// ===== Profile Page JavaScript =====

class ProfileManager {
    constructor() {
        this.currentProfile = null;
        this.currentTab = 'overview';
        this.isEditing = false;
        this.currentEditSection = null;

        this.init();
    }

    async init() {
        // Check authentication
        if (!this.checkAuth()) {
            return;
        }

        // Set a timeout to ensure content shows even if API hangs
        const loadingTimeout = setTimeout(() => {
            console.warn('Loading timeout - showing content anyway');
            this.showLoading(false);
        }, 5000); // 5 second timeout

        try {
            // Load profile data
            await this.loadProfile();
        } finally {
            clearTimeout(loadingTimeout);
        }

        // Setup event listeners
        this.setupEventListeners();

        // Initialize UI
        this.initializeUI();
    }

    checkAuth() {
        return authState.isAuthenticated();
    }

    async loadProfile() {
        try {
            this.showLoading(true);

            const response = await api.profiles.getMyProfile();

            // Debug: log the response structure
            console.log('Profile API Response:', response);

            // Handle both possible response structures
            this.currentProfile = response.data ? response.data.profile : response.profile;

            if (!this.currentProfile) {
                throw new Error('Profile data not found in response');
            }

            try {
                this.updateProfileDisplay();
                this.calculateCompletionScore();
            } catch (displayError) {
                console.error('Error updating display:', displayError);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.showError(`Failed to load profile: ${error.message}`);

            // Only clear storage and redirect if it's actually an auth error
            if (error.message.includes('token') || error.message.includes('unauthorized') || error.response?.status === 401) {
                console.log('Authentication error detected, logging out');
                if (error.message.includes('token') || error.message.includes('unauthorized')) {
                    setTimeout(() => window.logout(), 3000);
                }
            } else {
                // For other errors, create fallback profile
                const userId = authState.getUserId();
                if (userId && !this.currentProfile) {
                    this.currentProfile = {
                        user: {
                            email: 'user@example.com',
                            display_name: 'User'
                        },
                        location: '',
                        bio: '',
                        pronouns: '',
                        date_of_birth: '',
                        fitness_level: '',
                        height: null,
                        weight: null,
                        skills: [],
                        primary_goals: [],
                        created_at: new Date().toISOString()
                    };
                    try {
                        this.updateProfileDisplay();
                        this.calculateCompletionScore();
                    } catch (displayError) {
                        console.error('Error updating fallback display:', displayError);
                    }
                }
            }
        } finally {
            // ALWAYS hide loading state when done, whether successful or not
            this.showLoading(false);
        }
    }

    updateProfileDisplay() {
        if (!this.currentProfile) return;

        const profile = this.currentProfile;
        const user = profile.user || {};

        // Update header
        this.updateElement('profileName', user.display_name || 'User');
        this.updateElement('profileEmail', user.email || 'user@example.com');
        this.updateElement('profileLocation', profile.location || 'Location not set');

        // Update avatar
        this.updateAvatar(user.display_name || 'User', user.avatar_url);

        // Update member since
        this.updateElement('memberSince', this.formatMemberSince(profile.created_at));

        // Update overview tab content
        this.updateOverviewTab(profile);

        // Update settings
        this.updateSettings(profile);
    }

    updateAvatar(name, avatarUrl) {
        const avatarElement = document.getElementById('profileAvatar');
        const initialsElement = document.getElementById('avatarInitials');

        if (avatarUrl) {
            avatarElement.innerHTML = `<img src="${avatarUrl}" alt="${name}">`;
        } else {
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
            initialsElement.textContent = initials;
        }
    }

    updateOverviewTab(profile) {
        // Basic information
        this.updateElement('displayPronouns', profile.pronouns || 'Not specified');
        this.updateElement('displayLocation', profile.location || 'Not specified');
        this.updateElement('displayDateOfBirth', profile.date_of_birth ?
            new Date(profile.date_of_birth).toLocaleDateString() : 'Not specified');
        this.updateElement('displayFitnessLevel', profile.fitness_level ?
            this.capitalizeFirst(profile.fitness_level) : 'Not specified');
        this.updateElement('displayBio', profile.bio || 'No bio available');

        // Physical information
        this.updateElement('displayHeight', profile.height ?
            `${profile.height} cm` : 'Not specified');
        this.updateElement('displayWeight', profile.weight ?
            `${profile.weight} kg` : 'Not specified');

        // Calculate and display BMI
        const bmi = this.calculateBMI(profile.height, profile.weight);
        this.updateElement('displayBMI', bmi ? bmi.toFixed(1) : 'Not calculated');

        // Skills
        this.updateSkillsDisplay(profile.skills || []);

        // Goals
        this.updateGoalsDisplay(profile.primary_goals || []);
    }

    updateSkillsDisplay(skills) {
        const container = document.getElementById('displaySkills');

        if (skills.length === 0) {
            container.innerHTML = '<p class="no-data">No skills added yet</p>';
            return;
        }

        container.innerHTML = skills.map(skill =>
            `<span class="skill-tag">${this.capitalizeFirst(skill.replace('_', ' '))}</span>`
        ).join('');
    }

    updateGoalsDisplay(goals) {
        const container = document.getElementById('displayGoals');

        if (goals.length === 0) {
            container.innerHTML = '<p class="no-data">No goals set yet</p>';
            return;
        }

        container.innerHTML = goals.map(goal =>
            `<span class="goal-tag">${this.capitalizeFirst(goal.replace('_', ' '))}</span>`
        ).join('');
    }

    updateSettings(profile) {
        const privacySettings = profile.privacy_settings || {};

        this.updateElement('profileVisibility', privacySettings.profile_visibility || 'public');
        this.updateElement('showActivity', privacySettings.show_activity !== false);
        this.updateElement('showGoals', privacySettings.show_goals !== false);
        this.updateElement('showConnections', privacySettings.show_connections !== false);
    }

    calculateCompletionScore() {
        if (!this.currentProfile) return 0;

        const profile = this.currentProfile;
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

        const percentage = Math.min(score, maxScore);

        this.updateElement('profileCompletion', `${percentage}%`);
        this.updateElement('completionPercentage', `${percentage}%`);

        const fillElement = document.getElementById('completionFill');
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }

        this.updateCompletionTips(percentage);

        return percentage;
    }

