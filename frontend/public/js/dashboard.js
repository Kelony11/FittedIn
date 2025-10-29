// Dashboard Personalization Logic

async function loadDashboardData() {
    console.log('[dashboard] loadDashboardData called');

    // Check if authState is available
    if (typeof authState === 'undefined' || !authState) {
        console.error('[dashboard] authState is not defined!');
        // Fallback to localStorage directly
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        console.log('[dashboard] Fallback check:', { hasToken: !!token, hasUserId: !!userId });
        if (!token || !userId) {
            console.log('[dashboard] Not authenticated (fallback), redirecting to login');
            window.location.href = 'login.html';
            return;
        }
    }

    // Check authentication using centralized auth state
    if (!authState.isAuthenticated()) {
        console.log('[dashboard] Not authenticated, redirecting to login');
        authState.validateAuth();
        return;
    }

    const userId = authState.getUserId();
    console.log('[dashboard] Authenticated, userId:', userId);

    try {
        // Load user info
        await loadUserInfo(userId);

        // Load profile info
        await loadProfileInfo();

        // Load goals stats
        await loadGoalsStats();

        // Load recent activity
        loadRecentActivity();

        // Load community data (mock data)
        loadCommunityData();

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        // Only clear storage and redirect if it's actually an auth error
        if (error.message.includes('token') || error.message.includes('unauthorized') || error.response?.status === 401) {
            console.log('Authentication error detected, logging out');
            authState.clearAuth();
            window.location.href = 'login.html';
        } else {
            // For other errors, just show a message but don't logout
            console.error('Failed to load data but user remains logged in');
        }
    }
}

// Load user info
async function loadUserInfo(userId) {
    try {
        const response = await api.users.getProfile(userId);
        const user = response.user;

        // Update display name
        document.getElementById('userDisplayName').textContent = user.displayName || 'User';

        // Update personalized message
        updatePersonalizedMessage(user.displayName);
    } catch (error) {
        console.error('Failed to load user info:', error);
        // Don't fail the whole page if user info fails
        document.getElementById('userDisplayName').textContent = 'User';
    }
}

// Load profile info
async function loadProfileInfo() {
    try {
        const response = await api.profiles.getMyProfile();
        // Handle both possible response structures
        const profile = response.data ? response.data.profile : response.profile;

        // Calculate profile completion
        const completion = calculateProfileCompletion(profile);
        document.getElementById('profileCompletion').textContent = `${completion}%`;

        // Show profile preview if there's data
        if (profile.location || profile.fitness_level) {
            document.getElementById('profilePreview').style.display = 'block';
            document.getElementById('profileCompletionText').style.display = 'none';

            document.getElementById('userLocation').textContent = profile.location || 'Not set';

            if (profile.fitness_level) {
                document.getElementById('userFitnessLevel').textContent =
                    capitalizeFirst(profile.fitness_level);
            } else {
                document.getElementById('userFitnessLevel').textContent = 'Not set';
            }
        }

        // Show stats overview if there's any progress
        const statsOverview = document.getElementById('statsOverview');
        if (statsOverview) {
            statsOverview.style.display = 'grid';
        }

    } catch (error) {
        console.error('Failed to load profile:', error);
        // Continue without profile data - don't clear tokens or logout
    }
}

// Load goals stats
async function loadGoalsStats() {
    try {
        const response = await api.goals.getAll();
        const goals = response.goals || [];

        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.status === 'completed').length;
        const activeGoals = goals.filter(g => g.status === 'active').length;

        // Update stats
        const totalGoalsEl = document.getElementById('totalGoals');
        const completedGoalsEl = document.getElementById('completedGoals');
        if (totalGoalsEl) totalGoalsEl.textContent = totalGoals;
        if (completedGoalsEl) completedGoalsEl.textContent = completedGoals;

        // Update goals preview
        if (activeGoals > 0) {
            const goalsPreview = document.getElementById('goalsPreview');
            const goalsSummaryText = document.getElementById('goalsSummaryText');
            if (goalsPreview) goalsPreview.style.display = 'block';
            if (goalsSummaryText) goalsSummaryText.style.display = 'none';

            const activeGoalsCount = document.getElementById('activeGoalsCount');
            if (activeGoalsCount) activeGoalsCount.textContent = activeGoals;

            // Get latest goal
            if (goals.length > 0) {
                const latestGoalEl = document.getElementById('latestGoal');
                if (latestGoalEl) {
                    const latestGoal = goals[0];
                    latestGoalEl.textContent =
                        latestGoal.title.length > 30 ?
                            latestGoal.title.substring(0, 30) + '...' :
                            latestGoal.title;
                }
            }
        }

    } catch (error) {
        console.error('Failed to load goals:', error);
        // Continue without goals data - don't clear tokens or logout
    }
}

