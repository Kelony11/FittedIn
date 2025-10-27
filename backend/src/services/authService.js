const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class AuthService {
    /**
     * Register a new user
     */
    async register(userData) {
        try {
            logger.info('Registering new user', { email: userData.email });

            // Check if user already exists
            const existingUser = await User.findOne({
                where: { email: userData.email }
            });

            if (existingUser) {
                throw new AppError('User with this email already exists', 409);
            }

            // Create new user
            const user = await User.create({
                display_name: userData.displayName,
                email: userData.email,
                password_hash: userData.password
            });

            // Generate JWT token
            const token = this.generateToken(user.id, user.email);

            logger.info('User registered successfully', { userId: user.id });

            return {
                user: user.toJSON(),
                token
            };
        } catch (error) {
            logger.error('Registration failed', error);
            throw error;
        }
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            logger.info('Attempting login', { email });

            // Find user
            const user = await User.findOne({ where: { email } });

            if (!user) {
                throw new AppError('Invalid email or password', 401);
            }

            // Verify password
            const isValid = await user.validatePassword(password);

            if (!isValid) {
                throw new AppError('Invalid email or password', 401);
            }

            // Generate JWT token
            const token = this.generateToken(user.id, user.email);

            logger.info('Login successful', { userId: user.id });

            return {
                user: user.toJSON(),
                token
            };
        } catch (error) {
            logger.error('Login failed', error);
            throw error;
        }
    }

    /**
     * Verify JWT token
     */
    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new AppError('Invalid or expired token', 401);
        }
    }

    /**
     * Generate JWT token
     */
    generateToken(userId, email) {
        const payload = {
            userId,
            email
        };

        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        return jwt.sign(payload, secret, { expiresIn });
    }
}

module.exports = new AuthService();
