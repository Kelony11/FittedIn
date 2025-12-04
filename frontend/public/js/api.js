// API Configuration
// Supports both development and production environments
const getApiBaseUrl = () => {
    // Check if we're in production (HTTPS or non-localhost)
    const isProduction = window.location.protocol === 'https:' ||
        (!window.location.hostname.includes('localhost') &&
            !window.location.hostname.includes('127.0.0.1'));

    // Use environment variable if available (set via build process or server-side injection)
    if (window.API_BASE_URL) {
        return window.API_BASE_URL;
    }

    // Auto-detect based on current location
    if (isProduction) {
        // In production, use the same origin (Nginx will proxy to backend)
        return `${window.location.origin}/api`;
    }

    // Development fallback
    return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Authentication state management
const authState = {
    getToken() {
        try {
            const token = localStorage.getItem('token');
            console.log('[authState] getToken called, returning:', token ? 'token exists' : 'no token');
            return token;
        } catch (error) {
            console.error('[authState] Error getting token:', error);
            return null;
        }
    },

    getUserId() {
        try {
            const userId = localStorage.getItem('userId');
            console.log('[authState] getUserId called, returning:', userId ? 'userId exists' : 'no userId');
            return userId;
        } catch (error) {
            console.error('[authState] Error getting userId:', error);
            return null;
        }
    },

    isAuthenticated() {
        const token = this.getToken();
        const userId = this.getUserId();
        const isAuth = !!(token && userId);
        console.log('[authState] isAuthenticated check:', isAuth, { hasToken: !!token, hasUserId: !!userId });
        return isAuth;
    },

    setAuth(token, userId) {
        try {
            console.log('[authState] setAuth called with token and userId');
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            console.log('[authState] Token and userId stored successfully');
        } catch (error) {
            console.error('[authState] Error setting auth:', error);
        }
    },

    clearAuth() {
        try {
            console.log('[authState] clearAuth called');
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            console.log('[authState] Token and userId cleared successfully');
        } catch (error) {
            console.error('[authState] Error clearing auth:', error);
        }
    },

    validateAuth() {
        if (!this.isAuthenticated()) {
            // Don't redirect from index page
            if (!window.location.pathname.includes('index.html')) {
                console.log('[authState] No authentication found, redirecting to login');
                window.location.href = 'login.html';
            }
            return false;
        }
        return true;
    }
};

// Make authState globally accessible
window.authState = authState;

// API Client
const api = {
    async request(endpoint, options = {}) {
        const token = authState.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            // Handle rate limiting (429) with better error message
            if (response.status === 429) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = {
                        message: 'Too many requests. Please wait a moment and try again.'
                    };
                }
                const error = new Error(errorData.message || 'Too many requests. Please wait a moment.');
                throw error;
            }

            // Parse JSON response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    throw new Error('Invalid JSON response from server');
                }
            } else {
                // If not JSON, read as text to see what we got
                const text = await response.text();
                throw new Error(`Unexpected response format: ${text.substring(0, 100)}`);
            }

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401) {
                    console.log('Authentication failed, clearing credentials');
                    authState.clearAuth();
                    if (!window.location.pathname.includes('index.html') &&
                        !window.location.pathname.includes('login.html')) {
                        window.location.href = 'login.html';
                    }
                }

                // Create error with validation details
                const error = new Error(data.message || 'An error occurred');
                if (data.errors) {
                    error.validationErrors = data.errors;
                }
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);

            // Don't show toast for rate limiting errors (too noisy)
            if (window.toast && typeof window.toast.error === 'function' && error.message) {
                if (!error.message.includes('Too many requests')) {
                    const errorMsg = error.message || 'An error occurred';
                    window.toast.error(errorMsg);
                }
            }

            throw error;
        }
    },

    // Auth endpoints
    auth: {
        register: (userData) => api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
        login: (credentials) => api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        logout: () => api.request('/auth/logout', { method: 'POST' })
    },

    // User endpoints
    users: {
        getProfile: (userId) => api.request(`/users/${userId}`),
        updateProfile: (userId, data) => api.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },

    // Profile endpoints
    profiles: {
        getMyProfile: () => api.request('/profiles/me'),
        updateMyProfile: (data) => api.request('/profiles/me', {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        getUserProfile: (userId) => api.request(`/profiles/${userId}`)
    },

    // Goal endpoints
    goals: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/goals${queryString ? '?' + queryString : ''}`);
        },
        getById: (goalId) => api.request(`/goals/${goalId}`),
        create: (goalData) => api.request('/goals', {
            method: 'POST',
            body: JSON.stringify(goalData)
        }),
        update: (goalId, data) => api.request(`/goals/${goalId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (goalId) => api.request(`/goals/${goalId}`, { method: 'DELETE' }),
        updateProgress: (goalId, progressData) => api.request(`/goals/${goalId}/progress`, {
            method: 'PATCH',
            body: JSON.stringify(progressData)
        })
    },

    // Activity endpoints
    activities: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/activities${queryString ? '?' + queryString : ''}`);
        },
        getFeed: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/activities/feed${queryString ? '?' + queryString : ''}`);
        },
        getStats: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/activities/stats${queryString ? '?' + queryString : ''}`);
        }
    },

    // Connection endpoints
    connections: {
        searchUsers: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/connections/search${queryString ? '?' + queryString : ''}`);
        },
        getConnections: (status = 'accepted') => {
            return api.request(`/connections?status=${status}`);
        },
        getPendingRequests: () => api.request('/connections/pending'),
        getConnectionStatus: (userId) => api.request(`/connections/status/${userId}`),
        sendRequest: (receiverId) => api.request('/connections', {
            method: 'POST',
            body: JSON.stringify({ receiver_id: receiverId })
        }),
        acceptRequest: (connectionId) => api.request(`/connections/${connectionId}/accept`, {
            method: 'PUT'
        }),
        rejectRequest: (connectionId) => api.request(`/connections/${connectionId}/reject`, {
            method: 'PUT'
        }),
        removeConnection: (connectionId) => api.request(`/connections/${connectionId}`, {
            method: 'DELETE'
        })
    },

    // Notification endpoints
    notifications: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/notifications${queryString ? '?' + queryString : ''}`);
        },
        getUnreadCount: () => api.request('/notifications/unread-count'),
        markAsRead: (notificationId) => api.request(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        }),
        markAllAsRead: () => api.request('/notifications/read-all', {
            method: 'PUT'
        }),
        delete: (notificationId) => api.request(`/notifications/${notificationId}`, {
            method: 'DELETE'
        })
    },

    // Post endpoints (ready for future backend integration)
    posts: {
        getFeed: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/posts/feed${queryString ? '?' + queryString : ''}`);
        },
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/posts${queryString ? '?' + queryString : ''}`);
        },
        getById: (postId) => api.request(`/posts/${postId}`),
        create: (postData) => api.request('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        }),
        update: (postId, data) => api.request(`/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (postId) => api.request(`/posts/${postId}`, { method: 'DELETE' }),
        like: (postId) => api.request(`/posts/${postId}/like`, {
            method: 'POST'
        }),
        unlike: (postId) => api.request(`/posts/${postId}/like`, {
            method: 'DELETE'
        }),
        comment: (postId, commentData) => api.request(`/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify(commentData)
        }),
        getComments: (postId, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return api.request(`/posts/${postId}/comments${queryString ? '?' + queryString : ''}`);
        },
        deleteComment: (commentId) => api.request(`/posts/comments/${commentId}`, {
            method: 'DELETE'
        })
    }
};