// Load recent activity
function loadRecentActivity() {
    // This would load from API when we have activity logging
    // For now, we'll create some demo activity based on goals

    setTimeout(async () => {
        try {
            const response = await api.goals.getAll();
            const goals = response.goals || [];

            // Filter active goals with progress
            const recentUpdates = goals
                .filter(g => g.status === 'active' && g.current_value > 0)
                .slice(0, 3);

            if (recentUpdates.length > 0) {
                const activityList = document.getElementById('activityList');
                const recentActivity = document.getElementById('recentActivity');

                activityList.innerHTML = recentUpdates.map(goal => {
                    const progress = Math.round((goal.current_value / goal.target_value) * 100);
                    return `
                        <div class="activity-item">
                            <strong>${goal.title}</strong>
                            <div style="margin-top: 0.5rem;">
                                Progress: ${progress}% (${goal.current_value} / ${goal.target_value} ${goal.unit})
                            </div>
                        </div>
                    `;
                }).join('');

                recentActivity.style.display = 'block';
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }
    }, 500);
}

// Calculate profile completion percentage
function calculateProfileCompletion(profile) {
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

// Update personalized message
function updatePersonalizedMessage(displayName) {
    const hour = new Date().getHours();
    let greeting;

    if (hour < 12) {
        greeting = 'Good morning';
    } else if (hour < 18) {
        greeting = 'Good afternoon';
    } else {
        greeting = 'Good evening';
    }

    document.getElementById('personalizedMessage').textContent =
        `${greeting}, ${displayName}! Track your progress and connect with your wellness community.`;
}

// Utility functions
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Use the global logout function from auth.js (already defined there)

// ===== Community Features (Mock Data) =====

// Mock data for activity feed (made available globally for posts module)
function getMockActivityFeed() {
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
            comments: 3
        },
        {
            id: 2,
            userId: 3,
            userName: 'Mike Johnson',
            userAvatar: 'MJ',
            activity: 'Updated fitness goal progress: 75% complete',
            activityType: 'goal_progress',
            timeAgo: '4h ago',
            likes: 8,
            comments: 1
        },
        {
            id: 3,
            userId: 4,
            userName: 'Emily Rodriguez',
            userAvatar: 'ER',
            activity: 'Shared new activity: Ran 5 km',
            activityType: 'activity_shared',
            timeAgo: '6h ago',
            likes: 15,
            comments: 5
        },
        {
            id: 4,
            userId: 5,
            userName: 'David Kim',
            userAvatar: 'DK',
            activity: 'Created new goal: "Exercise 5 times per week"',
            activityType: 'goal_created',
            timeAgo: '1d ago',
            likes: 6,
            comments: 2
        },
        {
            id: 5,
            userId: 6,
            userName: 'Lisa Wang',
            userAvatar: 'LW',
            activity: 'Completed 7-day fitness challenge',
            activityType: 'challenge_completed',
            timeAgo: '1d ago',
            likes: 20,
            comments: 8
        }
    ];
}

// Mock data for connection suggestions
function getMockConnectionSuggestions() {
    return [
        {
            id: 7,
            name: 'Alex Taylor',
            avatar: 'AT',
            location: 'New Jersey',
            commonInterests: ['Weight Loss', 'Running'],
            mutualConnections: 3
        },
        {
            id: 8,
            name: 'Jessica Brown',
            avatar: 'JB',
            location: 'New York',
            commonInterests: ['Yoga', 'Meditation'],
            mutualConnections: 2
        },
        {
            id: 9,
            name: 'Chris Lee',
            avatar: 'CL',
            location: 'New Jersey',
            commonInterests: ['Strength Training', 'Nutrition'],
            mutualConnections: 5
        }
    ];
}

// Mock data for connections
function getMockConnections() {
    return [
        {
            id: 10,
            name: 'Sarah Chen',
            avatar: 'SC',
            location: 'New York',
            recentActivity: 'Completed a goal 2h ago',
            status: 'active'
        },
        {
            id: 11,
            name: 'Mike Johnson',
            avatar: 'MJ',
            location: 'New Jersey',
            recentActivity: 'Shared activity today',
            status: 'active'
        },
        {
            id: 12,
            name: 'Emily Rodriguez',
            avatar: 'ER',
            location: 'Boston',
            recentActivity: 'Updated progress 1d ago',
            status: 'active'
        },
        {
            id: 13,
            name: 'David Kim',
            avatar: 'DK',
            location: 'Philadelphia',
            recentActivity: 'Created new goal 3d ago',
            status: 'active'
        }
    ];
}

