const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const fixPasswords = async () => {
    try {
        console.log('🔧 Starting password fix utility...');

        const updates = [
            { email: "doffyism1@gmail.com", newPassword: "Satyam@123" },
            { email: "weebmafia1@gmail.com", newPassword: "Satyam@123" },
            { email: "satyamr814@gmail.com", newPassword: "Satyam@123" },
            { email: "admin@cervicare.com", newPassword: "password" }
        ];

        console.log(`Found ${updates.length} accounts to verify/update.`);

        for (const u of updates) {
            // Check if user exists
            const res = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);

            if (res.rows.length === 0) {
                console.warn(`⚠️ User not found: ${u.email}`);
                continue;
            }

            // Update password
            const hash = await bcrypt.hash(u.newPassword, 10);
            await pool.query(
                'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
                [hash, u.email]
            );

            console.log(`✅ Password updated for: ${u.email}`);
        }

        console.log('🎉 All password updates completed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Password fix failed:', error);
        process.exit(1);
    }
};

fixPasswords();
