// Posts Module - Dashboard Post Feature
// Handles post creation, rendering, and interactions with mock data

// Store user posts (local state for mock data)
let userPosts = [];
let nextPostId = 1000; // Start high to avoid conflicts with mock data

// Get current user info for posts
function getCurrentUserInfo() {
    try {
        const userId = authState.getUserId();
        const userDisplayName = document.getElementById('userDisplayName')?.textContent || 'User';
        // Generate avatar initials
        const avatar = userDisplayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
        return { userId: parseInt(userId) || 1, userName: userDisplayName, userAvatar: avatar };
    } catch (error) {
        console.error('Error getting user info:', error);
        return { userId: 1, userName: 'User', userAvatar: 'U' };
    }
}

// Generate mock posts data
function getMockPosts() {
    return [
        {
            id: 'mock-1',
            userId: 2,
            userName: 'Sarah Chen',
            userAvatar: 'SC',
            content: 'Just completed my 5K run this morning! Feeling amazing and ready to tackle the rest of my fitness goals. 💪',
            postType: 'text',
            likes: 24,
            comments: 5,
            isLiked: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            timeAgo: '2h ago'
        },
        {
            id: 'mock-2',
            userId: 3,
            userName: 'Mike Johnson',
            userAvatar: 'MJ',
            content: 'Hit a new personal record at the gym today! Consistency really pays off. Keep pushing everyone! 🏋️‍♂️',
            imagePlaceholder: true,
            postType: 'image',
            likes: 18,
            comments: 3,
            isLiked: false,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            timeAgo: '5h ago'
        },
        {
            id: 'mock-3',
            userId: 4,
            userName: 'Emily Rodriguez',
            userAvatar: 'ER',
            content: 'Sharing my favorite healthy meal prep recipe for the week. Balanced nutrition is key to achieving your wellness goals! 🥗',
            postType: 'text',
            likes: 32,
            comments: 8,
            isLiked: true,
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            timeAgo: '8h ago'
        },
        {
            id: 'mock-4',
            userId: 5,
            userName: 'David Kim',
            userAvatar: 'DK',
            content: 'Celebrating 30 days of consistent morning yoga practice! The mental clarity and physical flexibility gains are incredible. 🧘‍♂️',
            postType: 'activity',
            linkedGoalId: 1,
            likes: 45,
            comments: 12,
            isLiked: false,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            timeAgo: '1d ago'
        },
        {
            id: 'mock-5',
            userId: 6,
            userName: 'Lisa Wang',
            userAvatar: 'LW',
            content: 'New gym outfit, new motivation! Sometimes the little things help keep you inspired. What keeps you motivated? 💙',
            imagePlaceholder: true,
            postType: 'image',
            likes: 28,
            comments: 7,
            isLiked: false,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            timeAgo: '2d ago'
        }
    ];
}

// Calculate time ago string
function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString();
}

// Render a single comment
function renderComment(comment, currentUserId) {
    const commentUserId = comment.user?.id || comment.user_id;
    const commentUserName = comment.user?.display_name || 'Unknown User';
    const commentUserAvatar = comment.user?.avatar_url ? '' : (comment.user?.display_name?.slice(0, 2).toUpperCase() || 'U');
    const commentTimeAgo = getTimeAgo(comment.created_at);
    const isOwnComment = currentUserId && parseInt(currentUserId) === parseInt(commentUserId);

    return `
        <div class="post-comment" data-comment-id="${comment.id}">
            <div class="post-comment-avatar">${commentUserAvatar}</div>
            <div class="post-comment-content">
                <div class="post-comment-header">
                    <a href="profile.html?userId=${commentUserId}" class="post-comment-author">${escapeHtml(commentUserName)}</a>
                    <span class="post-comment-time">${commentTimeAgo}</span>
                </div>
                <div class="post-comment-text">${escapeHtml(comment.content).replace(/\n/g, '<br>')}</div>
            </div>
            ${isOwnComment ? `
                <button class="post-comment-delete" data-action="delete-comment" data-comment-id="${comment.id}" title="Delete comment">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            ` : ''}
        </div>
    `;
}

