const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');
const User = require('../models/User');
const Connection = require('../models/Connection');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');
const notificationService = require('./notificationService');

class PostService {
    /**
     * Create a new post
     */
    async createPost(userId, content) {
        try {
            logger.info('Creating post', { userId });

            if (!content || content.trim().length === 0) {
                throw new AppError('Post content cannot be empty', 400);
            }

            if (content.length > 5000) {
                throw new AppError('Post content cannot exceed 5000 characters', 400);
            }

            const post = await Post.create({
                user_id: userId,
                content: content.trim()
            });

            // Load with user info
            await post.reload({
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'display_name', 'avatar_url']
                }]
            });

            return post.toJSON();
        } catch (error) {
            logger.error('Failed to create post', error);
            throw error;
        }
    }

    /**
     * Get a post by ID
     */
    async getPostById(postId, userId = null) {
        try {
            const post = await Post.findByPk(postId, {
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'display_name', 'avatar_url']
                    },
                    {
                        model: PostLike,
                        as: 'likes',
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'display_name']
                        }]
                    },
                    {
                        model: PostComment,
                        as: 'comments',
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'display_name', 'avatar_url']
                        }],
                        order: [['created_at', 'ASC']]
                    }
                ]
            });

            if (!post) {
                throw new AppError('Post not found', 404);
            }

            const postData = post.toJSON();

            // Add like count and comment count
            postData.like_count = postData.likes ? postData.likes.length : 0;
            postData.comment_count = postData.comments ? postData.comments.length : 0;

            // Check if current user liked the post
            if (userId) {
                const userLike = postData.likes?.find(like => like.user_id === userId);
                postData.is_liked = !!userLike;
            } else {
                postData.is_liked = false;
            }

            return postData;
        } catch (error) {
            logger.error('Failed to get post', error);
            throw error;
        }
    }

    /**
     * Get feed posts (user's posts + connections' posts)
     */
    async getFeed(userId, options = {}) {
        try {
            const {
                limit = 50,
                offset = 0
            } = options;

            logger.debug('Fetching feed', { userId, limit, offset });

            // Get user's connections
            const connections = await Connection.findAll({
                where: {
                    [Op.or]: [
                        { requester_id: userId, status: 'accepted' },
                        { receiver_id: userId, status: 'accepted' }
                    ]
                }
            });

            // Get connected user IDs
            const connectedUserIds = new Set([userId]); // Include own posts
            connections.forEach(conn => {
                const connData = conn.toJSON ? conn.toJSON() : conn;
                if (connData.requester_id === userId) {
                    connectedUserIds.add(connData.receiver_id);
                } else {
                    connectedUserIds.add(connData.requester_id);
                }
            });

            // Get posts from user and connections
            const posts = await Post.findAll({
                where: {
                    user_id: {
                        [Op.in]: Array.from(connectedUserIds)
                    }
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'display_name', 'avatar_url']
                    },
                    {
                        model: PostLike,
                        as: 'likes',
                        attributes: ['id', 'user_id'],
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'display_name']
                        }]
                    },
                    {
                        model: PostComment,
                        as: 'comments',
                        attributes: ['id', 'user_id', 'content', 'created_at'],
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'display_name', 'avatar_url']
                        }],
                        limit: 5, // Limit comments per post in feed
                        order: [['created_at', 'DESC']]
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            // Format posts
            const formattedPosts = posts.map(post => {
                const postData = post.toJSON();
                postData.like_count = postData.likes ? postData.likes.length : 0;
                postData.comment_count = postData.comments ? postData.comments.length : 0;

                // Check if current user liked the post
                const userLike = postData.likes?.find(like => like.user_id === userId);
                postData.is_liked = !!userLike;

                return postData;
            });

            return formattedPosts;
        } catch (error) {
            logger.error('Failed to fetch feed', error);
            throw error;
        }
    }

    /**
     * Get user's posts
     */
    async getUserPosts(userId, options = {}) {
        try {
            const {
                limit = 50,
                offset = 0
            } = options;

            const posts = await Post.findAll({
                where: { user_id: userId },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'display_name', 'avatar_url']
                    },
                    {
                        model: PostLike,
                        as: 'likes',
                        attributes: ['id', 'user_id']
                    },
                    {
                        model: PostComment,
                        as: 'comments',
                        attributes: ['id', 'user_id', 'content', 'created_at'],
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'display_name', 'avatar_url']
                        }]
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return posts.map(post => {
                const postData = post.toJSON();
                postData.like_count = postData.likes ? postData.likes.length : 0;
                postData.comment_count = postData.comments ? postData.comments.length : 0;
                return postData;
            });
        } catch (error) {
            logger.error('Failed to fetch user posts', error);
            throw error;
        }
    }

    /**
     * Update a post
     */
    async updatePost(postId, userId, content) {
        try {
            logger.info('Updating post', { postId, userId });

            const post = await Post.findOne({
                where: { id: postId, user_id: userId }
            });

            if (!post) {
                throw new AppError('Post not found', 404);
            }

            if (!content || content.trim().length === 0) {
                throw new AppError('Post content cannot be empty', 400);
            }

            if (content.length > 5000) {
                throw new AppError('Post content cannot exceed 5000 characters', 400);
            }

            await post.update({ content: content.trim() });
            await post.reload({
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'display_name', 'avatar_url']
                }]
            });

            return post.toJSON();
        } catch (error) {
            logger.error('Failed to update post', error);
            throw error;
        }
    }

    /**
     * Delete a post
     */
    async deletePost(postId, userId) {
        try {
            logger.info('Deleting post', { postId, userId });

            const post = await Post.findOne({
                where: { id: postId, user_id: userId }
            });

            if (!post) {
                throw new AppError('Post not found', 404);
            }

            await post.destroy();

            return true;
        } catch (error) {
            logger.error('Failed to delete post', error);
            throw error;
        }
    }

    /**
     * Like a post
     */
    async likePost(postId, userId) {
        try {
            logger.debug('Liking post', { postId, userId });

            // Check if post exists
            const post = await Post.findByPk(postId);
            if (!post) {
                throw new AppError('Post not found', 404);
            }

            // Check if already liked
            const existingLike = await PostLike.findOne({
                where: { post_id: postId, user_id: userId }
            });

            if (existingLike) {
                throw new AppError('Post already liked', 400);
            }

            const like = await PostLike.create({
                post_id: postId,
                user_id: userId
            });

            // Send notification to post owner (if not liking own post)
            try {
                if (post.user_id !== userId) {
                    const liker = await User.findByPk(userId);
                    if (liker) {
                        await notificationService.notifyPostLike(
                            post.user_id,
                            userId,
                            liker.display_name,
                            postId
                        );
                    }
                }
            } catch (error) {
                logger.error('Failed to send post like notification', error);
                // Don't fail the request if notification fails
            }

            return like.toJSON();
        } catch (error) {
            logger.error('Failed to like post', error);
            throw error;
        }
    }

    /**
     * Unlike a post
     */
    async unlikePost(postId, userId) {
        try {
            logger.debug('Unliking post', { postId, userId });

            const like = await PostLike.findOne({
                where: { post_id: postId, user_id: userId }
            });

            if (!like) {
                throw new AppError('Post not liked', 400);
            }

            await like.destroy();

            return true;
        } catch (error) {
            logger.error('Failed to unlike post', error);
            throw error;
        }
    }

    /**
     * Comment on a post
     */
    async commentOnPost(postId, userId, content) {
        try {
            logger.info('Commenting on post', { postId, userId });

            // Check if post exists
            const post = await Post.findByPk(postId);
            if (!post) {
                throw new AppError('Post not found', 404);
            }

            if (!content || content.trim().length === 0) {
                throw new AppError('Comment content cannot be empty', 400);
            }

            if (content.length > 1000) {
                throw new AppError('Comment content cannot exceed 1000 characters', 400);
            }

            const comment = await PostComment.create({
                post_id: postId,
                user_id: userId,
                content: content.trim()
            });

            // Load with user info
            await comment.reload({
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'display_name', 'avatar_url']
                }]
            });

            // Send notification to post owner (if not commenting on own post)
            try {
                if (post.user_id !== userId) {
                    const commenter = await User.findByPk(userId);
                    if (commenter) {
                        await notificationService.notifyPostComment(
                            post.user_id,
                            userId,
                            commenter.display_name,
                            postId
                        );
                    }
                }
            } catch (error) {
                logger.error('Failed to send post comment notification', error);
                // Don't fail the request if notification fails
            }

            return comment.toJSON();
        } catch (error) {
            logger.error('Failed to comment on post', error);
            throw error;
        }
    }

    /**
     * Get comments for a post
     */
    async getPostComments(postId, options = {}) {
        try {
            const {
                limit = 50,
                offset = 0
            } = options;

            // Check if post exists
            const post = await Post.findByPk(postId);
            if (!post) {
                throw new AppError('Post not found', 404);
            }

            const comments = await PostComment.findAll({
                where: { post_id: postId },
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'display_name', 'avatar_url']
                }],
                order: [['created_at', 'ASC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return comments.map(comment => comment.toJSON());
        } catch (error) {
            logger.error('Failed to get post comments', error);
            throw error;
        }
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId, userId) {
        try {
            logger.info('Deleting comment', { commentId, userId });

            const comment = await PostComment.findOne({
                where: { id: commentId, user_id: userId }
            });

            if (!comment) {
                throw new AppError('Comment not found', 404);
            }

            await comment.destroy();

            return true;
        } catch (error) {
            logger.error('Failed to delete comment', error);
            throw error;
        }
    }
}

module.exports = new PostService();

