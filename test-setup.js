// Test script to verify Phase 1 backend setup
require('dotenv').config();
const pool = require('./src/config/database');
const googleSheetsService = require('./src/services/googleSheetsService');

console.log('🧪 CerviCare Phase 1 - Setup Verification\n');
console.log('='.repeat(50));

async function testDatabase() {
    console.log('\n📊 Testing Database Connection...');
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        console.log(`   Server time: ${result.rows[0].now}`);

        // Test tables exist
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

        console.log(`✅ Found ${tables.rows.length} tables:`);
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Count records
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const profileCount = await pool.query('SELECT COUNT(*) FROM user_profiles');
        const dietCount = await pool.query('SELECT COUNT(*) FROM diet_content');
        const protectionCount = await pool.query('SELECT COUNT(*) FROM protection_plan_content');

        console.log('\n📈 Record Counts:');
        console.log(`   Users: ${userCount.rows[0].count}`);
        console.log(`   Profiles: ${profileCount.rows[0].count}`);
        console.log(`   Diet Content: ${dietCount.rows[0].count}`);
        console.log(`   Protection Plans: ${protectionCount.rows[0].count}`);

        if (parseInt(dietCount.rows[0].count) === 0) {
            console.log('\n⚠️  WARNING: No diet content found!');
            console.log('   Run: psql "YOUR_DB_URL" -f database/sample-content.sql');
        }

        if (parseInt(protectionCount.rows[0].count) === 0) {
            console.log('\n⚠️  WARNING: No protection plan content found!');
            console.log('   Run: psql "YOUR_DB_URL" -f database/sample-content.sql');
        }

        return true;
    } catch (error) {
        console.log('❌ Database connection failed');
        console.log(`   Error: ${error.message}`);
        console.log('\n💡 Fix:');
        console.log('   1. Check DATABASE_URL in .env');
        console.log('   2. Verify Neon database is active');
        console.log('   3. Run: psql "YOUR_DB_URL" -f database/schema.sql');
        return false;
    }
}

async function testGoogleSheets() {
    console.log('\n📊 Testing Google Sheets Connection...');
    try {
        const initialized = await googleSheetsService.initialize();

        if (initialized) {
            console.log('✅ Google Sheets connected successfully');
            console.log(`   Spreadsheet ID: ${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}`);
        } else {
            console.log('⚠️  Google Sheets not configured (optional)');
            console.log('   This is OK for testing, but recommended for production');
            console.log('\n💡 To enable:');
            console.log('   1. Set GOOGLE_SHEETS_CREDENTIALS_PATH in .env');
            console.log('   2. Set GOOGLE_SHEETS_SPREADSHEET_ID in .env');
            console.log('   3. Share spreadsheet with service account email');
        }

        return true;
    } catch (error) {
        console.log('⚠️  Google Sheets connection failed (optional)');
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

function testEnvironment() {
    console.log('\n🔧 Testing Environment Variables...');

    const required = [
        'DATABASE_URL',
        'JWT_SECRET',
        'PORT'
    ];

    const optional = [
        'GOOGLE_SHEETS_CREDENTIALS_PATH',
        'GOOGLE_SHEETS_SPREADSHEET_ID',
        'NODE_ENV',
        'ALLOWED_ORIGINS'
    ];

    let allGood = true;

    console.log('\n✅ Required Variables:');
    required.forEach(key => {
        if (process.env[key]) {
            const value = key.includes('SECRET') || key.includes('URL')
                ? '***' + process.env[key].slice(-4)
                : process.env[key];
            console.log(`   ${key}: ${value}`);
        } else {
            console.log(`   ❌ ${key}: MISSING`);
            allGood = false;
        }
    });

    console.log('\n📋 Optional Variables:');
    optional.forEach(key => {
        if (process.env[key]) {
            const value = key.includes('PATH') || key.includes('ID')
                ? '***' + process.env[key].slice(-10)
                : process.env[key];
            console.log(`   ${key}: ${value}`);
        } else {
            console.log(`   ${key}: Not set`);
        }
    });

    if (!allGood) {
        console.log('\n💡 Fix:');
        console.log('   1. Copy .env.phase1 to .env');
        console.log('   2. Update the values');
        console.log('   3. Run this test again');
    }

    return allGood;
}

async function runTests() {
    try {
        // Test environment
        const envOk = testEnvironment();

        if (!envOk) {
            console.log('\n❌ Environment setup incomplete');
            console.log('   Fix environment variables first, then run again');
            process.exit(1);
        }

        // Test database
        const dbOk = await testDatabase();

        // Test Google Sheets (optional)
        await testGoogleSheets();

        console.log('\n' + '='.repeat(50));

        if (dbOk) {
            console.log('\n✅ Phase 1 Setup Complete!');
            console.log('\n🚀 Next Steps:');
            console.log('   1. Start server: npm run dev');
            console.log('   2. Test API: curl http://localhost:3000/api/health');
            console.log('   3. Read API docs: API-DOCUMENTATION.md');
            console.log('   4. Deploy to Render: RENDER-DEPLOYMENT.md');
        } else {
            console.log('\n❌ Setup Incomplete');
            console.log('   Fix the issues above and run again');
            process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

runTests();
