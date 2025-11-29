const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const postController = require('../controllers/postController');
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

// Get feed
router.get('/feed',
    [
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    postController.getFeed
);

// Get user's posts
router.get('/user/:userId',
    [
        param('userId').isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('offset').optional().isInt({ min: 0 })
    ],
    validate,
    postController.getUserPosts
);

// Get a specific post
router.get('/:id',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    postController.getPost
);

// Create a new post
router.post('/',
    [
        body('content')
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage('Content must be between 1 and 5000 characters')
    ],
    validate,
    postController.createPost
);

// Update a post
router.put('/:id',
    [
        param('id').isInt({ min: 1 }),
        body('content')
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage('Content must be between 1 and 5000 characters')
    ],
    validate,
    postController.updatePost
);

// Delete a post
router.delete('/:id',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    postController.deletePost
);

// Like a post
router.post('/:id/like',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    postController.likePost
);

// Unlike a post
router.delete('/:id/like',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    postController.unlikePost
);

// Comment on a post
router.post('/:id/comment',
    [
        param('id').isInt({ min: 1 }),
        body('content')
            .trim()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Comment content must be between 1 and 1000 characters')
    ],
    validate,
    postController.commentOnPost
);

// Delete a comment
router.delete('/comments/:id',
    [
        param('id').isInt({ min: 1 })
    ],
    validate,
    postController.deleteComment
);

module.exports = router;

