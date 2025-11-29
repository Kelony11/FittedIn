const Notification = require('../models/Notification');
const User = require('../models/User');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class NotificationService {
    /**
     * Create a notification
     */
    async createNotification(userId, type, title, message = null, relatedEntityType = null, relatedEntityId = null, fromUserId = null) {
        try {
            logger.debug('Creating notification', { userId, type });

            const notification = await Notification.create({
                user_id: userId,
                type,
                title,
                message,
                related_entity_type: relatedEntityType,
                related_entity_id: relatedEntityId,
                from_user_id: fromUserId
            });

            return notification.toJSON();
        } catch (error) {
            logger.error('Failed to create notification', error);
            throw error;
        }
    }

    /**
     * Notify user of connection request
     */
    async notifyConnectionRequest(receiverId, requesterId, requesterName) {
        return this.createNotification(
            receiverId,
            'connection_request',
            `${requesterName} wants to connect`,
            `${requesterName} sent you a connection request`,
            'connection',
            null,
            requesterId
        );
    }

    /**
     * Notify user of connection accepted
     */
    async notifyConnectionAccepted(userId, otherUserId, otherUserName) {
        return this.createNotification(
            userId,
            'connection_accepted',
            `${otherUserName} accepted your connection request`,
            `You are now connected with ${otherUserName}`,
            'connection',
            null,
            otherUserId
        );
    }

    /**
     * Notify user of post like
     */
    async notifyPostLike(postOwnerId, likerId, likerName, postId) {
        return this.createNotification(
            postOwnerId,
            'post_like',
            `${likerName} liked your post`,
            null,
            'post',
            postId,
            likerId
        );
    }

    /**
     * Notify user of post comment
     */
    async notifyPostComment(postOwnerId, commenterId, commenterName, postId) {
        return this.createNotification(
            postOwnerId,
            'post_comment',
            `${commenterName} commented on your post`,
            null,
            'post',
            postId,
            commenterId
        );
    }

    /**
     * Get user's notifications
     */
    async getUserNotifications(userId, options = {}) {
        try {
            const {
                limit = 50,
                offset = 0,
                unreadOnly = false
            } = options;

            logger.debug('Fetching notifications', { userId, limit, offset, unreadOnly });

            const whereClause = { user_id: userId };

            if (unreadOnly) {
                whereClause.is_read = false;
            }

            const notifications = await Notification.findAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'fromUser',
                        attributes: ['id', 'display_name', 'avatar_url'],
                        required: false
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return notifications.map(notif => notif.toJSON());
        } catch (error) {
            logger.error('Failed to fetch notifications', error);
            throw error;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        try {
            const count = await Notification.count({
                where: {
                    user_id: userId,
                    is_read: false
                }
            });

            return count;
        } catch (error) {
            logger.error('Failed to get unread count', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        try {
            logger.debug('Marking notification as read', { notificationId, userId });

            const notification = await Notification.findOne({
                where: {
                    id: notificationId,
                    user_id: userId
                }
            });

            if (!notification) {
                throw new AppError('Notification not found', 404);
            }

            await notification.markAsRead();

            return notification.toJSON();
        } catch (error) {
            logger.error('Failed to mark notification as read', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        try {
            logger.debug('Marking all notifications as read', { userId });

            const updated = await Notification.update(
                {
                    is_read: true,
                    read_at: new Date()
                },
                {
                    where: {
                        user_id: userId,
                        is_read: false
                    }
                }
            );

            return updated[0]; // Number of updated rows
        } catch (error) {
            logger.error('Failed to mark all notifications as read', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        try {
            logger.debug('Deleting notification', { notificationId, userId });

            const notification = await Notification.findOne({
                where: {
                    id: notificationId,
                    user_id: userId
                }
            });

            if (!notification) {
                throw new AppError('Notification not found', 404);
            }

            await notification.destroy();

            return true;
        } catch (error) {
            logger.error('Failed to delete notification', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();

