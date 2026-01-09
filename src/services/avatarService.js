const pool = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class AvatarService {
  constructor() {
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.aiProviders = {
      dicebear: {
        baseUrl: 'https://api.dicebear.com/7.x',
        styles: [
          'avataaars', 'avataaars-neutral', 'adventurer', 'adventurer-neutral',
          'big-ears', 'big-ears-neutral', 'big-smile', 'bottts', 'bottts-neutral',
          'croodles', 'croodles-neutral', 'fun-emoji', 'icons', 'identicon',
          'lorelei', 'lorelei-neutral', 'micah', 'miniavs', 'notionists',
          'notionists-neutral', 'open-peeps', 'personas', 'pixel-art',
          'pixel-art-neutral', 'rings', 'shapes', 'thumbs'
        ]
      }
    };
  }

  // Generate AI avatar using DiceBear API
  async generateAIAvatar(userId, preferences = {}) {
    try {
      const startTime = Date.now();
      
      // Create generation request record
      const requestQuery = `
        INSERT INTO avatar_generation_requests (user_id, generation_type, request_data)
        VALUES ($1, 'ai_generated', $2)
        RETURNING id
      `;
      
      const requestResult = await pool.query(requestQuery, [
        userId, 
        JSON.stringify(preferences)
      ]);
      
      const requestId = requestResult.rows[0].id;
      
      // Generate avatar URL based on preferences
      const { style = 'avataaars', seed, backgroundColor, ...otherOptions } = preferences;
      const avatarSeed = seed || `user-${userId}-${Date.now()}`;
      
      // Build DiceBear URL
      const baseUrl = this.aiProviders.dicebear.baseUrl;
      const avatarUrl = this.buildDiceBearUrl(baseUrl, style, avatarSeed, {
        backgroundColor: backgroundColor || this.getRandomColor(),
        ...otherOptions
      });
      
      // Update user profile with AI avatar
      await this.updateUserAvatar(userId, {
        avatar_type: 'ai_generated',
        profile_image_url: avatarUrl,
        avatar_metadata: {
          generated_url: avatarUrl,
          style: style,
          seed: avatarSeed,
          preferences: preferences,
          generated_at: new Date().toISOString()
        }
      });
      
      // Mark generation request as completed
      const processingTime = Date.now() - startTime;
      await pool.query(`
        UPDATE avatar_generation_requests 
        SET result_image_url = $1, generation_status = 'completed', 
            processing_time_ms = $2, completed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [avatarUrl, processingTime, requestId]);
      
      console.log(`🎨 AI avatar generated for user ${userId}: ${avatarUrl}`);
      
      return {
        success: true,
        avatarUrl: avatarUrl,
        requestId: requestId,
        processingTime: processingTime
      };
      
    } catch (error) {
      console.error('❌ Failed to generate AI avatar:', error);
      
      // Mark request as failed
      if (requestId) {
        await pool.query(`
          UPDATE avatar_generation_requests 
          SET generation_status = 'failed', error_message = $1, completed_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [error.message, requestId]);
      }
      
      throw error;
    }
  }

  // Get random avatar from templates or generate using DiceBear
  async getRandomAvatar(userId, templateType = 'random_set') {
    try {
      // Enhanced random avatar generation with more creative styles
      const allStyles = this.aiProviders.dicebear.styles;
      const randomStyle = allStyles[Math.floor(Math.random() * allStyles.length)];
      const randomSeed = `random-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const randomColor = this.getRandomColor();
      
      // Generate random avatar URL using DiceBear
      const baseUrl = this.aiProviders.dicebear.baseUrl;
      const avatarUrl = this.buildDiceBearUrl(baseUrl, randomStyle, randomSeed, {
        backgroundColor: randomColor
      });
      
      // Update user profile with random avatar
      await this.updateUserAvatar(userId, {
        avatar_type: 'random',
        profile_image_url: avatarUrl,
        avatar_metadata: {
          template_name: randomStyle,
          template_url: avatarUrl,
          template_type: templateType,
          style: randomStyle,
          seed: randomSeed,
          backgroundColor: randomColor,
          selected_at: new Date().toISOString()
        }
      });
      
      // Try to create generation request record (if table exists)
      try {
        await pool.query(`
          INSERT INTO avatar_generation_requests (user_id, generation_type, request_data, result_image_url, generation_status, completed_at)
          VALUES ($1, 'random_selected', $2, $3, 'completed', CURRENT_TIMESTAMP)
        `, [
          userId,
          JSON.stringify({ template_name: randomStyle, template_type: templateType }),
          avatarUrl
        ]);
      } catch (err) {
        // Table might not exist, ignore
        console.log('Note: avatar_generation_requests table not found, skipping log');
      }
      
      console.log(`🎲 Random avatar generated for user ${userId}: ${randomStyle}`);
      
      return {
        success: true,
        avatarUrl: avatarUrl,
        template: {
          template_name: randomStyle,
          image_url: avatarUrl,
          description: `Random ${randomStyle} avatar`,
          tags: [randomStyle, 'random', 'creative']
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to get random avatar:', error);
      throw error;
    }
  }

  // Upload custom image
  async uploadCustomImage(userId, fileData) {
    try {
      const { filename, mimeType, size, buffer } = fileData;
      
      // Validate file
      this.validateImageFile(mimeType, size);
      
      // Create upload record
      const uploadQuery = `
        INSERT INTO image_uploads (user_id, original_filename, file_size, mime_type, upload_status)
        VALUES ($1, $2, $3, $4, 'processing')
        RETURNING id
      `;
      
      const uploadResult = await pool.query(uploadQuery, [
        userId, filename, size, mimeType
      ]);
      
      const uploadId = uploadResult.rows[0].id;
      
      // Process image (resize, optimize, generate thumbnail)
      const processedImages = await this.processImage(buffer, mimeType);
      
      // Save files (in production, this would be to cloud storage)
      const storageUrl = await this.saveImage(uploadId, processedImages.main, mimeType);
      const thumbnailUrl = await this.saveImage(`${uploadId}_thumb`, processedImages.thumbnail, mimeType);
      
      // Update user profile with custom image
      await this.updateUserAvatar(userId, {
        avatar_type: 'custom_upload',
        profile_image_url: storageUrl,
        avatar_metadata: {
          upload_id: uploadId,
          original_filename: filename,
          file_size: size,
          mime_type: mimeType,
          uploaded_at: new Date().toISOString()
        }
      });
      
      // Mark upload as completed
      await pool.query(`
        UPDATE image_uploads 
        SET storage_url = $1, thumbnail_url = $2, upload_status = 'completed', processed_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [storageUrl, thumbnailUrl, uploadId]);
      
      console.log(`📸 Custom image uploaded for user ${userId}: ${filename}`);
      
      return {
        success: true,
        imageUrl: storageUrl,
        thumbnailUrl: thumbnailUrl,
        uploadId: uploadId
      };
      
    } catch (error) {
      console.error('❌ Failed to upload custom image:', error);
      
      // Mark upload as failed
      if (uploadId) {
        await pool.query(`
          UPDATE image_uploads 
          SET upload_status = 'failed', processing_error = $1
          WHERE id = $2
        `, [error.message, uploadId]);
      }
      
      throw error;
    }
  }

  // Get available avatar templates
  async getAvatarTemplates(templateType = null) {
    try {
      let query = `
        SELECT template_name, template_type, image_url, thumbnail_url, description, tags, usage_count
        FROM avatar_templates
        WHERE is_active = true
      `;
      
      const params = [];
      if (templateType) {
        query += ' AND template_type = $1';
        params.push(templateType);
      }
      
      query += ' ORDER BY usage_count DESC, template_name';
      
      const result = await pool.query(query, params);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get avatar templates:', error);
      return [];
    }
  }

  // Get user's avatar history
  async getUserAvatarHistory(userId, limit = 10) {
    try {
      const query = `
        SELECT 
          agr.id,
          agr.generation_type,
          agr.request_data,
          agr.result_image_url,
          agr.generation_status,
          agr.error_message,
          agr.processing_time_ms,
          agr.created_at,
          agr.completed_at
        FROM avatar_generation_requests agr
        WHERE agr.user_id = $1
        ORDER BY agr.created_at DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Failed to get user avatar history:', error);
      return [];
    }
  }

  // Delete user's current avatar
  async deleteCurrentAvatar(userId) {
    try {
      // Get current avatar info
      const currentQuery = `
        SELECT avatar_type, profile_image_url, avatar_metadata
        FROM user_profiles
        WHERE user_id = $1
      `;
      
      const currentResult = await pool.query(currentQuery, [userId]);
      
      if (currentResult.rows.length === 0) {
        throw new Error('User profile not found');
      }
      
      const current = currentResult.rows[0];
      
      // If it's a custom upload, mark as deleted
      if (current.avatar_type === 'custom_upload' && current.avatar_metadata?.upload_id) {
        await pool.query(`
          UPDATE image_uploads 
          SET upload_status = 'deleted'
          WHERE id = $1
        `, [current.avatar_metadata.upload_id]);
      }
      
      // Reset to default avatar
      await this.updateUserAvatar(userId, {
        avatar_type: 'default',
        profile_image_url: null,
        avatar_metadata: null
      });
      
      console.log(`🗑️ Avatar deleted for user ${userId}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Failed to delete avatar:', error);
      throw error;
    }
  }

  // Helper methods
  async updateUserAvatar(userId, avatarData) {
    // First check if profile exists, if not create it
    const checkQuery = `SELECT user_id FROM user_profiles WHERE user_id = $1`;
    const checkResult = await pool.query(checkQuery, [userId]);
    
    if (checkResult.rows.length === 0) {
      // Create profile if it doesn't exist
      const insertQuery = `
        INSERT INTO user_profiles (user_id, avatar_type, profile_image_url, avatar_metadata, image_uploaded_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const insertResult = await pool.query(insertQuery, [
        userId,
        avatarData.avatar_type,
        avatarData.profile_image_url,
        JSON.stringify(avatarData.avatar_metadata)
      ]);
      return insertResult.rows[0];
    } else {
      // Update existing profile
      const updateQuery = `
        UPDATE user_profiles 
        SET avatar_type = $2, profile_image_url = $3, avatar_metadata = $4, 
            image_uploaded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [
        userId,
        avatarData.avatar_type,
        avatarData.profile_image_url,
        JSON.stringify(avatarData.avatar_metadata)
      ]);
      return result.rows[0];
    }
    
    return result.rows[0];
  }

  buildDiceBearUrl(baseUrl, style, seed, options = {}) {
    const url = `${baseUrl}/${style}/svg`;
    const params = new URLSearchParams();
    
    params.set('seed', seed);
    
    // Add options
    if (options.backgroundColor) {
      params.set('backgroundColor', options.backgroundColor);
    }
    
    if (options.hairColor) {
      params.set('hairColor', options.hairColor);
    }
    
    if (options.facialHair) {
      params.set('facialHair', options.facialHair);
    }
    
    if (options.accessories) {
      params.set('accessories[]', options.accessories);
    }
    
    return `${url}?${params.toString()}`;
  }

  getRandomColor() {
    const colors = ['3b82f6', 'a855f7', '10b981', 'f97316', '14b8a6', 'ef4444', 'f59e0b', '8b5cf6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  validateImageFile(mimeType, size) {
    if (!this.supportedFormats.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}. Supported formats: ${this.supportedFormats.join(', ')}`);
    }
    
    if (size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${this.maxFileSize / 1024 / 1024}MB`);
    }
  }

  async processImage(buffer, mimeType) {
    // In a real implementation, this would use sharp or similar library
    // For now, return the original buffer as both main and thumbnail
    return {
      main: buffer,
      thumbnail: buffer // In production, this would be a resized version
    };
  }

  async saveImage(filename, buffer, mimeType) {
    // In production, this would upload to cloud storage (S3, Cloudinary, etc.)
    // For now, save to local uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    const extension = mimeType.split('/')[1];
    const filePath = path.join(uploadsDir, `${filename}.${extension}`);
    
    await fs.writeFile(filePath, buffer);
    
    // Return URL (in production, this would be the cloud storage URL)
    return `/uploads/${filename}.${extension}`;
  }

  // Get user's current avatar info
  async getUserAvatar(userId) {
    try {
      const query = `
        SELECT 
          up.avatar_type,
          up.profile_image_url,
          up.avatar_metadata,
          up.image_uploaded_at,
          CASE 
            WHEN up.profile_image_url IS NOT NULL THEN up.profile_image_url
            WHEN up.avatar_type = 'ai_generated' THEN COALESCE(up.avatar_metadata->>'generated_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')
            WHEN up.avatar_type = 'random' THEN COALESCE(up.avatar_metadata->>'template_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')
            ELSE 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
          END as display_image_url
        FROM user_profiles up
        WHERE up.user_id = $1
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return {
          avatar_type: 'default',
          display_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
        };
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Failed to get user avatar:', error);
      return {
        avatar_type: 'default',
        display_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
      };
    }
  }
}

module.exports = new AvatarService();
