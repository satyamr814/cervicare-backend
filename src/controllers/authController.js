const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const webhookService = require('../services/webhookService');
const googleSheetsService = require('../services/googleSheetsService');

class AuthController {
  static async signup(req, res) {
    try {
      const { email, password, phone, city } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create new user
      const user = await User.create(email, password);

      // Generate JWT token
      const token = generateToken({ userId: user.id, email: user.email });

      // Trigger automation webhook for new user signup (non-blocking)
      webhookService.triggerUserSignup(user.id, user.email).catch(console.error);

      // Log action (non-blocking)
      googleSheetsService.syncUserAction(user.id, 'user_signup', 'website').catch(console.error);

      // Sync to Google Sheets (non-blocking)
      googleSheetsService.syncUserSignup(user.id, user.email, phone, city).catch(console.error);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Signup error:', error);

      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Database is not reachable. Start PostgreSQL and set DATABASE_URL, then run database/schema.sql.',
          code: 'DB_UNAVAILABLE'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during signup'
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Validate password
      const isValidPassword = await User.validatePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = generateToken({ userId: user.id });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);

      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        return res.status(503).json({
          success: false,
          message: 'Database is not reachable. Start PostgreSQL and set DATABASE_URL, then run database/schema.sql.',
          code: 'DB_UNAVAILABLE'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }
}

module.exports = AuthController;