    updateCompletionTips(percentage) {
        const tipsElement = document.getElementById('completionTips');
        const profile = this.currentProfile;
        let tips = [];

        // Give specific recommendations based on what's missing
        if (!profile.location) {
            tips.push('Add your location to connect with nearby members');
        }
        if (!profile.bio || profile.bio.length < 50) {
            tips.push('Write a bio (50+ characters) to introduce yourself');
        }
        if (!profile.fitness_level) {
            tips.push('Set your fitness level to personalize your experience');
        }
        if (!profile.height || !profile.weight) {
            tips.push('Add your height and weight to track your BMI');
        }
        if (!profile.skills || profile.skills.length === 0) {
            tips.push('Add wellness skills to showcase your expertise');
        }
        if (!profile.primary_goals || profile.primary_goals.length === 0) {
            tips.push('Set primary goals to start your wellness journey');
        }
        if (!profile.pronouns && percentage > 0) {
            tips.push('Add your pronouns for better inclusivity');
        }

        // If everything is complete
        if (percentage >= 100 || tips.length === 0) {
            tips = ['Congratulations! Your profile is complete. Start connecting with others!'];
        } else if (tips.length > 3) {
            // If too many tips, just show a general message
            tips = ['Complete key sections: location, bio, fitness level, and goals'];
        }

        tipsElement.innerHTML = `<p>${tips.join(' • ')}</p>`;
    }

    calculateBMI(height, weight) {
        if (!height || !weight) return null;

        const heightInMeters = height / 100;
        return weight / (heightInMeters * heightInMeters);
    }

