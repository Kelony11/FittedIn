// Connections page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!authState.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize
    initTabs();
    initLogout();
    await loadConnections();
    await loadPendingRequests();
    initSearch();

    // Tab switching
    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Update active state
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Show/hide content
                tabContents.forEach(content => {
                    content.style.display = 'none';
                });

                if (tabName === 'connections') {
                    document.getElementById('connectionsTab').style.display = 'block';
                } else if (tabName === 'requests') {
                    document.getElementById('requestsTab').style.display = 'block';
                } else if (tabName === 'discover') {
                    document.getElementById('discoverTab').style.display = 'block';
                    // Auto-load recommended users when Discover tab is opened
                    // Only load if not already loading and container is empty
                    const container = document.getElementById('discoverList');
                    if (container && (!isLoadingRecommended && !isSearching)) {
                        const isEmpty = container.innerHTML.includes('Search for users') ||
                            container.innerHTML.includes('empty-state');
                        if (isEmpty) {
                            loadRecommendedUsers();
                        }
                    }
                }
            });
        });
    }

    // Load connections
    async function loadConnections() {
        try {
            const response = await api.connections.getConnections('accepted');
            console.log('[connections] Full response:', response);
            console.log('[connections] response.data:', response.data);
            // Handle both response formats: { data: { connections: [] } } or { connections: [] }
            const connections = response.data?.connections || response.connections || [];
            console.log('[connections] Parsed connections:', connections);

            const container = document.getElementById('connectionsList');

            if (connections.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <h3>No connections yet</h3>
                        <p>Start connecting with others to build your wellness community!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = connections
                .filter(conn => conn.user) // Filter out connections without user data
                .map(conn => {
                    const user = conn.user;
                    if (!user || !user.display_name) {
                        return ''; // Skip invalid users
                    }

                    const initials = user.display_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);

                    // Sanitize avatar URL to prevent XSS
                    const avatarUrl = user.avatar_url && typeof user.avatar_url === 'string'
                        ? user.avatar_url.replace(/['"]/g, '')
                        : null;
                    const avatarStyle = avatarUrl
                        ? `background: url('${avatarUrl.replace(/'/g, "\\'")}'); background-size: cover;`
                        : 'background: var(--primary-color);';

                    // Escape HTML to prevent XSS
                    const escapeHtml = (text) => {
                        const div = document.createElement('div');
                        div.textContent = text;
                        return div.innerHTML;
                    };

                    return `
                        <div class="user-card" data-user-id="${user.id}" data-connection-id="${conn.id}">
                            <div class="user-header">
                                <div class="user-avatar" style="${avatarStyle}">
                                    ${!avatarUrl ? initials : ''}
                                </div>
                                <div class="user-info">
                                    <h3>${escapeHtml(user.display_name)}</h3>
                                    <p>${escapeHtml(user.email || '')}</p>
                                </div>
                            </div>
                            ${user.profile?.bio ? `<div class="user-bio">${escapeHtml(user.profile.bio)}</div>` : ''}
                            ${user.profile?.location ? `<div class="user-info"><p>📍 ${escapeHtml(user.profile.location)}</p></div>` : ''}
                            <div class="user-actions">
                                <button class="btn-primary btn-small btn-view-profile" data-user-id="${user.id}">View Profile</button>
                                <button class="btn-secondary btn-small btn-remove-connection" data-connection-id="${conn.id}">Remove</button>
                            </div>
                        </div>
                    `;
                })
                .filter(html => html) // Remove empty strings
                .join('');

            // Attach event listeners for dynamically created buttons
            attachConnectionEventListeners(container);
        } catch (error) {
            console.error('Failed to load connections:', error);
            showError('Failed to load connections. Please try again.');
        }
    }

    // Load pending requests
    async function loadPendingRequests() {
        try {
            const response = await api.connections.getPendingRequests();
            console.log('[connections] Pending requests response:', response);
            console.log('[connections] response.data:', response.data);
            // Handle both response formats
            const data = response.data || response;
            const { sent, received } = data || { sent: [], received: [] };
            console.log('[connections] Parsed - sent:', sent.length, 'received:', received.length);

            const container = document.getElementById('requestsList');

            if (sent.length === 0 && received.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <h3>No pending requests</h3>
                        <p>You don't have any pending connection requests.</p>
                    </div>
                `;
                return;
            }

            // Helper function to escape HTML (shared for both sent and received)
            const escapeHtml = (text) => {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };

            let html = '';

            if (received.length > 0) {
                html += '<h2 style="margin-bottom: 1rem;">Received Requests</h2>';
                html += '<div class="connections-grid received-requests" style="margin-bottom: 2rem;">';

                html += received
                    .filter(req => req.user && req.user.display_name) // Filter invalid requests
                    .map(req => {
                        const user = req.user;
                        const initials = user.display_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2);

                        // Sanitize avatar URL
                        const avatarUrl = user.avatar_url && typeof user.avatar_url === 'string'
                            ? user.avatar_url.replace(/['"]/g, '')
                            : null;
                        const avatarStyle = avatarUrl
                            ? `background: url('${avatarUrl.replace(/'/g, "\\'")}'); background-size: cover;`
                            : 'background: var(--primary-color);';

                        return `
                            <div class="user-card" data-user-id="${user.id}" data-connection-id="${req.id}">
                                <div class="user-header">
                                    <div class="user-avatar" style="${avatarStyle}">
                                        ${!avatarUrl ? initials : ''}
                                    </div>
                                    <div class="user-info">
                                        <h3>${escapeHtml(user.display_name)} <span class="pending-badge">Pending</span></h3>
                                        <p>${escapeHtml(user.email || '')}</p>
                                    </div>
                                </div>
                                ${user.profile?.bio ? `<div class="user-bio">${escapeHtml(user.profile.bio)}</div>` : ''}
                                <div class="user-actions">
                                    <button class="btn-primary btn-small btn-accept-request" data-connection-id="${req.id}">Accept</button>
                                    <button class="btn-secondary btn-small btn-reject-request" data-connection-id="${req.id}">Reject</button>
                                </div>
                            </div>
                        `;
                    }).join('');
                html += '</div>';
            }

            if (sent.length > 0) {
                html += '<h2 style="margin-bottom: 1rem;">Sent Requests</h2>';
                html += '<div class="connections-grid sent-requests">';

                html += sent
                    .filter(req => req.user && req.user.display_name) // Filter invalid requests
                    .map(req => {
                        const user = req.user;
                        const initials = user.display_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .substring(0, 2);

                        // Sanitize avatar URL
                        const avatarUrl = user.avatar_url && typeof user.avatar_url === 'string'
                            ? user.avatar_url.replace(/['"]/g, '')
                            : null;
                        const avatarStyle = avatarUrl
                            ? `background: url('${avatarUrl.replace(/'/g, "\\'")}'); background-size: cover;`
                            : 'background: var(--primary-color);';

                        return `
                            <div class="user-card" data-user-id="${user.id}">
                                <div class="user-header">
                                    <div class="user-avatar" style="${avatarStyle}">
                                        ${!avatarUrl ? initials : ''}
                                    </div>
                                    <div class="user-info">
                                        <h3>${escapeHtml(user.display_name)} <span class="pending-badge">Pending</span></h3>
                                        <p>${escapeHtml(user.email || '')}</p>
                                    </div>
                                </div>
                                ${user.profile?.bio ? `<div class="user-bio">${escapeHtml(user.profile.bio)}</div>` : ''}
                                <div class="user-actions">
                                    <button class="btn-secondary btn-small" disabled>Request Sent</button>
                                </div>
                            </div>
                        `;
                    }).join('');
                html += '</div>';
            }

            container.innerHTML = html;

            // Attach event listeners for dynamically created buttons
            const receivedContainer = container.querySelector('.received-requests');
            if (receivedContainer) {
                attachRequestEventListeners(receivedContainer);
            }
            const sentContainer = container.querySelector('.sent-requests');
            if (sentContainer) {
                attachRequestEventListeners(sentContainer);
            }
        } catch (error) {
            console.error('Failed to load pending requests:', error);
            showError('Failed to load pending requests. Please try again.');
        }
    }

    // Search users with debounce for real-time search
    let searchTimeout = null;
    let isSearching = false;
    let isLoadingRecommended = false; // Prevent concurrent recommended users loading

    function initSearch() {
        const searchBtn = document.getElementById('searchUsersBtn');
        const searchInput = document.getElementById('userSearchInput');

        // Real-time search on input (with debounce)
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();

            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // Cancel any pending search
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // If search term is empty, show recommended users
            if (searchTerm === '') {
                loadRecommendedUsers();
                return;
            }

            // Debounce: wait 600ms after user stops typing before searching (increased to reduce API calls)
            searchTimeout = setTimeout(() => {
                performSearch(searchTerm);
            }, 600);
        });

        // Search button click (immediate search)
        searchBtn.addEventListener('click', () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm === '') {
                loadRecommendedUsers();
            } else {
                performSearch(searchTerm);
            }
        });

        // Enter key to search
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                const searchTerm = searchInput.value.trim();
                if (searchTerm === '') {
                    loadRecommendedUsers();
                } else {
                    performSearch(searchTerm);
                }
            }
        });
    }

    // Perform search (called by debounced input or button click)
    async function performSearch(searchTerm) {
        if (isSearching) return; // Prevent concurrent searches

        const container = document.getElementById('discoverList');
        isSearching = true;

        try {
            container.innerHTML = '<div class="empty-state"><p>Searching...</p></div>';

            const response = await api.connections.searchUsers({ q: searchTerm, limit: 20 });
            const users = response.data?.users || response.users || [];

            if (users.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>No users found</h3>
                        <p>Try a different search term.</p>
                    </div>
                `;
                return;
            }

            // Render users (connection status is already included in response from backend)
            await renderUsersList(users, container, true); // Pass true to skip additional status API calls
        } catch (error) {
            // Don't show error for rate limiting (too noisy, but show in UI)
            if (error.message && error.message.includes('Too many requests')) {
                console.warn('Rate limited, please wait a moment');
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>Too many requests</h3>
                        <p>Please wait a moment before searching again.</p>
                    </div>
                `;
            } else {
                console.error('Failed to search users:', error);
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>Search failed</h3>
                        <p>Please try again later.</p>
                    </div>
                `;
            }
        } finally {
            isSearching = false;
        }
    }

    // Load recommended users (without search term)
    async function loadRecommendedUsers() {
        // Prevent concurrent operations
        if (isSearching || isLoadingRecommended) {
            console.log('[connections] Skipping loadRecommendedUsers - already loading');
            return;
        }

        const container = document.getElementById('discoverList');
        if (!container) return; // Safety check

        isLoadingRecommended = true;

        try {
            container.innerHTML = '<div class="empty-state"><p>Loading recommended users...</p></div>';

            // Search without a term to get recommended users
            const response = await api.connections.searchUsers({ q: '', limit: 20 });
            const users = response.data?.users || response.users || [];

            // Debug: Check if connectionStatus is included
            if (users.length > 0) {
                console.log('[connections] Sample user data:', {
                    hasConnectionStatus: users[0].connectionStatus !== undefined,
                    connectionStatus: users[0].connectionStatus
                });
            }

            if (users.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <h3>No users available</h3>
                        <p>Try searching for specific users.</p>
                    </div>
                `;
                return;
            }

            // Verify that connectionStatus is included in response (from backend optimization)
            // If not, we'll need to fetch it (but this should not happen with the backend fix)
            const hasConnectionStatus = users.length > 0 && users.every(user => user.connectionStatus !== undefined);

            if (!hasConnectionStatus && users.length > 0) {
                console.warn('[connections] Backend did not include connectionStatus, will fetch individually (this may cause rate limiting)');
            }

            // Render users (connection status should be already included in response from backend)
            await renderUsersList(users, container, hasConnectionStatus); // Skip status API calls if already included
        } catch (error) {
            console.error('Failed to load recommended users:', error);

            // Handle rate limiting gracefully
            if (error.message && error.message.includes('Too many requests')) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>Too many requests</h3>
                        <p>Please wait a moment and refresh the page.</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>Failed to load users</h3>
                        <p>Please try again later.</p>
                    </div>
                `;
            }
        } finally {
            isLoadingRecommended = false;
        }
    }

    // Legacy searchUsers function (kept for backward compatibility)
    async function searchUsers() {
        const searchTerm = document.getElementById('userSearchInput').value.trim();
        if (searchTerm === '') {
            await loadRecommendedUsers();
        } else {
            await performSearch(searchTerm);
        }
    }

    // Render users list (shared function for both search and recommended users)
    // skipStatusCheck: if true, connection status is already in user object (from backend)
    async function renderUsersList(users, container, skipStatusCheck = false) {
        let usersWithStatus = users;

        // Only fetch connection status if not already included in response
        if (!skipStatusCheck) {
            // Get connection status for each user (only if not provided by backend)
            usersWithStatus = await Promise.all(users.map(async (user) => {
                // If connection status is already provided, use it
                if (user.connectionStatus) {
                    return user;
                }

                try {
                    const statusResponse = await api.connections.getConnectionStatus(user.id);
                    return {
                        ...user,
                        connectionStatus: statusResponse.data?.status || statusResponse.status || { status: 'none' }
                    };
                } catch (error) {
                    // If rate limited or error, default to 'none'
                    return {
                        ...user,
                        connectionStatus: { status: 'none' }
                    };
                }
            }));
        }

        // Helper function to escape HTML
        const escapeHtml = (text) => {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        };

        const usersHtml = usersWithStatus
            .filter(user => user && user.display_name) // Filter invalid users
            .map(user => {
                const initials = user.display_name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);

                const status = user.connectionStatus?.status || 'none';
                let actionButton = '';

                if (status === 'none') {
                    actionButton = `<button class="btn-primary btn-small btn-send-request" data-user-id="${user.id}">Connect</button>`;
                } else if (status === 'pending') {
                    if (user.connectionStatus?.isRequester) {
                        actionButton = `<button class="btn-secondary btn-small" disabled>Request Sent</button>`;
                    } else {
                        actionButton = `<button class="btn-primary btn-small btn-accept-from-discover" data-user-id="${user.id}">Accept</button>`;
                    }
                } else if (status === 'accepted') {
                    actionButton = `<button class="btn-secondary btn-small" disabled>Connected</button>`;
                }

                // Sanitize avatar URL
                const avatarUrl = user.avatar_url && typeof user.avatar_url === 'string'
                    ? user.avatar_url.replace(/['"]/g, '')
                    : null;
                const avatarStyle = avatarUrl
                    ? `background: url('${avatarUrl.replace(/'/g, "\\'")}'); background-size: cover;`
                    : 'background: var(--primary-color);';

                return `
                    <div class="user-card" data-user-id="${user.id}">
                        <div class="user-header">
                            <div class="user-avatar" style="${avatarStyle}">
                                ${!avatarUrl ? initials : ''}
                            </div>
                            <div class="user-info">
                                <h3>${escapeHtml(user.display_name)}</h3>
                                <p>${escapeHtml(user.email || '')}</p>
                            </div>
                        </div>
                        ${user.profile?.bio ? `<div class="user-bio">${escapeHtml(user.profile.bio)}</div>` : ''}
                        ${user.profile?.location ? `<div class="user-info"><p>📍 ${escapeHtml(user.profile.location)}</p></div>` : ''}
                        ${user.profile?.fitness_level ? `<div class="user-info"><p>💪 ${escapeHtml(user.profile.fitness_level)}</p></div>` : ''}
                        <div class="user-actions">
                            ${actionButton}
                            <button class="btn-secondary btn-small btn-view-profile" data-user-id="${user.id}">View Profile</button>
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = usersHtml;

        // Attach event listeners for discover tab buttons
        attachDiscoverEventListeners(container);
    }

    // Event listener attachment functions
    function attachConnectionEventListeners(container) {
        // View Profile buttons
        container.querySelectorAll('.btn-view-profile').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.dataset.userId;
                viewProfile(userId);
            });
        });

        // Remove Connection buttons
        container.querySelectorAll('.btn-remove-connection').forEach(btn => {
            btn.addEventListener('click', function () {
                const connectionId = this.dataset.connectionId;
                removeConnection(connectionId);
            });
        });
    }

    function attachRequestEventListeners(container) {
        // Accept Request buttons
        container.querySelectorAll('.btn-accept-request').forEach(btn => {
            btn.addEventListener('click', function () {
                const connectionId = this.dataset.connectionId;
                acceptRequest(connectionId);
            });
        });

        // Reject Request buttons
        container.querySelectorAll('.btn-reject-request').forEach(btn => {
            btn.addEventListener('click', function () {
                const connectionId = this.dataset.connectionId;
                rejectRequest(connectionId);
            });
        });
    }

    function attachDiscoverEventListeners(container) {
        // Send Connection Request buttons
        container.querySelectorAll('.btn-send-request').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.dataset.userId;
                sendConnectionRequest(userId);
            });
        });

        // Accept Request from Discover buttons
        container.querySelectorAll('.btn-accept-from-discover').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.dataset.userId;
                acceptRequestFromDiscover(userId);
            });
        });

        // View Profile buttons
        container.querySelectorAll('.btn-view-profile').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.dataset.userId;
                viewProfile(userId);
            });
        });
    }

    // Connection action functions
    async function sendConnectionRequest(userId) {
        try {
            await api.connections.sendRequest(userId);
            showSuccess('Connection request sent!');
            await searchUsers(); // Refresh the list
            await loadPendingRequests(); // Update pending requests
        } catch (error) {
            showError(error.message || 'Failed to send connection request.');
        }
    }

    async function acceptRequest(connectionId) {
        try {
            await api.connections.acceptRequest(connectionId);
            showSuccess('Connection request accepted!');
            await loadPendingRequests();
            await loadConnections();
        } catch (error) {
            showError(error.message || 'Failed to accept connection request.');
        }
    }

    async function rejectRequest(connectionId) {
        try {
            await api.connections.rejectRequest(connectionId);
            showSuccess('Connection request rejected.');
            await loadPendingRequests();
        } catch (error) {
            showError(error.message || 'Failed to reject connection request.');
        }
    }

    async function acceptRequestFromDiscover(userId) {
        try {
            // First get pending requests to find the connection ID
            const response = await api.connections.getPendingRequests();
            const data = response.data || response;
            const received = data.received || [];
            const request = received.find(req => req.user?.id === userId || req.user_id === userId);

            if (request) {
                await api.connections.acceptRequest(request.id);
                showSuccess('Connection request accepted!');
                await searchUsers();
                await loadPendingRequests();
                await loadConnections();
            }
        } catch (error) {
            showError(error.message || 'Failed to accept connection request.');
        }
    }

    async function removeConnection(connectionId) {
        if (!confirm('Are you sure you want to remove this connection?')) {
            return;
        }

        try {
            await api.connections.removeConnection(connectionId);
            showSuccess('Connection removed.');
            await loadConnections();
        } catch (error) {
            showError(error.message || 'Failed to remove connection.');
        }
    }

    function viewProfile(userId) {
        window.location.href = `profile.html?userId=${userId}`;
    }

    // Logout
    function initLogout() {
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                authState.clearAuth();
                window.location.href = 'login.html';
            });
        }
    }

    // Utility functions
    function showSuccess(message) {
        if (window.toast) {
            window.toast.success(message);
        } else {
            alert(message);
        }
    }

    function showError(message) {
        if (window.toast) {
            window.toast.error(message);
        } else {
            alert('Error: ' + message);
        }
    }
});

