const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const connectionController = require('../controllers/connectionController');
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

// Search for users to connect with
router.get('/search',
    [
        query('q').optional().trim().isLength({ max: 100 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    connectionController.searchUsers
);

// Get connection status with a specific user
router.get('/status/:userId',
    [
        param('userId').isInt({ min: 1 })
    ],
    validate,
    connectionController.getConnectionStatus
);

// Get pending connection requests
router.get('/pending', connectionController.getPendingRequests);

// Get all connections (default: accepted)
router.get('/',
    [
        query('status').optional().isIn(['pending', 'accepted', 'rejected', 'blocked'])
    ],
    validate,
    connectionController.getConnections
);

// Send a connection request
router.post('/',
    [
        body('receiver_id')
            .isInt({ min: 1 })
            .withMessage('receiver_id must be a valid user ID')
    ],
    validate,
    connectionController.sendConnectionRequest
);

// Accept a connection request
router.put('/:id/accept',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    connectionController.acceptConnectionRequest
);

// Reject a connection request
router.put('/:id/reject',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    connectionController.rejectConnectionRequest
);

// Remove a connection
router.delete('/:id',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    connectionController.removeConnection
);

// Process auto-accept for pending requests (utility endpoint)
router.post('/auto-accept-pending', connectionController.processAutoAccept);

module.exports = router;

