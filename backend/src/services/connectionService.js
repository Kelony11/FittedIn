const User = require('../models/User');
const Profile = require('../models/Profile');
const Connection = require('../models/Connection');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const notificationService = require('./notificationService');
const autoAcceptService = require('./autoAcceptService');

class ConnectionService {
    /**
     * Send a connection request
     */
    async sendConnectionRequest(requesterId, receiverId) {
        try {
            logger.info('Sending connection request', { requesterId, receiverId });

            // Cannot send request to yourself
            if (requesterId === receiverId) {
                throw new AppError('Cannot send connection request to yourself', 400);
            }

            // Check if receiver exists
            const receiver = await User.findByPk(receiverId);
            if (!receiver) {
                throw new AppError('User not found', 404);
            }

            // Check if connection already exists
            const existingConnection = await Connection.findOne({
                where: {
                    [Op.or]: [
                        { requester_id: requesterId, receiver_id: receiverId },
                        { requester_id: receiverId, receiver_id: requesterId }
                    ]
                }
            });

            if (existingConnection) {
                if (existingConnection.status === 'accepted') {
                    throw new AppError('Already connected', 400);
                } else if (existingConnection.status === 'pending') {
                    throw new AppError('Connection request already pending', 400);
                } else if (existingConnection.status === 'blocked') {
                    throw new AppError('Connection is blocked', 403);
                }
            }

            // Create connection request
            const connection = await Connection.create({
                requester_id: requesterId,
                receiver_id: receiverId,
                status: 'pending'
            });

            // Auto-accept if receiver is a seeded user
            const wasAutoAccepted = await autoAcceptService.autoAcceptIfSeeded(
                connection.id,
                receiverId
            );

            // Reload connection to get updated status
            if (wasAutoAccepted) {
                await connection.reload();
                logger.info('Connection auto-accepted for seeded user', {
                    connectionId: connection.id,
                    receiverId
                });
            } else {
                // Only send notification if not auto-accepted (notification sent in auto-accept)
                try {
                    const requester = await User.findByPk(requesterId);
                    if (requester) {
                        await notificationService.notifyConnectionRequest(
                            receiverId,
                            requesterId,
                            requester.display_name
                        );
                    }
                } catch (error) {
                    logger.error('Failed to send connection request notification', error);
                    // Don't fail the request if notification fails
                }
            }

            logger.info('Connection request sent successfully', {
                connectionId: connection.id,
                autoAccepted: wasAutoAccepted
            });

            return connection.toJSON();
        } catch (error) {
            logger.error('Failed to send connection request', error);
            throw error;
        }
    }

    /**
     * Accept a connection request
     */
    async acceptConnectionRequest(userId, connectionId) {
        try {
            logger.info('Accepting connection request', { userId, connectionId });

            const connection = await Connection.findOne({
                where: {
                    id: connectionId,
                    receiver_id: userId,
                    status: 'pending'
                }
            });

            if (!connection) {
                throw new AppError('Connection request not found', 404);
            }

            await connection.update({ status: 'accepted' });

            // Send notification to requester
            try {
                const receiver = await User.findByPk(userId);
                if (receiver) {
                    await notificationService.notifyConnectionAccepted(
                        connection.requester_id,
                        userId,
                        receiver.display_name
                    );
                }
            } catch (error) {
                logger.error('Failed to send connection accepted notification', error);
                // Don't fail the request if notification fails
            }

            logger.info('Connection request accepted', { connectionId });

            return connection.toJSON();
        } catch (error) {
            logger.error('Failed to accept connection request', error);
            throw error;
        }
    }

    /**
     * Reject a connection request
     */
    async rejectConnectionRequest(userId, connectionId) {
        try {
            logger.info('Rejecting connection request', { userId, connectionId });

            const connection = await Connection.findOne({
                where: {
                    id: connectionId,
                    receiver_id: userId,
                    status: 'pending'
                }
            });

            if (!connection) {
                throw new AppError('Connection request not found', 404);
            }

            await connection.update({ status: 'rejected' });

            logger.info('Connection request rejected', { connectionId });

            return connection.toJSON();
        } catch (error) {
            logger.error('Failed to reject connection request', error);
            throw error;
        }
    }

