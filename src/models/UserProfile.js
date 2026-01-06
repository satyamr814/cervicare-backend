const pool = require('../config/database');

class UserProfile {
  static isProfileComplete(data) {
    const requiredFields = ['age', 'gender', 'city', 'diet_type', 'budget_level', 'lifestyle'];
    return requiredFields.every(field => data[field] && data[field] !== '' && data[field] !== 'N/A');
  }

  static async create(userId, profileData) {
    try {
      const {
        age, gender, city, diet_type, budget_level, lifestyle,
        whatsapp_consent, marketing_consent, phone, profile_image_url
      } = profileData;

      const isComplete = this.isProfileComplete(profileData);

      const query = `
        INSERT INTO user_profiles (
          user_id, age, gender, city, diet_type, budget_level, lifestyle, 
          whatsapp_consent, marketing_consent, phone, profile_image_url, profile_completed
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *
      `;
      const result = await pool.query(query, [
        userId, age, gender, city, diet_type, budget_level, lifestyle,
        whatsapp_consent || false,
        marketing_consent || false,
        phone || null,
        profile_image_url || null,
        isComplete
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const query = 'SELECT * FROM user_profiles WHERE user_id = $1';
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async update(userId, profileData) {
    try {
      const {
        age, gender, city, diet_type, budget_level, lifestyle,
        whatsapp_consent, marketing_consent, phone, profile_image_url
      } = profileData;

      const isComplete = this.isProfileComplete(profileData);

      const query = `
        UPDATE user_profiles 
        SET age = $2, gender = $3, city = $4, diet_type = $5, budget_level = $6, lifestyle = $7, 
            whatsapp_consent = $8, marketing_consent = $9, phone = $10, 
            profile_image_url = $11, profile_completed = $12, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 
        RETURNING *
      `;
      const result = await pool.query(query, [
        userId, age, gender, city, diet_type, budget_level, lifestyle,
        whatsapp_consent, marketing_consent, phone, profile_image_url, isComplete
      ]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async upsert(userId, profileData) {
    try {
      const existingProfile = await this.findByUserId(userId);
      if (existingProfile) {
        return await this.update(userId, profileData);
      } else {
        return await this.create(userId, profileData);
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserProfile;
