// ===== AUTH PAGE FUNCTIONALITY =====
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CHECK SERVER CONNECTION =====
    async function checkServerConnection() {
        try {
            const response = await fetch('/api/health', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            // If we get any response, server is running
            return response.ok;
        } catch (error) {
            console.warn('Server connection check failed:', error);
            return false;
        }
    }
    
    // Check server on page load (non-blocking)
    checkServerConnection().then(isConnected => {
        if (!isConnected) {
            console.warn('⚠️ Server may not be running. Please start the server with: npm start');
        }
    });
    
    // ===== READ URL PARAMETERS AND SWITCH TAB =====
    function switchToTabFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        
        if (tabParam === 'login' || tabParam === 'signin') {
            // Switch to login tab
            const loginTab = document.querySelector('[data-tab="login"]');
            if (loginTab) {
                loginTab.click();
            }
        } else if (tabParam === 'signup' || tabParam === 'signin') {
            // Switch to signup tab
            const signupTab = document.querySelector('[data-tab="signup"]');
            if (signupTab) {
                signupTab.click();
            }
        }
    }
    
    // Switch tab based on URL parameter on page load
    switchToTabFromURL();
    
    // ===== TAB SWITCHING =====
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update forms
            forms.forEach(f => f.classList.remove('active'));
            
            if (targetTab === 'login') {
                document.getElementById('login-form').classList.add('active');
            } else if (targetTab === 'signup') {
                document.getElementById('signup-form').classList.add('active');
            }
            
            // Clear messages
            clearMessages();
        });
    });
    
    // ===== PASSWORD TOGGLE =====
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // ===== PASSWORD STRENGTH CHECKER =====
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
            checkPasswordMatch();
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    function checkPasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };
        
        // Update requirement indicators
        document.getElementById('req-length').classList.toggle('valid', requirements.length);
        document.getElementById('req-uppercase').classList.toggle('valid', requirements.uppercase);
        document.getElementById('req-lowercase').classList.toggle('valid', requirements.lowercase);
        document.getElementById('req-number').classList.toggle('valid', requirements.number);
        document.getElementById('req-special').classList.toggle('valid', requirements.special);
        
        // Calculate strength
        const metCount = Object.values(requirements).filter(Boolean).length;
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');
        
        strengthBar.className = 'strength-bar';
        
        if (metCount <= 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Weak password';
            strengthText.style.color = '#ef4444';
        } else if (metCount <= 4) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Medium password';
            strengthText.style.color = '#f59e0b';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Strong password';
            strengthText.style.color = '#22c55e';
        }
        
        if (password.length === 0) {
            strengthBar.className = 'strength-bar';
            strengthText.textContent = 'Password strength';
            strengthText.style.color = '#6b7280';
        }
    }
    
    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const matchIndicator = document.getElementById('password-match');
        
        if (confirmPassword.length === 0) {
            matchIndicator.className = 'match-indicator';
            return;
        }
        
        if (password === confirmPassword) {
            matchIndicator.className = 'match-indicator match';
            matchIndicator.innerHTML = '<i class="fa-solid fa-check-circle"></i> Passwords match';
        } else {
            matchIndicator.className = 'match-indicator no-match';
            matchIndicator.innerHTML = '<i class="fa-solid fa-times-circle"></i> Passwords do not match';
        }
    }
    
    // ===== LOGIN FORM =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearMessages();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            
            // Validate
            if (!email || !password) {
                showError(errorDiv, 'Please fill in all fields');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = loginForm.querySelector('.auth-submit-btn');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
                
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                // Restore button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    if (!response.ok) {
                        showError(errorDiv, `Server error (${response.status}). Please check if server is running on http://localhost:3000`);
                    } else {
                        showError(errorDiv, 'Server error: Invalid response. Please check if server is running.');
                    }
                    return;
                }
                
                if (response.ok && data.success) {
                    const user = data?.data?.user || data?.user;
                    const token = data?.data?.token || data?.token;

                    if (token) {
                        localStorage.setItem('token', token);
                    }

                    if (user) {
                        localStorage.setItem('user', JSON.stringify(user));
                        localStorage.setItem('isLoggedIn', 'true');
                        
                        // Redirect to profile page
                        window.location.href = 'profile.html';
                    } else {
                        showError(errorDiv, 'Login successful but user data not received. Please try again.');
                    }
                } else {
                    showError(errorDiv, data.message || 'Invalid email or password');
                }
            } catch (error) {
                console.error('Login error:', error);
                // Restore button
                const submitBtn = loginForm.querySelector('.auth-submit-btn');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
                }
                
                if (error.message && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
                    showError(errorDiv, 'Cannot connect to server. Please make sure the server is running on http://localhost:3000. Check the terminal for server status.');
                } else if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network'))) {
                    showError(errorDiv, 'Network error. Please check your connection and ensure the server is running. Run "npm start" in the terminal.');
                } else if (error.message && error.message.includes('load')) {
                    showError(errorDiv, 'Unable to load data. Please check if the server is running and try again.');
                } else {
                    showError(errorDiv, 'An error occurred: ' + (error.message || 'Please try again. If this persists, check the server console.'));
                }
                console.error('Full error details:', error);
            }
        });
    }
    
    // ===== SIGNUP FORM =====
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearMessages();
            
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const terms = document.getElementById('terms').checked;
            
            const errorDiv = document.getElementById('signup-error');
            const successDiv = document.getElementById('signup-success');
            
            // Validate
            if (!firstName || !lastName || !email || !password || !confirmPassword) {
                showError(errorDiv, 'Please fill in all fields');
                return;
            }
            
            if (!terms) {
                showError(errorDiv, 'Please accept the Terms & Conditions');
                return;
            }
            
            // Check password strength
            const passwordRequirements = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
            };
            
            const allMet = Object.values(passwordRequirements).every(Boolean);
            if (!allMet) {
                showError(errorDiv, 'Password does not meet all requirements');
                return;
            }
            
            if (password !== confirmPassword) {
                showError(errorDiv, 'Passwords do not match');
                return;
            }
            
            try {
                // Show loading state
                const submitBtn = signupForm.querySelector('.auth-submit-btn');
                const originalBtnText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
                
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password
                    })
                });
                
                // Restore button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    showError(errorDiv, 'Server error: Invalid response. Please check if server is running.');
                    return;
                }
                
                if (response.ok && data.success) {
                    // Auto-login after successful signup
                    const user = data?.data?.user || data?.user;
                    const token = data?.data?.token || data?.token;

                    if (token) {
                        localStorage.setItem('token', token);
                    }

                    if (user) {
                        // Store user session
                        localStorage.setItem('user', JSON.stringify(user));
                        localStorage.setItem('isLoggedIn', 'true');
                        
                        showSuccess(successDiv, 'Account created successfully! Redirecting...');
                        
                        // Clear form
                        signupForm.reset();
                        document.querySelectorAll('.req-item').forEach(item => {
                            item.classList.remove('valid');
                        });
                        const strengthBar = document.getElementById('strength-bar');
                        const strengthText = document.getElementById('strength-text');
                        const passwordMatch = document.getElementById('password-match');
                        
                        if (strengthBar) strengthBar.className = 'strength-bar';
                        if (strengthText) {
                            strengthText.textContent = 'Password strength';
                            strengthText.style.color = '#6b7280';
                        }
                        if (passwordMatch) passwordMatch.className = 'match-indicator';
                        
                        // Redirect to profile page after 1.5 seconds
                        setTimeout(() => {
                            window.location.href = 'profile.html';
                        }, 1500);
                    } else {
                        // Fallback: switch to login tab if user data not received
                        showSuccess(successDiv, 'Account created successfully! Please login...');
                        
                        // Clear form
                        signupForm.reset();
                        document.querySelectorAll('.req-item').forEach(item => {
                            item.classList.remove('valid');
                        });
                        const strengthBar = document.getElementById('strength-bar');
                        const strengthText = document.getElementById('strength-text');
                        const passwordMatch = document.getElementById('password-match');
                        
                        if (strengthBar) strengthBar.className = 'strength-bar';
                        if (strengthText) {
                            strengthText.textContent = 'Password strength';
                            strengthText.style.color = '#6b7280';
                        }
                        if (passwordMatch) passwordMatch.className = 'match-indicator';
                        
                        // Switch to login tab after 2 seconds
                        setTimeout(() => {
                            const loginTab = document.querySelector('[data-tab="login"]');
                            if (loginTab) {
                                loginTab.click();
                                const loginEmailInput = document.getElementById('login-email');
                                if (loginEmailInput) {
                                    loginEmailInput.value = email;
                                }
                            }
                        }, 2000);
                    }
                } else {
                    showError(errorDiv, data.message || 'An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Signup error:', error);
                // Restore button in case of error
                const submitBtn = signupForm.querySelector('.auth-submit-btn');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
                
                if (error.message && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
                    showError(errorDiv, 'Cannot connect to server. Please make sure the server is running on http://localhost:3000. Check the terminal for server status.');
                } else if (error.message && error.message.includes('load')) {
                    showError(errorDiv, 'Unable to load data. Please check if the server is running and try again.');
                } else {
                    showError(errorDiv, 'An error occurred: ' + (error.message || 'Please try again. If this persists, check the server console.'));
                }
                console.error('Full error details:', error);
            }
        });
    }
    
    // ===== HELPER FUNCTIONS =====
    function showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.add('show');
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
    
    function showSuccess(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.add('show');
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }
    
    function clearMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(msg => {
            msg.classList.remove('show');
            msg.textContent = '';
        });
    }
});

