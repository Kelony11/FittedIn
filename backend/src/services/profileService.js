const User = require('../models/User');
const Profile = require('../models/Profile');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

class ProfileService {
    /**
     * Get user profile
     */
    async getProfile(userId) {
        try {
            logger.debug('Fetching profile', { userId });

            let profile = await Profile.findOne({ where: { user_id: userId } });

            if (!profile) {
                // Create default profile if it doesn't exist
                profile = await Profile.create({
                    user_id: userId,
                    privacy_settings: {
                        profile_visibility: 'public',
                        show_activity: true,
                        show_goals: true,
                        show_connections: true
                    }
                });
            }

            // Get user information
            const user = await User.findByPk(userId);

            return {
                ...profile.toJSON(),
                user: {
                    id: user.id,
                    display_name: user.display_name,
                    email: user.email,
                    avatar_url: user.avatar_url
                }
            };
        } catch (error) {
            logger.error('Failed to fetch profile', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, updateData) {
        try {
            logger.info('Updating profile', { userId });

            // Find or create profile
            let profile = await Profile.findOne({ where: { user_id: userId } });

            if (!profile) {
                profile = await Profile.create({
                    user_id: userId,
                    ...updateData
                });
            } else {
                await profile.update(updateData);
            }

            // Get user information
            const user = await User.findByPk(userId);

            logger.info('Profile updated successfully', { userId });

            return {
                ...profile.toJSON(),
                user: {
                    id: user.id,
                    display_name: user.display_name,
                    email: user.email,
                    avatar_url: user.avatar_url
                }
            };
        } catch (error) {
            logger.error('Failed to update profile', error);
            throw error;
        }
    }

    /**
     * Get another user's public profile
     */
    async getPublicProfile(userId, currentUserId) {
        try {
            logger.debug('Fetching public profile', { userId, currentUserId });

            // Check if user exists
            const user = await User.findByPk(userId);

            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Get user's profile
            const profile = await Profile.findOne({ where: { user_id: userId } });

            if (!profile) {
                throw new AppError('Profile not found', 404);
            }

            // Check privacy settings
            const privacySettings = profile.privacy_settings || {};

            // If profile is private and not the current user, return limited info
            if (privacySettings.profile_visibility === 'private' && userId !== currentUserId.toString()) {
                throw new AppError('Profile is private', 403);
            }

            // Return public profile data
            return {
                id: profile.id,
                user_id: profile.user_id,
                pronouns: profile.pronouns,
                bio: profile.bio,
                location: profile.location,
                fitness_level: profile.fitness_level,
                primary_goals: profile.primary_goals,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                user: {
                    id: user.id,
                    display_name: user.display_name,
                    avatar_url: user.avatar_url
                }
            };
        } catch (error) {
            logger.error('Failed to fetch public profile', error);
            throw error;
        }
    }

    /**
     * Calculate profile completion percentage
     */
    calculateProfileCompletion(profile) {
        let score = 0;
        const maxScore = 100;

        // Basic info (40 points)
        if (profile.location) score += 10;
        if (profile.bio && profile.bio.length > 50) score += 15;
        if (profile.pronouns) score += 5;
        if (profile.date_of_birth) score += 10;

        // Physical info (20 points)
        if (profile.height) score += 5;
        if (profile.weight) score += 5;
        if (profile.fitness_level) score += 10;

        // Goals (20 points)
        const primaryGoals = profile.primary_goals || [];
        if (primaryGoals.length > 0) score += 20;

        // Skills (20 points)
        const skills = profile.skills || [];
        if (skills.length > 0) score += 20;

        return Math.min(score, maxScore);
    }
}

module.exports = new ProfileService();