// Render activity feed
function renderActivityFeed() {
    const activityFeed = document.getElementById('activityFeed');
    if (!activityFeed) return;

    const activities = getMockActivityFeed();

    if (activities.length === 0) {
        activityFeed.innerHTML = '<div class="empty-state">No recent activity</div>';
        return;
    }

    activityFeed.innerHTML = activities.map(activity => {
        return `
            <div class="activity-item-community">
                <div class="activity-user-avatar">${activity.userAvatar}</div>
                <div class="activity-content">
                    <div class="activity-header">
                        <strong>${activity.userName}</strong>
                        <span class="activity-time">${activity.timeAgo}</span>
                    </div>
                    <div class="activity-text">${activity.activity}</div>
                    <div class="activity-actions">
                        <button class="btn-icon" title="Like">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${activity.likes}</span>
                        </button>
                        <button class="btn-icon" title="Comment">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>${activity.comments}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render connection suggestions
function renderConnectionSuggestions() {
    const suggestionsContainer = document.getElementById('connectionSuggestions');
    if (!suggestionsContainer) return;

    const suggestions = getMockConnectionSuggestions();

    if (suggestions.length === 0) {
        suggestionsContainer.innerHTML = '<div class="empty-state">No suggestions available</div>';
        return;
    }

    suggestionsContainer.innerHTML = suggestions.map(user => {
        const commonInterests = user.commonInterests.join(', ');
        return `
            <div class="user-card-suggestion">
                <div class="user-card-avatar">${user.avatar}</div>
                <div class="user-card-info">
                    <div class="user-card-name">${user.name}</div>
                    <div class="user-card-location">${user.location}</div>
                    <div class="user-card-common">
                        <span class="common-interest">${commonInterests}</span>
                        ${user.mutualConnections > 0 ? `<span class="mutual-connections">${user.mutualConnections} mutual connections</span>` : ''}
                    </div>
                </div>
                <button class="btn-connect" data-user-id="${user.id}">
                    <span>Connect</span>
                </button>
            </div>
        `;
    }).join('');

    // Add click handlers for connect buttons (UI only)
    suggestionsContainer.querySelectorAll('.btn-connect').forEach(btn => {
        btn.addEventListener('click', function () {
            this.innerHTML = '<span>Pending</span>';
            this.disabled = true;
            this.classList.add('sent');
        });
    });
}

// Render connections
function renderConnections() {
    const connectionsContainer = document.getElementById('yourConnections');
    if (!connectionsContainer) return;

    const connections = getMockConnections();

    if (connections.length === 0) {
        connectionsContainer.innerHTML = '<div class="empty-state">No connections yet</div>';
        return;
    }

    connectionsContainer.innerHTML = connections.map(connection => {
        return `
            <div class="user-card-connection">
                <div class="user-card-avatar">${connection.avatar}</div>
                <div class="user-card-info">
                    <div class="user-card-name">${connection.name}</div>
                    <div class="user-card-location">${connection.location}</div>
                    <div class="user-card-activity">${connection.recentActivity}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Load community data
function loadCommunityData() {
    try {
        // Simulate loading delay
        setTimeout(() => {
            // Initialize posts module (will handle rendering posts and activities)
            if (window.postsModule && typeof window.postsModule.initialize === 'function') {
                window.postsModule.initialize();
            } else {
                // Fallback to old activity feed if posts module not available
                renderActivityFeed();
            }
            renderConnectionSuggestions();
            renderConnections();
        }, 800);
    } catch (error) {
        console.error('Failed to load community data:', error);
    }
}

// Search box handler (UI only)
function setupSearchBox() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('communitySearchInput');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                // Visual feedback only
                this.textContent = 'Searching...';
                this.disabled = true;
                setTimeout(() => {
                    this.textContent = 'Search';
                    this.disabled = false;
                    // Show a temporary message (UI only)
                    alert('Search functionality coming soon! You searched for: "' + query + '"');
                    searchInput.value = '';
                }, 1000);
            }
        });

        // Allow Enter key to trigger search
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
}

// Make getMockActivityFeed globally accessible for posts module
window.getMockActivityFeed = getMockActivityFeed;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard: DOMContentLoaded event fired');

    // Add event listener for logout link
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout link clicked from dashboard');
            window.logout();
        });
    }

    // Setup search box
    setupSearchBox();

    try {
        await loadDashboardData();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
    }
});

