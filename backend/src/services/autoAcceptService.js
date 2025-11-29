const User = require('../models/User');
const Connection = require('../models/Connection');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

/**
 * Service to automatically accept connection requests for seeded/fake users
 */
class AutoAcceptService {
    /**
     * Check if a user is a seeded/fake user
     * Seeded users are identified by:
     * 1. Email pattern (contains @example.com or similar fake domains)
     * 2. Created during seeding (we can check creation time or add a flag)
     */
    async isSeededUser(userId) {
        try {
            const user = await User.findByPk(userId);
            if (!user) {
                return false;
            }

            // Check if email matches seeded user pattern
            // Seeded users use emails like: firstname.lastname@fittedin-seeded.com
            const seededEmailPatterns = [
                /@fittedin-seeded\.com$/i,
                /@example\.com$/i,
                /@faker\.com$/i,
                /@test\.com$/i
            ];

            const isSeededEmail = seededEmailPatterns.some(pattern =>
                pattern.test(user.email)
            );

            // Also check if user was created recently (within last 24 hours of seeding)
            // This is a heuristic - in production you might want a dedicated flag
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const isRecentlyCreated = new Date(user.created_at) > oneDayAgo;

            // User is considered seeded if email matches pattern OR was recently created
            // In a real scenario, you might want to add an `is_seeded` flag to the User model
            return isSeededEmail || (isRecentlyCreated && user.email.includes('@'));
        } catch (error) {
            logger.error('Failed to check if user is seeded', error);
            return false;
        }
    }

    /**
     * Automatically accept a connection request if the receiver is a seeded user
     */
    async autoAcceptIfSeeded(connectionId, receiverId) {
        try {
            const isSeeded = await this.isSeededUser(receiverId);

            if (!isSeeded) {
                return false; // Not a seeded user, don't auto-accept
            }

            // Find the connection
            const connection = await Connection.findByPk(connectionId);
            if (!connection) {
                logger.warn('Connection not found for auto-accept', { connectionId });
                return false;
            }

            // Only auto-accept if status is pending
            if (connection.status !== 'pending') {
                return false;
            }

            // Auto-accept the connection
            await connection.update({ status: 'accepted' });

            logger.info('Auto-accepted connection request for seeded user', {
                connectionId,
                receiverId,
                requesterId: connection.requester_id
            });

            // Send notification to requester
            try {
                const receiver = await User.findByPk(receiverId);
                if (receiver) {
                    await notificationService.notifyConnectionAccepted(
                        connection.requester_id,
                        receiverId,
                        receiver.display_name
                    );
                }
            } catch (error) {
                logger.error('Failed to send auto-accept notification', error);
                // Don't fail if notification fails
            }

            return true;
        } catch (error) {
            logger.error('Failed to auto-accept connection', error);
            return false;
        }
    }

    /**
     * Process all pending connection requests for seeded users
     * This can be called periodically or manually
     */
    async processPendingRequestsForSeededUsers() {
        try {
            logger.info('Processing pending requests for seeded users');

            // Get all pending connections
            const pendingConnections = await Connection.findAll({
                where: { status: 'pending' }
            });

            let autoAcceptedCount = 0;

            for (const connection of pendingConnections) {
                const receiverId = connection.receiver_id;
                const isSeeded = await this.isSeededUser(receiverId);

                if (isSeeded) {
                    const accepted = await this.autoAcceptIfSeeded(connection.id, receiverId);
                    if (accepted) {
                        autoAcceptedCount++;
                    }
                }
            }

            logger.info('Auto-accept processing completed', {
                totalPending: pendingConnections.length,
                autoAccepted: autoAcceptedCount
            });

            return {
                totalPending: pendingConnections.length,
                autoAccepted: autoAcceptedCount
            };
        } catch (error) {
            logger.error('Failed to process pending requests', error);
            throw error;
        }
    }
}

module.exports = new AutoAcceptService();

