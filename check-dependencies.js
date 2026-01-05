// Script to check if all dependencies are installed
const fs = require('fs');
const path = require('path');

console.log('Checking dependencies...\n');

const requiredDependencies = [
    'express',
    'bcrypt',
    'uuid'
];

let allInstalled = true;

requiredDependencies.forEach(dep => {
    try {
        require.resolve(dep);
        console.log(`✅ ${dep} is installed`);
    } catch (error) {
        console.log(`❌ ${dep} is NOT installed`);
        allInstalled = false;
    }
});

if (!allInstalled) {
    console.log('\n⚠️  Some dependencies are missing. Please run: npm install\n');
    process.exit(1);
} else {
    console.log('\n✅ All dependencies are installed!\n');
}