// Render a single post (Facebook-style)
function renderPost(post) {
    const isPost = post.postType || post.content;
    const isActivity = !isPost && post.activity;
    const userId = post.userId || post.user_id;
    const userName = post.userName || 'Unknown User';
    const userAvatar = post.userAvatar || userName?.slice(0, 2).toUpperCase() || 'U';
    const timeAgo = post.timeAgo || getTimeAgo(post.createdAt);
    const currentUserId = authState.getUserId();
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const showComments = isPost; // Only show comments for posts, not activities

    return `
        <div class="post-card ${isPost ? 'post-item' : 'activity-item'}" data-id="${post.id}" data-type="${isPost ? 'post' : 'activity'}" data-user-id="${userId}">
            <div class="post-header">
                <div class="post-user-info">
                    <div class="post-avatar" data-user-id="${userId}" style="cursor: pointer;" title="View ${userName}'s profile">
                        ${userAvatar}
                    </div>
                    <div class="post-user-details">
                        <a href="profile.html?userId=${userId}" class="post-user-name" data-user-id="${userId}">${escapeHtml(userName)}</a>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                </div>
            </div>
            ${isPost ? `
                <div class="post-body">
                    <div class="post-text">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>
                    ${post.imagePlaceholder ? `
                        <div class="post-image-placeholder">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span>Image preview placeholder</span>
                        </div>
                    ` : ''}
                    ${post.linkedGoalId ? `
                        <div class="post-linked-goal">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>Linked to goal</span>
                        </div>
                    ` : ''}
                </div>
            ` : `
                <div class="post-body">
                    <div class="activity-text">${escapeHtml(post.activity || 'No activity description')}</div>
                </div>
            `}
            <div class="post-stats">
                ${(post.likes || 0) > 0 ? `
                    <div class="post-stat-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"></path>
                        </svg>
                        <span class="like-count">${post.likes}</span>
                    </div>
                ` : ''}
                ${(post.commentCount || post.comments?.length || 0) > 0 ? `
                    <div class="post-stat-item">
                        <span class="comment-count">${post.commentCount || post.comments?.length || 0} comment${(post.commentCount || post.comments?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                ` : ''}
            </div>
            <div class="post-actions">
                <button class="post-action-btn ${post.isLiked ? 'liked' : ''}" data-action="like" data-id="${post.id}" title="Like">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="${post.isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>Like</span>
                </button>
                <button class="post-action-btn" data-action="comment" data-id="${post.id}" title="Comment">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>Comment</span>
                </button>
                ${isPost ? `
                    <button class="post-action-btn" data-action="share" data-id="${post.id}" title="Share">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                        <span>Share</span>
                    </button>
                ` : ''}
            </div>
            ${showComments ? `
                <div class="post-comments-section" data-post-id="${post.id}">
                    ${comments.length > 0 ? `
                        <div class="post-comments-list">
                            ${comments.map(comment => renderComment(comment, currentUserId)).join('')}
                        </div>
                    ` : ''}
                    <div class="post-comment-input-wrapper">
                        <div class="post-comment-avatar-input">${getCurrentUserInfo().userAvatar}</div>
                        <form class="post-comment-form" data-post-id="${post.id}">
                            <input type="text" class="post-comment-input" placeholder="Write a comment..." maxlength="1000" />
                            <button type="submit" class="post-comment-submit" title="Post comment">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render all posts and activities combined
function renderPostsFeed(posts = [], activities = []) {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;

    // Combine and sort by time
    const allItems = [
        ...posts.map(p => ({ ...p, sortKey: new Date(p.createdAt || Date.now()) })),
        ...activities.map(a => ({ ...a, sortKey: new Date(a.createdAt || Date.now()), postType: null }))
    ].sort((a, b) => b.sortKey - a.sortKey);

    if (allItems.length === 0) {
        activityFeed.innerHTML = '<div class="empty-state">No posts or activities yet</div>';
        return;
    }

    activityFeed.innerHTML = allItems.map(item => renderPost(item)).join('');

    // Attach event listeners
    attachPostEventListeners();
}

// Attach event listeners for post interactions
function attachPostEventListeners() {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;

    // Like button handlers
    activityFeed.querySelectorAll('[data-action="like"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const postId = this.dataset.id;
            handleLikePost(postId, this);
        });
    });

    // Comment button handlers
    activityFeed.querySelectorAll('[data-action="comment"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const postId = this.dataset.id;
            handleCommentPost(postId, this);
        });
    });

    // Share button handlers (UI only for now)
    activityFeed.querySelectorAll('[data-action="share"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const postId = this.dataset.id;
            handleSharePost(postId);
        });
    });

    // User name and avatar click handlers - navigate to profile
    activityFeed.querySelectorAll('.post-user-name, .post-avatar').forEach(element => {
        element.addEventListener('click', function (e) {
            e.preventDefault();
            const userId = this.dataset.userId || this.closest('[data-user-id]')?.dataset.userId;
            if (userId) {
                window.location.href = `profile.html?userId=${userId}`;
            }
        });
    });

    // Attach comment form handlers for existing comment sections
    activityFeed.querySelectorAll('.post-comments-section').forEach(section => {
        attachCommentFormHandler(section);
        attachCommentDeleteHandlers(section);
    });
}

