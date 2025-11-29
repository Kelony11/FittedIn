// Notifications Module - Handles notification UI and polling

let notificationPollInterval = null;
let notificationsData = [];
let unreadCount = 0;

// Initialize notifications
function initializeNotifications() {
    console.log('[notifications] Initializing notifications module');

    // Load initial notifications
    loadNotifications();

    // Start polling for new notifications (every 30 seconds)
    startNotificationPolling();

    // Setup event listeners
    setupNotificationEventListeners();
}

// Load notifications from API
async function loadNotifications() {
    try {
        const response = await api.notifications.getAll({ limit: 20 });
        const notifications = response.data?.notifications || response.notifications || [];
        notificationsData = notifications;

        // Update unread count
        await updateUnreadCount();

        // Render notifications
        renderNotifications();
    } catch (error) {
        console.error('[notifications] Failed to load notifications:', error);
    }
}

// Update unread count badge
async function updateUnreadCount() {
    try {
        const response = await api.notifications.getUnreadCount();
        unreadCount = response.data?.count || response.count || 0;

        // Update badge
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('[notifications] Failed to update unread count:', error);
    }
}

// Render notifications dropdown
function renderNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    const emptyState = document.getElementById('notificationEmptyState');
    const notificationList = document.getElementById('notificationList');

    if (!dropdown || !notificationList) return;

    if (notificationsData.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        notificationList.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Render notifications (show unread first)
    const sortedNotifications = [...notificationsData].sort((a, b) => {
        if (a.is_read !== b.is_read) {
            return a.is_read ? 1 : -1; // Unread first
        }
        return new Date(b.created_at) - new Date(a.created_at); // Newest first
    });

    notificationList.innerHTML = sortedNotifications.map(notification => {
        const timeAgo = getTimeAgo(notification.created_at);
        const readClass = notification.is_read ? 'read' : 'unread';

        return `
            <div class="notification-item ${readClass}" data-notification-id="${notification.id}">
                <div class="notification-icon">
                    ${getNotificationIcon(notification.type)}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${escapeHtml(notification.title)}</div>
                    <div class="notification-message">${escapeHtml(notification.message)}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                ${!notification.is_read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `;
    }).join('');

    // Add click handlers
    attachNotificationHandlers();
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        connection_request: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
        </svg>`,
        connection_accepted: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`,
        post_like: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>`,
        post_comment: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>`,
        goal_completed: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>`,
        default: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`
    };

    return icons[type] || icons.default;
}

// Attach notification item handlers
function attachNotificationHandlers() {
    const notificationItems = document.querySelectorAll('.notification-item');

    notificationItems.forEach(item => {
        item.addEventListener('click', async function () {
            const notificationId = this.dataset.notificationId;
            const notification = notificationsData.find(n => n.id == notificationId);

            if (!notification) return;

            // Mark as read if unread
            if (!notification.is_read) {
                await markNotificationAsRead(notificationId);
            }

            // Handle navigation based on notification type
            handleNotificationClick(notification);
        });
    });
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        await api.notifications.markAsRead(notificationId);

        // Update local data
        const notification = notificationsData.find(n => n.id == notificationId);
        if (notification) {
            notification.is_read = true;
        }

        // Update UI
        await updateUnreadCount();
        renderNotifications();
    } catch (error) {
        console.error('[notifications] Failed to mark notification as read:', error);
    }
}

// Handle notification click (navigation)
function handleNotificationClick(notification) {
    // Close dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }

    // Navigate based on type
    if (notification.related_entity_type === 'connection' && notification.related_entity_id) {
        // Navigate to connections page
        window.location.href = 'connections.html';
    } else if (notification.related_entity_type === 'post' && notification.related_entity_id) {
        // Navigate to dashboard (posts feed)
        window.location.href = 'dashboard.html';
    } else if (notification.related_entity_type === 'goal' && notification.related_entity_id) {
        // Navigate to goals page
        window.location.href = 'goals.html';
    }
}

// Setup event listeners
function setupNotificationEventListeners() {
    const bellIcon = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    const viewAllBtn = document.getElementById('viewAllNotificationsBtn');

    // Toggle dropdown on bell click
    if (bellIcon) {
        bellIcon.addEventListener('click', function (e) {
            e.stopPropagation();
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (dropdown && !dropdown.contains(e.target) && !bellIcon.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async function (e) {
            e.stopPropagation();
            await markAllNotificationsAsRead();
        });
    }

    // View all notifications
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            // For now, just close dropdown - can add dedicated notifications page later
            if (dropdown) {
                dropdown.classList.remove('active');
            }
        });
    }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        await api.notifications.markAllAsRead();

        // Update local data
        notificationsData.forEach(n => {
            n.is_read = true;
        });

        // Update UI
        await updateUnreadCount();
        renderNotifications();

        // Show success message
        if (window.toast) {
            window.toast.success('All notifications marked as read');
        }
    } catch (error) {
        console.error('[notifications] Failed to mark all as read:', error);
        if (window.toast) {
            window.toast.error('Failed to mark all notifications as read');
        }
    }
}

// Start polling for new notifications
function startNotificationPolling() {
    // Clear existing interval if any
    if (notificationPollInterval) {
        clearInterval(notificationPollInterval);
    }

    // Poll every 60 seconds (reduced frequency to avoid rate limiting)
    notificationPollInterval = setInterval(async () => {
        try {
            await loadNotifications();
        } catch (error) {
            // Silently handle errors to avoid console spam
            if (error.message && !error.message.includes('429')) {
                console.error('[notifications] Polling error:', error);
            }
        }
    }, 60000); // Changed from 30000 to 60000 (1 minute instead of 30 seconds)
}

// Stop polling
function stopNotificationPolling() {
    if (notificationPollInterval) {
        clearInterval(notificationPollInterval);
        notificationPollInterval = null;
    }
}

// Utility functions
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export for global access
window.notificationsModule = {
    initialize: initializeNotifications,
    load: loadNotifications,
    stopPolling: stopNotificationPolling
};

