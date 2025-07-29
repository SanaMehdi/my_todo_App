// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    init() {
        this.bindAuthEvents();
        this.checkAuthStatus();
    }

    bindAuthEvents() {
        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // Screen switching
        document.getElementById('showSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('signupScreen');
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showScreen('loginScreen');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const messageEl = document.getElementById('loginMessage');

        // Clear previous messages
        messageEl.innerHTML = '';

        // Basic validation
        if (!email || !password) {
            this.showMessage(messageEl, 'Please fill in all fields', 'error');
            return;
        }

        // Get stored user
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            this.showMessage(messageEl, 'Account not found. Please check your email or create an account.', 'error');
            return;
        }

        if (user.password !== password) {
            this.showMessage(messageEl, 'Incorrect password. Please try again.', 'error');
            return;
        }

        // Successful login
        this.setCurrentUser(user);
        this.showMessage(messageEl, 'Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            this.showApp();
        }, 1000);
    }

    handleSignup() {
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const messageEl = document.getElementById('signupMessage');

        // Clear previous messages
        messageEl.innerHTML = '';

        // Basic validation
        if (!name || !email || !password || !confirmPassword) {
            this.showMessage(messageEl, 'Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage(messageEl, 'Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage(messageEl, 'Password must be at least 6 characters long', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage(messageEl, 'Please enter a valid email address', 'error');
            return;
        }

        // Check if user already exists
        const users = this.getStoredUsers();
        if (users.some(u => u.email === email)) {
            this.showMessage(messageEl, 'An account with this email already exists', 'error');
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password, // In production, this should be hashed
            createdAt: new Date().toISOString()
        };

        // Save user
        users.push(newUser);
        this.saveUsers(users);

        // Set as current user
        this.setCurrentUser(newUser);
        this.showMessage(messageEl, 'Account created successfully! Redirecting...', 'success');

        setTimeout(() => {
            this.showApp();
        }, 1000);
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.clearCurrentUser();
            this.showScreen('loginScreen');
            this.clearForms();
            
            // Clear the TaskManager instance to ensure a fresh start on next login
            if (window.taskManager) {
                window.taskManager = null;
            }
        }
    }

    checkAuthStatus() {
        if (this.currentUser) {
            this.showApp();
        } else {
            this.showScreen('loginScreen');
        }
    }

    showApp() {
        this.showScreen('appScreen');
        document.getElementById('currentUser').textContent = this.currentUser.name;
        
        // This is the crucial line: Always re-initialize task manager for the *current* user.
        // This guarantees that the TaskManager instance loads tasks
        // specifically for the user who is now logged in.
        window.taskManager = new TaskManager(); 
        console.log('TaskManager initialized for user:', this.currentUser.name);
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        document.getElementById(screenId).classList.add('active');
    }

    showMessage(element, message, type) {
        element.innerHTML = `<div class="${type}-message">${message}</div>`;
    }

    clearForms() {
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
        document.getElementById('loginMessage').innerHTML = '';
        document.getElementById('signupMessage').innerHTML = '';
    }

    // User management methods
    getStoredUsers() {
        try {
            const stored = localStorage.getItem('taskflow_users');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load users:', error);
            return [];
        }
    }

    saveUsers(users) {
        try {
            localStorage.setItem('taskflow_users', JSON.stringify(users));
        } catch (error) {
            console.error('Failed to save users:', error);
        }
    }

    getCurrentUser() {
        try {
            const stored = localStorage.getItem('taskflow_current_user');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Failed to load current user:', error);
            return null;
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        try {
            localStorage.setItem('taskflow_current_user', JSON.stringify(user));
        } catch (error) {
            console.error('Failed to save current user:', error);
        }
    }

    clearCurrentUser() {
        this.currentUser = null;
        try {
            localStorage.removeItem('taskflow_current_user');
        } catch (error) {
            console.error('Failed to clear current user:', error);
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