// Handle like action
async function handleLikePost(postId, buttonElement) {
    // Check if it's a real post ID (not activity or mock)
    if (postId.toString().startsWith('activity-') || postId.toString().startsWith('mock-') || postId.toString().startsWith('user-post-')) {
        // Handle mock/activity likes locally
        const allPosts = [...userPosts, ...getMockPosts()];
        let post = allPosts.find(p => p.id === postId);
        if (!post) {
            const getActivities = window.getMockActivityFeed || (typeof getMockActivityFeed === 'function' ? getMockActivityFeed : null);
            const activities = getActivities ? getActivities() : getMockActivityFeedFallback();
            post = activities.find(a => a.id === postId);
        }
        if (post) {
            post.isLiked = !post.isLiked;
            post.likes = post.isLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1);
            const likeCount = buttonElement.closest('.post-card').querySelector('.like-count');
            if (likeCount) likeCount.textContent = post.likes;
            const svgElement = buttonElement.querySelector('svg');
            if (svgElement) {
                if (post.isLiked) {
                    buttonElement.classList.add('liked');
                    svgElement.setAttribute('fill', 'currentColor');
                } else {
                    buttonElement.classList.remove('liked');
                    svgElement.setAttribute('fill', 'none');
                }
            }
        }
        return;
    }

    // Handle real API post likes
    // Prevent multiple simultaneous requests
    if (buttonElement.disabled) return;

    try {
        const isLiked = buttonElement.classList.contains('liked');
        const postCard = buttonElement.closest('.post-card');
        if (!postCard) return;

        const likeCountElement = postCard.querySelector('.like-count');
        const svgElement = buttonElement.querySelector('svg');
        if (!svgElement) return;

        // Parse current like count from text
        const currentLikeCount = likeCountElement ? (parseInt(likeCountElement.textContent.trim()) || 0) : 0;

        // Disable button during request
        buttonElement.disabled = true;

        // Optimistic update
        if (isLiked) {
            buttonElement.classList.remove('liked');
            svgElement.setAttribute('fill', 'none');
            if (likeCountElement) {
                likeCountElement.textContent = Math.max(0, currentLikeCount - 1);
            }
            await api.posts.unlike(postId);
        } else {
            buttonElement.classList.add('liked');
            svgElement.setAttribute('fill', 'currentColor');
            if (likeCountElement) {
                likeCountElement.textContent = currentLikeCount + 1;
            }
            await api.posts.like(postId);
        }

        // Refresh the feed to get accurate counts
        await refreshPostsFeed();
    } catch (error) {
        console.error('Failed to like/unlike post:', error);
        // Revert optimistic update on error
        await refreshPostsFeed();
    } finally {
        buttonElement.disabled = false;
    }
}

// Handle comment action - toggle comment section
function handleCommentPost(postId, buttonElement) {
    const postCard = buttonElement.closest('.post-card');
    if (!postCard) return;

    const commentsSection = postCard.querySelector('.post-comments-section');
    if (!commentsSection) {
        // If comments section doesn't exist, load comments and show it
        loadAndShowComments(postId, postCard);
        return;
    }

    // Toggle visibility
    const isVisible = commentsSection.style.display !== 'none';
    commentsSection.style.display = isVisible ? 'none' : 'block';

    // If showing, ensure comments are loaded
    if (!isVisible) {
        const commentsList = commentsSection.querySelector('.post-comments-list');
        if (!commentsList || commentsList.children.length === 0) {
            loadCommentsForPost(postId, commentsSection);
        }
    }
}

