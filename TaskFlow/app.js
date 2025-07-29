// Task Management Class
class TaskManager {
    constructor() {
        console.log('TaskManager constructor called.');
        // Initialize tasks, filter, nextId, and bind events regardless of user login status.
        // User-specific data loading will happen within loadTasks().
        this.tasks = this.loadTasks(); 
        this.currentFilter = 'all';
        this.nextId = this.getNextId();
        console.log('TaskManager initialized. Tasks:', this.tasks, 'Next ID:', this.nextId);
        this.init(); 
    }

    // Add the getNextId() method right here:
    getNextId() {
        // Finds the maximum existing task ID to ensure new IDs are unique
        const maxId = this.tasks.reduce((max, task) => Math.max(max, task.id), 0);
        return maxId + 1;
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
        const tasksContainer = document.getElementById('tasksContainer'); // Get tasks container for delegation

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

        // Event delegation for dynamically added tasks (toggle, edit, delete)
        tasksContainer.addEventListener('click', (e) => {
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return; // Not a task item or child of one

            const taskId = parseInt(taskItem.dataset.id);

            if (e.target.closest('.task-checkbox')) {
                this.toggleTask(taskId);
            } else if (e.target.closest('.edit-btn')) {
                this.editTask(taskId);
            } else if (e.target.closest('.delete-btn')) {
                this.deleteTask(taskId);
            } else if (e.target.closest('.save-btn')) { // For edit mode save button
                 // Find the input within the same taskItem for saveEdit
                const editInput = taskItem.querySelector('.task-edit-input');
                if (editInput) {
                    this.saveEdit(taskId, editInput.value);
                }
            } else if (e.target.closest('.cancel-btn')) { // For edit mode cancel button
                this.cancelEdit(taskId);
            }
        });
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
        console.log('addTask called.');
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
        console.log('Task added to array:', newTask, 'Current tasks array:', this.tasks);
        this.saveTasks();
        input.value = '';
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task added successfully!', 'success');
    }

