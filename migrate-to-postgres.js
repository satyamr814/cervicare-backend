const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Paths to data files
const PROFILES_PATH = path.join(__dirname, 'user-profiles.json');
const USERS_JSON_PATH = path.join(__dirname, 'users.json');

const migrate = async () => {
    try {
        console.log('🚀 Starting migration to PostgreSQL...');

        // 1. Read JSON Data
        let profiles = [];
        if (fs.existsSync(PROFILES_PATH)) {
            profiles = JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf8'));
        }

        let users = [];
        // Combine known users with profiles
        const knownUsers = [
            { email: "doffyism1@gmail.com", password: "Satyam@123" },
            { email: "weebmafia1@gmail.com", password: "Satyam@123" },
            { email: "satyamr814@gmail.com", password: "Satyam@123" },
            { email: "admin@cervicare.com", password: "password", role: 'admin' }
        ];

        // 2. Process and Insert Users
        for (const u of knownUsers) {
            // Check if user exists
            const res = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);

            let userId;
            if (res.rows.length === 0) {
                // Hash password
                const hash = await bcrypt.hash(u.password, 10);
                const role = u.role || 'user';

                const insertRes = await pool.query(
                    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
                    [u.email, hash, role]
                );
                userId = insertRes.rows[0].id;
                console.log(`✅ Migrated user: ${u.email}`);
            } else {
                userId = res.rows[0].id;
                console.log(`ℹ️ User exists (skipping): ${u.email}`);
            }

            // 3. Migrate Profile Data
            const profile = profiles.find(p => p.email === u.email) || {};
            if (userId) {
                // Upsert profile
                await pool.query(`
          INSERT INTO user_profiles (
            user_id, age, city, diet_type, budget_level, lifestyle
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (user_id) DO UPDATE SET
            age = EXCLUDED.age,
            city = EXCLUDED.city,
            diet_type = EXCLUDED.diet_type,
            budget_level = EXCLUDED.budget_level,
            lifestyle = EXCLUDED.lifestyle
        `, [
                    userId,
                    profile.age || u.age,
                    profile.city || u.city,
                    profile.diet_type,
                    profile.budget || profile.budget_level,
                    profile.lifestyle
                ]);
            }
        }

        console.log('✅ Migration completed successfully');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrate();