// Load comments for a post
async function loadCommentsForPost(postId, commentsSection) {
    // Check if it's a real post ID
    if (postId.toString().startsWith('activity-') || postId.toString().startsWith('mock-') || postId.toString().startsWith('user-post-')) {
        return; // No comments for mock/activity posts
    }

    try {
        const response = await api.posts.getComments(postId, { limit: 50 });
        const comments = response.data?.comments || response.comments || [];
        const currentUserId = authState.getUserId();

        let commentsList = commentsSection.querySelector('.post-comments-list');
        if (!commentsList) {
            commentsList = document.createElement('div');
            commentsList.className = 'post-comments-list';
            const commentInputWrapper = commentsSection.querySelector('.post-comment-input-wrapper');
            if (commentInputWrapper) {
                commentsSection.insertBefore(commentsList, commentInputWrapper);
            } else {
                commentsSection.appendChild(commentsList);
            }
        }

        commentsList.innerHTML = comments.map(comment => renderComment(comment, currentUserId)).join('');

        // Attach delete handlers
        attachCommentDeleteHandlers(commentsSection);
    } catch (error) {
        console.error('Failed to load comments:', error);
        // Show error message to user
        if (window.toast) {
            window.toast.error('Failed to load comments');
        }
    }
}

// Load and show comments section
async function loadAndShowComments(postId, postCard) {
    // Create comments section
    const commentsSection = document.createElement('div');
    commentsSection.className = 'post-comments-section';
    commentsSection.setAttribute('data-post-id', postId);
    commentsSection.innerHTML = `
        <div class="post-comments-list"></div>
        <div class="post-comment-input-wrapper">
            <div class="post-comment-avatar-input">${getCurrentUserInfo().userAvatar}</div>
            <form class="post-comment-form" data-post-id="${postId}">
                <input type="text" class="post-comment-input" placeholder="Write a comment..." maxlength="1000" />
                <button type="submit" class="post-comment-submit" title="Post comment">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    `;

    // Insert after post actions
    const postActions = postCard.querySelector('.post-actions');
    if (postActions) {
        postActions.parentNode.insertBefore(commentsSection, postActions.nextSibling);
    } else {
        postCard.appendChild(commentsSection);
    }

    // Load comments
    await loadCommentsForPost(postId, commentsSection);

    // Attach comment form handler
    attachCommentFormHandler(commentsSection);
}

