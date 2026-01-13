// ============================================
// PRODUCTIVITY HUB - GOALS PANEL (COMPACT V2)
// ============================================

let draggedGoalId = null;

function calculateGoalProgress(goalId) {
    const linkedTasks = appState.tasks.filter(t => t.goal_id === goalId);
    const totalTasks = linkedTasks.length;
    if (totalTasks === 0) return 0;
    const completedTasks = linkedTasks.filter(t => t.is_completed).length;
    return Math.round((completedTasks / totalTasks) * 100);
}

function getGoalTaskCounts(goalId) {
    const linkedTasks = appState.tasks.filter(t => t.goal_id === goalId);
    const completed = linkedTasks.filter(t => t.is_completed).length;
    return { total: linkedTasks.length, completed: completed };
}

async function renderGoals() {
    const goalsList = document.getElementById('goals-list');
    if (!goalsList) return;
    
    let activeGoals = appState.goals
        .filter(g => g.status === 'active')
        .sort((a, b) => (a.user_order || 0) - (b.user_order || 0));
    
    if (activeGoals.length === 0) {
        goalsList.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-bullseye text-4xl mb-2"></i><p>No active goals yet</p><p class="text-sm mt-1">Tap + to create your first goal</p></div>';
        return;
    }
    
    goalsList.innerHTML = activeGoals.map(goal => {
        // Get category color directly
        const category = appState.categories.find(c => c.id === goal.category_id);
        const goalColor = category ? category.color_hex : '#6B7280';
        const categoryName = category ? category.name : 'Uncategorized';
        
        const taskCounts = getGoalTaskCounts(goal.id);
        const progress = calculateGoalProgress(goal.id);
        const dueDate = formatGoalDueDate(goal.due_date);
        const hasDeadline = goal.due_date !== null;
        const emoji = goal.emoji || '';
        
        return '<div class="goal-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" data-goal-id="' + goal.id + '" draggable="true" ondragstart="handleGoalDragStart(event, \'' + goal.id + '\')" ondragover="handleGoalDragOver(event)" ondrop="handleGoalDrop(event, \'' + goal.id + '\')" ondragend="handleGoalDragEnd(event)" onclick="openGoalModal(\'' + goal.id + '\')"><div style="height: 3px; background-color: ' + goalColor + ';"></div><div class="p-2"><div class="flex items-start justify-between gap-2 mb-1"><div class="flex-1 min-w-0"><div class="flex items-center gap-1 mb-0.5">' + (emoji ? '<span class="text-lg">' + emoji + '</span>' : '') + ' <h3 class="font-semibold text-primary text-sm leading-tight">' + escapeHtml(goal.name) + '</h3><span class="text-xs px-1.5 py-0.5 rounded" style="background-color: ' + goalColor + '20; color: ' + goalColor + ';">' + categoryName + '</span></div>' + (goal.description ? '<p class="text-xs text-gray-500 line-clamp-1">' + escapeHtml(goal.description) + '</p>' : '') + '</div></div><div class="mb-1"><div class="flex items-center justify-between mb-0.5"><span class="text-xs text-gray-500">Progress</span><span class="text-xs font-bold" style="color: ' + goalColor + ';">' + progress + '%</span></div><div class="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"><div class="h-full rounded-full transition-all duration-300" style="width: ' + progress + '%; background-color: ' + goalColor + ';"></div></div></div><div class="flex items-center justify-between text-xs"><div class="flex items-center gap-2">' + (taskCounts.total > 0 ? '<span class="flex items-center gap-1 text-gray-500"><i class="fas fa-tasks text-xs"></i><span>' + taskCounts.completed + '/' + taskCounts.total + '</span></span>' : '<span class="text-gray-400">No tasks</span>') + '</div><div class="flex items-center gap-2">' + (hasDeadline ? '<span class="flex items-center gap-1 ' + (dueDate.isOverdue ? 'text-danger font-semibold' : 'text-gray-500') + '"><i class="fas fa-clock text-xs"></i><span>' + dueDate.text + '</span></span>' : '<span class="flex items-center gap-1 text-gray-400"><i class="fas fa-infinity text-xs"></i></span>') + (progress >= 100 ? '<button onclick="event.stopPropagation(); markGoalComplete(\'' + goal.id + '\');" class="text-success hover:text-green-700 ml-1" title="Mark as complete"><i class="fas fa-check-circle"></i></button>' : '') + '</div></div></div></div>';
    }).join('');
}

