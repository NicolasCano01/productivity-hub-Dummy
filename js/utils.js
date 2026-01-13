// ============================================
// PRODUCTIVITY HUB - UTILITY FUNCTIONS
// ============================================

// Update connection status indicator
function updateConnectionStatus(connected, errorMsg = '') {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (connected) {
        statusDot.className = 'w-2 h-2 rounded-full bg-success';
        statusText.textContent = 'Connected';
    } else {
        statusDot.className = 'w-2 h-2 rounded-full bg-danger';
        statusText.textContent = errorMsg ? 'Error' : 'Disconnected';
        if (errorMsg) {
            console.error('Connection error:', errorMsg);
        }
    }
}

// Switch between panels
function switchPanel(panelName) {
    // Hide all panels
    const panels = document.querySelectorAll('.panel');
    panels.forEach(panel => panel.classList.add('hidden'));
    
    // Show selected panel
    const targetPanel = document.getElementById(`${panelName}-panel`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    }
    
    // Update navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.dataset.panel === panelName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update current panel
    currentPanel = panelName;
    
    // Render panel content if needed
    if (panelName === 'tasks') {
        renderTasks();
    } else if (panelName === 'analytics') {
        renderAnalytics();
    } else if (panelName === 'calendar') {
        renderCalendar();
    }
    
    console.log(`Switched to ${panelName} panel`);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'none';
    
    // Show the first panel (habits)
    switchPanel('habits');
    
    // Update current date display
    updateCurrentDate();
}

// Update current date display
function updateCurrentDate() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = today.toLocaleDateString('en-US', options);
    }
}

// Close modal on backdrop click
function closeModalOnBackdrop(event, modalId) {
    if (event.target.id === modalId) {
        if (modalId === 'habit-modal') {
            closeHabitModal();
        } else if (modalId === 'task-modal') {
            closeTaskModal();
        } else if (modalId === 'goal-modal') {
            closeGoalModal();
        }
    }
}

// Populate filter dropdowns with categories and goals
function populateFilterDropdowns() {
    // Populate category filter
    const categoryFilter = document.getElementById('filter-category');
    const taskCategory = document.getElementById('task-category');
    
    if (categoryFilter && taskCategory) {
        const categoryOptions = appState.categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + categoryOptions;
        taskCategory.innerHTML = '<option value="">No category</option>' + categoryOptions;
    }
    
    // Populate goal filter
    const goalFilter = document.getElementById('filter-goal');
    const taskGoal = document.getElementById('task-goal');
    
    if (goalFilter && taskGoal) {
        const goalOptions = appState.goals.map(goal => 
            `<option value="${goal.id}">${goal.name}</option>`
        ).join('');
        
        goalFilter.innerHTML = '<option value="">All Goals</option>' + goalOptions;
        taskGoal.innerHTML = '<option value="">No goal</option>' + goalOptions;
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
