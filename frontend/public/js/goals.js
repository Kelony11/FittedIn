// Goals Management JavaScript

let goalsData = [];
let currentFilter = 'all';
let editingGoalId = null;
let updatingProgressGoalId = null;

// Demo data for presentation
const demoGoals = [
    {
        title: "Run 5km per week",
        description: "Build up my cardio fitness and improve endurance",
        category: "cardio",
        target_value: 5,
        current_value: 3.5,
        unit: "km",
        priority: "high",
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_public: true
    },
    {
        title: "Lose 5kg in 3 months",
        description: "Healthy weight loss through diet and exercise",
        category: "weight_loss",
        target_value: 5,
        current_value: 2.3,
        unit: "kg",
        priority: "high",
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_public: true
    },
    {
        title: "Build muscle - Bench Press 100kg",
        description: "Progressive strength training goal",
        category: "muscle_gain",
        target_value: 100,
        current_value: 80,
        unit: "kg",
        priority: "medium",
        target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_public: false
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) {
        return;
    }

    // Set up event listeners
    setupEventListeners();

    await loadGoals();
});

// Set up all event listeners
function setupEventListeners() {
    // Logout link
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logout link clicked from goals');
            window.logout();
        });
    }

    // Open create goal modal button
    const openCreateGoalBtn = document.getElementById('openCreateGoalBtn');
    if (openCreateGoalBtn) {
        openCreateGoalBtn.addEventListener('click', () => openCreateGoalModal());
    }

    const createFirstGoalBtn = document.getElementById('createFirstGoalBtn');
    if (createFirstGoalBtn) {
        createFirstGoalBtn.addEventListener('click', () => openCreateGoalModal());
    }

    // Load demo button
    const loadDemoBtn = document.getElementById('loadDemoBtn');
    if (loadDemoBtn) {
        loadDemoBtn.addEventListener('click', () => loadDemoGoals());
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            filterGoals(filter);
        });
    });

    // Modal close buttons
    const closeGoalModalBtn = document.getElementById('closeGoalModalBtn');
    const cancelGoalModalBtn = document.getElementById('cancelGoalModalBtn');
    if (closeGoalModalBtn) {
        closeGoalModalBtn.addEventListener('click', () => closeGoalModal());
    }
    if (cancelGoalModalBtn) {
        cancelGoalModalBtn.addEventListener('click', () => closeGoalModal());
    }

    const closeProgressModalBtn = document.getElementById('closeProgressModalBtn');
    const cancelProgressModalBtn = document.getElementById('cancelProgressModalBtn');
    if (closeProgressModalBtn) {
        closeProgressModalBtn.addEventListener('click', () => closeProgressModal());
    }
    if (cancelProgressModalBtn) {
        cancelProgressModalBtn.addEventListener('click', () => closeProgressModal());
    }

    // Modal save buttons
    const saveGoalBtn = document.getElementById('saveGoalBtn');
    if (saveGoalBtn) {
        saveGoalBtn.addEventListener('click', () => saveGoal());
    }

    const saveProgressBtn = document.getElementById('saveProgressBtn');
    if (saveProgressBtn) {
        saveProgressBtn.addEventListener('click', () => saveProgress());
    }

    // Close modals when clicking outside
    const goalModal = document.getElementById('goalModal');
    const progressModal = document.getElementById('progressModal');

    if (goalModal) {
        goalModal.addEventListener('click', (e) => {
            if (e.target === goalModal) {
                closeGoalModal();
            }
        });
    }

    if (progressModal) {
        progressModal.addEventListener('click', (e) => {
            if (e.target === progressModal) {
                closeProgressModal();
            }
        });
    }
}

function checkAuth() {
    if (!authState.isAuthenticated()) {
        authState.validateAuth();
        return false;
    }
    return true;
}

// Load goals from API
async function loadGoals() {
    try {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('goalsGrid').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';

        const response = await api.goals.getAll();
        goalsData = response.goals || [];

        displayGoals();
        document.getElementById('loadingState').style.display = 'none';
    } catch (error) {
        console.error('Failed to load goals:', error);
        alert('Failed to load goals. Please try again.');
        document.getElementById('loadingState').style.display = 'none';
    }
}

// Display goals
function displayGoals() {
    const grid = document.getElementById('goalsGrid');
    const emptyState = document.getElementById('emptyState');

    // Filter goals
    let filteredGoals = goalsData;
    if (currentFilter !== 'all') {
        filteredGoals = goalsData.filter(goal => goal.status === currentFilter);
    }

    if (filteredGoals.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = filteredGoals.map(goal => createGoalCard(goal)).join('');

    // Add event listeners
    filteredGoals.forEach((goal, index) => {
        const card = grid.children[index];
        if (!card) return;

        const editBtn = card.querySelector('[data-action="edit"]');
        const deleteBtn = card.querySelector('[data-action="delete"]');
        const progressBtn = card.querySelector('[data-action="progress"]');

        if (editBtn) editBtn.addEventListener('click', () => editGoal(goal.id));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteGoal(goal.id));
        if (progressBtn) progressBtn.addEventListener('click', () => updateProgress(goal));
    });
}

