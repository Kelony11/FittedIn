const connectionService = require('../services/connectionService');
const autoAcceptService = require('../services/autoAcceptService');
const ResponseHandler = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class ConnectionController {
    /**
     * Send a connection request
     * POST /api/connections
     */
    sendConnectionRequest = asyncHandler(async (req, res) => {
        const requesterId = req.user.id;
        const { receiver_id } = req.body;

        if (!receiver_id) {
            return ResponseHandler.validationError(res, [{ msg: 'receiver_id is required' }]);
        }

        const connection = await connectionService.sendConnectionRequest(requesterId, receiver_id);

        ResponseHandler.success(
            res,
            { connection },
            'Connection request sent successfully',
            201
        );
    });

    /**
     * Accept a connection request
     * PUT /api/connections/:id/accept
     */
    acceptConnectionRequest = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        const connection = await connectionService.acceptConnectionRequest(userId, id);

        ResponseHandler.success(
            res,
            { connection },
            'Connection request accepted successfully'
        );
    });

    /**
     * Reject a connection request
     * PUT /api/connections/:id/reject
     */
    rejectConnectionRequest = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        const connection = await connectionService.rejectConnectionRequest(userId, id);

        ResponseHandler.success(
            res,
            { connection },
            'Connection request rejected successfully'
        );
    });

    /**
     * Get all connections for current user
     * GET /api/connections
     */
    getConnections = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { status = 'accepted' } = req.query;

        const connections = await connectionService.getConnections(userId, status);

        ResponseHandler.success(
            res,
            { connections },
            'Connections retrieved successfully'
        );
    });

    /**
     * Get pending connection requests
     * GET /api/connections/pending
     */
    getPendingRequests = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        const requests = await connectionService.getPendingRequests(userId);

        ResponseHandler.success(
            res,
            requests,
            'Pending requests retrieved successfully'
        );
    });

    /**
     * Remove a connection
     * DELETE /api/connections/:id
     */
    removeConnection = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        await connectionService.removeConnection(userId, id);

        ResponseHandler.success(
            res,
            null,
            'Connection removed successfully'
        );
    });

    /**
     * Search for users to connect with
     * GET /api/connections/search
     */
    searchUsers = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { q: searchTerm = '', limit = 20, offset = 0 } = req.query;

        const result = await connectionService.searchUsers(userId, searchTerm, limit, offset);

        ResponseHandler.success(
            res,
            result,
            'Users retrieved successfully'
        );
    });

    /**
     * Get connection status between current user and another user
     * GET /api/connections/status/:userId
     */
    getConnectionStatus = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { userId: otherUserId } = req.params;

        const status = await connectionService.getConnectionStatus(userId, otherUserId);

        ResponseHandler.success(
            res,
            { status },
            'Connection status retrieved successfully'
        );
    });

    /**
     * Process pending requests for seeded users (admin/utility endpoint)
     * POST /api/connections/auto-accept-pending
     */
    processAutoAccept = asyncHandler(async (req, res) => {
        const result = await autoAcceptService.processPendingRequestsForSeededUsers();

        ResponseHandler.success(
            res,
            result,
            'Auto-accept processing completed'
        );
    });
}

module.exports = new ConnectionController();

