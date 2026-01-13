// ============================================
// PRODUCTIVITY HUB - ANALYTICS PANEL V2
// ============================================

let currentPeriod = 7; // Default to 7 days
let habitCharts = {};
let taskCharts = {};
let goalCharts = {};
let insightCharts = {};

// Collapsible section states
let sectionStates = {
    habits: true,    // expanded by default
    tasks: true,     // expanded by default
    goals: true,     // expanded by default
    insights: true   // expanded by default
};

// Initialize analytics when panel is shown
function initAnalytics() {
    currentPeriod = 7;
    renderAnalytics();
}

// Main render function
function renderAnalytics() {
    console.log('Rendering analytics with period:', currentPeriod);
    renderHabitAnalytics();
    renderTaskAnalytics();
    renderGoalAnalytics();
    renderInsights();
}

// Switch time period
function switchPeriod(period) {
    currentPeriod = period;
    
    // Update button states
    document.querySelectorAll('.period-btn').forEach(btn => {
        if (btn.dataset.period == period) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Re-render all analytics
    renderAnalytics();
}

// Toggle section collapse/expand
function toggleSection(sectionName) {
    sectionStates[sectionName] = !sectionStates[sectionName];
    
    // Update UI
    const contentId = `${sectionName}-analytics-content`;
    const iconId = `${sectionName}-collapse-icon`;
    
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    
    if (content && icon) {
        if (sectionStates[sectionName]) {
            content.classList.remove('hidden');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            content.classList.add('hidden');
            icon.classList.add('fa-chevron-down');
            icon.classList.remove('fa-chevron-up');
        }
    }
}

// ============================================
// HABIT ANALYTICS
// ============================================

function renderHabitAnalytics() {
    renderHabitSummaryCards();
    renderHabitCharts();
}

function renderHabitSummaryCards() {
    const container = document.getElementById('habit-summary-cards');
    if (!container) return;
    
    const metrics = calculateHabitMetrics();
    
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Completion Rate</div>
                <div class="text-xl font-bold text-success">${metrics.completionRate}%</div>
                <div class="text-xs text-gray-400">${currentPeriod === 'all' ? 'All time' : 'Last ' + currentPeriod + ' days'}</div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Avg Streak</div>
                <div class="text-xl font-bold text-primary">${metrics.avgStreak} days</div>
                <div class="text-xs text-gray-400">Current</div>
            </div>
        </div>
        <div class="bg-blue-50 border-l-4 border-primary p-2 mb-3">
            <div class="flex items-start gap-2">
                <i class="fas fa-info-circle text-primary text-sm mt-0.5"></i>
                <div class="text-xs text-gray-700">
                    <strong>Streak Info:</strong> Streaks count consecutive days completed. Weekend-exempt habits skip Sat/Sun. 
                    Streaks continue if today isn't required yet (weekends for exempt habits).
                </div>
            </div>
        </div>
    `;
}

function calculateHabitMetrics() {
    // Get date range
    const { startDate, endDate } = getDateRange(currentPeriod);
    
    // Filter daily habits only (as per functional design spec)
    const dailyHabits = appState.habits.filter(h => h.frequency === 'daily');
    
    if (dailyHabits.length === 0) {
        return {
            completionRate: 0,
            avgStreak: 0
        };
    }
    
    // Calculate completion rate for each habit
    let totalRate = 0;
    let rateCount = 0;
    
    dailyHabits.forEach(habit => {
        const completion = calculateHabitCompletionRate(habit, startDate, endDate);
        if (completion.expected > 0) {
            totalRate += completion.rate;
            rateCount++;
        }
    });
    
    const avgCompletionRate = rateCount > 0 ? Math.round(totalRate / rateCount) : 0;
    
    // Calculate average streak
    const avgStreak = appState.habitStreaks.length > 0
        ? Math.round(appState.habitStreaks.reduce((sum, s) => sum + (s.current_streak || 0), 0) / appState.habitStreaks.length)
        : 0;
    
    console.log('Habit Metrics:', { avgCompletionRate, avgStreak, dailyHabitsCount: dailyHabits.length });
    
    return {
        completionRate: avgCompletionRate,
        avgStreak: avgStreak
    };
}

function calculateHabitCompletionRate(habit, startDate, endDate) {
    // Calculate expected days based on frequency and weekend exemptions
    let expectedDays = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Count day if not exempt weekend or not a weekend
        if (!habit.exempt_weekends || !isWeekend) {
            expectedDays++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Count actual completions in date range
    const actualCompletions = appState.habitCompletions.filter(c => {
        if (c.habit_id !== habit.id) return false;
        const compDate = new Date(c.completion_date);
        return compDate >= startDate && compDate <= endDate;
    }).length;
    
    const rate = expectedDays > 0 ? Math.round((actualCompletions / expectedDays) * 100) : 0;
    
    return {
        expected: expectedDays,
        actual: actualCompletions,
        rate: rate
    };
}

function renderHabitCharts() {
    const container = document.getElementById('habit-charts');
    if (!container) return;
    
    // Destroy existing charts
    if (habitCharts.completionTrend) habitCharts.completionTrend.destroy();
    if (habitCharts.performance) habitCharts.performance.destroy();
    
    container.innerHTML = `
        <div class="bg-white rounded-lg border border-gray-200 p-3 mb-2">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Completion Trend</h4>
            <div class="chart-container">
                <canvas id="habit-completion-chart"></canvas>
            </div>
        </div>
        
        <div class="bg-white rounded-lg border border-gray-200 p-3">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Top Habits</h4>
            <div class="chart-container">
                <canvas id="habit-performance-chart"></canvas>
            </div>
        </div>
    `;
    
    // Create charts
    setTimeout(() => {
        createHabitCompletionChart();
        createHabitPerformanceChart();
    }, 100);
}

function createHabitCompletionChart() {
    const ctx = document.getElementById('habit-completion-chart');
    if (!ctx) return;
    
    const { startDate, endDate } = getDateRange(currentPeriod);
    const dailyHabits = appState.habits.filter(h => h.frequency === 'daily');
    
    if (dailyHabits.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center text-gray-500 py-8 text-sm">No daily habits to display</div>';
        return;
    }
    
    // Generate date labels and data points
    const labels = [];
    const data = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateStr = formatDateForDB(currentDate);
        labels.push(formatDateLabel(currentDate));
        
        // Calculate completion rate for this specific date
        let expectedHabits = 0;
        let completedHabits = 0;
        
        dailyHabits.forEach(habit => {
            const dayOfWeek = currentDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            // Count if not exempt weekend or not a weekend
            if (!habit.exempt_weekends || !isWeekend) {
                expectedHabits++;
                
                // Check if completed on this date
                const isCompleted = appState.habitCompletions.some(c => 
                    c.habit_id === habit.id && c.completion_date === dateStr
                );
                
                if (isCompleted) completedHabits++;
            }
        });
        
        const rate = expectedHabits > 0 ? Math.round((completedHabits / expectedHabits) * 100) : 0;
        data.push(rate);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    habitCharts.completionTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion Rate',
                data: data,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 8,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Completion: ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

function createHabitPerformanceChart() {
    const ctx = document.getElementById('habit-performance-chart');
    if (!ctx) return;
    
    const { startDate, endDate } = getDateRange(currentPeriod);
    const dailyHabits = appState.habits.filter(h => h.frequency === 'daily');
    
    if (dailyHabits.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center text-gray-500 py-8 text-sm">No daily habits to display</div>';
        return;
    }
    
    // Calculate completion rate for each habit
    const habitPerformance = dailyHabits.map(habit => {
        const completion = calculateHabitCompletionRate(habit, startDate, endDate);
        return {
            name: (habit.emoji || '') + ' ' + habit.name,
            rate: completion.rate
        };
    }).sort((a, b) => b.rate - a.rate).slice(0, 5); // Top 5 habits
    
    const labels = habitPerformance.map(h => h.name);
    const data = habitPerformance.map(h => h.rate);
    const backgroundColors = habitPerformance.map(h => {
        if (h.rate >= 80) return '#10B981'; // Green
        if (h.rate >= 60) return '#FBBF24'; // Yellow
        return '#EF4444'; // Red
    });
    
    habitCharts.performance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion Rate',
                data: data,
                backgroundColor: backgroundColors,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 8,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Completion: ' + context.parsed.x + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================
// TASK ANALYTICS
// ============================================

function renderTaskAnalytics() {
    renderTaskSummaryCards();
    renderTaskCharts();
}

function renderTaskSummaryCards() {
    const container = document.getElementById('task-summary-cards');
    if (!container) return;
    
    const metrics = calculateTaskMetrics();
    
    container.innerHTML = `
        <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Completed</div>
                <div class="text-lg font-bold text-success">${metrics.completed}</div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Velocity</div>
                <div class="text-lg font-bold text-primary">${metrics.velocity}/day</div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Overdue</div>
                <div class="text-lg font-bold text-danger">${metrics.overdue}</div>
            </div>
        </div>
    `;
}

function calculateTaskMetrics() {
    const { startDate, endDate } = getDateRange(currentPeriod);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count completed tasks in period
    const completedInPeriod = appState.tasks.filter(t => {
        if (!t.is_completed || !t.completed_at) return false;
        const completedDate = new Date(t.completed_at);
        return completedDate >= startDate && completedDate <= endDate;
    }).length;
    
    // Calculate velocity (tasks per day)
    const daysDiff = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const velocity = Math.round((completedInPeriod / daysDiff) * 10) / 10; // Round to 1 decimal
    
    // Count overdue tasks
    const overdue = appState.tasks.filter(t => {
        if (t.is_completed) return false;
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    }).length;
    
    console.log('Task Metrics:', { completedInPeriod, velocity, overdue });
    
    return {
        completed: completedInPeriod,
        velocity: velocity,
        overdue: overdue
    };
}

function renderTaskCharts() {
    const container = document.getElementById('task-charts');
    if (!container) return;
    
    // Destroy existing charts
    if (taskCharts.completionTrend) taskCharts.completionTrend.destroy();
    if (taskCharts.categoryBreakdown) taskCharts.categoryBreakdown.destroy();
    
    container.innerHTML = `
        <div class="bg-white rounded-lg border border-gray-200 p-3 mb-2">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Completion Trend</h4>
            <div class="chart-container">
                <canvas id="task-completion-chart"></canvas>
            </div>
        </div>
        
        <div class="bg-white rounded-lg border border-gray-200 p-3">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Category Breakdown</h4>
            <div class="chart-container-small">
                <canvas id="task-category-chart"></canvas>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        createTaskCompletionChart();
        createTaskCategoryChart();
    }, 100);
}