    // Toggle task completion
    toggleTask(id) {
        console.log('toggleTask called for ID:', id);
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            console.log('Task', id, 'completed status changed to:', task.completed);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task status updated!', 'info');
        } else {
            console.warn('Task with ID', id, 'not found for toggling.');
        }
    }

    // Delete task
    deleteTask(id) {
        // TEMPORARY: Bypassing confirm() to debug. Re-implement custom modal later.
        // if (!confirm('Are you sure you want to delete this task?')) {
        //     console.log('Delete cancelled by user (confirm box).');
        //     return;
        // }
        console.log('deleteTask called for ID:', id);
        const initialTaskCount = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.id !== id);
        if (this.tasks.length < initialTaskCount) {
            console.log('Task with ID', id, 'removed from array.');
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted!', 'info');
        } else {
            console.warn('Task with ID', id, 'not found for deletion, or already deleted.');
        }
    }

    // Edit task
    editTask(id) {
        console.log('editTask called for ID:', id);
        const taskElement = document.querySelector(`[data-id="${id}"]`);
        if (!taskElement) {
            console.error('Task element not found for editing:', id);
            return;
        }
        const textElement = taskElement.querySelector('.task-text');
        const actionsElement = taskElement.querySelector('.task-actions');
        
        const currentText = textElement.textContent;
        
        // Create edit input
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.value = currentText;
        console.log('Creating edit input for task', id, 'with text:', currentText);
        
        // Create save and cancel buttons
        const saveBtn = document.createElement('button');
        saveBtn.className = 'task-btn save-btn';
        saveBtn.innerHTML = '<i class="fas fa-check"></i>';
        // onclick handlers removed here, handled by event delegation on tasksContainer
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'task-btn cancel-btn';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        // onclick handlers removed here, handled by event delegation on tasksContainer
        
        // Replace elements
        textElement.replaceWith(editInput);
        actionsElement.innerHTML = '';
        actionsElement.appendChild(saveBtn);
        actionsElement.appendChild(cancelBtn);
        
        // Add editing class and focus input
        taskElement.classList.add('editing');
        editInput.focus();
        editInput.select();
        
        // Handle enter key (still useful for direct input focus)
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent default form submission if any
                this.saveEdit(id, editInput.value);
            }
            if (e.key === 'Escape') {
                this.cancelEdit(id);
            }
        });
    }

    // Save task edit
    saveEdit(id, newText) {
        console.log('saveEdit called for ID:', id, 'New Text:', newText);
        const trimmedText = newText.trim();
        if (trimmedText === '') {
            this.showNotification('Task cannot be empty!', 'error');
            console.warn('Attempted to save empty task text for ID:', id);
            return;
        }

        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = trimmedText;
            console.log('Task', id, 'text updated to:', trimmedText);
            this.saveTasks();
            this.renderTasks();
            this.showNotification('Task updated!', 'success');
        } else {
            console.error('Task with ID', id, 'not found for saving edit.');
        }
    }

    // Cancel task edit
    cancelEdit(id) {
        console.log('cancelEdit called for ID:', id);
        // Simply re-render tasks to revert changes
        this.renderTasks();
        this.showNotification('Edit cancelled.', 'info');
    }

    // Set filter
    setFilter(filter) {
        console.log('setFilter called:', filter);
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        } else {
            console.warn('Filter button not found for:', filter);
        }
        
        this.renderTasks();
    }

    // Clear completed tasks
    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        console.log('clearCompleted called. Completed tasks count:', completedCount);
        
        if (completedCount === 0) {
            this.showNotification('No completed tasks to clear!', 'info');
            return;
        }

        // TEMPORARY: Bypassing confirm() to debug. Re-implement custom modal later.
        // if (!confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) {
        //     console.log('Clear completed cancelled by user (confirm box).');
        //     return;
        // }

        const initialTaskCount = this.tasks.length;
        this.tasks = this.tasks.filter(t => !t.completed);
        if (this.tasks.length < initialTaskCount) {
            console.log(`${completedCount} completed task(s) removed.`);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification(`${completedCount} completed task(s) cleared!`, 'success');
        } else {
            console.warn('No completed tasks were removed.');
        }
    }

    // Get filtered tasks
    getFilteredTasks() {
        console.log('getFilteredTasks called. Current filter:', this.currentFilter);
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
        console.log('renderTasks called.');
        const container = document.getElementById('tasksContainer');
        if (!container) {
            console.error('Tasks container (tasksContainer) not found.');
            return;
        }
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            console.log('Rendering empty state.');
            return;
        }
        
        const tasksHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        container.innerHTML = tasksHTML;
        console.log('Tasks rendered:', filteredTasks.length);
        
        // No need for bindTaskEvents() now, as event delegation handles it.
    }

    // Create task HTML
    createTaskHTML(task) {
        // Removed inline onclick attributes; events are handled by delegation on tasksContainer
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}">
                    ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete-btn" title="Delete task">
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

    // This method is no longer strictly needed due to event delegation
    bindTaskEvents() {
        // console.log('bindTaskEvents called: No longer directly binding events, using delegation.');
    }

    // Update statistics
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        
        const totalTasksEl = document.getElementById('totalTasks');
        const completedTasksEl = document.getElementById('completedTasks');

        if (totalTasksEl) {
            totalTasksEl.textContent = `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`;
        } else {
            console.warn('Element #totalTasks not found for updating stats.');
        }
        if (completedTasksEl) {
            completedTasksEl.textContent = `${completedTasks} completed`;
        } else {
            console.warn('Element #completedTasks not found for updating stats.');
        }
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

    //load task method
    loadTasks() {
        try {
            const currentUser = this.getCurrentUser(); // This gets the current user
            if (!currentUser) {
                console.log('loadTasks: No user logged in, returning empty tasks.');
                return []; // Return an empty array if no user is logged in
            }

            const storageKey = `taskflow_tasks_${currentUser.id}`;
            console.log('loadTasks: Attempting to load tasks for user ID:', currentUser.id, 'from key:', storageKey);
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsedTasks = JSON.parse(stored);
                console.log('loadTasks: Successfully loaded tasks:', parsedTasks);
                return parsedTasks;
            } else {
                console.log('loadTasks: No tasks found in localStorage for this user ID.');
                return [];
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
            return [];
        }
    }

    getCurrentUser() {
        try {
            const stored = localStorage.getItem('taskflow_current_user');
            const currentUser = stored ? JSON.parse(stored) : null;
            console.log('getCurrentUser (TaskManager): Fetched current user:', currentUser);
            return currentUser;
        } catch (error) {
            console.error('Failed to load current user (TaskManager):', error);
            return null;
        }
    }

    // Save tasks to localStorage
    saveTasks() {
        try {
            const currentUser = this.getCurrentUser(); // This gets the current user
            if (!currentUser) {
                console.warn('saveTasks: Cannot save tasks: No user logged in.');
                this.showNotification('Cannot save tasks: No user logged in!', 'error');
                return; // Do nothing if no user is logged in to save tasks for
            }

            const storageKey = `taskflow_tasks_${currentUser.id}`;
            console.log('saveTasks: Attempting to save tasks for user ID:', currentUser.id, 'to key:', storageKey, 'Tasks:', this.tasks);
            localStorage.setItem(storageKey, JSON.stringify(this.tasks));
            console.log('saveTasks: Tasks saved successfully.');
        } catch (error) {
            console.error('Failed to save tasks:', error);
            this.showNotification('Failed to save tasks!', 'error');
        }
    }
} // This closing brace correctly closes the TaskManager class

// Handle page visibility change to update date
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.taskManager) {
        window.taskManager.displayCurrentDate();
    }
});
