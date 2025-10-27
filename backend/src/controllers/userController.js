const userService = require('../services/userService');
const ResponseHandler = require('../utils/response');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

class UserController {
    /**
     * Get user by ID
     * GET /api/users/:id
     */
    getUserById = asyncHandler(async (req, res) => {
        const { id } = req.params;

        const user = await userService.getUserById(id);

        ResponseHandler.success(res, { user }, 'User retrieved successfully');
    });

    /**
     * Update user
     * PUT /api/users/:id
     */
    updateUser = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        const user = await userService.updateUser(id, updateData);

        ResponseHandler.success(res, { user }, 'User updated successfully');
    });

    /**
     * Delete user
     * DELETE /api/users/:id
     */
    deleteUser = asyncHandler(async (req, res) => {
        const { id } = req.params;

        await userService.deleteUser(id);

        ResponseHandler.success(res, null, 'User deleted successfully');
    });

    /**
     * Get all users
     * GET /api/users
     */
    getAllUsers = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await userService.getAllUsers(page, limit);

        ResponseHandler.success(res, result, 'Users retrieved successfully');
    });
}

module.exports = new UserController();