function createTaskCompletionChart() {
    const ctx = document.getElementById('task-completion-chart');
    if (!ctx) return;
    
    const { startDate, endDate } = getDateRange(currentPeriod);
    
    // Generate date labels and completion counts
    const labels = [];
    const data = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dateStr = formatDateForDB(currentDate);
        labels.push(formatDateLabel(currentDate));
        
        // Count tasks completed on this date
        const completed = appState.tasks.filter(t => {
            if (!t.is_completed || !t.completed_at) return false;
            const completedDate = formatDateForDB(new Date(t.completed_at));
            return completedDate === dateStr;
        }).length;
        
        data.push(completed);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    taskCharts.completionTrend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tasks Completed',
                data: data,
                borderColor: '#A855F7',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 8,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 10
                        },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

function createTaskCategoryChart() {
    const ctx = document.getElementById('task-category-chart');
    if (!ctx) return;
    
    const { startDate, endDate } = getDateRange(currentPeriod);
    
    // Count completed tasks by category
    const categoryCounts = {};
    const categoryColors = {};
    const categoryNames = {};
    
    appState.tasks.forEach(task => {
        if (!task.is_completed || !task.completed_at) return;
        const completedDate = new Date(task.completed_at);
        if (completedDate < startDate || completedDate > endDate) return;
        
        const categoryId = task.category_id || 'none';
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
        
        // Get category color and name
        if (categoryId !== 'none') {
            const category = appState.categories.find(c => c.id === categoryId);
            if (category) {
                categoryColors[categoryId] = category.color_hex;
                categoryNames[categoryId] = category.name;
            }
        } else {
            categoryColors['none'] = '#9CA3AF';
            categoryNames['none'] = 'No Category';
        }
    });
    
    // Prepare chart data
    const labels = [];
    const data = [];
    const colors = [];
    
    Object.entries(categoryCounts).forEach(([catId, count]) => {
        labels.push(categoryNames[catId] || 'Unknown');
        data.push(count);
        colors.push(categoryColors[catId] || '#9CA3AF');
    });
    
    if (data.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center text-gray-500 py-8 text-sm">No completed tasks in this period</div>';
        return;
    }
    
    taskCharts.categoryBreakdown = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 11
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label}: ${value}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 8,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return context.label + ': ' + context.parsed + ' tasks (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// GOAL ANALYTICS
// ============================================