function formatGoalDueDate(dueDate) {
    if (!dueDate) return { text: 'No date', isOverdue: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;
    let text;
    if (diffDays === 0) text = 'Today';
    else if (diffDays === 1) text = 'Tomorrow';
    else if (diffDays === -1) text = 'Yesterday';
    else if (diffDays > 0 && diffDays <= 30) text = diffDays + 'd';
    else if (diffDays < 0) text = Math.abs(diffDays) + 'd ago';
    else text = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { text: text, isOverdue: isOverdue };
}

async function markGoalComplete(goalId) {
    if (!confirm('Mark this goal as complete? It will be archived.')) return;
    try {
        const { error } = await supabaseClient.from('goals').update({ status: 'archived' }).eq('id', goalId);
        if (error) throw error;
        const goal = appState.goals.find(g => g.id === goalId);
        if (goal) goal.status = 'archived';
        renderGoals();
        showToast('🎉 Goal completed! Great work!', 'success');
    } catch (error) {
        console.error('Error completing goal:', error);
        showToast('Failed to complete goal', 'error');
    }
}

function openGoalModal(goalId) {
    goalId = goalId || null;
    const modal = document.getElementById('goal-modal');
    const modalTitle = document.getElementById('goal-modal-title');
    const deleteBtn = document.getElementById('delete-goal-btn');
    const form = document.getElementById('goal-form');
    
    editingGoalId = goalId;
    
    if (goalId) {
        const goal = appState.goals.find(g => g.id === goalId);
        if (!goal) return;
        
        modalTitle.textContent = 'Edit Goal';
        deleteBtn.classList.remove('hidden');
        
        document.getElementById('goal-name').value = goal.name || '';
        document.getElementById('goal-description').value = goal.description || '';
        document.getElementById('goal-category').value = goal.category_id || '';
        document.getElementById('goal-due-date').value = goal.due_date || '';
        document.getElementById('goal-emoji').value = goal.emoji || '';
        
        const emojiDisplay = document.getElementById('selected-goal-emoji');
        if (goal.emoji) {
            emojiDisplay.textContent = goal.emoji;
            emojiDisplay.classList.remove('no-emoji');
        } else {
            emojiDisplay.textContent = '';
            emojiDisplay.classList.add('no-emoji');
        }
        
        const linkedTasks = appState.tasks.filter(t => t.goal_id === goal.id);
        const taskInfo = document.getElementById('goal-task-info');
        if (taskInfo) {
            if (linkedTasks.length > 0) {
                const tasksList = linkedTasks.map(task => {
                    const isCompleted = task.is_completed;
                    return '<div class="flex items-center gap-2 py-1.5 ' + (isCompleted ? 'opacity-60' : '') + '"><i class="fas fa-' + (isCompleted ? 'check-circle text-success' : 'circle text-gray-300') + ' text-sm"></i><span class="flex-1 text-sm ' + (isCompleted ? 'line-through text-gray-500' : 'text-gray-700') + '">' + escapeHtml(task.title) + '</span></div>';
                }).join('');
                taskInfo.innerHTML = '<div class="p-2 bg-blue-50 border border-blue-200 rounded-lg"><div class="flex items-center gap-1.5 mb-2"><i class="fas fa-tasks text-primary text-sm"></i><span class="font-semibold text-sm">Linked Tasks (' + linkedTasks.filter(t => t.is_completed).length + '/' + linkedTasks.length + ')</span></div><div class="max-h-32 overflow-y-auto custom-scrollbar">' + tasksList + '</div></div>';
            } else {
                taskInfo.innerHTML = '<div class="p-2 bg-gray-50 border border-gray-200 rounded-lg"><div class="flex items-center gap-1.5 text-sm text-gray-600"><i class="fas fa-link text-gray-400"></i><span>No tasks linked yet</span></div></div>';
            }
        }
    } else {
        modalTitle.textContent = 'Add Goal';
        deleteBtn.classList.add('hidden');
        form.reset();
        const emojiDisplay = document.getElementById('selected-goal-emoji');
        emojiDisplay.textContent = '';
        emojiDisplay.classList.add('no-emoji');
        const taskInfo = document.getElementById('goal-task-info');
        if (taskInfo) taskInfo.innerHTML = '';
    }
    
   // Populate category dropdown
    populateGoalCategories();
    
    modal.classList.remove('hidden');
}

function toggleGoalEmojiPicker() {
    const picker = document.getElementById('goal-emoji-picker');
    if (!picker) return;
    
    if (picker.classList.contains('hidden')) {
        picker.classList.remove('hidden');
        // Check if the categories container is empty instead
        const container = document.getElementById('goal-emoji-categories');
        if (container && container.innerHTML.trim() === '') {
            loadGoalEmojiPicker();
        }
    } else {
        picker.classList.add('hidden');
    }
}

function loadGoalEmojiPicker() {
    const container = document.getElementById('goal-emoji-categories');
    const categories = {
        'Targets': ['🎯', '🏆', '⭐', '🎖️', '🥇', '🥈', '🥉', '👑'],
        'Activities': ['💼', '📚', '🏋️', '🧘', '✈️', '🏠', '💰', '🎨', '🎵', '🎮'],
        'Symbols': ['✨', '🔥', '💪', '🚀', '💡', '🎉', '⚡', '🌟', '💯', '🎪']
    };
    
    let html = '';
    for (const cat in categories) {
        html += '<div class="mb-2"><div class="text-xs font-semibold text-gray-600 mb-1">' + cat + '</div><div class="grid grid-cols-8 gap-1">';
        categories[cat].forEach(emoji => {
            html += '<button type="button" class="text-2xl hover:bg-gray-200 rounded p-1 transition" onclick="selectGoalEmoji(\'' + emoji + '\')">' + emoji + '</button>';
        });
        html += '</div></div>';
    }
    container.innerHTML = html;
}

function selectGoalEmoji(emoji) {
    document.getElementById('goal-emoji').value = emoji;
    const display = document.getElementById('selected-goal-emoji');
    display.textContent = emoji;
    display.classList.remove('no-emoji');
    document.getElementById('goal-emoji-picker').classList.add('hidden');
}

function clearGoalEmoji() {
    document.getElementById('goal-emoji').value = '';
    const display = document.getElementById('selected-goal-emoji');
    display.textContent = '';
    display.classList.add('no-emoji');
}

function closeGoalModal() {
    document.getElementById('goal-modal').classList.add('hidden');
    document.getElementById('goal-form').reset();
    editingGoalId = null;
}

// Populate category dropdown
function populateGoalCategories() {
    const select = document.getElementById('goal-category');
    if (!select) return;
    
    // Keep "No category" option
    select.innerHTML = '<option value="">No category</option>';
    
    // Add all categories
    appState.categories
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
}

async function saveGoal(event) {
    event.preventDefault();
    const goalData = {
        name: document.getElementById('goal-name').value.trim(),
        description: document.getElementById('goal-description').value.trim() || null,
        category_id: document.getElementById('goal-category').value || null,
        due_date: document.getElementById('goal-due-date').value || null,
        emoji: document.getElementById('goal-emoji').value || null
    };
    
    try {
        if (editingGoalId) {
            const { error } = await supabaseClient.from('goals').update(goalData).eq('id', editingGoalId);
            if (error) throw error;
            const goalIndex = appState.goals.findIndex(g => g.id === editingGoalId);
            if (goalIndex !== -1) {
                appState.goals[goalIndex] = Object.assign({}, appState.goals[goalIndex], goalData);
            }
            showToast('Goal updated successfully', 'success');
        } else {
            const maxOrder = Math.max(0, ...appState.goals.map(g => g.user_order || 0));
            const { data, error } = await supabaseClient.from('goals').insert([Object.assign({}, goalData, {
                status: 'active',
                user_order: maxOrder + 1,
                created_at: new Date().toISOString()
            })]).select().single();
            if (error) throw error;
            appState.goals.push(data);
            showToast('Goal created successfully', 'success');
        }
        renderGoals();
        closeGoalModal();
    } catch (error) {
        console.error('Error saving goal:', error);
        showToast('Failed to save goal', 'error');
    }
}

async function deleteGoal() {
    if (!editingGoalId) return;
    const taskCounts = getGoalTaskCounts(editingGoalId);
    let confirmMsg = 'Are you sure you want to delete this goal?';
    if (taskCounts.total > 0) {
        confirmMsg = 'This goal has ' + taskCounts.total + ' linked task(s). Deleting the goal will unlink these tasks. Continue?';
    }
    if (!confirm(confirmMsg)) return;
    try {
        const { error } = await supabaseClient.from('goals').delete().eq('id', editingGoalId);
        if (error) throw error;
        appState.goals = appState.goals.filter(g => g.id !== editingGoalId);
        appState.tasks.forEach(task => {
            if (task.goal_id === editingGoalId) task.goal_id = null;
        });
        renderGoals();
        closeGoalModal();
        showToast('Goal deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting goal:', error);
        showToast('Failed to delete goal', 'error');
    }
}

function handleGoalDragStart(event, goalId) {
    draggedGoalId = goalId;
    event.target.style.opacity = '0.5';
    event.dataTransfer.effectAllowed = 'move';
}

function handleGoalDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const targetCard = event.target.closest('.goal-card');
    if (targetCard && targetCard.dataset.goalId !== draggedGoalId) {
        targetCard.style.borderTop = '2px solid #3B82F6';
    }
}

