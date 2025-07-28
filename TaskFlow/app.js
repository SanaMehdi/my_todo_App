// Task Management Class
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.nextId = this.getNextId();
        this.init();
    }

    // Initialize the application
    init() {
        this.bindEvents();
        this.displayCurrentDate();
        this.renderTasks();
        this.updateStats();
    }

    // Bind event listeners
    bindEvents() {
        const taskInput = document.getElementById('taskInput');
        const addBtn = document.getElementById('addTaskBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const clearBtn = document.getElementById('clearCompleted');

        // Add task events
        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter events
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // Clear completed tasks
        clearBtn.addEventListener('click', () => this.clearCompleted());

        // Focus input on load
        taskInput.focus();
    }

    // Display current date
    displayCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const dateString = now.toLocaleDateString('en-US', options);
        document.getElementById('currentDate').textContent = dateString;
    }

    // Add new task
    addTask() {
        const input = document.getElementById('taskInput');
        const taskText = input.value.trim();

        if (taskText === '') {
            this.showNotification('Please enter a task!', 'error');
            return;
        }

        const newTask = {
            id: this.nextId++,
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        input.value = '';
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task added successfully!', 'success');
    }

    // Toggle task completion
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    // Delete task
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted!', 'info');
        }
    }

    // Edit task
    editTask(id) {
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        const textElement = taskElement.querySelector('.task-text');
        const actionsElement = taskElement.querySelector('.task-actions');
        
        const currentText = textElement.textContent;
        
        // Create edit input
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.value = currentText;
        
        // Create save and cancel buttons
        const saveBtn = document.createElement('button');
        saveBtn.className = 'task-btn save-btn';
        saveBtn.innerHTML = '<i class="fas fa-check"></i>';
        saveBtn.onclick = () => this.saveEdit(id, editInput.value);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'task-btn cancel-btn';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        cancelBtn.onclick = () => this.cancelEdit(id);
        
        // Replace elements
        textElement.replaceWith(editInput);
        actionsElement.innerHTML = '';
        actionsElement.appendChild(saveBtn);
        actionsElement.appendChild(cancelBtn);
        
        // Add editing class and focus input
        taskElement.classList.add('editing');
        editInput.focus();
        editInput.select();
        
        // Handle enter key
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEdit(id, editInput.value);
            if (e.key === 'Escape') this.cancelEdit(id);
        });
    }

    // Save task edit
    saveEdit(id, newText) {
        const trimmedText = newText.trim();
        if (trimmedText === '') {
            this.showNotification('Task cannot be empty!', 'error');
            return;
        }

        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = trimmedText;
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task updated!', 'success');
        }
    }

    // Cancel task edit
    cancelEdit(id) {
        this.renderTasks();
    }

    // Set filter
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    // Clear completed tasks
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }

        if (confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
            this.tasks = this.tasks.filter(t => !t.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(`${completedCount} completed task(s) cleared!`, 'success');
        }
    }

    // Get filtered tasks
    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'pending':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    // Render tasks
    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
        
        const tasksHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        container.innerHTML = tasksHTML;
        
        // Bind task events
        this.bindTaskEvents();
    }

    // Create task HTML
    createTaskHTML(task) {
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="taskManager.toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" onclick="taskManager.editTask(${task.id})" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete-btn" onclick="taskManager.deleteTask(${task.id})" title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Get empty state HTML
    getEmptyStateHTML() {
        const messages = {
            all: 'No tasks yet',
            pending: 'No pending tasks',
            completed: 'No completed tasks'
        };
        
        const descriptions = {
            all: 'Add a task above to get started!',
            pending: 'All tasks are completed! 🎉',
            completed: 'Complete some tasks to see them here!'
        };

        return `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>${messages[this.currentFilter]}</h3>
                <p>${descriptions[this.currentFilter]}</p>
            </div>
        `;
    }

    // Bind task-specific events
    bindTaskEvents() {
        // Additional event binding if needed
        // This method is called after rendering tasks
    }

    // Update statistics
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        
        document.getElementById('totalTasks').textContent = 
            `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`;
        document.getElementById('completedTasks').textContent = 
            `${completedTasks} completed`;
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            ${message}
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '15px 20px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '1000',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '250px',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Get notification color
    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            info: '#17a2b8'
        };
        return colors[type] || '#17a2b8';
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load tasks from localStorage
    loadTasks() {
        try {
            const stored = localStorage.getItem('taskflow_tasks');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to load tasks:', error);
            return [];
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        try {
            localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Failed to save tasks:', error);
            this.showNotification('Failed to save tasks!', 'error');
        }
    }

    // Get next available ID
    getNextId() {
        return this.tasks.length > 0 ? Math.max(...this.tasks.map(t => t.id)) + 1 : 1;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});

// Handle page visibility change to update date
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.taskManager) {
        window.taskManager.displayCurrentDate();
    }
});