function renderGoalAnalytics() {
    renderGoalSummaryCards();
    renderGoalCharts();
}

function renderGoalSummaryCards() {
    const container = document.getElementById('goal-summary-cards');
    if (!container) return;
    
    const metrics = calculateGoalMetrics();
    
    // Build completed goals display
    let completedHtml = '';
    if (metrics.completed > 0) {
        completedHtml = `<div class="text-xs text-gray-500 mt-1">${metrics.completed} completed 🎉</div>`;
    }
    
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Total Active</div>
                <div class="text-lg font-bold text-primary">${metrics.total} goals</div>
                ${completedHtml}
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Avg Progress</div>
                <div class="text-lg font-bold text-success">${metrics.avgProgress}%</div>
            </div>
        </div>
        <div class="bg-blue-50 border-l-4 border-primary p-2 mb-3">
            <div class="flex items-start gap-2">
                <i class="fas fa-info-circle text-primary text-sm mt-0.5"></i>
                <div class="text-xs text-gray-700">
                    <strong>Status:</strong> Completed (100%) | On Track (75-99%) | At Risk (50-74%) | Behind (<50%)
                </div>
            </div>
        </div>
    `;
}

function calculateGoalMetrics() {
    // Only consider active goals (not archived)
    const activeGoals = appState.goals.filter(g => !g.is_archived);
    
    if (activeGoals.length === 0) {
        return {
            total: 0,
            completed: 0,
            avgProgress: 0
        };
    }
    
    let totalProgress = 0;
    let completedCount = 0;
    
    activeGoals.forEach(goal => {
        // Calculate current progress
        const linkedTasks = appState.tasks.filter(t => t.goal_id === goal.id);
        const completedTasks = linkedTasks.filter(t => t.is_completed).length;
        const currentProgress = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0;
        
        totalProgress += currentProgress;
        
        if (currentProgress === 100) {
            completedCount++;
        }
    });
    
    const avgProgress = Math.round(totalProgress / activeGoals.length);
    
    console.log('Goal Metrics:', { total: activeGoals.length, completed: completedCount, avgProgress });
    
    return {
        total: activeGoals.length,
        completed: completedCount,
        avgProgress: avgProgress
    };
}

function renderGoalCharts() {
	    const container = document.getElementById('goal-charts');
	    if (!container) return;
	    
	    // Destroy existing charts
	    if (goalCharts.progressOverview) goalCharts.progressOverview.destroy();
	    if (goalCharts.statusBreakdown) goalCharts.statusBreakdown.destroy();
	    
	    const activeGoals = appState.goals.filter(g => !g.is_archived);
	    
	    if (activeGoals.length === 0) {
	        container.innerHTML = `
	            <div class="text-center text-gray-500 py-8">
	                <i class="fas fa-bullseye text-4xl mb-2"></i>
	                <p>No active goals</p>
	                <p class="text-sm mt-1">Create some goals to see analytics</p>
	            </div>
	        `;
	        return;
	    }
	    
	    // Calculate number of in-progress goals (excluding 100% complete)
	    const inProgressGoals = activeGoals.filter(goal => {
	        const linkedTasks = appState.tasks.filter(t => t.goal_id === goal.id);
	        const completedTasks = linkedTasks.filter(t => t.is_completed).length;
	        const progress = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0;
	        return progress < 100;
	    });
	    
	    // Dynamic height: 40px per goal, minimum 200px, maximum 600px
	    const goalCount = Math.max(inProgressGoals.length, 5); // Show at least 5 slots
	    const chartHeight = Math.max(200, Math.min(600, goalCount * 40));
	    
	    container.innerHTML = `
	        <div class="bg-white rounded-lg border border-gray-200 p-3 mb-2">
	            <h4 class="text-sm font-semibold text-gray-700 mb-2">Progress Overview</h4>
	            <div style="position: relative; height: ${chartHeight}px; margin-bottom: 1rem;">
	                <canvas id="goal-progress-chart"></canvas>
	            </div>
	        </div>
	        
	        <div class="bg-white rounded-lg border border-gray-200 p-3">
	            <h4 class="text-sm font-semibold text-gray-700 mb-2">Status Breakdown</h4>
	            <div class="chart-container-small">
	                <canvas id="goal-status-chart"></canvas>
	            </div>
	        </div>
	    `;
	    
	    setTimeout(() => {
	        createGoalProgressChart();
	        createGoalStatusChart();
	    }, 100);
}

function createGoalProgressChart() {
    const ctx = document.getElementById('goal-progress-chart');
    if (!ctx) return;
    
    const activeGoals = appState.goals.filter(g => !g.is_archived);
    
    // Calculate progress for each goal, EXCLUDE 100% completed goals
    const goalData = activeGoals
        .map(goal => {
            const linkedTasks = appState.tasks.filter(t => t.goal_id === goal.id);
            const completedTasks = linkedTasks.filter(t => t.is_completed).length;
            const progress = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0;
            
            // Color coding based on progress
            let color;
            if (progress >= 100) color = '#A855F7'; // Purple - completed
            else if (progress >= 75) color = '#10B981'; // Green - on track
            else if (progress >= 50) color = '#FBBF24'; // Yellow - at risk
            else color = '#EF4444'; // Red - behind
            
            return {
                name: (goal.emoji || '') + ' ' + goal.name,
                progress: progress,
                color: color,
                isCompleted: progress === 100
            };
        })
        .filter(g => !g.isCompleted) // FILTER OUT 100% completed
        .sort((a, b) => b.progress - a.progress); // Sort by progress, no slice limit
    
    if (goalData.length === 0) {
        ctx.parentElement.innerHTML = '<div class="text-center text-gray-500 py-8 text-sm">All goals completed! 🎉</div>';
        return;
    }
    
    const labels = goalData.map(g => g.name);
    const data = goalData.map(g => g.progress);
    const colors = goalData.map(g => g.color);
    
    goalCharts.progressOverview = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Progress',
                data: data,
                backgroundColor: colors,
                borderRadius: 4,
                barThickness: 20, // Fixed bar thickness for consistent sizing
                maxBarThickness: 25
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 8,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Progress: ' + context.parsed.x + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        font: {
                            size: 10
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            layout: {
                padding: {
                    left: 5,
                    right: 5,
                    top: 5,
                    bottom: 5
                }
            }
        }
    });
}

function createGoalStatusChart() {
    const ctx = document.getElementById('goal-status-chart');
    if (!ctx) return;
    
    const activeGoals = appState.goals.filter(g => !g.is_archived);
    
    // Categorize goals: Completed (100%), On Track (75-99%), At Risk (50-74%), Behind (<50%)
    let completed = 0;
    let onTrack = 0;
    let atRisk = 0;
    let behind = 0;
    
    activeGoals.forEach(goal => {
        const linkedTasks = appState.tasks.filter(t => t.goal_id === goal.id);
        const completedTasks = linkedTasks.filter(t => t.is_completed).length;
        const progress = linkedTasks.length > 0 ? Math.round((completedTasks / linkedTasks.length) * 100) : 0;
        
        if (progress === 100) completed++;
        else if (progress >= 75) onTrack++;
        else if (progress >= 50) atRisk++;
        else behind++;
    });
    
    const labels = [];
    const data = [];
    const colors = [];
    
    if (completed > 0) {
        labels.push('Completed');
        data.push(completed);
        colors.push('#A855F7'); // Purple for completed
    }
    if (onTrack > 0) {
        labels.push('On Track');
        data.push(onTrack);
        colors.push('#10B981'); // Green
    }
    if (atRisk > 0) {
        labels.push('At Risk');
        data.push(atRisk);
        colors.push('#FBBF24'); // Yellow
    }
    if (behind > 0) {
        labels.push('Behind');
        data.push(behind);
        colors.push('#EF4444'); // Red
    }
    
    goalCharts.statusBreakdown = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 11
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    return {
                                        text: `${label}: ${value}`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 8,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + ' goals';
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// PRODUCTIVITY INSIGHTS
// ============================================

function renderInsights() {
    const container = document.getElementById('insights-content');
    if (!container) return;
    
    // Calculate insights
    const weeklyComparison = calculateWeeklyComparison();
    const bestDay = calculateBestDay();
    
    // Destroy existing charts
    if (insightCharts.weeklyComparison) insightCharts.weeklyComparison.destroy();
    if (insightCharts.bestDay) insightCharts.bestDay.destroy();
    
    container.innerHTML = `
        <!-- Weekly Comparison Cards -->
        <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Habits</div>
                <div class="text-lg font-bold ${weeklyComparison.habits.change >= 0 ? 'text-success' : 'text-danger'}">
                    ${weeklyComparison.habits.change >= 0 ? '+' : ''}${weeklyComparison.habits.change}%
                </div>
                <div class="text-xs text-gray-400 flex items-center gap-1">
                    <i class="fas fa-${weeklyComparison.habits.change >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    vs last week
                </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Tasks</div>
                <div class="text-lg font-bold ${weeklyComparison.tasks.change >= 0 ? 'text-success' : 'text-danger'}">
                    ${weeklyComparison.tasks.change >= 0 ? '+' : ''}${weeklyComparison.tasks.change}%
                </div>
                <div class="text-xs text-gray-400 flex items-center gap-1">
                    <i class="fas fa-${weeklyComparison.tasks.change >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    vs last week
                </div>
            </div>
            <div class="bg-white rounded-lg border border-gray-200 p-2">
                <div class="text-xs text-gray-500">Goals</div>
                <div class="text-lg font-bold ${weeklyComparison.goals.change >= 0 ? 'text-success' : 'text-danger'}">
                    ${weeklyComparison.goals.change >= 0 ? '+' : ''}${weeklyComparison.goals.change}%
                </div>
                <div class="text-xs text-gray-400 flex items-center gap-1">
                    <i class="fas fa-${weeklyComparison.goals.change >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                    vs last week
                </div>
            </div>
        </div>
        
        <!-- Best Day Analysis -->
        <div class="bg-white rounded-lg border border-gray-200 p-3 mb-3">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">Best Day Analysis</h4>
            <div class="chart-container-small">
                <canvas id="best-day-chart"></canvas>
            </div>
        </div>
        
        <!-- Productivity Insight -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border-l-4 border-primary">
            <div class="flex items-start gap-2">
                <i class="fas fa-lightbulb text-primary text-lg mt-0.5"></i>
                <div>
                    <div class="text-sm font-semibold text-gray-800 mb-1">Productivity Insight</div>
                    <div class="text-xs text-gray-700">${bestDay.insight}</div>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        createBestDayChart();
    }, 100);
}

