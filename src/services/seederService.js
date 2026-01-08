const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class SeederService {
    async seed() {
        try {
            console.log('🌱 Starting database seeding...');

            // 1. Create Users Table
            await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
          plan_type VARCHAR(50) DEFAULT 'basic',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

            // 2. Create User Profiles Table
            await pool.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

            // 3. Create Google Sheets Sync Log Table
            await pool.query(`
        CREATE TABLE IF NOT EXISTS google_sheets_sync_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sync_type VARCHAR(100) NOT NULL,
          user_id VARCHAR(255),
          data JSONB,
          status VARCHAR(50) DEFAULT 'pending',
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

            // 4. Seed Essential Accounts
            const testAccounts = [
                { email: 'admin@cervicare.com', password: 'password', role: 'admin' },
                { email: 'user@cervicare.com', password: 'password', role: 'user' },
                { email: 'satyamr814@gmail.com', password: 'Satyam@123', role: 'user' }
            ];

            for (const account of testAccounts) {
                const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [account.email]);

                if (existingUser.rows.length === 0) {
                    const passwordHash = await bcrypt.hash(account.password, 10);
                    await pool.query(
                        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                        [account.email, passwordHash, account.role]
                    );
                    console.log(`✅ Created test account: ${account.email}`);
                } else {
                    // Update password for existing user to ensure it matches the requested ones
                    const passwordHash = await bcrypt.hash(account.password, 10);
                    await pool.query(
                        'UPDATE users SET password_hash = $1 WHERE email = $2',
                        [passwordHash, account.email]
                    );
                    console.log(`ℹ️ Updated password for account: ${account.email}`);
                }
            }

            console.log('✅ Database seeding completed successfully');
        } catch (error) {
            console.error('❌ Database seeding failed:', error);
        }
    }
}

module.exports = new SeederService();
