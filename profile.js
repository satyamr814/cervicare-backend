// Profile Page JavaScript
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.avatarData = null;
        this.uploadedImage = null;
        this.apiBase = 'http://localhost:3000/api';
        
        this.initializeElements();
        this.bindEvents();
        this.loadUserProfile();
    }

    initializeElements() {
        // Profile elements
        this.profileImage = document.getElementById('profileImage');
        this.userName = document.getElementById('userName');
        this.userEmail = document.getElementById('userEmail');
        this.profileCompletion = document.getElementById('profileCompletion');
        this.memberSince = document.getElementById('memberSince');
        
        // Avatar modal elements
        this.avatarModal = document.getElementById('avatarModal');
        this.changeAvatarBtn = document.getElementById('changeAvatarBtn');
        this.closeAvatarModal = document.getElementById('closeAvatarModal');
        this.avatarType = document.getElementById('avatarType');
        
        // AI Avatar elements
        this.avatarStyle = document.getElementById('avatarStyle');
        this.avatarSeed = document.getElementById('avatarSeed');
        this.generateAIAvatar = document.getElementById('generateAIAvatar');
        
        // Random Avatar elements
        this.templateType = document.getElementById('templateType');
        this.getRandomAvatar = document.getElementById('getRandomAvatar');
        
        // Custom Upload elements
        this.customImageInput = document.getElementById('customImageInput');
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.uploadPreview = document.getElementById('uploadPreview');
        this.previewImage = document.getElementById('previewImage');
        this.uploadImageBtn = document.getElementById('uploadImageBtn');
        this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
        
        // Profile form elements
        this.profileForm = document.getElementById('profileForm');
        this.resetBtn = document.getElementById('resetBtn');
        
        // UI elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.successToast = document.getElementById('successToast');
        this.errorToast = document.getElementById('errorToast');
        this.successMessage = document.getElementById('successMessage');
        this.errorMessage = document.getElementById('errorMessage');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.activityHistory = document.getElementById('activityHistory');
    }

    bindEvents() {
        // Avatar modal events
        this.changeAvatarBtn.addEventListener('click', () => this.openAvatarModal());
        this.closeAvatarModal.addEventListener('click', () => this.closeModal());
        
        // Close modal on outside click
        this.avatarModal.addEventListener('click', (e) => {
            if (e.target === this.avatarModal) {
                this.closeModal();
            }
        });
        
        // AI Avatar events
        this.generateAIAvatar.addEventListener('click', () => this.generateAIAvatarFunc());
        
        // Random Avatar events
        this.getRandomAvatar.addEventListener('click', () => this.getRandomAvatarFunc());
        
        // Custom Upload events
        this.customImageInput.addEventListener('change', (e) => this.handleImageSelect(e));
        this.uploadImageBtn.addEventListener('click', () => this.uploadCustomImage());
        this.cancelUploadBtn.addEventListener('click', () => this.cancelUpload());
        
        // Drag and drop events
        this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadArea.addEventListener('drop', (e) => this.handleImageDrop(e));
        
        // Profile form events
        this.profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        this.resetBtn.addEventListener('click', () => this.resetForm());
        
        // Logout event
        this.logoutBtn.addEventListener('click', () => this.logout());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.avatarModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    async loadUserProfile() {
        try {
            this.showLoading();
            
            // Get user info from token
            const token = localStorage.getItem('token');
            if (!token) {
                this.redirectToLogin();
                return;
            }
            
            const userResponse = await fetch(`${this.apiBase}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!userResponse.ok) {
                throw new Error('Failed to load user profile');
            }
            
            const userData = await userResponse.json();
            this.currentUser = userData.data.user;
            
            // Load avatar data
            await this.loadAvatarData();
            
            // Update UI
            this.updateProfileUI();
            this.updateAvatarUI();
            
            // Load activity history
            await this.loadActivityHistory();
            
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showError('Failed to load profile');
        } finally {
            this.hideLoading();
        }
    }

    async loadAvatarData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/avatar/current`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.avatarData = data.data.avatar;
            }
        } catch (error) {
            console.error('Error loading avatar data:', error);
        }
    }

    updateProfileUI() {
        if (!this.currentUser) return;
        
        // Update user info
        this.userName.textContent = this.currentUser.email.split('@')[0];
        this.userEmail.textContent = this.currentUser.email;
        
        // Update member since date
        if (this.currentUser.created_at) {
            const createdDate = new Date(this.currentUser.created_at);
            this.memberSince.textContent = createdDate.toLocaleDateString();
        }
        
        // Update profile completion
        const completion = this.calculateProfileCompletion();
        this.profileCompletion.textContent = `${completion}%`;
        
        // Update form fields if profile data exists
        if (this.currentUser.profile) {
            this.populateForm(this.currentUser.profile);
        }
    }

    updateAvatarUI() {
        if (!this.avatarData) return;
        
        // Update profile image
        this.profileImage.src = this.avatarData.display_image_url;
        
        // Update avatar type badge
        const typeText = this.avatarData.avatar_type?.replace('_', ' ') || 'Default';
        this.avatarType.textContent = typeText.charAt(0).toUpperCase() + typeText.slice(1);
        
        // Update badge color based on type
        this.avatarType.className = 'avatar-type-badge';
        if (this.avatarData.avatar_type === 'ai_generated') {
            this.avatarType.style.background = '#e6f3ff';
            this.avatarType.style.color = '#0066cc';
        } else if (this.avatarData.avatar_type === 'custom_upload') {
            this.avatarType.style.background = '#e6ffe6';
            this.avatarType.style.color = '#006600';
        } else if (this.avatarData.avatar_type === 'random') {
            this.avatarType.style.background = '#fff0e6';
            this.avatarType.style.color = '#cc6600';
        }
    }

    calculateProfileCompletion() {
        if (!this.currentUser.profile) return 0;
        
        const profile = this.currentUser.profile;
        const fields = ['age', 'gender', 'city', 'diet_type', 'budget_level', 'lifestyle'];
        const completedFields = fields.filter(field => profile[field] && profile[field] !== '');
        
        return Math.round((completedFields.length / fields.length) * 100);
    }

    populateForm(profile) {
        const fields = {
            age: profile.age,
            gender: profile.gender,
            city: profile.city,
            phone: profile.phone,
            dietType: profile.diet_type,
            budgetLevel: profile.budget_level,
            lifestyle: profile.lifestyle,
            whatsappConsent: profile.whatsapp_consent,
            marketingConsent: profile.marketing_consent
        };
        
        Object.keys(fields).forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = fields[field];
                } else {
                    element.value = fields[field] || '';
                }
            }
        });
    }

    openAvatarModal() {
        this.avatarModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.avatarModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.resetUploadPreview();
    }

    async generateAIAvatarFunc() {
        try {
            this.showLoading();
            
            const preferences = {
                style: this.avatarStyle.value,
                seed: this.avatarSeed.value || undefined
            };
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/avatar/generate-ai`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.profileImage.src = data.data.avatarUrl;
                this.avatarData = {
                    avatar_type: 'ai_generated',
                    display_image_url: data.data.avatarUrl
                };
                this.updateAvatarUI();
                this.closeModal();
                this.showSuccess('AI avatar generated successfully!');
                
                // Add to activity history
                this.addActivityItem('avatar_generated', 'AI Avatar Generated', 'Created a new AI-powered avatar');
            } else {
                throw new Error(data.message || 'Failed to generate avatar');
            }
            
        } catch (error) {
            console.error('Error generating AI avatar:', error);
            this.showError('Failed to generate AI avatar');
        } finally {
            this.hideLoading();
        }
    }

    async getRandomAvatarFunc() {
        try {
            this.showLoading();
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/avatar/random?templateType=${this.templateType.value}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.profileImage.src = data.data.avatarUrl;
                this.avatarData = {
                    avatar_type: 'random',
                    display_image_url: data.data.avatarUrl
                };
                this.updateAvatarUI();
                this.closeModal();
                this.showSuccess('Random avatar selected successfully!');
                
                // Add to activity history
                this.addActivityItem('avatar_random', 'Random Avatar Selected', 'Chose a random avatar from collection');
            } else {
                throw new Error(data.message || 'Failed to get random avatar');
            }
            
        } catch (error) {
            console.error('Error getting random avatar:', error);
            this.showError('Failed to get random avatar');
        } finally {
            this.hideLoading();
        }
    }

    handleImageSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.previewImageFile(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        this.fileUploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
    }

    handleImageDrop(event) {
        event.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (this.validateImageFile(file)) {
                this.previewImageFile(file);
            }
        }
    }

    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            this.showError('Invalid file type. Please upload JPEG, PNG, or WebP image.');
            return false;
        }
        
        if (file.size > maxSize) {
            this.showError('File too large. Please upload an image smaller than 5MB.');
            return false;
        }
        
        return true;
    }

    previewImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.uploadedImage = file;
            this.uploadPreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    async uploadCustomImage() {
        if (!this.uploadedImage) {
            this.showError('Please select an image first');
            return;
        }
        
        try {
            this.showLoading();
            
            const formData = new FormData();
            formData.append('image', this.uploadedImage);
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/avatar/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.profileImage.src = data.data.imageUrl;
                this.avatarData = {
                    avatar_type: 'custom_upload',
                    display_image_url: data.data.imageUrl
                };
                this.updateAvatarUI();
                this.closeModal();
                this.showSuccess('Custom image uploaded successfully!');
                
                // Add to activity history
                this.addActivityItem('avatar_uploaded', 'Custom Image Uploaded', 'Uploaded a custom profile picture');
            } else {
                throw new Error(data.message || 'Failed to upload image');
            }
            
        } catch (error) {
            console.error('Error uploading custom image:', error);
            this.showError('Failed to upload custom image');
        } finally {
            this.hideLoading();
        }
    }

    cancelUpload() {
        this.resetUploadPreview();
        this.customImageInput.value = '';
        this.uploadedImage = null;
    }

    resetUploadPreview() {
        this.uploadPreview.classList.add('hidden');
        this.previewImage.src = '';
        this.uploadedImage = null;
    }

    async handleProfileSubmit(event) {
        event.preventDefault();
        
        try {
            this.showLoading();
            
            const formData = new FormData(this.profileForm);
            const profileData = {
                age: parseInt(formData.get('age')),
                gender: formData.get('gender'),
                city: formData.get('city'),
                phone: formData.get('phone'),
                diet_type: formData.get('diet_type'),
                budget_level: formData.get('budget_level'),
                lifestyle: formData.get('lifestyle'),
                whatsapp_consent: formData.has('whatsapp_consent'),
                marketing_consent: formData.has('marketing_consent')
            };
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.apiBase}/profile`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser.profile = profileData;
                this.updateProfileUI();
                this.showSuccess('Profile updated successfully!');
                
                // Add to activity history
                this.addActivityItem('profile_updated', 'Profile Updated', 'Updated personal information');
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile');
        } finally {
            this.hideLoading();
        }
    }

    resetForm() {
        this.profileForm.reset();
        if (this.currentUser.profile) {
            this.populateForm(this.currentUser.profile);
        }
    }

    async loadActivityHistory() {
        try {
            // Add initial activity items
            this.addActivityItem('account_created', 'Account Created', 'Welcome to CerviCare!');
            
            if (this.currentUser.profile) {
                this.addActivityItem('profile_completed', 'Profile Completed', 'Personal information added');
            }
            
        } catch (error) {
            console.error('Error loading activity history:', error);
        }
    }

    addActivityItem(type, title, description) {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        const iconMap = {
            'account_created': 'fa-user-plus',
            'profile_updated': 'fa-user-edit',
            'profile_completed': 'fa-check-circle',
            'avatar_generated': 'fa-magic',
            'avatar_random': 'fa-dice',
            'avatar_uploaded': 'fa-camera'
        };
        
        const icon = iconMap[type] || 'fa-circle';
        
        activityItem.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="activity-content">
                <strong>${title}</strong>
                <p>${description}</p>
            </div>
            <span class="activity-time">Just now</span>
        `;
        
        // Add to the top of the activity list
        this.activityHistory.insertBefore(activityItem, this.activityHistory.firstChild);
        
        // Remove old items if there are too many
        const items = this.activityHistory.querySelectorAll('.activity-item');
        if (items.length > 5) {
            items[items.length - 1].remove();
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'auth.html';
    }

    redirectToLogin() {
        window.location.href = 'auth.html';
    }

    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successToast.classList.remove('hidden');
        
        setTimeout(() => {
            this.successToast.classList.add('hidden');
        }, 3000);
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorToast.classList.remove('hidden');
        
        setTimeout(() => {
            this.errorToast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});
