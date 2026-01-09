const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('.'));
app.use('/uploads', express.static('uploads'));

// File upload for avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Data storage
let users = [];
let userProfiles = [];
let avatarData = [];
let userProtection = []; // Store score and plans per user

// Initialize data
async function initializeData() {
  try {
    // Load users
    const usersData = await fs.readFile('users.json', 'utf8').catch(() => '[]');
    const parsedUsers = JSON.parse(usersData);
    users = Array.isArray(parsedUsers) ? parsedUsers : (parsedUsers.users || []);

    // Ensure test accounts exist
    const testAccounts = [
      { id: '1', email: 'admin@cervicare.com', password: 'password', role: 'admin' },
      { id: '2', email: 'user@cervicare.com', password: 'password', role: 'user' }
    ];

    testAccounts.forEach(testAcc => {
      if (!users.find(u => u.email === testAcc.email)) {
        users.push({
          ...testAcc,
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // hashed 'password'
          createdAt: new Date().toISOString()
        });
      }
    });

    // Save if updated
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
    const profilesData = await fs.readFile('user-profiles.json', 'utf8').catch(() => '[]');
    const parsedProfiles = JSON.parse(profilesData);
    userProfiles = Array.isArray(parsedProfiles) ? parsedProfiles : (parsedProfiles.profiles || []);

    // Load avatar data
    const avatarDataFile = await fs.readFile('avatar-data.json', 'utf8').catch(() => '[]');
    const parsedAvatars = JSON.parse(avatarDataFile);
    avatarData = Array.isArray(parsedAvatars) ? parsedAvatars : (parsedAvatars.avatars || []);

    // Load protection data
    const protectionDataFile = await fs.readFile('user-protection.json', 'utf8').catch(() => '[]');
    const parsedProtection = JSON.parse(protectionDataFile);
    userProtection = Array.isArray(parsedProtection) ? parsedProtection : (parsedProtection.protection || []);

    console.log(`✅ Loaded ${users.length} users, ${userProfiles.length} profiles, ${avatarData.length} avatars`);
  } catch (error) {
    console.log('📝 Creating initial data...');

    // Create default users
    users = [
      {
        id: '1',
        email: 'admin@cervicare.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'user@cervicare.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];

    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
  }
}

// Google Sheets Logger (simulated)
class GoogleSheetsLogger {
  static async logUserLogin(userData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: userData.userId,
      email: userData.email,
      action: userData.action,
      ip: userData.ip || 'localhost',
      userAgent: userData.userAgent || 'browser',
      details: userData.details || ''
    };

    try {
      await fs.appendFile('user-logins.csv',
        `${logEntry.timestamp},${logEntry.userId},${logEntry.email},${logEntry.action},${logEntry.ip},${logEntry.userAgent},${logEntry.details}\n`
      );
      console.log(`📊 Action logged [${userData.action}]: ${userData.email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to log action:', error);
      return false;
    }
  }

  static async logBotData(botData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: botData.userId || 'unknown',
      email: botData.email || 'unknown',
      botMessage: botData.botMessage || '',
      botResponse: botData.botResponse || '',
      intent: botData.intent || '',
      actionTaken: botData.actionTaken || '',
      whatsappSent: botData.whatsappSent || false
    };

    try {
      await fs.appendFile('bot-data.csv',
        `${logEntry.timestamp},${logEntry.userId},${logEntry.email},${logEntry.botMessage},${logEntry.botResponse},${logEntry.intent},${logEntry.actionTaken},${logEntry.whatsappSent}\n`
      );
      console.log(`🤖 Bot data logged: ${botData.botMessage}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to log bot data:', error);
      return false;
    }
  }

  static async logAvatarChange(userId, avatarType, avatarUrl) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: userId,
      avatarType: avatarType,
      avatarUrl: avatarUrl
    };

    try {
      await fs.appendFile('avatar-history.csv',
        `${logEntry.timestamp},${logEntry.userId},${logEntry.avatarType},${logEntry.avatarUrl}\n`
      );
      console.log(`👤 Avatar change logged: ${avatarType}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to log avatar change:', error);
      return false;
    }
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/protection.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'protection.html'));
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Use bcrypt to validate password (not plain text comparison)
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Log to Google Sheets
    await GoogleSheetsLogger.logUserLogin({
      userId: user.id,
      email: user.email,
      action: 'login',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt || user.created_at
        },
        token: 'simple-jwt-token-for-demo'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (users.find(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));

    // Log to Google Sheets
    await GoogleSheetsLogger.logUserLogin({
      userId: newUser.id,
      email: newUser.email,
      action: 'signup',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Signup successful',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt
        },
        token: 'simple-jwt-token-for-demo'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Profile endpoints
app.post('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;

    const existingProfile = userProfiles.find(p => p.userId === profileData.userId);
    if (existingProfile) {
      Object.assign(existingProfile, profileData);
    } else {
      userProfiles.push(profileData);
    }

    await fs.writeFile('user-profiles.json', JSON.stringify(userProfiles, null, 2));

    // Log to Google Sheets
    await GoogleSheetsLogger.logUserLogin({
      userId: profileData.userId,
      email: profileData.email || 'unknown',
      action: 'profile_updated',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: JSON.stringify(profileData).replace(/,/g, ';') // Avoid CSV breaking with commas
    });

    res.json({ success: true, message: 'Profile saved successfully' });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/api/profile/:userId', (req, res) => {
  try {
    const profile = userProfiles.find(p => p.userId === req.params.userId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, data: { profile } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Avatar endpoints
app.post('/api/avatar/generate-ai', async (req, res) => {
  try {
    const { style = 'avataaars', seed } = req.body;
    const avatarSeed = seed || `user-${Date.now()}`;
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${avatarSeed}`;

    // Save avatar data
    const userId = req.body.userId;
    if (userId) {
      const existingAvatar = avatarData.find(a => a.userId === userId);
      if (existingAvatar) {
        existingAvatar.avatar_type = 'ai_generated';
        existingAvatar.display_image_url = avatarUrl;
        existingAvatar.updatedAt = new Date().toISOString();
      } else {
        avatarData.push({
          userId,
          avatar_type: 'ai_generated',
          display_image_url: avatarUrl,
          createdAt: new Date().toISOString()
        });
      }

      await fs.writeFile('avatar-data.json', JSON.stringify(avatarData, null, 2));
      await GoogleSheetsLogger.logAvatarChange(userId, 'ai_generated', avatarUrl);
    }

    res.json({
      success: true,
      message: 'AI avatar generated successfully',
      data: { avatarUrl, requestId: Date.now().toString() }
    });
  } catch (error) {
    console.error('AI avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate AI avatar' });
  }
});