// Create goal card HTML
function createGoalCard(goal) {
    const progressPercentage = goal.progress_percentage || 0;
    const statusClass = goal.status || 'active';
    const category = formatCategory(goal.category);

    const startDate = goal.start_date ? new Date(goal.start_date).toLocaleDateString() : 'Not set';
    const targetDate = goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'No deadline';

    return `
        <div class="goal-card">
            <div class="goal-header">
                <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
                <span class="goal-status ${statusClass}">${capitalize(statusClass)}</span>
            </div>
            <div class="goal-category">${category}</div>
            ${goal.description ? `<p class="goal-description">${escapeHtml(goal.description)}</p>` : ''}
            <div class="goal-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <div class="progress-text">
                    <span>${escapeHtml(goal.current_value || 0)} / ${escapeHtml(goal.target_value)} ${escapeHtml(goal.unit)}</span>
                    <span>${progressPercentage}%</span>
                </div>
            </div>
            <div class="goal-dates">
                <span>Started: ${startDate}</span>
                <span>Target: ${targetDate}</span>
            </div>
            <div class="goal-actions">
                <button class="btn-primary" data-action="progress" style="flex: 2;">Update Progress</button>
                <button class="btn-secondary" data-action="edit">Edit</button>
                <button class="btn-danger" data-action="delete" style="color: #d32f2f;">Delete</button>
            </div>
        </div>
    `;
}

// Filter goals
function filterGoals(status) {
    currentFilter = status;

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === status) {
            btn.classList.add('active');
        }
    });

    displayGoals();
}

// Open create goal modal
function openCreateGoalModal() {
    editingGoalId = null;
    document.getElementById('goalForm').reset();
    document.getElementById('modalTitle').textContent = 'Create New Goal';
    document.getElementById('goalModal').classList.add('active');
}

// Edit goal
function editGoal(goalId) {
    const goal = goalsData.find(g => g.id === goalId);
    if (!goal) return;

    editingGoalId = goalId;

    // Populate form
    document.getElementById('title').value = goal.title;
    document.getElementById('description').value = goal.description || '';
    document.getElementById('category').value = goal.category;
    document.getElementById('target_value').value = goal.target_value;
    document.getElementById('current_value').value = goal.current_value || 0;
    document.getElementById('unit').value = goal.unit;
    document.getElementById('target_date').value = goal.target_date || '';
    document.getElementById('priority').value = goal.priority || 'medium';
    document.getElementById('is_public').checked = goal.is_public !== false;

    document.getElementById('modalTitle').textContent = 'Edit Goal';
    document.getElementById('goalModal').classList.add('active');
}

// Update progress modal
function updateProgress(goal) {
    updatingProgressGoalId = goal.id;
    document.getElementById('progressForm').reset();
    document.getElementById('progress_current_value').value = goal.current_value || 0;
    document.getElementById('progressModal').classList.add('active');
}

// Save goal
async function saveGoal() {
    try {
        const formData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            target_value: parseFloat(document.getElementById('target_value').value),
            current_value: parseFloat(document.getElementById('current_value').value) || 0,
            unit: document.getElementById('unit').value,
            target_date: document.getElementById('target_date').value || null,
            priority: document.getElementById('priority').value,
            is_public: document.getElementById('is_public').checked
        };

        if (editingGoalId) {
            await api.goals.update(editingGoalId, formData);
        } else {
            await api.goals.create(formData);
        }

        closeGoalModal();
        await loadGoals();
        alert(editingGoalId ? 'Goal updated successfully!' : 'Goal created successfully!');
    } catch (error) {
        console.error('Failed to save goal:', error);
        alert('Failed to save goal. ' + (error.message || 'Please try again.'));
    }
}

// Save progress
async function saveProgress() {
    try {
        const formData = {
            current_value: parseFloat(document.getElementById('progress_current_value').value),
            notes: document.getElementById('progress_notes').value || ''
        };

        await api.goals.updateProgress(updatingProgressGoalId, formData);

        closeProgressModal();
        await loadGoals();
        alert('Progress updated successfully!');
    } catch (error) {
        console.error('Failed to update progress:', error);
        alert('Failed to update progress. Please try again.');
    }
}

// Delete goal
async function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) {
        return;
    }

    try {
        await api.goals.delete(goalId);
        await loadGoals();
        alert('Goal deleted successfully!');
    } catch (error) {
        console.error('Failed to delete goal:', error);
        alert('Failed to delete goal. Please try again.');
    }
}

// Close modals
function closeGoalModal() {
    document.getElementById('goalModal').classList.remove('active');
}

function closeProgressModal() {
    document.getElementById('progressModal').classList.remove('active');
}

// Utility functions
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatCategory(category) {
    return category.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Logout handled by global window.logout function from auth.js

// Load demo goals for presentation
async function loadDemoGoals() {
    if (!confirm('This will create demo goals for presentation. Continue?')) {
        return;
    }

    try {
        for (const goalData of demoGoals) {
            await api.goals.create(goalData);
        }

        alert('Demo goals loaded successfully!');
        await loadGoals();
    } catch (error) {
        console.error('Failed to load demo goals:', error);
        alert('Some demo goals may already exist or there was an error.');
        await loadGoals(); // Reload anyway to show existing goals
    }
}