function calculateWeeklyComparison() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // This week (last 7 days)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - 6);
    
    // Last week (7 days before that)
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    
    // Calculate habit completion rates
    const thisWeekHabits = calculatePeriodHabitRate(thisWeekStart, today);
    const lastWeekHabits = calculatePeriodHabitRate(lastWeekStart, lastWeekEnd);
    const habitChange = lastWeekHabits > 0 ? Math.round(((thisWeekHabits - lastWeekHabits) / lastWeekHabits) * 100) : 0;
    
    // Calculate task completions
    const thisWeekTasks = appState.tasks.filter(t => {
        if (!t.is_completed || !t.completed_at) return false;
        const compDate = new Date(t.completed_at);
        return compDate >= thisWeekStart && compDate <= today;
    }).length;
    
    const lastWeekTasks = appState.tasks.filter(t => {
        if (!t.is_completed || !t.completed_at) return false;
        const compDate = new Date(t.completed_at);
        return compDate >= lastWeekStart && compDate <= lastWeekEnd;
    }).length;
    
    const taskChange = lastWeekTasks > 0 ? Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100) : 0;
    
    // Calculate goal progress change
    const activeGoals = appState.goals.filter(g => !g.is_archived);
    let thisWeekGoalProgress = 0;
    let lastWeekGoalProgress = 0;
    
    activeGoals.forEach(goal => {
        const allTasks = appState.tasks.filter(t => t.goal_id === goal.id);
        
        const thisWeekCompleted = allTasks.filter(t => {
            if (!t.is_completed || !t.completed_at) return false;
            const compDate = new Date(t.completed_at);
            return compDate >= thisWeekStart && compDate <= today;
        }).length;
        
        const lastWeekCompleted = allTasks.filter(t => {
            if (!t.is_completed || !t.completed_at) return false;
            const compDate = new Date(t.completed_at);
            return compDate >= lastWeekStart && compDate <= lastWeekEnd;
        }).length;
        
        thisWeekGoalProgress += thisWeekCompleted;
        lastWeekGoalProgress += lastWeekCompleted;
    });
    
    const goalChange = lastWeekGoalProgress > 0 ? Math.round(((thisWeekGoalProgress - lastWeekGoalProgress) / lastWeekGoalProgress) * 100) : 0;
    
    return {
        habits: {
            thisWeek: thisWeekHabits,
            lastWeek: lastWeekHabits,
            change: habitChange
        },
        tasks: {
            thisWeek: thisWeekTasks,
            lastWeek: lastWeekTasks,
            change: taskChange
        },
        goals: {
            thisWeek: thisWeekGoalProgress,
            lastWeek: lastWeekGoalProgress,
            change: goalChange
        }
    };
}