    /**
     * Get all connections for a user
     */
    async getConnections(userId, status = 'accepted') {
        try {
            logger.debug('Fetching connections', { userId, status });

            const connections = await Connection.findAll({
                where: {
                    [Op.or]: [
                        { requester_id: userId, status },
                        { receiver_id: userId, status }
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'requester',
                        attributes: ['id', 'display_name', 'email', 'avatar_url']
                    },
                    {
                        model: User,
                        as: 'receiver',
                        attributes: ['id', 'display_name', 'email', 'avatar_url']
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            // Format connections to show the other user and fetch their profile
            const formattedConnections = await Promise.all(connections.map(async (connection) => {
                const otherUser = connection.requester_id === userId
                    ? connection.receiver
                    : connection.requester;

                let profile = null;
                if (otherUser) {
                    const userProfile = await Profile.findOne({ where: { user_id: otherUser.id } });
                    if (userProfile) {
                        profile = {
                            bio: userProfile.bio,
                            location: userProfile.location,
                            fitness_level: userProfile.fitness_level,
                            primary_goals: userProfile.primary_goals
                        };
                    }
                }

                return {
                    id: connection.id,
                    status: connection.status,
                    created_at: connection.created_at,
                    updated_at: connection.updated_at,
                    user: otherUser ? {
                        id: otherUser.id,
                        display_name: otherUser.display_name,
                        email: otherUser.email,
                        avatar_url: otherUser.avatar_url,
                        profile
                    } : null
                };
            }));

            return formattedConnections;
        } catch (error) {
            logger.error('Failed to fetch connections', error);
            throw error;
        }
    }

    /**
     * Get pending connection requests (sent and received)
     */
    async getPendingRequests(userId) {
        try {
            logger.debug('Fetching pending requests', { userId });

            const sentRequests = await Connection.findAll({
                where: {
                    requester_id: userId,
                    status: 'pending'
                },
                include: [{
                    model: User,
                    as: 'receiver',
                    attributes: ['id', 'display_name', 'email', 'avatar_url']
                }],
                order: [['created_at', 'DESC']]
            });

            const receivedRequests = await Connection.findAll({
                where: {
                    receiver_id: userId,
                    status: 'pending'
                },
                include: [{
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'display_name', 'email', 'avatar_url']
                }],
                order: [['created_at', 'DESC']]
            });

            // Fetch profiles for sent requests
            const sentWithProfiles = await Promise.all(sentRequests.map(async (conn) => {
                let profile = null;
                if (conn.receiver) {
                    const userProfile = await Profile.findOne({ where: { user_id: conn.receiver.id } });
                    if (userProfile) {
                        profile = {
                            bio: userProfile.bio,
                            location: userProfile.location,
                            fitness_level: userProfile.fitness_level
                        };
                    }
                }
                return {
                    id: conn.id,
                    status: conn.status,
                    created_at: conn.created_at,
                    user: conn.receiver ? {
                        id: conn.receiver.id,
                        display_name: conn.receiver.display_name,
                        email: conn.receiver.email,
                        avatar_url: conn.receiver.avatar_url,
                        profile
                    } : null
                };
            }));

            // Fetch profiles for received requests
            const receivedWithProfiles = await Promise.all(receivedRequests.map(async (conn) => {
                let profile = null;
                if (conn.requester) {
                    const userProfile = await Profile.findOne({ where: { user_id: conn.requester.id } });
                    if (userProfile) {
                        profile = {
                            bio: userProfile.bio,
                            location: userProfile.location,
                            fitness_level: userProfile.fitness_level
                        };
                    }
                }
                return {
                    id: conn.id,
                    status: conn.status,
                    created_at: conn.created_at,
                    user: conn.requester ? {
                        id: conn.requester.id,
                        display_name: conn.requester.display_name,
                        email: conn.requester.email,
                        avatar_url: conn.requester.avatar_url,
                        profile
                    } : null
                };
            }));

            return {
                sent: sentWithProfiles,
                received: receivedWithProfiles
            };
        } catch (error) {
            logger.error('Failed to fetch pending requests', error);
            throw error;
        }
    }

    /**
     * Remove a connection
     */
    async removeConnection(userId, connectionId) {
        try {
            logger.info('Removing connection', { userId, connectionId });

            const connection = await Connection.findOne({
                where: {
                    id: connectionId,
                    [Op.or]: [
                        { requester_id: userId },
                        { receiver_id: userId }
                    ],
                    status: 'accepted'
                }
            });

            if (!connection) {
                throw new AppError('Connection not found', 404);
            }

            await connection.destroy();

            logger.info('Connection removed', { connectionId });

            return true;
        } catch (error) {
            logger.error('Failed to remove connection', error);
            throw error;
        }
    }

    /**
     * Search for users to connect with
     */
    async searchUsers(userId, searchTerm = '', limit = 20, offset = 0) {
        try {
            logger.debug('Searching users', { userId, searchTerm, limit, offset });

            // Get user's existing connections
            const existingConnections = await Connection.findAll({
                where: {
                    [Op.or]: [
                        { requester_id: userId },
                        { receiver_id: userId }
                    ]
                }
            });

            const connectedUserIds = new Set();
            existingConnections.forEach(conn => {
                if (conn.requester_id === userId) {
                    connectedUserIds.add(conn.receiver_id);
                } else {
                    connectedUserIds.add(conn.requester_id);
                }
            });
            connectedUserIds.add(userId); // Exclude self

            // Build search query
            const whereClause = {
                id: {
                    [Op.notIn]: Array.from(connectedUserIds)
                }
            };

            if (searchTerm) {
                whereClause[Op.or] = [
                    { display_name: { [Op.iLike]: `%${searchTerm}%` } },
                    { email: { [Op.iLike]: `%${searchTerm}%` } }
                ];
            }

            const { count, rows } = await User.findAndCountAll({
                where: whereClause,
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['created_at', 'DESC']]
            });

            // Build a map of connection statuses for all found users
            const foundUserIds = rows.map(u => u.id);
            const connectionsMap = new Map();

            if (foundUserIds.length > 0) {
                const relevantConnections = await Connection.findAll({
                    where: {
                        [Op.or]: [
                            { requester_id: userId, receiver_id: { [Op.in]: foundUserIds } },
                            { receiver_id: userId, requester_id: { [Op.in]: foundUserIds } }
                        ]
                    }
                });

                relevantConnections.forEach(conn => {
                    const otherUserId = conn.requester_id === userId
                        ? conn.receiver_id
                        : conn.requester_id;
                    connectionsMap.set(otherUserId, {
                        status: conn.status,
                        isRequester: conn.requester_id === userId
                    });
                });
            }

            // Fetch profiles for users and include connection status
            const usersWithProfiles = await Promise.all(rows.map(async (user) => {
                const userProfile = await Profile.findOne({ where: { user_id: user.id } });
                const connectionInfo = connectionsMap.get(user.id);

                return {
                    id: user.id,
                    display_name: user.display_name,
                    email: user.email,
                    avatar_url: user.avatar_url,
                    profile: userProfile ? {
                        bio: userProfile.bio,
                        location: userProfile.location,
                        fitness_level: userProfile.fitness_level,
                        primary_goals: userProfile.primary_goals
                    } : null,
                    connectionStatus: connectionInfo || { status: 'none' }
                };
            }));

            return {
                users: usersWithProfiles,
                pagination: {
                    total: count,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Failed to search users', error);
            throw error;
        }
    }

    /**
     * Check connection status between two users
     */
    async getConnectionStatus(userId, otherUserId) {
        try {
            const connection = await Connection.findOne({
                where: {
                    [Op.or]: [
                        { requester_id: userId, receiver_id: otherUserId },
                        { requester_id: otherUserId, receiver_id: userId }
                    ]
                }
            });

            if (!connection) {
                return { status: 'none' };
            }

            if (connection.requester_id === userId) {
                return {
                    status: connection.status,
                    isRequester: true
                };
            } else {
                return {
                    status: connection.status,
                    isRequester: false
                };
            }
        } catch (error) {
            logger.error('Failed to get connection status', error);
            throw error;
        }
    }
}

module.exports = new ConnectionService();

