const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User registration validation
const validateSignup = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    handleValidationErrors
];

// User login validation
const validateLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    
    handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
    body('height')
        .optional()
        .isFloat({ min: 50, max: 300 })
        .withMessage('Height must be between 50 and 300 cm'),
    
    body('weight')
        .optional()
        .isFloat({ min: 20, max: 500 })
        .withMessage('Weight must be between 20 and 500 kg'),
    
    body('age')
        .optional()
        .isInt({ min: 13, max: 120 })
        .withMessage('Age must be between 13 and 120 years'),
    
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),
    
    body('activity_level')
        .optional()
        .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
        .withMessage('Activity level must be one of: sedentary, light, moderate, active, very_active'),
    
    handleValidationErrors
];

// Workout validation
const validateWorkout = [
    body('workout_type')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Workout type is required and must be less than 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Workout type can only contain letters and spaces'),
    
    body('exercise_name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Exercise name is required and must be less than 100 characters'),
    
    body('sets')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Sets must be between 0 and 100'),
    
    body('reps')
        .optional()
        .isInt({ min: 0, max: 1000 })
        .withMessage('Reps must be between 0 and 1000'),
    
    body('duration')
        .optional()
        .isInt({ min: 0, max: 1440 })
        .withMessage('Duration must be between 0 and 1440 minutes'),
    
    body('weight')
        .optional()
        .isFloat({ min: 0, max: 1000 })
        .withMessage('Weight must be between 0 and 1000 kg'),
    
    body('calories_burned')
        .optional()
        .isInt({ min: 0, max: 10000 })
        .withMessage('Calories burned must be between 0 and 10000'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters'),
    
    handleValidationErrors
];

// BMI calculation validation
const validateBMICalculation = [
    body('height')
        .isFloat({ min: 50, max: 300 })
        .withMessage('Height must be between 50 and 300 cm'),
    
    body('weight')
        .isFloat({ min: 20, max: 500 })
        .withMessage('Weight must be between 20 and 500 kg'),
    
    handleValidationErrors
];

// Forgot password validation
const validateForgotPassword = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    handleValidationErrors
];

// Reset password validation
const validateResetPassword = [
    body('token')
        .isUUID()
        .withMessage('Invalid reset token format'),
    
    body('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('Password must be between 6 and 128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    handleValidationErrors
];

// Parameter validation
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer'),
    
    handleValidationErrors
];

// Query validation for pagination
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('period')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Period must be between 1 and 365 days'),
    
    handleValidationErrors
];

module.exports = {
    validateSignup,
    validateLogin,
    validateProfileUpdate,
    validateWorkout,
    validateBMICalculation,
    validateForgotPassword,
    validateResetPassword,
    validateId,
    validatePagination,
    handleValidationErrors
};