function handleGoalDrop(event, targetGoalId) {
    event.preventDefault();
    const targetCard = event.target.closest('.goal-card');
    if (targetCard) targetCard.style.borderTop = '';
    if (draggedGoalId && draggedGoalId !== targetGoalId) {
        reorderGoals(draggedGoalId, targetGoalId);
    }
}

function handleGoalDragEnd(event) {
    event.target.style.opacity = '1';
    document.querySelectorAll('.goal-card').forEach(card => {
        card.style.borderTop = '';
    });
    draggedGoalId = null;
}

async function reorderGoals(draggedId, targetId) {
    const activeGoals = appState.goals.filter(g => g.status === 'active').sort((a, b) => (a.user_order || 0) - (b.user_order || 0));
    const draggedIndex = activeGoals.findIndex(g => g.id === draggedId);
    const targetIndex = activeGoals.findIndex(g => g.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const draggedGoal = activeGoals.splice(draggedIndex, 1)[0];
    activeGoals.splice(targetIndex, 0, draggedGoal);
    activeGoals.forEach((goal, index) => {
        goal.user_order = index + 1;
    });
    renderGoals();
    try {
        for (let i = 0; i < activeGoals.length; i++) {
            const goal = activeGoals[i];
            const { error } = await supabaseClient.from('goals').update({ user_order: goal.user_order }).eq('id', goal.id);
            if (error) throw error;
        }
    } catch (error) {
        console.error('Error reordering goals:', error);
        showToast('Failed to save new order', 'error');
    }
}