app.get('/api/avatar/random', async (req, res) => {
  try {
    const styles = ['avataaars', 'adventurer', 'bottts', 'lorelei', 'notionists', 'personas'];
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    const avatarUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${Date.now()}`;

    // Save avatar data
    const userId = req.query.userId;
    if (userId) {
      const existingAvatar = avatarData.find(a => a.userId === userId);
      if (existingAvatar) {
        existingAvatar.avatar_type = 'random';
        existingAvatar.display_image_url = avatarUrl;
        existingAvatar.updatedAt = new Date().toISOString();
      } else {
        avatarData.push({
          userId,
          avatar_type: 'random',
          display_image_url: avatarUrl,
          createdAt: new Date().toISOString()
        });
      }

      await fs.writeFile('avatar-data.json', JSON.stringify(avatarData, null, 2));
      await GoogleSheetsLogger.logAvatarChange(userId, 'random', avatarUrl);
    }

    res.json({
      success: true,
      message: 'Random avatar selected successfully',
      data: { avatarUrl, template: { template_name: randomStyle } }
    });
  } catch (error) {
    console.error('Random avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to get random avatar' });
  }
});

app.post('/api/avatar/upload', async (req, res) => {
  try {
    console.log('📬 Received Base64 upload request');
    const { userId, image, filename } = req.body;

    if (!userId || !image) {
      console.log('❌ Missing userId or image data');
      return res.status(400).json({ success: false, message: 'Missing user ID or image data' });
    }

    // Extract base64 data
    // Format: "data:image/png;base64,iVBORw0KGgoAAA..."
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
      console.log('❌ Invalid image format');
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    const safeFilename = `custom-${Date.now()}-${Math.round(Math.random() * 1E9)}.png`;
    const filePath = path.join('uploads', safeFilename);

    // Save file
    await fs.writeFile(filePath, imageBuffer);
    const imageUrl = `/uploads/${safeFilename}`;

    console.log('✅ File saved to:', filePath);

    // Update data
    const existingAvatar = avatarData.find(a => a.userId === userId);
    if (existingAvatar) {
      existingAvatar.avatar_type = 'custom_upload';
      existingAvatar.display_image_url = imageUrl;
      existingAvatar.updatedAt = new Date().toISOString();
    } else {
      avatarData.push({
        userId,
        avatar_type: 'custom_upload',
        display_image_url: imageUrl,
        createdAt: new Date().toISOString()
      });
    }

    await fs.writeFile('avatar-data.json', JSON.stringify(avatarData, null, 2));
    await GoogleSheetsLogger.logAvatarChange(userId, 'custom_upload', imageUrl);

    console.log('💾 Avatar data saved successfully');

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: { imageUrl }
    });

  } catch (error) {
    console.error('❌ Upload Error:', error);
    res.status(500).json({ success: false, message: 'Server upload failed' });
  }
});

app.get('/api/avatar/current/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const avatar = avatarData.find(a => a.userId === userId);

    if (!avatar) {
      return res.json({
        success: true,
        data: {
          avatar: {
            avatar_type: 'default',
            display_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
          }
        }
      });
    }

    res.json({
      success: true,
      data: { avatar }
    });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to get avatar' });
  }
});

// Protection Plan endpoints
app.get('/api/protection/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    let data = userProtection.find(p => p.userId === userId);

    if (!data) {
      // Create default protection data for new user
      data = {
        userId,
        score: 45,
        plans: [
          {
            id: 'plan-1',
            title: 'Annual Screening Schedule',
            description: 'Regular PAP smears and HPV tests are your first line of defense.',
            status: 'not-started',
            priority: 'high',
            duration: '12 months',
            steps: [
              { title: 'Schedule Consultation', note: 'Book appointment with a gynecologist', frequency: 'Once' },
              { title: 'Complete PAP Smear', note: 'Standard diagnostic test', frequency: 'Every 3 years' }
            ],
            notes: ''
          },
          {
            id: 'plan-2',
            title: 'Lifestyle Optimization',
            description: 'Dietary and lifestyle changes to boost your immune system.',
            status: 'in-progress',
            priority: 'medium',
            duration: 'Ongoing',
            steps: [
              { title: 'Vitamin C Intake', note: 'Daily fruits or supplements', frequency: 'Daily' },
              { title: 'Consistent Sleep', note: '7-8 hours per night', frequency: 'Daily' }
            ],
            notes: 'Started focusing on better sleep.'
          }
        ],
        updatedAt: new Date().toISOString()
      };
      userProtection.push(data);
      await fs.writeFile('user-protection.json', JSON.stringify(userProtection, null, 2));
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get protection error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/protection/plans/update', async (req, res) => {
  try {
    const { userId, planId, status, notes } = req.body;
    const userData = userProtection.find(p => p.userId === userId);

    if (!userData) {
      return res.status(404).json({ success: false, message: 'Protection data not found' });
    }

    const plan = userData.plans.find(p => p.id === planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (status) plan.status = status;
    if (notes !== undefined) plan.notes = notes;

    // Update score based on completed plans
    const completedCount = userData.plans.filter(p => p.status === 'completed').length;
    userData.score = 45 + (completedCount * 15); // Simple logic
    if (userData.score > 100) userData.score = 100;

    userData.updatedAt = new Date().toISOString();
    await fs.writeFile('user-protection.json', JSON.stringify(userProtection, null, 2));

    res.json({ success: true, message: 'Plan updated successfully', data: userData });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Bot webhook endpoint

app.post('/api/bot-data/webhook', async (req, res) => {
  try {
    const botData = req.body;

    await GoogleSheetsLogger.logBotData({
      userId: botData.userId || 'unknown',
      email: botData.email || 'unknown',
      botMessage: botData.botMessage || '',
      botResponse: botData.botResponse || '',
      intent: botData.intent || '',
      actionTaken: botData.actionTaken || '',
      whatsappSent: botData.whatsappSent || false
    });

    res.json({ success: true, message: 'Bot data logged successfully' });
  } catch (error) {
    console.error('Bot webhook error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CerviCare Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      authentication: true,
      profiles: true,
      avatars: true,
      botWebhook: true,
      googleSheets: 'simulated'
    }
  });
});

// Data viewing endpoints
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: {
      users: Array.isArray(users) ? users.map(u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt })) : [],
      profiles: Array.isArray(userProfiles) ? userProfiles : [],
      avatars: Array.isArray(avatarData) ? avatarData : []
    }
  });
});

app.get('/api/logs', async (req, res) => {
  try {
    const userLogins = await fs.readFile('user-logins.csv', 'utf8').catch(() => 'No user logins yet');
    const botData = await fs.readFile('bot-data.csv', 'utf8').catch(() => 'No bot data yet');
    const avatarHistory = await fs.readFile('avatar-history.csv', 'utf8').catch(() => 'No avatar history yet');

    res.json({
      success: true,
      data: {
        userLogins: userLogins.split('\n').filter(line => line.trim()),
        botData: botData.split('\n').filter(line => line.trim()),
        avatarHistory: avatarHistory.split('\n').filter(line => line.trim())
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        userLogins: ['No data yet'],
        botData: ['No data yet'],
        avatarHistory: ['No data yet']
      }
    });
  }
});

// Create uploads directory
async function createUploadsDir() {
  try {
    await fs.mkdir('uploads', { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Start server
async function startServer() {
  await createUploadsDir();
  // Ensure uploads directory exists
  try {
    await fs.mkdir('uploads', { recursive: true });
    console.log('✅ Uploads directory ensured');
  } catch (err) {
    console.error('❌ Failed to create uploads directory:', err);
  }

  await initializeData();

  app.listen(PORT, () => {
    console.log(`🚀 CerviCare Server is running on http://localhost:${PORT}`);
    console.log(`\n📄 Pages:`);
    console.log(`   Main: http://localhost:${PORT}/`);
    console.log(`   Auth: http://localhost:${PORT}/auth.html`);
    console.log(`   Profile: http://localhost:${PORT}/profile.html`);
    console.log(`   Protection: http://localhost:${PORT}/protection.html`);
    console.log(`\n🔗 API Endpoints:`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Users: http://localhost:${PORT}/api/users`);
    console.log(`   Logs: http://localhost:${PORT}/api/logs`);
    console.log(`   Bot Webhook: POST http://localhost:${PORT}/api/bot-data/webhook`);
    console.log(`\n✅ Features Working:`);
    console.log(`   - User Authentication`);
    console.log(`   - Profile Management`);
    console.log(`   - AI Avatar Generation`);
    console.log(`   - Custom Image Upload`);
    console.log(`   - Random Avatar Selection`);
    console.log(`   - Bot Data Logging`);
    console.log(`   - Google Sheets Simulation`);
    console.log(`\n📝 Test Accounts:`);
    console.log(`   Email: admin@cervicare.com | Password: password`);
    console.log(`   Email: user@cervicare.com  | Password: password`);
    console.log(`\n📊 Data Files Created:`);
    console.log(`   - users.json (user data)`);
    console.log(`   - user-profiles.json (profile data)`);
    console.log(`   - avatar-data.json (avatar data)`);
    console.log(`   - user-logins.csv (login logs)`);
    console.log(`   - bot-data.csv (bot interactions)`);
    console.log(`   - avatar-history.csv (avatar changes)`);
  });
}

// Global Crash Prevention
process.on('uncaughtException', (err) => {
  console.error('❌ CRITICAL: Uncaught Exception:', err);
  // Keep server running but log error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server running but log error
});

startServer().catch(console.error);

module.exports = app;
