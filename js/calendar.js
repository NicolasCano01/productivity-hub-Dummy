// ============================================
// PRODUCTIVITY HUB - CALENDAR PANEL
// ============================================

let currentCalendarDate = new Date();
let selectedDate = null;

// Initialize calendar when panel is shown
function initCalendar() {
    currentCalendarDate = new Date();
    renderCalendar();
}

// Render the calendar grid
function renderCalendar() {
    const calendarView = document.getElementById('calendar-view');
    if (!calendarView) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Month/Year header with navigation
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let html = `
        <div class="mb-3">
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold text-gray-800">${monthNames[month]} ${year}</h3>
                <button onclick="jumpToToday()" class="px-2.5 py-1 bg-primary text-white rounded text-xs font-semibold hover:bg-blue-600 transition">
                    Today
                </button>
            </div>
            <div class="flex gap-2 mb-3">
                <button onclick="previousMonth()" class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1">
                    <i class="fas fa-chevron-left text-xs"></i>
                    <span>Previous</span>
                </button>
                <button onclick="nextMonth()" class="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-1">
                    <span>Next</span>
                    <i class="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>
        
        <!-- Calendar Grid -->
        <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <!-- Day Headers -->
            <div class="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                <div class="text-center py-2 text-xs font-semibold text-gray-600">M</div>
                <div class="text-center py-2 text-xs font-semibold text-gray-600">T</div>
                <div class="text-center py-2 text-xs font-semibold text-gray-600">W</div>
                <div class="text-center py-2 text-xs font-semibold text-gray-600">T</div>
                <div class="text-center py-2 text-xs font-semibold text-gray-600">F</div>
                <div class="text-center py-2 text-xs font-semibold text-gray-600">S</div>
                <div class="text-center py-2 text-xs font-semibold text-gray-600">S</div>
            </div>
            
            <!-- Calendar Days -->
            <div class="grid grid-cols-7">
    `;
    
        // Empty cells before first day of month (adjust for Monday start)
        const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
        for (let i = 0; i < adjustedStartDay; i++) {
            html += '<div class="aspect-square border-b border-r border-gray-100 bg-gray-50"></div>';
        }
    
    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        currentDate.setHours(0, 0, 0, 0);
        const isToday = currentDate.getTime() === today.getTime();
        const isPast = currentDate < today;
        const dateStr = formatDateForDB(currentDate);
        
        // Get activity for this date
        const activities = getDateActivities(dateStr);
        const hasHabits = activities.habits > 0;
        const hasTasks = activities.tasks > 0;
        const hasGoals = activities.goals > 0;
        const hasActivity = hasHabits || hasTasks || hasGoals;
        
        html += `
            <div class="aspect-square border-b border-r border-gray-100 relative cursor-pointer hover:bg-blue-50 transition ${isPast && !hasActivity ? 'bg-gray-50' : 'bg-white'}" 
                 onclick="openDateDetails('${dateStr}')">
                <div class="absolute inset-0 p-1 flex flex-col">
                    <div class="text-center ${isToday ? 'bg-primary text-white rounded-full w-6 h-6 mx-auto flex items-center justify-center font-bold' : isPast ? 'text-gray-400' : 'text-gray-700'} text-xs">
                        ${day}
                    </div>
                    ${hasActivity ? `
                        <div class="flex-1 flex items-end justify-center pb-1">
                            <div class="flex flex-col gap-0.5 items-center">
                            ${hasHabits ? `<div class="flex items-center gap-0.5"><div class="w-1 h-1 rounded-full bg-success"></div><span class="text-[8px] font-bold text-success">${activities.habits}</span></div>` : ''}
                            ${hasTasks ? `<div class="flex items-center gap-0.5"><div class="w-1 h-1 rounded-full bg-purple-500"></div><span class="text-[8px] font-bold text-purple-500">${activities.tasks}</span></div>` : ''}
                            ${hasGoals ? `<div class="flex items-center gap-0.5"><div class="w-1 h-1 rounded-full bg-primary"></div><span class="text-[8px] font-bold text-primary">${activities.goals}</span></div>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Fill remaining cells
    const totalCells = adjustedStartDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        html += '<div class="aspect-square border-b border-r border-gray-100 bg-gray-50"></div>';
    }
    
    html += `
            </div>
        </div>
        
        <!-- Legend -->
        <div class="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-center justify-center gap-4 text-xs">
                <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-success"></div>
                    <span class="text-gray-600">Habits</span>
                </div>
                <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span class="text-gray-600">Tasks</span>
                </div>
                <div class="flex items-center gap-1">
                    <div class="w-2 h-2 rounded-full bg-primary"></div>
                    <span class="text-gray-600">Goals</span>
                </div>
            </div>
        </div>
    `;
    
    calendarView.innerHTML = html;
}

// Get activities for a specific date
function getDateActivities(dateStr) {
    const activities = {
        habits: 0,
        tasks: 0,
        goals: 0
    };
    
    // Count habit completions
    const habitCompletions = appState.habitCompletions.filter(c => c.completion_date === dateStr);
    activities.habits = habitCompletions.length;
    
    // Count tasks due on this date
    const tasksOnDate = appState.tasks.filter(t => t.due_date === dateStr && !t.is_completed);
    activities.tasks = tasksOnDate.length;
    
    // Count goals with deadline on this date
    const goalsOnDate = appState.goals.filter(g => g.due_date === dateStr && g.status === 'active');
    activities.goals = goalsOnDate.length;
    
    return activities;
}

// Format date for database (YYYY-MM-DD)
function formatDateForDB(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() === today.getTime()) {
        return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (targetDate.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    }
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Navigation functions
function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function jumpToToday() {
    currentCalendarDate = new Date();
    renderCalendar();
}

// Open date details modal
function openDateDetails(dateStr) {
    selectedDate = dateStr;
    const modal = document.getElementById('calendar-detail-modal');
    if (!modal) return;
    
    const dateDisplay = formatDateForDisplay(dateStr);
    
    // Get all activities for this date
    const habitCompletions = appState.habitCompletions.filter(c => c.completion_date === dateStr);
    const tasksOnDate = appState.tasks.filter(t => t.due_date === dateStr);
    const goalsOnDate = appState.goals.filter(g => g.due_date === dateStr && g.status === 'active');
    
    // Build habits section
    let habitsHtml = '';
    if (habitCompletions.length > 0) {
        const completedHabits = habitCompletions.map(c => {
            const habit = appState.habits.find(h => h.id === c.habit_id);
            return habit ? `
                <div class="flex items-center gap-2 py-1.5">
                    <i class="fas fa-check-circle text-success text-sm"></i>
                    ${habit.emoji ? `<span class="text-lg">${habit.emoji}</span>` : ''}
                    <span class="text-sm text-gray-700">${escapeHtml(habit.name)}</span>
                </div>
            ` : '';
        }).filter(Boolean).join('');
        
        habitsHtml = `
            <div class="mb-3">
                <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full bg-success"></div>
                    Habits Completed (${habitCompletions.length})
                </h4>
                <div class="space-y-1">${completedHabits}</div>
            </div>
        `;
    }
    
    // Build tasks section
    let tasksHtml = '';
    if (tasksOnDate.length > 0) {
        const tasksList = tasksOnDate.map(task => {
            const category = appState.categories.find(c => c.id === task.category_id);
            const categoryColor = category ? category.color_hex : '#6B7280';
            const isCompleted = task.is_completed;
            
            return `
                <div class="flex items-center gap-2 py-1.5 ${isCompleted ? 'opacity-60' : ''} cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2" onclick="event.stopPropagation(); openTaskFromCalendar('${task.id}');">
                    <i class="fas fa-${isCompleted ? 'check-circle text-success' : 'circle text-gray-300'} text-sm"></i>
                    <span class="flex-1 text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}">${escapeHtml(task.title)}</span>
                    ${category ? `<span class="text-xs px-1.5 py-0.5 rounded" style="background-color: ${categoryColor}20; color: ${categoryColor};">${category.name}</span>` : ''}
                </div>
            `;
        }).join('');
        
        tasksHtml = `
            <div class="mb-3">
                <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                    Tasks (${tasksOnDate.filter(t => !t.is_completed).length}/${tasksOnDate.length})
                </h4>
                <div class="space-y-1">${tasksList}</div>
            </div>
        `;
    }
    
    // Build goals section
    let goalsHtml = '';
    if (goalsOnDate.length > 0) {
        const goalsList = goalsOnDate.map(goal => {
            const categoryMap = {
                'travel': 'Travel', 'personal': 'Personal', 'career': 'Work',
                'health': 'Health', 'financial': 'Finance', 'learning': 'Learning', 'other': 'Other'
            };
            const categoryName = categoryMap[goal.goal_type] || 'Other';
            const category = appState.categories.find(c => c.name === categoryName);
            const goalColor = category ? category.color_hex : '#6B7280';
            
            return `
                <div class="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2" onclick="event.stopPropagation(); openGoalFromCalendar('${goal.id}');">
                    ${goal.emoji ? `<span class="text-lg">${goal.emoji}</span>` : '<i class="fas fa-bullseye text-primary text-sm"></i>'}
                    <span class="flex-1 text-sm text-primary font-medium">${escapeHtml(goal.name)}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded" style="background-color: ${goalColor}20; color: ${goalColor};">${categoryName}</span>
                </div>
            `;
        }).join('');
        
        goalsHtml = `
            <div class="mb-3">
                <h4 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full bg-primary"></div>
                    Goal Deadlines (${goalsOnDate.length})
                </h4>
                <div class="space-y-1">${goalsList}</div>
            </div>
        `;
    }
    
    // Combine all sections
    const hasAnyActivity = habitCompletions.length > 0 || tasksOnDate.length > 0 || goalsOnDate.length > 0;
    const contentHtml = hasAnyActivity ? (habitsHtml + tasksHtml + goalsHtml) : `
        <div class="text-center py-6 text-gray-500">
            <i class="fas fa-calendar-day text-3xl mb-2"></i>
            <p class="text-sm">No activity on this date</p>
        </div>
    `;
    
    // Update modal
    document.getElementById('calendar-detail-date').textContent = dateDisplay;
    document.getElementById('calendar-detail-content').innerHTML = contentHtml;
    
    modal.classList.remove('hidden');
}

// Close calendar detail modal
function closeCalendarDetailModal() {
    const modal = document.getElementById('calendar-detail-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    selectedDate = null;
}

// Helper to open task from calendar
function openTaskFromCalendar(taskId) {
    console.log('Opening task from calendar:', taskId);
    
    // Close calendar modal
    closeCalendarDetailModal();
    
    // Store the task ID globally
    window.pendingTaskId = taskId;
    
    // Switch to tasks panel
    switchPanel('tasks');
    
    // Use multiple checks to ensure modal opens
    let attempts = 0;
    const checkAndOpen = setInterval(() => {
        attempts++;
        if (typeof openTaskModal === 'function' && document.getElementById('tasks-panel') && !document.getElementById('tasks-panel').classList.contains('hidden')) {
            clearInterval(checkAndOpen);
            console.log('Opening task modal with ID:', window.pendingTaskId);
            openTaskModal(window.pendingTaskId);
            window.pendingTaskId = null;
        } else if (attempts > 10) {
            clearInterval(checkAndOpen);
            console.error('Failed to open task modal after 10 attempts');
        }
    }, 100);
}

// Helper to open goal from calendar
function openGoalFromCalendar(goalId) {
    console.log('Opening goal from calendar:', goalId);
    
    // Close calendar modal
    closeCalendarDetailModal();
    
    // Store the goal ID globally
    window.pendingGoalId = goalId;
    
    // Switch to goals panel
    switchPanel('goals');
    
    // Use multiple checks to ensure modal opens
    let attempts = 0;
    const checkAndOpen = setInterval(() => {
        attempts++;
        if (typeof openGoalModal === 'function' && document.getElementById('goals-panel') && !document.getElementById('goals-panel').classList.contains('hidden')) {
            clearInterval(checkAndOpen);
            console.log('Opening goal modal with ID:', window.pendingGoalId);
            openGoalModal(window.pendingGoalId);
            window.pendingGoalId = null;
        } else if (attempts > 10) {
            clearInterval(checkAndOpen);
            console.error('Failed to open goal modal after 10 attempts');
        }
    }, 100);
}
