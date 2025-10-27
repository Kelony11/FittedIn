const profileService = require('../services/profileService');
const ResponseHandler = require('../utils/response');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

class ProfileController {
    /**
     * Get current user's profile
     * GET /api/profiles/me
     */
    getMyProfile = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const profile = await profileService.getProfile(userId);

        ResponseHandler.success(
            res,
            { profile },
            'Profile retrieved successfully'
        );
    });

    /**
     * Update current user's profile
     * PUT /api/profiles/me
     */
    updateMyProfile = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const updateData = req.body;

        const profile = await profileService.updateProfile(userId, updateData);

        ResponseHandler.success(
            res,
            { profile },
            'Profile updated successfully'
        );
    });

    /**
     * Get another user's public profile
     * GET /api/profiles/:userId
     */
    getUserProfile = asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const currentUserId = req.user.id;

        const profile = await profileService.getPublicProfile(userId, currentUserId);

        ResponseHandler.success(res, { profile }, 'Profile retrieved successfully');
    });
}

module.exports = new ProfileController();
