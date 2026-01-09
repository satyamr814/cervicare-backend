/**
 * Neon Database Setup Script
 * This script sets up the Neon database connection and ensures schema is applied
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Neon API key
const NEON_API_KEY = process.env.NEON_API_KEY || 'napi_qwhvr48ifdjn89z4gi7mponc546ufiq3evuw0qqdyjdbg6r57381ijjz9bzlrl39';

// Database connection - will be set from environment or Neon API
let DATABASE_URL = process.env.DATABASE_URL;

async function setupDatabase() {
  try {
    console.log('🚀 Starting Neon database setup...');

    // If DATABASE_URL is not set, we need to get it from Neon API
    if (!DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found. Attempting to get from Neon API...');
      
      // For now, we'll use a placeholder - user needs to set DATABASE_URL
      console.error('❌ DATABASE_URL environment variable is required!');
      console.log('\n📝 To get your Neon database connection string:');
      console.log('1. Go to https://console.neon.tech/');
      console.log('2. Select your project');
      console.log('3. Go to "Connection Details"');
      console.log('4. Copy the connection string');
      console.log('5. Set it as DATABASE_URL environment variable');
      console.log('\nExample:');
      console.log('DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require');
      process.exit(1);
    }

    // Create connection pool
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Neon requires SSL
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful!');

    // Apply schema
    console.log('📋 Applying database schema...');
    
    // Enable UUID extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('✅ UUID extension enabled');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
        plan_type VARCHAR(50) DEFAULT 'basic',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created/verified');

    // Create index on email
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Create user_profiles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        age INTEGER,
        gender VARCHAR(20),
        city VARCHAR(100),
        phone VARCHAR(20),
        diet_type VARCHAR(50),
        budget_level VARCHAR(50),
        lifestyle VARCHAR(50),
        whatsapp_consent BOOLEAN DEFAULT FALSE,
        marketing_consent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `);
    console.log('✅ User profiles table created/verified');

    // Create other tables from schema.sql if needed
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diet_content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        diet_type VARCHAR(20) NOT NULL CHECK (diet_type IN ('veg', 'nonveg', 'vegan')),
        budget_level VARCHAR(20) NOT NULL CHECK (budget_level IN ('low', 'medium', 'high')),
        region VARCHAR(100) NOT NULL,
        food_name VARCHAR(200) NOT NULL,
        reason TEXT NOT NULL,
        frequency VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS protection_plan_content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        risk_band VARCHAR(30) NOT NULL CHECK (risk_band IN ('low', 'moderate', 'higher_attention')),
        plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'complete', 'premium')),
        section VARCHAR(30) NOT NULL CHECK (section IN ('diet', 'lifestyle', 'screening')),
        content_text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create triggers for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
      CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Database schema applied successfully');

    // Seed test users
    console.log('👤 Creating test users...');
    const testUsers = [
      { email: 'admin@cervicare.com', password: 'password', role: 'admin' },
      { email: 'user@cervicare.com', password: 'password', role: 'user' },
      { email: 'satyamr814@gmail.com', password: 'Satyam@123', role: 'user' },
      { email: 'doffyism1@gmail.com', password: 'Satyam@123', role: 'user' },
      { email: 'weebmafia1@gmail.com', password: 'Satyam@123', role: 'user' },
    ];

    for (const user of testUsers) {
      const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [user.email]);
      
      if (existing.rows.length === 0) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        await pool.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
          [user.email, passwordHash, user.role]
        );
        console.log(`✅ Created user: ${user.email} (password: ${user.password})`);
      } else {
        // Update password to ensure it's correct
        const passwordHash = await bcrypt.hash(user.password, 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE email = $2',
          [passwordHash, user.email]
        );
        console.log(`✅ Updated password for: ${user.email} (password: ${user.password})`);
      }
    }

    // Verify users
    console.log('\n📊 Verifying users in database...');
    const allUsers = await pool.query('SELECT email, role, created_at FROM users ORDER BY created_at');
    console.log(`✅ Found ${allUsers.rows.length} user(s) in database:`);
    allUsers.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    await pool.end();
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Test login credentials:');
    console.log('   Email: satyamr814@gmail.com');
    console.log('   Password: Satyam@123');
    console.log('\n   Email: admin@cervicare.com');
    console.log('   Password: password');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('\n💡 Troubleshooting:');
      console.error('1. Check your DATABASE_URL is correct');
      console.error('2. Verify Neon database is active');
      console.error('3. Ensure SSL is enabled (sslmode=require)');
    }
    process.exit(1);
  }
}

// Run setup
setupDatabase();
