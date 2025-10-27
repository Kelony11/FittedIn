const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const Goal = require('../models/Goal');
const User = require('../models/User');

const router = express.Router();

// Get all goals for current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, category, limit = 50, offset = 0 } = req.query;

        const whereClause = { user_id: userId };

        if (status) {
            whereClause.status = status;
        }

        if (category) {
            whereClause.category = category;
        }

        const goals = await Goal.findAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'display_name', 'avatar_url']
            }]
        });

        res.json({
            success: true,
            goals: goals.map(goal => goal.toJSON()),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: goals.length
            }
        });
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get goals'
        });
    }
});

// Get a specific goal
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const goal = await Goal.findOne({
            where: { id, user_id: userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'display_name', 'avatar_url']
            }]
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        res.json({
            success: true,
            goal: goal.toJSON()
        });
    } catch (error) {
        console.error('Get goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get goal'
        });
    }
});

// Create a new goal
router.post('/', authenticateToken, [
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('category')
        .isIn(['weight_loss', 'weight_gain', 'muscle_gain', 'cardio', 'flexibility', 'nutrition', 'mental_health', 'sleep', 'hydration', 'other'])
        .withMessage('Invalid category'),
    body('target_value')
        .isFloat({ min: 0 })
        .withMessage('Target value must be a positive number'),
    body('unit')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Unit must be between 1 and 50 characters'),
    body('target_date')
        .optional()
        .isISO8601()
        .withMessage('Target date must be a valid date'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('is_public')
        .optional()
        .isBoolean()
        .withMessage('is_public must be a boolean')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.user.id;
        const goalData = {
            ...req.body,
            user_id: userId,
            current_value: req.body.current_value || 0
        };

        const goal = await Goal.create(goalData);

        res.status(201).json({
            success: true,
            message: 'Goal created successfully',
            goal: goal.toJSON()
        });
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create goal'
        });
    }
});

// Update a goal
router.put('/:id', authenticateToken, [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    body('category')
        .optional()
        .isIn(['weight_loss', 'weight_gain', 'muscle_gain', 'cardio', 'flexibility', 'nutrition', 'mental_health', 'sleep', 'hydration', 'other'])
        .withMessage('Invalid category'),
    body('target_value')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Target value must be a positive number'),
    body('current_value')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Current value must be a positive number'),
    body('unit')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Unit must be between 1 and 50 characters'),
    body('target_date')
        .optional()
        .isISO8601()
        .withMessage('Target date must be a valid date'),
    body('status')
        .optional()
        .isIn(['active', 'completed', 'paused', 'cancelled'])
        .withMessage('Status must be active, completed, paused, or cancelled'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('is_public')
        .optional()
        .isBoolean()
        .withMessage('is_public must be a boolean')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const userId = req.user.id;

        const goal = await Goal.findOne({
            where: { id, user_id: userId }
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        await goal.update(req.body);

        res.json({
            success: true,
            message: 'Goal updated successfully',
            goal: goal.toJSON()
        });
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update goal'
        });
    }
});

// Delete a goal
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const goal = await Goal.findOne({
            where: { id, user_id: userId }
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        await goal.destroy();

        res.json({
            success: true,
            message: 'Goal deleted successfully'
        });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete goal'
        });
    }
});

// Update goal progress
router.patch('/:id/progress', authenticateToken, [
    body('current_value')
        .isFloat({ min: 0 })
        .withMessage('Current value must be a positive number'),
    body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters')
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const userId = req.user.id;
        const { current_value, notes } = req.body;

        const goal = await Goal.findOne({
            where: { id, user_id: userId }
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        // Update current value and notes
        await goal.update({
            current_value,
            notes: notes || goal.notes
        });

        // Check if goal is completed
        if (current_value >= goal.target_value && goal.status === 'active') {
            await goal.update({ status: 'completed' });
        }

        res.json({
            success: true,
            message: 'Goal progress updated successfully',
            goal: goal.toJSON()
        });
    } catch (error) {
        console.error('Update goal progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update goal progress'
        });
    }
});

module.exports = router;
