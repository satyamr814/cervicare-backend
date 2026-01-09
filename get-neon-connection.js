/**
 * Get Neon Database Connection String
 * This script helps you get your Neon database connection string
 */

const https = require('https');

const NEON_API_KEY = 'napi_qwhvr48ifdjn89z4gi7mponc546ufiq3evuw0qqdyjdbg6r57381ijjz9bzlrl39';

async function getNeonConnection() {
  try {
    console.log('🔍 Fetching Neon projects...');
    
    // Note: This is a simplified version. In practice, you'd use the Neon API
    // For now, we'll guide the user to get it manually
    
    console.log('\n📝 To get your Neon database connection string:');
    console.log('1. Go to https://console.neon.tech/');
    console.log('2. Sign in with your account');
    console.log('3. Select your project (or create a new one)');
    console.log('4. Click on your database');
    console.log('5. Go to "Connection Details" or "Connection String" tab');
    console.log('6. Copy the connection string');
    console.log('\nThe connection string should look like:');
    console.log('postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require');
    console.log('\nThen set it as an environment variable:');
    console.log('DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getNeonConnection();
