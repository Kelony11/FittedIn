const notificationService = require('../services/notificationService');
const ResponseHandler = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class NotificationController {
    /**
     * Get user's notifications
     * GET /api/notifications
     */
    getNotifications = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { limit, offset, unread_only } = req.query;

        const notifications = await notificationService.getUserNotifications(userId, {
            limit: limit || 50,
            offset: offset || 0,
            unreadOnly: unread_only === 'true'
        });

        ResponseHandler.success(
            res,
            { notifications },
            'Notifications retrieved successfully'
        );
    });

    /**
     * Get unread notification count
     * GET /api/notifications/unread-count
     */
    getUnreadCount = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const count = await notificationService.getUnreadCount(userId);

        ResponseHandler.success(
            res,
            { count },
            'Unread count retrieved successfully'
        );
    });

    /**
     * Mark notification as read
     * PUT /api/notifications/:id/read
     */
    markAsRead = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await notificationService.markAsRead(id, userId);

        ResponseHandler.success(
            res,
            { notification },
            'Notification marked as read'
        );
    });

    /**
     * Mark all notifications as read
     * PUT /api/notifications/read-all
     */
    markAllAsRead = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const count = await notificationService.markAllAsRead(userId);

        ResponseHandler.success(
            res,
            { count },
            'All notifications marked as read'
        );
    });

    /**
     * Delete a notification
     * DELETE /api/notifications/:id
     */
    deleteNotification = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        await notificationService.deleteNotification(id, userId);

        ResponseHandler.success(
            res,
            null,
            'Notification deleted successfully'
        );
    });
}

module.exports = new NotificationController();