function calculatePeriodHabitRate(startDate, endDate) {
    const dailyHabits = appState.habits.filter(h => h.frequency === 'daily');
    if (dailyHabits.length === 0) return 0;
    
    let totalRate = 0;
    let rateCount = 0;
    
    dailyHabits.forEach(habit => {
        const completion = calculateHabitCompletionRate(habit, startDate, endDate);
        if (completion.expected > 0) {
            totalRate += completion.rate;
            rateCount++;
        }
    });
    
    return rateCount > 0 ? Math.round(totalRate / rateCount) : 0;
}

function calculateBestDay() {
    // Analyze last 30 days to find best day of week
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const dayStats = {
        0: { name: 'Sunday', tasks: 0, habits: 0, total: 0 },
        1: { name: 'Monday', tasks: 0, habits: 0, total: 0 },
        2: { name: 'Tuesday', tasks: 0, habits: 0, total: 0 },
        3: { name: 'Wednesday', tasks: 0, habits: 0, total: 0 },
        4: { name: 'Thursday', tasks: 0, habits: 0, total: 0 },
        5: { name: 'Friday', tasks: 0, habits: 0, total: 0 },
        6: { name: 'Saturday', tasks: 0, habits: 0, total: 0 }
    };
    
    // Count tasks by day of week
    appState.tasks.forEach(task => {
        if (!task.is_completed || !task.completed_at) return;
        const compDate = new Date(task.completed_at);
        if (compDate < thirtyDaysAgo || compDate > today) return;
        
        const dayOfWeek = compDate.getDay();
        dayStats[dayOfWeek].tasks++;
        dayStats[dayOfWeek].total++;
    });
    
    // Count habit completions by day of week
    appState.habitCompletions.forEach(comp => {
        const compDate = new Date(comp.completion_date);
        if (compDate < thirtyDaysAgo || compDate > today) return;
        
        const dayOfWeek = compDate.getDay();
        dayStats[dayOfWeek].habits++;
        dayStats[dayOfWeek].total++;
    });
    
    // Find best day
    let bestDay = Object.values(dayStats).reduce((best, current) => {
        return current.total > best.total ? current : best;
    });
    
    // Generate insight
    let insight = `You're most productive on ${bestDay.name}s! `;
    if (bestDay.tasks > bestDay.habits) {
        insight += `This is your best day for completing tasks (avg ${Math.round(bestDay.tasks / 4)} per week).`;
    } else {
        insight += `This is your best day for habit consistency (avg ${Math.round(bestDay.habits / 4)} per week).`;
    }
    
    return {
        dayStats: dayStats,
        bestDay: bestDay,
        insight: insight
    };
}

