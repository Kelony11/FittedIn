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

    try {
        await loadDashboardData();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
    }
});