    formatMemberSince(dateString) {
        if (!dateString) return '-';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
            return `${diffDays} days`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months} month${months > 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years} year${years > 1 ? 's' : ''}`;
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            if (typeof value === 'boolean') {
                element.checked = value;
            } else {
                element.textContent = value;
            }
        }
    }

    setupEventListeners() {
        // Logout link
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.logout();
            });
        }

        // Edit Profile button
        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Share Profile button
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareProfile());
        }

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Section edit buttons
        document.querySelectorAll('.btn-edit-section').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.editSection(section);
                }
            });
        });

        // Add Goal buttons
        const addGoalBtn = document.getElementById('addGoalBtn');
        const addFirstGoalBtn = document.getElementById('addFirstGoalBtn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.addNewGoal());
        }
        if (addFirstGoalBtn) {
            addFirstGoalBtn.addEventListener('click', () => this.addNewGoal());
        }

        // Delete Account button
        const deleteAccountBtn = document.getElementById('deleteAccountBtn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.deleteAccount());
        }

        // Modal close buttons
        const closeEditModalBtn = document.getElementById('closeEditModalBtn');
        const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
        if (closeEditModalBtn) {
            closeEditModalBtn.addEventListener('click', () => this.closeEditModal());
        }
        if (cancelEditModalBtn) {
            cancelEditModalBtn.addEventListener('click', () => this.closeEditModal());
        }

        const closeAvatarModalBtn = document.getElementById('closeAvatarModalBtn');
        const cancelAvatarModalBtn = document.getElementById('cancelAvatarModalBtn');
        if (closeAvatarModalBtn) {
            closeAvatarModalBtn.addEventListener('click', () => this.closeAvatarModal());
        }
        if (cancelAvatarModalBtn) {
            cancelAvatarModalBtn.addEventListener('click', () => this.closeAvatarModal());
        }

        // Save buttons
        const saveProfileChangesBtn = document.getElementById('saveProfileChangesBtn');
        if (saveProfileChangesBtn) {
            saveProfileChangesBtn.addEventListener('click', () => this.saveProfileChanges());
        }

        const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
        if (uploadAvatarBtn) {
            uploadAvatarBtn.addEventListener('click', () => this.uploadAvatar());
        }

        // Form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileChanges();
            });
        }

        // Avatar upload
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                this.handleAvatarPreview(e);
            });
        }

        // Open avatar upload modal
        const openAvatarUploadBtn = document.getElementById('openAvatarUploadBtn');
        if (openAvatarUploadBtn) {
            openAvatarUploadBtn.addEventListener('click', () => this.openAvatarUpload());
        }

        // Choose file button in avatar upload modal
        const chooseAvatarFileBtn = document.getElementById('chooseAvatarFileBtn');
        if (chooseAvatarFileBtn) {
            chooseAvatarFileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('avatarInput').click();
            });
        }
    }

    initializeUI() {
        // Set initial tab
        this.switchTab('overview');

        // Initialize completion score
        this.calculateCompletionScore();

        // Close modal when clicking outside
        const editModal = document.getElementById('editModal');
        const avatarModal = document.getElementById('avatarModal');

        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.closeEditModal();
                }
            });
        }

        if (avatarModal) {
            avatarModal.addEventListener('click', (e) => {
                if (e.target === avatarModal) {
                    this.closeAvatarModal();
                }
            });
        }
    }

    // ===== Tab Management =====
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch (tabName) {
            case 'goals':
                this.loadGoalsData();
                break;
            case 'activity':
                this.loadActivityData();
                break;
            case 'settings':
                this.loadSettingsData();
                break;
        }
    }

    loadGoalsData() {
        // This would typically load goals from the API
        // For now, we'll show the empty state
        const goalsList = document.getElementById('goalsList');
        if (goalsList && goalsList.querySelector('.empty-state')) {
            // Goals are already loaded in the HTML
        }
    }

    loadActivityData() {
        // This would typically load activity data from the API
        // For now, we'll show placeholder data
    }

    loadSettingsData() {
        // Settings are already loaded in updateSettings()
    }

    // ===== Edit Mode =====
    toggleEditMode() {
        this.isEditing = !this.isEditing;

        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.innerHTML = this.isEditing ?
                '<i class="icon-close"></i> Cancel Edit' :
                '<i class="icon-edit"></i> Edit Profile';
        }

        // Toggle edit buttons visibility
        document.querySelectorAll('.btn-edit-section').forEach(btn => {
            btn.style.display = this.isEditing ? 'block' : 'none';
        });
    }

    editSection(section) {
        this.currentEditSection = section;
        this.openEditModal(section);
    }

    openEditModal(section) {
        const modal = document.getElementById('editModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('profileForm');

        modalTitle.textContent = `Edit ${this.capitalizeFirst(section)} Information`;

        // Generate form content based on section
        form.innerHTML = this.generateFormContent(section);

        // Populate form with current data
        this.populateForm(section);

        modal.style.display = 'block';
    }

    generateFormContent(section) {
        const forms = {
            basic: `
                <div class="form-group">
                    <label for="pronouns">Pronouns</label>
                    <input type="text" id="pronouns" name="pronouns" placeholder="e.g., they/them, she/her, he/him">
                </div>
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location" placeholder="City, Country">
                </div>
                <div class="form-group">
                    <label for="date_of_birth">Date of Birth</label>
                    <input type="date" id="date_of_birth" name="date_of_birth">
                </div>
                <div class="form-group">
                    <label for="bio">Professional Summary</label>
                    <textarea id="bio" name="bio" rows="4" placeholder="Write a compelling summary of your wellness journey..."></textarea>
                </div>
            `,
            physical: `
                <div class="form-group">
                    <label for="height">Height (cm)</label>
                    <input type="number" id="height" name="height" min="50" max="300" placeholder="170">
                </div>
                <div class="form-group">
                    <label for="weight">Weight (kg)</label>
                    <input type="number" id="weight" name="weight" min="10" max="500" step="0.1" placeholder="70.5">
                </div>
                <div class="form-group">
                    <label for="fitness_level">Fitness Level</label>
                    <select id="fitness_level" name="fitness_level">
                        <option value="">Select fitness level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            `,
            skills: `
                <div class="form-group">
                    <label>Wellness Skills (select all that apply)</label>
                    <div class="checkbox-group">
                        ${this.generateSkillCheckboxes()}
                    </div>
                </div>
            `,
            goals: `
                <div class="form-group">
                    <label>Primary Goals (select all that apply)</label>
                    <div class="checkbox-group">
                        ${this.generateGoalCheckboxes()}
                    </div>
                </div>
            `
        };

        return forms[section] || '';
    }

    generateSkillCheckboxes() {
        const skills = [
            'nutrition', 'fitness', 'yoga', 'running', 'weightlifting',
            'swimming', 'cycling', 'mental_health', 'meditation', 'pilates'
        ];

        return skills.map(skill => `
            <div class="checkbox-item">
                <input type="checkbox" id="skill_${skill}" value="${skill}">
                <label for="skill_${skill}">${this.capitalizeFirst(skill.replace('_', ' '))}</label>
            </div>
        `).join('');
    }

    generateGoalCheckboxes() {
        const goals = [
            'weight_loss', 'muscle_gain', 'cardio', 'flexibility',
            'nutrition', 'mental_health', 'strength', 'endurance'
        ];

        return goals.map(goal => `
            <div class="checkbox-item">
                <input type="checkbox" id="goal_${goal}" value="${goal}">
                <label for="goal_${goal}">${this.capitalizeFirst(goal.replace('_', ' '))}</label>
            </div>
        `).join('');
    }

    populateForm(section) {
        if (!this.currentProfile) return;

        const profile = this.currentProfile;

        switch (section) {
            case 'basic':
                this.setFormValue('pronouns', profile.pronouns || '');
                this.setFormValue('location', profile.location || '');
                this.setFormValue('date_of_birth', profile.date_of_birth || '');
                this.setFormValue('bio', profile.bio || '');
                break;
            case 'physical':
                this.setFormValue('height', profile.height || '');
                this.setFormValue('weight', profile.weight || '');
                this.setFormValue('fitness_level', profile.fitness_level || '');
                break;
            case 'skills':
                this.setCheckboxes('skill_', profile.skills || []);
                break;
            case 'goals':
                this.setCheckboxes('goal_', profile.primary_goals || []);
                break;
        }
    }

    setFormValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }

    setCheckboxes(prefix, values) {
        document.querySelectorAll(`input[id^="${prefix}"]`).forEach(checkbox => {
            checkbox.checked = values.includes(checkbox.value);
        });
    }

    async saveProfileChanges() {
        try {
            const formData = new FormData(document.getElementById('profileForm'));
            const data = {};

            // Validate and collect form data
            const validationErrors = this.validateFormData(this.currentEditSection);
            if (validationErrors.length > 0) {
                this.showError(validationErrors.join(' '));
                return;
            }

            // Collect form data
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }

            // Collect checkboxes
            if (this.currentEditSection === 'skills') {
                data.skills = Array.from(document.querySelectorAll('input[id^="skill_"]:checked'))
                    .map(cb => cb.value);
            } else if (this.currentEditSection === 'goals') {
                data.primary_goals = Array.from(document.querySelectorAll('input[id^="goal_"]:checked'))
                    .map(cb => cb.value);
            }

            // Disable save button and show loading
            const saveBtn = document.getElementById('saveProfileChangesBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }

            // Update profile
            const response = await api.profiles.updateMyProfile(data);
            // Handle both possible response structures
            this.currentProfile = response.data ? response.data.profile : response.profile;

            // Update display
            this.updateProfileDisplay();
            this.calculateCompletionScore();

            // Close modal
            this.closeEditModal();

            this.showSuccess('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            this.showError(`Failed to update profile: ${error.message}`);
        } finally {
            // Re-enable save button
            const saveBtn = document.getElementById('saveProfileChangesBtn');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
            }
        }
    }

    validateFormData(section) {
        const errors = [];

        switch (section) {
            case 'physical':
                const height = document.getElementById('height')?.value;
                const weight = document.getElementById('weight')?.value;

                if (height) {
                    const h = parseInt(height);
                    if (h < 50 || h > 300) {
                        errors.push('Height must be between 50-300 cm.');
                    }
                }

                if (weight) {
                    const w = parseFloat(weight);
                    if (w < 10 || w > 500) {
                        errors.push('Weight must be between 10-500 kg.');
                    }
                }
                break;

            case 'basic':
                const bio = document.getElementById('bio')?.value;
                if (bio && bio.length > 1000) {
                    errors.push('Bio must be less than 1000 characters.');
                }
                break;
        }

        return errors;
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    // ===== Avatar Management =====
    openAvatarUpload() {
        document.getElementById('avatarModal').style.display = 'block';
    }

    closeAvatarModal() {
        document.getElementById('avatarModal').style.display = 'none';
    }

    handleAvatarPreview(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('uploadPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }

    async uploadAvatar() {
        const fileInput = document.getElementById('avatarInput');
        const file = fileInput.files[0];

        if (!file) {
            this.showError('Please select a file to upload');
            return;
        }

        try {
            // In a real implementation, you would upload the file to a server
            // For now, we'll just show a success message
            this.showSuccess('Avatar updated successfully!');
            this.closeAvatarModal();
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            this.showError('Failed to upload avatar. Please try again.');
        }
    }

    // ===== Utility Functions =====
    showLoading(show) {
        console.log('showLoading called with:', show);
        const loadingState = document.getElementById('loadingState');
        const profileContent = document.getElementById('profileContent');

        if (!loadingState || !profileContent) {
            console.error('Loading state elements not found:', { loadingState, profileContent });
            return;
        }

        if (show) {
            loadingState.classList.remove('hidden');
            profileContent.classList.add('hidden');
            console.log('Showing loading state');
        } else {
            loadingState.classList.add('hidden');
            profileContent.classList.remove('hidden');
            console.log('Hiding loading state, showing profile content');
        }
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.textContent = message;
        errorAlert.classList.remove('hidden');

        setTimeout(() => {
            errorAlert.classList.add('hidden');
        }, 5000);
    }

    showSuccess(message) {
        const successAlert = document.getElementById('successAlert');
        successAlert.textContent = message;
        successAlert.classList.remove('hidden');

        setTimeout(() => {
            successAlert.classList.add('hidden');
        }, 3000);
    }

    // Logout handled by global window.logout function

    // ===== Public Methods for HTML onclick handlers =====
    addNewGoal() {
        // This would open a goal creation modal
        this.showSuccess('Goal creation feature coming soon!');
    }

    shareProfile() {
        // This would implement profile sharing
        if (navigator.share) {
            navigator.share({
                title: 'My FittedIn Profile',
                text: 'Check out my wellness profile on FittedIn!',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            this.showSuccess('Profile link copied to clipboard!');
        }
    }

    deleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // This would implement account deletion
            this.showError('Account deletion feature coming soon!');
        }
    }
}

// ===== Global Functions for HTML onclick handlers =====
let profileManager;

// Logout handled by global window.logout function from auth.js

window.switchTab = function (tabName) {
    console.log('switchTab called with:', tabName);
    if (profileManager) {
        profileManager.switchTab(tabName);
    } else {
        console.error('ProfileManager not initialized');
    }
};

window.toggleEditMode = function () {
    console.log('toggleEditMode called');
    if (profileManager) {
        profileManager.toggleEditMode();
    } else {
        console.error('ProfileManager not initialized');
    }
};

window.editSection = function (section) {
    if (profileManager) {
        profileManager.editSection(section);
    } else {
        console.error('ProfileManager not initialized');
    }
};

window.closeEditModal = function () {
    if (profileManager) {
        profileManager.closeEditModal();
    } else {
        const modal = document.getElementById('editModal');
        if (modal) modal.style.display = 'none';
    }
};

window.saveProfileChanges = function () {
    if (profileManager) {
        profileManager.saveProfileChanges();
    } else {
        console.error('ProfileManager not initialized');
    }
};

window.openAvatarUpload = function () {
    if (profileManager) {
        profileManager.openAvatarUpload();
    } else {
        const modal = document.getElementById('avatarModal');
        if (modal) modal.style.display = 'block';
    }
};

window.closeAvatarModal = function () {
    if (profileManager) {
        profileManager.closeAvatarModal();
    } else {
        const modal = document.getElementById('avatarModal');
        if (modal) modal.style.display = 'none';
    }
};

window.uploadAvatar = function () {
    if (profileManager) {
        profileManager.uploadAvatar();
    } else {
        console.error('ProfileManager not initialized');
    }
};

window.addNewGoal = function () {
    if (profileManager) {
        profileManager.addNewGoal();
    } else {
        alert('ProfileManager not initialized');
    }
};

window.shareProfile = function () {
    if (profileManager) {
        profileManager.shareProfile();
    } else {
        if (navigator.share) {
            navigator.share({
                title: 'My FittedIn Profile',
                text: 'Check out my wellness profile on FittedIn!',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Profile link copied to clipboard!');
        }
    }
};

window.deleteAccount = function () {
    if (profileManager) {
        profileManager.deleteAccount();
    } else {
        if (confirm('Are you sure you want to delete your account?')) {
            alert('Account deletion feature coming soon!');
        }
    }
};

// ===== Initialize Profile Manager =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ProfileManager...');
    try {
        profileManager = new ProfileManager();
        console.log('ProfileManager initialized successfully');
    } catch (error) {
        console.error('Error initializing ProfileManager:', error);
        // Ensure content is shown even if initialization fails
        const loadingState = document.getElementById('loadingState');
        const profileContent = document.getElementById('profileContent');
        if (loadingState) loadingState.classList.add('hidden');
        if (profileContent) profileContent.classList.remove('hidden');
    }
});