function createBestDayChart() {
    const ctx = document.getElementById('best-day-chart');
    if (!ctx) return;
    
    const bestDayData = calculateBestDay();
    
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = labels.map((_, index) => bestDayData.dayStats[index].total);
    const colors = data.map((value, index) => {
        // Highlight best day with primary color
        return value === bestDayData.bestDay.total ? '#3B82F6' : '#D1D5DB';
    });
    
    insightCharts.bestDay = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Activities',
                data: data,
                backgroundColor: colors,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 8,
                    bodyFont: {
                        size: 12
                    },
                    titleFont: {
                        size: 12,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            const dayIndex = context.dataIndex;
                            const stats = bestDayData.dayStats[dayIndex];
                            return [
                                `Total: ${stats.total}`,
                                `Tasks: ${stats.tasks}`,
                                `Habits: ${stats.habits}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 10
                        },
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDateForDB(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateLabel(date) {
    // Format for chart labels based on period
    if (currentPeriod <= 7) {
        // Short format for 7 days or less (Mon, Tue, etc.)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    } else if (currentPeriod <= 30) {
        // Month/Day format for 30 days or less
        return `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
        // Just month/day for longer periods
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

function getDateRange(period) {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    if (period === 'all') {
        // Set to earliest data point or 1 year ago, whichever is more recent
        startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
        startDate.setDate(startDate.getDate() - period + 1);
    }
    
    return { startDate, endDate };
}
