const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is required');
    process.exit(1);
}

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Validate email configuration
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration missing. Password reset functionality will not work.');
}

// Register new user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const [existingUser] = await db.promise().execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await db.promise().execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Create user profile
        await db.promise().execute(
            'INSERT INTO user_profiles (user_id) VALUES (?)',
            [result.insertId]
        );

        res.status(201).json({ 
            message: 'User created successfully',
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt received');

        // Validate input
        if (!email || !password) {
            console.log('Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Test login shortcut removed to prevent unintended user creation

        // Try database login
        try {
            const [users] = await db.promise().execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            console.log('Database query completed');

            if (users.length === 0) {
                console.log(`Authentication failed - user not found for email: ${email}`);
                return res.status(401).json({ 
                    message: 'User account not found. Please check your email or register a new account.',
                    errorType: 'USER_NOT_FOUND'
                });
            }

            const user = users[0];
            console.log('User authenticated successfully');

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                console.log(`Authentication failed - invalid password for email: ${email}`);
                return res.status(401).json({ 
                    message: 'Invalid password. Please check your password and try again.',
                    errorType: 'INVALID_PASSWORD'
                });
            }

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('Login successful - token generated');

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            });

        } catch (dbError) {
            console.error('Database connection error');
            return res.status(500).json({ message: 'Server error. Please try again later.' });
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if user exists
        const [users] = await db.promise().execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Store reset token
        await db.promise().execute(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
            [email, resetToken, expiresAt]
        );

        // Send email (in production, you would send a real email)
        const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        
        console.log(`Password reset link for ${email}: ${resetLink}`);

        res.json({ 
            message: 'Password reset link sent to your email',
            resetLink // Only for development
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if token is valid
        const [tokens] = await db.promise().execute(
            'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const resetToken = tokens[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password
        await db.promise().execute(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, resetToken.email]
        );

        // Delete used token
        await db.promise().execute(
            'DELETE FROM password_resets WHERE token = ?',
            [token]
        );

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.promise().execute(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [req.user.userId]
        );

        // If user doesn't exist in DB but token is valid (e.g., test account), return a default profile
        if (users.length === 0) {
            return res.json({
                user: {
                    id: req.user.userId,
                    name: 'Test User',
                    email: req.user.email,
                    created_at: new Date().toISOString()
                },
                profile: {}
            });
        }

        const [profiles] = await db.promise().execute(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [req.user.userId]
        );

        res.json({
            user: users[0],
            profile: profiles[0] || {}
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Test endpoint to check API connectivity
router.get('/test', (req, res) => {
    console.log('🧪 Test endpoint called');
    res.json({
        message: 'Auth API is working',
        timestamp: new Date().toISOString(),
        user: req.user || 'No user (not authenticated)'
    });
});

// Check if user exists by email
router.post('/check-user', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const [users] = await db.promise().execute(
            'SELECT id, name, email, created_at FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.json({
                exists: false,
                message: 'User account not found',
                suggestion: 'Please register a new account or check your email address'
            });
        }

        const user = users[0];
        return res.json({
            exists: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                memberSince: user.created_at
            },
            message: 'User account found'
        });

    } catch (error) {
        console.error('Check user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    console.log('🚀 PUT /profile endpoint called');
    console.log('👤 Request user from token:', req.user);

    try {
        const { height, weight, age, gender, activity_level, bmi: providedBmi } = req.body;
        const userId = req.user.userId;

        console.log('🔄 Updating profile for user:', userId);
        console.log('📊 Received data:', { height, weight, age, gender, activity_level, bmi: providedBmi });

        // First check if user exists
        const [userCheck] = await db.promise().execute(
            'SELECT id, name, email FROM users WHERE id = ?',
            [userId]
        );

        if (userCheck.length === 0) {
            console.error('❌ User not found in database:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('✅ User exists:', userCheck[0]);

        // Validate and convert data types
        const heightNum = height ? parseFloat(height) : null;
        const weightNum = weight ? parseFloat(weight) : null;
        const ageNum = age ? parseInt(age) : null;

        console.log('🔢 Parsed data:', { heightNum, weightNum, ageNum, gender, activity_level });

        // Validate ranges
        if (heightNum !== null && (heightNum <= 0 || heightNum > 300)) {
            console.error('❌ Invalid height range:', heightNum);
            return res.status(400).json({ message: 'Invalid height value' });
        }
        if (weightNum !== null && (weightNum <= 0 || weightNum > 500)) {
            console.error('❌ Invalid weight range:', weightNum);
            return res.status(400).json({ message: 'Invalid weight value' });
        }

        // Use provided BMI if available, otherwise calculate. Avoid writing zeros; use null when unknown
        let bmi = null;
        if (providedBmi !== undefined && providedBmi !== null && Number(providedBmi) > 0) {
            bmi = parseFloat(providedBmi);
            console.log('✅ Using provided BMI:', bmi.toFixed(2));
        } else if (heightNum !== null && weightNum !== null && heightNum > 0 && weightNum > 0) {
            const heightInMeters = heightNum / 100;
            bmi = weightNum / (heightInMeters * heightInMeters);
            console.log('🧮 Calculated BMI:', bmi.toFixed(2));
        } else {
            console.log('⚠️ Cannot calculate BMI: missing or invalid height/weight');
        }

        // Calculate BMR (Basal Metabolic Rate)
        let bmr = null;
        if (heightNum !== null && weightNum !== null && ageNum !== null && gender) {
            if (gender === 'male') {
                bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
            } else if (gender === 'female') {
                bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
            }
            console.log('🔥 Calculated BMR:', bmr.toFixed(2));
        }

        // Update or insert profile using MySQL UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
        console.log('💾 Executing database update...');

        const dbGender = gender || null;
        const dbActivityLevel = activity_level || null;

        // Use INSERT ... ON DUPLICATE KEY UPDATE for proper UPSERT
        // This will insert if no profile exists, or update if it does (based on UNIQUE constraint on user_id)
        const [upsertResult] = await db.promise().execute(
            `INSERT INTO user_profiles (user_id, height, weight, age, gender, activity_level, bmi, bmr)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               height = COALESCE(VALUES(height), height),
               weight = COALESCE(VALUES(weight), weight),
               age = COALESCE(VALUES(age), age),
               gender = COALESCE(VALUES(gender), gender),
               activity_level = COALESCE(VALUES(activity_level), activity_level),
               bmi = COALESCE(VALUES(bmi), bmi),
               bmr = COALESCE(VALUES(bmr), bmr),
               updated_at = CURRENT_TIMESTAMP`,
            [userId, heightNum, weightNum, ageNum, dbGender, dbActivityLevel, bmi, bmr]
        );
        
        if (upsertResult.insertId > 0) {
            console.log('✅ New profile created:', upsertResult.insertId);
        } else {
            console.log('✅ Existing profile updated for user:', userId);
        }

        // Return the updated profile data for immediate display
        const [updatedProfile] = await db.promise().execute(
            'SELECT * FROM user_profiles WHERE user_id = ?',
            [userId]
        );

        res.json({
            message: 'Profile updated successfully',
            profile: updatedProfile[0] || {}
        });

    } catch (error) {
        console.error('❌ Update profile error:', error);
        console.error('📋 Error details:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            stack: error.stack
        });

        // Return detailed error in development
        if (process.env.NODE_ENV === 'development') {
            return res.status(500).json({
                message: 'Internal server error',
                error: error.message,
                details: {
                    code: error.code,
                    sqlState: error.sqlState,
                    sqlMessage: error.sqlMessage
                }
            });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
