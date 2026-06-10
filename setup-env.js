const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment configuration...\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    
    if (fs.existsSync(envExamplePath)) {
        console.log('📋 Copying .env.example to .env...');
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created from .env.example');
        console.log('\n⚠️  IMPORTANT: Please update the following values in your .env file:');
        console.log('   - DB_PASSWORD: Set your MySQL password');
        console.log('   - JWT_SECRET: Generate a secure random string');
        console.log('   - EMAIL_USER: Your email for password reset (optional)');
        console.log('   - EMAIL_PASS: Your email app password (optional)');
    } else {
        console.log('❌ .env.example file not found!');
        console.log('Creating a basic .env file...');
        
        const basicEnvContent = `# Database Configuration
DB_HOST=localhost
DB_USER=fitness_user
DB_PASSWORD=your_password_here
DB_NAME=fitness_guide
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Server Configuration
PORT=3000
NODE_ENV=development

# Email Configuration (Optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Application Settings
APP_NAME=FITNESS GUIDE
APP_URL=http://localhost:3000
`;
        
        fs.writeFileSync(envPath, basicEnvContent);
        console.log('✅ Basic .env file created');
    }
} else {
    console.log('✅ .env file already exists');
}

console.log('\n🔍 Checking environment variables...');

// Load environment variables
require('dotenv').config();

const requiredVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const optionalVars = ['EMAIL_USER', 'EMAIL_PASS'];

let allGood = true;

requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].includes('your_') || process.env[varName].includes('_here')) {
        console.log(`❌ ${varName}: Not configured properly`);
        allGood = false;
    } else {
        console.log(`✅ ${varName}: Configured`);
    }
});

optionalVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].includes('your_') || process.env[varName].includes('_here')) {
        console.log(`⚠️  ${varName}: Not configured (optional for email features)`);
    } else {
        console.log(`✅ ${varName}: Configured`);
    }
});

if (allGood) {
    console.log('\n🎉 Environment configuration looks good!');
    console.log('You can now run: npm install && npm start');
} else {
    console.log('\n⚠️  Please update the required environment variables in your .env file before starting the server.');
}
