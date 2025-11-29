const Activity = require('../models/Activity');
const User = require('../models/User');
const Goal = require('../models/Goal');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class ActivityService {
    /**
     * Log an activity
     */
    async logActivity(userId, activityType, activityData = {}, relatedEntityType = null, relatedEntityId = null) {
        try {
            logger.debug('Logging activity', { userId, activityType });

            const activity = await Activity.create({
                user_id: userId,
                activity_type: activityType,
                activity_data: activityData,
                related_entity_type: relatedEntityType,
                related_entity_id: relatedEntityId
            });

            return activity.toJSON();
        } catch (error) {
            logger.error('Failed to log activity', error);
            throw error;
        }
    }

    /**
     * Log goal creation
     */
    async logGoalCreated(userId, goal) {
        return this.logActivity(
            userId,
            'goal_created',
            {
                goal_title: goal.title,
                goal_category: goal.category,
                target_value: goal.target_value,
                unit: goal.unit
            },
            'goal',
            goal.id
        );
    }

    /**
     * Log goal update
     */
    async logGoalUpdated(userId, goal, changes = {}) {
        return this.logActivity(
            userId,
            'goal_updated',
            {
                goal_title: goal.title,
                changes
            },
            'goal',
            goal.id
        );
    }

    /**
     * Log goal progress update
     */
    async logGoalProgress(userId, goal, previousValue, newValue) {
        const progressPercent = ((newValue / goal.target_value) * 100).toFixed(1);

        return this.logActivity(
            userId,
            'goal_progress',
            {
                goal_title: goal.title,
                previous_value: previousValue,
                current_value: newValue,
                target_value: goal.target_value,
                progress_percent: progressPercent,
                unit: goal.unit
            },
            'goal',
            goal.id
        );
    }

    /**
     * Log goal completion
     */
    async logGoalCompleted(userId, goal) {
        return this.logActivity(
            userId,
            'goal_completed',
            {
                goal_title: goal.title,
                goal_category: goal.category,
                final_value: goal.current_value,
                target_value: goal.target_value,
                unit: goal.unit
            },
            'goal',
            goal.id
        );
    }

    /**
     * Log goal deletion
     */
    async logGoalDeleted(userId, goalData) {
        return this.logActivity(
            userId,
            'goal_deleted',
            {
                goal_title: goalData.title || 'Unknown Goal'
            },
            'goal',
            goalData.id
        );
    }

    /**
     * Log profile update
     */
    async logProfileUpdated(userId, changes = {}) {
        return this.logActivity(
            userId,
            'profile_updated',
            { changes },
            'profile',
            userId
        );
    }

    /**
     * Log connection request
     */
    async logConnectionRequest(userId, receiverId) {
        return this.logActivity(
            userId,
            'connection_request',
            { receiver_id: receiverId },
            'connection',
            null
        );
    }

    /**
     * Log connection accepted
     */
    async logConnectionAccepted(userId, connectionId, otherUserId) {
        return this.logActivity(
            userId,
            'connection_accepted',
            { connection_id: connectionId, other_user_id: otherUserId },
            'connection',
            connectionId
        );
    }

    /**
     * Get activities for a user
     */
    async getUserActivities(userId, options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                activityType = null,
                includeRelated = true
            } = options;

            logger.debug('Fetching user activities', { userId, limit, offset });

            const whereClause = { user_id: userId };

            if (activityType) {
                whereClause.activity_type = activityType;
            }

            const activities = await Activity.findAll({
                where: whereClause,
                include: includeRelated ? [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'display_name', 'avatar_url']
                    },
                    {
                        model: Goal,
                        as: 'goal',
                        required: false,
                        attributes: ['id', 'title', 'category']
                    }
                ] : [],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return activities.map(activity => activity.toJSON());
        } catch (error) {
            logger.error('Failed to fetch user activities', error);
            throw error;
        }
    }

    /**
     * Get activities feed for user (user's activities + connections' activities)
     */
    async getActivityFeed(userId, connectionIds = [], options = {}) {
        try {
            const {
                limit = 50,
                offset = 0
            } = options;

            logger.debug('Fetching activity feed', { userId, connectionIds: connectionIds.length });

            // Get user's own activities and connections' activities
            const userIds = [userId, ...connectionIds];

            const activities = await Activity.findAll({
                where: {
                    user_id: {
                        [Op.in]: userIds
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'display_name', 'avatar_url']
                    },
                    {
                        model: Goal,
                        as: 'goal',
                        required: false,
                        attributes: ['id', 'title', 'category']
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return activities.map(activity => activity.toJSON());
        } catch (error) {
            logger.error('Failed to fetch activity feed', error);
            throw error;
        }
    }

    /**
     * Get activity statistics for a user
     */
    async getActivityStats(userId, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const stats = await Activity.findAll({
                where: {
                    user_id: userId,
                    created_at: {
                        [Op.gte]: startDate
                    }
                },
                attributes: [
                    'activity_type',
                    [Activity.sequelize.fn('COUNT', Activity.sequelize.col('id')), 'count']
                ],
                group: ['activity_type'],
                raw: true
            });

            const total = await Activity.count({
                where: {
                    user_id: userId,
                    created_at: {
                        [Op.gte]: startDate
                    }
                }
            });

            return {
                total,
                by_type: stats.reduce((acc, stat) => {
                    acc[stat.activity_type] = parseInt(stat.count);
                    return acc;
                }, {}),
                period_days: days
            };
        } catch (error) {
            logger.error('Failed to fetch activity stats', error);
            throw error;
        }
    }
}

module.exports = new ActivityService();

