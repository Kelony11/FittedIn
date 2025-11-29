const express = require('express');
const { query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const activityController = require('../controllers/activityController');
const { validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// All routes require authentication
router.use(authenticateToken);

// Get user's activities
router.get('/',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
        query('activity_type').optional().isIn([
            'goal_created',
            'goal_updated',
            'goal_progress',
            'goal_completed',
            'goal_deleted',
            'profile_updated',
            'connection_request',
            'connection_accepted'
        ])
    ],
    validate,
    activityController.getUserActivities
);

// Get activity feed
router.get('/feed',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    activityController.getActivityFeed
);

// Get activity statistics
router.get('/stats',
    [
        query('days').optional().isInt({ min: 1, max: 365 })
    ],
    validate,
    activityController.getActivityStats
);

module.exports = router;