// Attach comment form handlers
function attachCommentFormHandler(commentsSection) {
    const form = commentsSection.querySelector('.post-comment-form');
    if (!form) return;

    // Remove existing listener to prevent duplicates
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const postId = this.dataset.postId;
        const input = this.querySelector('.post-comment-input');
        const content = input.value.trim();

        if (!content || content.length === 0) {
            return;
        }

        if (content.length > 1000) {
            if (window.toast) {
                window.toast.error('Comment cannot exceed 1000 characters');
            }
            return;
        }

        // Disable form during submission
        const submitBtn = this.querySelector('.post-comment-submit');
        if (!submitBtn) return;
        submitBtn.disabled = true;

        try {
            // Check if it's a real post ID
            if (postId.toString().startsWith('activity-') || postId.toString().startsWith('mock-') || postId.toString().startsWith('user-post-')) {
                if (window.toast) {
                    window.toast.info('Comments are only available for posts');
                }
                submitBtn.disabled = false;
                return;
            }

            const response = await api.posts.comment(postId, { content });
            const comment = response.data?.comment || response.comment;

            if (comment) {
                // Add comment to list
                let commentsList = commentsSection.querySelector('.post-comments-list');
                if (!commentsList) {
                    const newCommentsList = document.createElement('div');
                    newCommentsList.className = 'post-comments-list';
                    const inputWrapper = commentsSection.querySelector('.post-comment-input-wrapper');
                    commentsSection.insertBefore(newCommentsList, inputWrapper);
                    commentsList = newCommentsList;
                }

                const currentUserId = authState.getUserId();
                const commentHtml = renderComment(comment, currentUserId);
                commentsList.insertAdjacentHTML('beforeend', commentHtml);

                // Update comment count
                const postCard = commentsSection.closest('.post-card');
                if (postCard) {
                    const commentCountElement = postCard.querySelector('.comment-count');
                    if (commentCountElement) {
                        // Parse count from text like "5 comments" or "1 comment"
                        const text = commentCountElement.textContent.trim();
                        const match = text.match(/(\d+)/);
                        const currentCount = match ? parseInt(match[1]) : 0;
                        const newCount = currentCount + 1;
                        commentCountElement.textContent = `${newCount} comment${newCount !== 1 ? 's' : ''}`;
                    } else {
                        // Create comment count element if it doesn't exist
                        const postStats = postCard.querySelector('.post-stats');
                        if (postStats) {
                            const statItem = document.createElement('div');
                            statItem.className = 'post-stat-item';
                            statItem.innerHTML = `<span class="comment-count">1 comment</span>`;
                            postStats.appendChild(statItem);
                        }
                    }
                }

                // Clear input
                input.value = '';

                // Attach delete handler to new comment
                attachCommentDeleteHandlers(commentsSection);

                // Show success feedback
                if (window.toast) {
                    window.toast.success('Comment added!');
                }
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
            // Error will be shown by API client toast
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// Attach delete handlers for comments
function attachCommentDeleteHandlers(commentsSection) {
    // Remove existing listeners by cloning elements
    const deleteButtons = commentsSection.querySelectorAll('[data-action="delete-comment"]');
    deleteButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    // Attach new listeners
    commentsSection.querySelectorAll('[data-action="delete-comment"]').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            const commentId = this.dataset.commentId;
            const commentElement = this.closest('.post-comment');

            if (!confirm('Are you sure you want to delete this comment?')) {
                return;
            }

            try {
                await api.posts.deleteComment(commentId);

                // Remove comment from DOM
                commentElement.remove();

                // Update comment count
                const postCard = commentsSection.closest('.post-card');
                if (postCard) {
                    const commentCountElement = postCard.querySelector('.comment-count');
                    if (commentCountElement) {
                        // Parse count from text like "5 comments" or "1 comment"
                        const text = commentCountElement.textContent.trim();
                        const match = text.match(/(\d+)/);
                        const currentCount = match ? parseInt(match[1]) : 0;
                        const newCount = Math.max(0, currentCount - 1);
                        if (newCount === 0) {
                            commentCountElement.textContent = '';
                        } else {
                            commentCountElement.textContent = `${newCount} comment${newCount !== 1 ? 's' : ''}`;
                        }
                    }
                }

                // Remove comments list if empty
                const commentsList = commentsSection.querySelector('.post-comments-list');
                if (commentsList && commentsList.children.length === 0) {
                    commentsList.remove();
                }

                if (window.toast) {
                    window.toast.success('Comment deleted');
                }
            } catch (error) {
                console.error('Failed to delete comment:', error);
                // Error will be shown by API client toast
            }
        });
    });
}

// Handle share action (UI only)
function handleSharePost(postId) {
    // Future: open share dialog
    console.log('Share post:', postId);
    // Show temporary feedback
    const tempMsg = document.createElement('div');
    tempMsg.className = 'temp-message';
    tempMsg.textContent = 'Share functionality coming soon!';
    tempMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--primary-color); color: white; padding: 1rem; border-radius: 8px; z-index: 1000;';
    document.body.appendChild(tempMsg);
    setTimeout(() => tempMsg.remove(), 2000);
}

// Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 200; // max-height from CSS
    textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
}

