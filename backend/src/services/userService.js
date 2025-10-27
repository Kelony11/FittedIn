const User = require('../models/User');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class UserService {
    /**
     * Get user by ID
     */
    async getUserById(userId) {
        try {
            logger.debug('Fetching user', { userId });

            const user = await User.findByPk(userId);

            if (!user) {
                throw new AppError('User not found', 404);
            }

            return user.toJSON();
        } catch (error) {
            logger.error('Failed to fetch user', error);
            throw error;
        }
    }

    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        try {
            const user = await User.findOne({ where: { email } });
            return user ? user.toJSON() : null;
        } catch (error) {
            logger.error('Failed to fetch user by email', error);
            throw error;
        }
    }

    /**
     * Update user information
     */
    async updateUser(userId, updateData) {
        try {
            logger.info('Updating user', { userId });

            const user = await User.findByPk(userId);

            if (!user) {
                throw new AppError('User not found', 404);
            }

            await user.update(updateData);

            logger.info('User updated successfully', { userId });

            return user.toJSON();
        } catch (error) {
            logger.error('Failed to update user', error);
            throw error;
        }
    }

    /**
     * Delete user
     */
    async deleteUser(userId) {
        try {
            logger.info('Deleting user', { userId });

            const user = await User.findByPk(userId);

            if (!user) {
                throw new AppError('User not found', 404);
            }

            await user.destroy();

            logger.info('User deleted successfully', { userId });

            return true;
        } catch (error) {
            logger.error('Failed to delete user', error);
            throw error;
        }
    }

    /**
     * Get all users (with pagination)
     */
    async getAllUsers(page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { count, rows } = await User.findAndCountAll({
                limit,
                offset,
                order: [['created_at', 'DESC']]
            });

            return {
                users: rows.map(user => user.toJSON()),
                pagination: {
                    total: count,
                    page,
                    limit,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            logger.error('Failed to fetch users', error);
            throw error;
        }
    }
}

module.exports = new UserService();
