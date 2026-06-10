const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { AuthenticationError } = require('./errorHandler');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('JWT_SECRET environment variable is required');
    process.exit(1);
}

// Rate limiter for authentication attempts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many authentication attempts, please try again later'
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new AuthenticationError('Access token required');
        }

        jwt.verify(token, JWT_SECRET, { maxAge: '24h' }, (err, user) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    throw new AuthenticationError('Token has expired');
                }
                throw new AuthenticationError('Invalid token');
            }
            req.user = user;
            next();
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { authenticateToken, authLimiter };
