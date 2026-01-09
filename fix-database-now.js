/**
 * Direct Database Fix Script
 * Connects to Neon and fixes all authentication issues
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://neondb_owner:npg_TDblkxXM8Oh4@ep-red-lab-adyuhexk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function fixDatabase() {
  try {
    console.log('🔌 Connecting to Neon database...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Connected successfully!\n');

    // 1. Create tables if they don't exist
    console.log('📋 Creating/verifying tables...');
    
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
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
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    
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
    
    console.log('✅ Tables created/verified\n');

    // 2. Check existing users
    console.log('👤 Checking existing users...');
    const existingUsers = await pool.query('SELECT email, role FROM users');
    console.log(`Found ${existingUsers.rows.length} existing user(s):`);
    existingUsers.rows.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    console.log('');

    // 3. Create/Update users with proper passwords
    console.log('🔐 Creating/updating users with proper password hashes...');
    
    const users = [
      { email: 'satyamr814@gmail.com', password: 'Satyam@123', role: 'user' },
      { email: 'admin@cervicare.com', password: 'password', role: 'admin' },
      { email: 'user@cervicare.com', password: 'password', role: 'user' },
      { email: 'doffyism1@gmail.com', password: 'Satyam@123', role: 'user' },
      { email: 'weebmafia1@gmail.com', password: 'Satyam@123', role: 'user' },
    ];

    for (const user of users) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      const passwordHash = await bcrypt.hash(user.password, 10);
      
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
          [user.email, passwordHash, user.role]
        );
        console.log(`✅ Created: ${user.email} (password: ${user.password})`);
      } else {
        await pool.query(
          'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
          [passwordHash, user.role, user.email]
        );
        console.log(`✅ Updated: ${user.email} (password: ${user.password})`);
      }
    }

    // 4. Verify all users
    console.log('\n📊 Final user list:');
    const allUsers = await pool.query('SELECT email, role, created_at FROM users ORDER BY email');
    allUsers.rows.forEach(u => {
      console.log(`   ✅ ${u.email} (${u.role})`);
    });

    // 5. Test password hashes
    console.log('\n🔍 Verifying password hashes...');
    const testUser = await pool.query('SELECT email, password_hash FROM users WHERE email = $1', ['satyamr814@gmail.com']);
    if (testUser.rows.length > 0) {
      const isValid = await bcrypt.compare('Satyam@123', testUser.rows[0].password_hash);
      console.log(`   Test password validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    }

    console.log('\n🎉 Database fix completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: satyamr814@gmail.com');
    console.log('   Password: Satyam@123');
    console.log('\n   Email: admin@cervicare.com');
    console.log('   Password: password');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixDatabase();
