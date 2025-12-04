const postService = require('../services/postService');
const ResponseHandler = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class PostController {
    /**
     * Create a new post
     * POST /api/posts
     */
    createPost = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { content } = req.body;

        if (!content) {
            return ResponseHandler.validationError(res, [{ msg: 'Content is required' }]);
        }

        const post = await postService.createPost(userId, content);

        ResponseHandler.success(
            res,
            { post },
            'Post created successfully',
            201
        );
    });

    /**
     * Get feed posts
     * GET /api/posts/feed
     */
    getFeed = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { limit, offset } = req.query;

        const posts = await postService.getFeed(userId, {
            limit: limit || 50,
            offset: offset || 0
        });

        ResponseHandler.success(
            res,
            { posts },
            'Feed retrieved successfully'
        );
    });

    /**
     * Get a specific post
     * GET /api/posts/:id
     */
    getPost = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        const post = await postService.getPostById(id, userId);

        ResponseHandler.success(
            res,
            { post },
            'Post retrieved successfully'
        );
    });

    /**
     * Get user's posts
     * GET /api/posts/user/:userId
     */
    getUserPosts = asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const { limit, offset } = req.query;

        const posts = await postService.getUserPosts(userId, {
            limit: limit || 50,
            offset: offset || 0
        });

        ResponseHandler.success(
            res,
            { posts },
            'User posts retrieved successfully'
        );
    });

    /**
     * Update a post
     * PUT /api/posts/:id
     */
    updatePost = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return ResponseHandler.validationError(res, [{ msg: 'Content is required' }]);
        }

        const post = await postService.updatePost(id, userId, content);

        ResponseHandler.success(
            res,
            { post },
            'Post updated successfully'
        );
    });

    /**
     * Delete a post
     * DELETE /api/posts/:id
     */
    deletePost = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        await postService.deletePost(id, userId);

        ResponseHandler.success(
            res,
            null,
            'Post deleted successfully'
        );
    });

    /**
     * Like a post
     * POST /api/posts/:id/like
     */
    likePost = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        await postService.likePost(id, userId);

        ResponseHandler.success(
            res,
            null,
            'Post liked successfully'
        );
    });

    /**
     * Unlike a post
     * DELETE /api/posts/:id/like
     */
    unlikePost = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        await postService.unlikePost(id, userId);

        ResponseHandler.success(
            res,
            null,
            'Post unliked successfully'
        );
    });

    /**
     * Comment on a post
     * POST /api/posts/:id/comment
     */
    commentOnPost = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return ResponseHandler.validationError(res, [{ msg: 'Comment content is required' }]);
        }

        const comment = await postService.commentOnPost(id, userId, content);

        ResponseHandler.success(
            res,
            { comment },
            'Comment added successfully',
            201
        );
    });

    /**
     * Get comments for a post
     * GET /api/posts/:id/comments
     */
    getPostComments = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { limit, offset } = req.query;

        const comments = await postService.getPostComments(id, {
            limit: limit || 50,
            offset: offset || 0
        });

        ResponseHandler.success(
            res,
            { comments },
            'Comments retrieved successfully'
        );
    });

    /**
     * Delete a comment
     * DELETE /api/posts/comments/:id
     */
    deleteComment = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const { id } = req.params;

        await postService.deleteComment(id, userId);

        ResponseHandler.success(
            res,
            null,
            'Comment deleted successfully'
        );
    });
}

module.exports = new PostController();

