/**
 * Migration Script: users.json → PostgreSQL
 * 
 * This script migrates users from the file-based storage (users.json)
 * to PostgreSQL database. It properly hashes passwords using bcrypt.
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... node migrate-users-to-postgres.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Validate environment
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set.');
  console.error('   Set it before running: DATABASE_URL=postgresql://... node migrate-users-to-postgres.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const USERS_JSON_PATH = path.join(__dirname, 'users.json');

/**
 * Migrate users from users.json to PostgreSQL
 */
const migrateUsers = async () => {
  try {
    console.log('🚀 Starting user migration to PostgreSQL...');
    console.log(`📁 Reading from: ${USERS_JSON_PATH}`);

    // 1. Check if users.json exists
    if (!fs.existsSync(USERS_JSON_PATH)) {
      console.log('ℹ️  users.json not found. No users to migrate.');
      process.exit(0);
    }

    // 2. Read users.json
    const usersData = fs.readFileSync(USERS_JSON_PATH, 'utf8');
    let users;
    try {
      const parsed = JSON.parse(usersData);
      users = Array.isArray(parsed) ? parsed : (parsed.users || []);
    } catch (error) {
      console.error('❌ Failed to parse users.json:', error.message);
      process.exit(1);
    }

    if (!Array.isArray(users) || users.length === 0) {
      console.log('ℹ️  No users found in users.json.');
      process.exit(0);
    }

    console.log(`📊 Found ${users.length} user(s) to migrate`);

    // 3. Test database connection
    try {
      await pool.query('SELECT 1');
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.error('   Ensure DATABASE_URL is correct and database is accessible');
      process.exit(1);
    }

    // 4. Verify users table exists
    try {
      await pool.query('SELECT 1 FROM users LIMIT 1');
    } catch (error) {
      console.error('❌ Users table does not exist.');
      console.error('   Run the database schema first: psql "$DATABASE_URL" -f database/schema.sql');
      process.exit(1);
    }

    // 5. Migrate each user
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
      try {
        const email = user.email?.toLowerCase().trim();
        if (!email) {
          console.warn(`⚠️  Skipping user with missing email: ${JSON.stringify(user)}`);
          errors++;
          continue;
        }

        // Check if user already exists
        const existingUser = await pool.query(
          'SELECT id, email FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          console.log(`ℹ️  User already exists (skipping): ${email}`);
          skipped++;
          continue;
        }

        // Handle password
        let passwordHash;
        if (user.password) {
          // Check if password is already hashed (starts with $2a$ or $2b$)
          if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            // Already hashed, use as-is
            passwordHash = user.password;
            console.log(`   Using existing hash for: ${email}`);
          } else {
            // Plain text password - hash it
            console.warn(`⚠️  WARNING: Plain text password found for ${email}. Hashing now...`);
            passwordHash = await bcrypt.hash(user.password, 10);
          }
        } else {
          console.warn(`⚠️  No password found for ${email}. Skipping.`);
          errors++;
          continue;
        }

        // Insert user into database
        const result = await pool.query(
          `INSERT INTO users (email, password_hash, created_at) 
           VALUES ($1, $2, $3) 
           RETURNING id, email, created_at`,
          [
            email,
            passwordHash,
            user.createdAt || user.created_at || new Date().toISOString()
          ]
        );

        console.log(`✅ Migrated: ${email} (ID: ${result.rows[0].id})`);
        migrated++;

      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
        errors++;
      }
    }

    // 6. Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ℹ️  Skipped (already exists): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📝 Total processed: ${users.length}`);

    if (migrated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('   Users can now log in using their original passwords.');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run migration
migrateUsers();
