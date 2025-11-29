const express = require('express');
const { query, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');
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

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Get notifications
router.get('/',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 }),
        query('unread_only').optional().isBoolean()
    ],
    validate,
    notificationController.getNotifications
);

// Mark notification as read
router.put('/:id/read',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    notificationController.markAsRead
);

// Delete notification
router.delete('/:id',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    notificationController.deleteNotification
);

module.exports = router;

