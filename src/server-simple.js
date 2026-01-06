require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Simple user storage (for demo)
let users = [];
let userProfiles = [];

// Load existing users
async function loadUsers() {
  try {
    const data = await fs.readFile('users.json', 'utf8');
    users = JSON.parse(data);
    console.log(`✅ Loaded ${users.length} users`);
  } catch (error) {
    console.log('📝 Creating new users file');
    users = [
      {
        id: '1',
        email: 'admin@cervicare.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        role: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'user@cervicare.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        role: 'user',
        createdAt: new Date().toISOString()
      }
    ];
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));
  }
}

// Google Sheets Service (Simple)
class SimpleGoogleSheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  }

  async logUserLogin(userData) {
    console.log('📊 Would log to Google Sheets:', userData);
    // In production, this would use Google Sheets API
    // For now, we'll log to console and local file
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...userData
      };
      
      // Save to local file for demo
      await fs.appendFile('user-logins.csv', 
        `${logEntry.timestamp},${logEntry.userId},${logEntry.email},${logEntry.action}\n`
      );
      
      console.log(`✅ User login logged: ${userData.email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to log user login:', error);
      return false;
    }
  }

  async logBotData(botData) {
    console.log('🤖 Would log bot data to Google Sheets:', botData);
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ...botData
      };
      
      // Save to local file for demo
      await fs.appendFile('bot-data.csv', 
        `${logEntry.timestamp},${logEntry.userId},${logEntry.email},${logEntry.botMessage},${logEntry.botResponse}\n`
      );
      
      console.log(`✅ Bot data logged: ${botData.botMessage}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to log bot data:', error);
      return false;
    }
  }
}

const sheetsService = new SimpleGoogleSheetsService();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'auth.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'profile.html'));
});

app.get('/protection.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'protection.html'));
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Simple password check (in production, use bcrypt)
    if (password !== 'password') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Log to Google Sheets
    await sheetsService.logUserLogin({
      userId: user.id,
      email: user.email,
      action: 'login'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token: 'simple-jwt-token-for-demo'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await fs.writeFile('users.json', JSON.stringify(users, null, 2));

    // Log to Google Sheets
    await sheetsService.logUserLogin({
      userId: newUser.id,
      email: newUser.email,
      action: 'signup'
    });

    res.json({
      success: true,
      message: 'Signup successful',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role
        },
        token: 'simple-jwt-token-for-demo'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Profile endpoints
app.post('/api/profile', async (req, res) => {
  try {
    const profileData = req.body;
    
    // Save profile
    const existingProfile = userProfiles.find(p => p.userId === profileData.userId);
    if (existingProfile) {
      Object.assign(existingProfile, profileData);
    } else {
      userProfiles.push(profileData);
    }

    await fs.writeFile('user-profiles.json', JSON.stringify(userProfiles, null, 2));

    // Log to Google Sheets
    await sheetsService.logUserLogin({
      userId: profileData.userId,
      email: profileData.email || 'unknown',
      action: 'profile_updated',
      profileData: JSON.stringify(profileData)
    });

    res.json({
      success: true,
      message: 'Profile saved successfully'
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

app.get('/api/profile/:userId', (req, res) => {
  try {
    const profile = userProfiles.find(p => p.userId === req.params.userId);
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profile not found' 
      });
    }

    res.json({
      success: true,
      data: { profile }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Avatar endpoints (Simple)
app.post('/api/avatar/generate-ai', (req, res) => {
  const { style = 'avataaars' } = req.body;
  const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${Date.now()}`;
  
  res.json({
    success: true,
    message: 'AI avatar generated successfully',
    data: { avatarUrl }
  });
});

app.get('/api/avatar/random', (req, res) => {
  const styles = ['avataaars', 'adventurer', 'bottts', 'lorelei', 'notionists', 'personas'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const avatarUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${Date.now()}`;
  
  res.json({
    success: true,
    message: 'Random avatar selected successfully',
    data: { avatarUrl }
  });
});

// Bot webhook endpoint
app.post('/api/bot-data/webhook', async (req, res) => {
  try {
    const botData = req.body;
    
    // Log bot data
    await sheetsService.logBotData({
      userId: botData.userId || 'unknown',
      email: botData.email || 'unknown',
      botMessage: botData.botMessage || '',
      botResponse: botData.botResponse || '',
      intent: botData.intent || '',
      actionTaken: botData.actionTaken || ''
    });

    res.json({
      success: true,
      message: 'Bot data logged successfully'
    });

  } catch (error) {
    console.error('Bot webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
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

// Get user data (for checking)
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: {
      users: users.map(u => ({ id: u.id, email: u.email, role: u.role, createdAt: u.createdAt })),
      profiles: userProfiles
    }
  });
});

// Get logs (for checking data)
app.get('/api/logs', async (req, res) => {
  try {
    const userLogins = await fs.readFile('user-logins.csv', 'utf8').catch(() => 'No user logins yet');
    const botData = await fs.readFile('bot-data.csv', 'utf8').catch(() => 'No bot data yet');
    
    res.json({
      success: true,
      data: {
        userLogins: userLogins.split('\n').filter(line => line.trim()),
        botData: botData.split('\n').filter(line => line.trim())
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        userLogins: ['No data yet'],
        botData: ['No data yet']
      }
    });
  }
});

// Start server
async function startServer() {
  await loadUsers();
  
  app.listen(PORT, () => {
    console.log(`🚀 CerviCare Server is running on http://localhost:${PORT}`);
    console.log(`📄 Main page: http://localhost:${PORT}/`);
    console.log(`🔐 Authentication: http://localhost:${PORT}/auth.html`);
    console.log(`👤 Profile: http://localhost:${PORT}/profile.html`);
    console.log(`🛡️ Protection: http://localhost:${PORT}/protection.html`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📝 User Data: http://localhost:${PORT}/api/users`);
    console.log(`📋 Logs: http://localhost:${PORT}/api/logs`);
    console.log(`🤖 Bot Webhook: POST http://localhost:${PORT}/api/bot-data/webhook`);
    console.log(`\n✅ Features Working:`);
    console.log(`   - User Authentication`);
    console.log(`   - Profile Management`);
    console.log(`   - Avatar Generation`);
    console.log(`   - Bot Data Logging`);
    console.log(`   - Google Sheets Simulation`);
    console.log(`\n📝 Test Accounts:`);
    console.log(`   Email: admin@cervicare.com | Password: password`);
    console.log(`   Email: user@cervicare.com  | Password: password`);
  });
}

startServer().catch(console.error);

module.exports = app;