// Setup post creation form
function setupPostCreation() {
    const postForm = document.getElementById('postCreateForm');
    const postTextarea = document.getElementById('postContent');
    const postImageBtn = document.getElementById('postImageBtn');
    const postEmojiBtn = document.getElementById('postEmojiBtn');
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    const postCharCount = document.getElementById('postCharCount');
    const postAvatar = document.getElementById('postCreateAvatar');

    if (!postForm || !postTextarea || !postSubmitBtn) return;

    const MAX_CHARS = 500;
    const MIN_CHARS = 1;

    // Update avatar with user info
    if (postAvatar) {
        const userInfo = getCurrentUserInfo();
        postAvatar.textContent = userInfo.userAvatar;
    }

    // Auto-resize textarea and character counter on input
    if (postTextarea) {
        postTextarea.addEventListener('input', function () {
            autoResizeTextarea(this);

            const length = this.value.length;
            if (postCharCount) {
                postCharCount.textContent = `${length}/${MAX_CHARS}`;
                postCharCount.style.color = length > MAX_CHARS ? 'var(--error-color)' : 'var(--text-light)';
            }

            // Enable/disable submit button
            if (postSubmitBtn) {
                postSubmitBtn.disabled = length < MIN_CHARS || length > MAX_CHARS;
            }
        });

        // Initialize height
        autoResizeTextarea(postTextarea);
    }

    // Image button (placeholder for future)
    if (postImageBtn) {
        postImageBtn.addEventListener('click', function (e) {
            e.preventDefault();
            // Future: open image picker
            console.log('Image upload - coming soon');
            const tempMsg = document.createElement('div');
            tempMsg.className = 'temp-message';
            tempMsg.textContent = 'Image upload coming soon!';
            tempMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--info-color); color: white; padding: 1rem; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
            document.body.appendChild(tempMsg);
            setTimeout(() => tempMsg.remove(), 2000);
        });
    }

    // Emoji/Feeling button (placeholder for future)
    if (postEmojiBtn) {
        postEmojiBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Feeling/Emoji picker - coming soon');
            const tempMsg = document.createElement('div');
            tempMsg.className = 'temp-message';
            tempMsg.textContent = 'Feeling picker coming soon!';
            tempMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--accent-color); color: white; padding: 1rem; border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
            document.body.appendChild(tempMsg);
            setTimeout(() => tempMsg.remove(), 2000);
        });
    }

    // Submit form
    postForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const content = postTextarea.value.trim();
        if (content.length < MIN_CHARS || content.length > MAX_CHARS) {
            return;
        }

        // Disable submit button during request
        if (postSubmitBtn) {
            postSubmitBtn.disabled = true;
            postSubmitBtn.textContent = 'Posting...';
        }

        try {
            // Create post via API
            const response = await api.posts.create({ content });

            // Handle response - could be { success: true, data: { post: {...} } } or { post: {...} }
            const newPost = response.data?.post || response.post;

            if (newPost) {
                // Add to local state for immediate display
                const userInfo = getCurrentUserInfo();
                userPosts.unshift({
                    id: newPost.id,
                    userId: userInfo.userId,
                    userName: userInfo.userName,
                    userAvatar: userInfo.userAvatar,
                    content: newPost.content,
                    postType: 'text',
                    likes: 0,
                    comments: 0,
                    isLiked: false,
                    createdAt: newPost.created_at || new Date().toISOString(),
                    timeAgo: 'Just now'
                });
            }

            // Clear form and reset height
            postTextarea.value = '';
            autoResizeTextarea(postTextarea);
            if (postCharCount) {
                postCharCount.textContent = `0/${MAX_CHARS}`;
                postCharCount.style.color = 'var(--text-light)';
            }

            // Re-render feed
            await refreshPostsFeed();

            // Show success feedback
            if (window.toast) {
                window.toast.success('Post created successfully!');
            } else {
                alert('Post created!');
            }
        } catch (error) {
            console.error('Failed to create post:', error);
            // Error will be shown by API client toast
        } finally {
            if (postSubmitBtn) {
                postSubmitBtn.disabled = content.length < MIN_CHARS || content.length > MAX_CHARS;
                postSubmitBtn.textContent = 'Post';
            }
        }
    });
}

