const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');
const ResponseHandler = require('../utils/response');

const router = express.Router();

/**
 * Validation middleware
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return ResponseHandler.validationError(res, errors.array());
    }
    next();
};

// Register new user
router.post('/register', [
    body('displayName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Display name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
], validate, authController.register);

// Login user
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], validate, authController.login);

// Logout user (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    ResponseHandler.success(res, null, 'Logged out successfully');
});

// Get current user profile
router.get('/me', authenticateToken, (req, res) => {
    ResponseHandler.success(res, {
        user: {
            id: req.user.id,
            email: req.user.email,
            displayName: req.user.display_name,
            avatarUrl: req.user.avatar_url,
            createdAt: req.user.created_at
        }
    }, 'User profile retrieved successfully');
});

module.exports = router;
