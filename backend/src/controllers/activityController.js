const activityService = require('../services/activityService');
const ResponseHandler = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class ActivityController {
    /**
     * Get user's activities
     * GET /api/activities
     */
    getUserActivities = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { limit, offset, activity_type } = req.query;

        const activities = await activityService.getUserActivities(userId, {
            limit: limit || 50,
            offset: offset || 0,
            activityType: activity_type || null,
            includeRelated: true
        });

        ResponseHandler.success(
            res,
            { activities },
            'Activities retrieved successfully'
        );
    });

    /**
     * Get activity feed (user's activities + connections' activities)
     * GET /api/activities/feed
     */
    getActivityFeed = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { limit, offset } = req.query;

        // Get user's connections
        const Connection = require('../models/Connection');
        const { Op } = require('sequelize');

        const connections = await Connection.findAll({
            where: {
                [Op.or]: [
                    { requester_id: userId, status: 'accepted' },
                    { receiver_id: userId, status: 'accepted' }
                ]
            }
        });

        // Get connected user IDs
        const connectedUserIds = [];
        connections.forEach(conn => {
            if (conn.requester_id === userId) {
                connectedUserIds.push(conn.receiver_id);
            } else {
                connectedUserIds.push(conn.requester_id);
            }
        });

        const activities = await activityService.getActivityFeed(userId, connectedUserIds, {
            limit: limit || 50,
            offset: offset || 0
        });

        ResponseHandler.success(
            res,
            { activities },
            'Activity feed retrieved successfully'
        );
    });

    /**
     * Get activity statistics
     * GET /api/activities/stats
     */
    getActivityStats = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { days = 30 } = req.query;

        const stats = await activityService.getActivityStats(userId, parseInt(days));

        ResponseHandler.success(
            res,
            { stats },
            'Activity statistics retrieved successfully'
        );
    });
}

module.exports = new ActivityController();