// Get mock activities (fallback if not available from dashboard.js)
function getMockActivityFeedFallback() {
    return [
        {
            id: 1,
            userId: 2,
            userName: 'Sarah Chen',
            userAvatar: 'SC',
            activity: 'Completed goal "Lose 10 kg"',
            activityType: 'goal_completed',
            timeAgo: '2h ago',
            likes: 12,
            comments: 3,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
    ];
}

// Refresh posts feed (load from API)
async function refreshPostsFeed() {
    try {
        // Load posts from API feed
        const feedResponse = await api.posts.getFeed({ limit: 50 });
        // Handle both response formats: { data: { posts: [...] } } or { posts: [...] }
        const apiPosts = feedResponse.data?.posts || feedResponse.posts || [];

        // Format API posts to match our render format
        const formattedPosts = apiPosts.map(post => ({
            id: post.id,
            userId: post.user?.id || post.user_id,
            userName: post.user?.display_name || 'Unknown User',
            userAvatar: post.user?.avatar_url ? '' : (post.user?.display_name?.slice(0, 2).toUpperCase() || 'U'),
            content: post.content,
            postType: 'text',
            likes: post.like_count || 0,
            commentCount: post.comment_count || 0,
            isLiked: post.is_liked || false,
            createdAt: post.created_at,
            timeAgo: getTimeAgo(post.created_at),
            // Include comments if available (limited to 5 in feed)
            comments: post.comments || []
        }));

        // Try to get activities from API
        let activities = [];
        try {
            const activityResponse = await api.activities.getFeed({ limit: 20 });
            // Handle both response formats
            const apiActivities = activityResponse.data?.activities || activityResponse.activities || [];
            activities = apiActivities.map(activity => ({
                id: `activity-${activity.id}`,
                userId: activity.user?.id || activity.user_id,
                userName: activity.user?.display_name || 'Unknown User',
                userAvatar: activity.user?.avatar_url ? '' : (activity.user?.display_name?.slice(0, 2).toUpperCase() || 'U'),
                activity: formatActivityText(activity),
                activityType: activity.activity_type,
                likes: 0,
                comments: 0,
                createdAt: activity.created_at,
                timeAgo: getTimeAgo(activity.created_at)
            }));
        } catch (error) {
            // Only log non-rate-limit errors
            if (!error.message || !error.message.includes('Too many requests')) {
                console.error('Failed to load activities:', error);
            }
            // Fallback to mock activities if API fails
            const getActivities = window.getMockActivityFeed || (typeof getMockActivityFeed === 'function' ? getMockActivityFeed : null);
            activities = getActivities ? getActivities() : getMockActivityFeedFallback();
        }

        renderPostsFeed(formattedPosts, activities);
    } catch (error) {
        // Only log non-rate-limit errors
        if (!error.message || !error.message.includes('Too many requests')) {
            console.error('Failed to load posts feed:', error);
        }
        // Fallback to mock data if API fails
        const mockPosts = getMockPosts();
        const getActivities = window.getMockActivityFeed || (typeof getMockActivityFeed === 'function' ? getMockActivityFeed : null);
        const mockActivities = getActivities ? getActivities() : getMockActivityFeedFallback();
        renderPostsFeed([...userPosts, ...mockPosts], mockActivities);
    }
}

// Format activity text for display
function formatActivityText(activity) {
    const data = activity.activity_data || {};
    switch (activity.activity_type) {
        case 'goal_created':
            return `Created goal "${data.goal_title || 'New Goal'}"`;
        case 'goal_progress':
            return `Updated progress on "${data.goal_title || 'Goal'}" to ${data.current_value || 0} ${data.unit || ''}`;
        case 'goal_completed':
            return `Completed goal "${data.goal_title || 'Goal'}"! 🎉`;
        case 'goal_updated':
            return `Updated goal "${data.goal_title || 'Goal'}"`;
        case 'profile_updated':
            return 'Updated profile';
        case 'connection_request':
            return 'Sent a connection request';
        case 'connection_accepted':
            return 'Accepted a connection request';
        default:
            return 'New activity';
    }
}

// Initialize posts module
function initializePosts() {
    console.log('[posts] Initializing posts module');

    // Setup post creation form
    setupPostCreation();

    // Load and render initial posts after a short delay to ensure DOM is ready
    setTimeout(() => {
        refreshPostsFeed();
    }, 100);
}

// Make functions available globally for dashboard.js
window.postsModule = {
    initialize: initializePosts,
    refresh: refreshPostsFeed,
    getMockPosts: getMockPosts
};

