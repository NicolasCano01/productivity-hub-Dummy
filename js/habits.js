// ============================================
// PRODUCTIVITY HUB - HABITS PANEL
// ============================================

// Get habit streak from state
function getHabitStreak(habitId) {
    const streak = appState.habitStreaks.find(s => s.habit_id === habitId);
    return streak ? streak.current_streak : 0;
}

// Check if habit is completed today
function isHabitCompletedToday(habitId) {
    return appState.habitCompletions.some(c => c.habit_id === habitId);
}

// Get streak badge CSS class based on streak count
function getStreakBadgeClass(streak) {
    if (streak >= 7) return 'hot';
    if (streak >= 3) return 'warm';
    return 'cold';
}

// Render habits list
function renderHabits() {
    const habitsList = document.getElementById('habits-list');
    
    if (appState.habits.length === 0) {
        habitsList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-list-check text-4xl mb-2"></i>
                <p>No habits yet. Tap + to create your first habit!</p>
            </div>
        `;
        return;
    }
    
    habitsList.innerHTML = appState.habits.map(habit => {
        const streak = getHabitStreak(habit.id);
        const isCompleted = isHabitCompletedToday(habit.id);
        const streakClass = getStreakBadgeClass(streak);
        const emoji = habit.emoji || '';
        
        let frequencyText = '';
        if (habit.frequency === 'daily') {
            frequencyText = 'Daily';
        } else if (habit.frequency === 'weekly') {
            frequencyText = `${habit.weekly_target_days || 3}x/week`;
        }
        
        if (habit.exempt_weekends) {
            frequencyText += ' • No weekends';
        }
        
        return `
            <div 
                class="habit-card" 
                draggable="true"
                data-habit-id="${habit.id}"
                ondragstart="handleDragStart(event, '${habit.id}')"
                ondragend="handleDragEnd(event)"
                ondragover="handleDragOver(event)"
                ondrop="handleDrop(event, '${habit.id}')"
                ondragleave="handleDragLeave(event)"
            >
                <div class="flex items-center gap-3">
                    <i class="fas fa-grip-vertical text-gray-400 text-sm cursor-move"></i>
                    ${emoji ? `<div class="text-2xl">${emoji}</div>` : ''}
                    <div 
                        class="habit-checkbox ${isCompleted ? 'checked' : ''}"
                        onclick="toggleHabitCompletion('${habit.id}')"
                    ></div>
                    <div class="flex-1 min-w-0" onclick="openEditHabitModal('${habit.id}')">
                        <h3 class="font-semibold text-gray-800 text-sm ${isCompleted ? 'line-through text-gray-400' : ''} truncate">
                            ${habit.name}
                        </h3>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-xs text-gray-500">
                                ${frequencyText}
                            </span>
                        </div>
                    </div>
                    ${streak > 0 ? `
                        <div class="streak-badge ${streakClass}">
                            <i class="fas fa-fire"></i>
                            <span>${streak}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Toggle habit completion
async function toggleHabitCompletion(habitId) {
    const isCompleted = isHabitCompletedToday(habitId);
    const today = new Date().toISOString().split('T')[0];
    
    try {
        if (isCompleted) {
            const { error } = await supabaseClient
                .from('habit_completions')
                .delete()
                .eq('habit_id', habitId)
                .eq('completion_date', today);
            
            if (error) throw error;
            
            appState.habitCompletions = appState.habitCompletions.filter(
                c => !(c.habit_id === habitId && c.completion_date === today)
            );
            
            await refreshHabitStreaks();
            renderHabits();
        } else {
            const { error } = await supabaseClient
                .from('habit_completions')
                .insert({
                    habit_id: habitId,
                    completion_date: today
                });
            
            if (error) throw error;
            
            appState.habitCompletions.push({
                habit_id: habitId,
                completion_date: today,
                logged_at: new Date().toISOString()
            });
            
            await refreshHabitStreaks();
            renderHabits();
            showToast('✨ Habit completed!', 'success');
        }
    } catch (error) {
        console.error('Error toggling habit completion:', error);
        showToast('Failed to update habit', 'error');
    }
}

// Refresh habit streaks from database
async function refreshHabitStreaks() {
    try {
        const { data: streaks, error } = await supabaseClient
            .from('habit_streaks')
            .select('*');
        
        if (error) throw error;
        appState.habitStreaks = streaks;
    } catch (error) {
        console.error('Error refreshing streaks:', error);
    }
}

// ============================================
// DRAG AND DROP FUNCTIONS
// ============================================

function handleDragStart(event, habitId) {
    draggedHabitId = habitId;
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.habit-card').forEach(card => {
        card.classList.remove('drag-over');
    });
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const draggedCard = document.querySelector('.dragging');
    const currentCard = event.currentTarget;
    
    if (draggedCard && currentCard !== draggedCard) {
        currentCard.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

async function handleDrop(event, targetHabitId) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    if (!draggedHabitId || draggedHabitId === targetHabitId) {
        return;
    }
    
    const draggedIndex = appState.habits.findIndex(h => h.id === draggedHabitId);
    const targetIndex = appState.habits.findIndex(h => h.id === targetHabitId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Optimistic update
    const draggedHabit = appState.habits[draggedIndex];
    appState.habits.splice(draggedIndex, 1);
    appState.habits.splice(targetIndex, 0, draggedHabit);
    
    renderHabits();
    showToast('Reordering...', 'success');
    
    // Background database update
    try {
        const updates = appState.habits.map((habit, index) => ({
            id: habit.id,
            user_order: index + 1
        }));
        
        for (const update of updates) {
            await supabaseClient
                .from('habits')
                .update({ user_order: update.user_order })
                .eq('id', update.id);
        }
        
        console.log('✅ Order saved to database');
        
    } catch (error) {
        console.error('Error reordering habits:', error);
        showToast('Failed to save order', 'error');
        await fetchInitialData();
        renderHabits();
    }
    
    draggedHabitId = null;
}

// ============================================
// EMOJI PICKER FUNCTIONS
// ============================================

function populateEmojiPicker() {
    const emojiContainer = document.getElementById('emoji-categories');
    
    let html = '';
    for (const [category, emojis] of Object.entries(EMOJI_CATEGORIES)) {
        html += `
            <div class="emoji-category">
                <div class="emoji-category-title">${category}</div>
                <div class="emoji-grid">
                    ${emojis.map(emoji => `
                        <div class="emoji-option" onclick="selectEmoji('${emoji}')" title="${emoji}">
                            ${emoji}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    emojiContainer.innerHTML = html;
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emoji-picker');
    picker.classList.toggle('hidden');
}

function selectEmoji(emoji) {
    const selectedEl = document.getElementById('selected-emoji');
    selectedEl.textContent = emoji;
    selectedEl.classList.remove('no-emoji');
    document.getElementById('habit-emoji').value = emoji;
    document.getElementById('emoji-picker').classList.add('hidden');
}

function clearEmoji() {
    const selectedEl = document.getElementById('selected-emoji');
    selectedEl.textContent = '';
    selectedEl.classList.add('no-emoji');
    document.getElementById('habit-emoji').value = '';
    document.getElementById('emoji-picker').classList.add('hidden');
}

// ============================================
// HABIT MODAL FUNCTIONS
// ============================================

function openHabitModal() {
    editingHabitId = null;
    document.getElementById('habit-modal-title').textContent = 'Add Habit';
    document.getElementById('habit-form').reset();
    document.getElementById('delete-habit-btn').classList.add('hidden');
    document.getElementById('weekly-target-container').style.display = 'none';
    document.getElementById('emoji-picker').classList.add('hidden');
    clearEmoji();
    populateEmojiPicker();
    document.getElementById('habit-modal').classList.remove('hidden');
}

function openEditHabitModal(habitId) {
    editingHabitId = habitId;
    const habit = appState.habits.find(h => h.id === habitId);
    
    if (!habit) return;
    
    document.getElementById('habit-modal-title').textContent = 'Edit Habit';
    document.getElementById('habit-name').value = habit.name;
    document.getElementById('habit-frequency').value = habit.frequency;
    document.getElementById('habit-exempt-weekends').checked = habit.exempt_weekends;
    
    const emoji = habit.emoji || '';
    const selectedEl = document.getElementById('selected-emoji');
    if (emoji) {
        selectedEl.textContent = emoji;
        selectedEl.classList.remove('no-emoji');
    } else {
        selectedEl.textContent = '';
        selectedEl.classList.add('no-emoji');
    }
    document.getElementById('habit-emoji').value = emoji;
    
    if (habit.frequency === 'weekly') {
        document.getElementById('weekly-target-container').style.display = 'block';
        document.getElementById('habit-weekly-target').value = habit.weekly_target_days || 3;
    } else {
        document.getElementById('weekly-target-container').style.display = 'none';
    }
    
    document.getElementById('delete-habit-btn').classList.remove('hidden');
    document.getElementById('emoji-picker').classList.add('hidden');
    populateEmojiPicker();
    document.getElementById('habit-modal').classList.remove('hidden');
}

function closeHabitModal() {
    document.getElementById('habit-modal').classList.add('hidden');
    document.getElementById('emoji-picker').classList.add('hidden');
    editingHabitId = null;
}

async function saveHabit(event) {
    event.preventDefault();
    
    const name = document.getElementById('habit-name').value.trim();
    const frequency = document.getElementById('habit-frequency').value;
    const exemptWeekends = document.getElementById('habit-exempt-weekends').checked;
    const weeklyTarget = frequency === 'weekly' ? 
        parseInt(document.getElementById('habit-weekly-target').value) : null;
    const emoji = document.getElementById('habit-emoji').value || null;
    
    try {
        if (editingHabitId) {
            const { error } = await supabaseClient
                .from('habits')
                .update({
                    name,
                    frequency,
                    exempt_weekends: exemptWeekends,
                    weekly_target_days: weeklyTarget,
                    emoji
                })
                .eq('id', editingHabitId);
            
            if (error) throw error;
            
            const habitIndex = appState.habits.findIndex(h => h.id === editingHabitId);
            if (habitIndex !== -1) {
                appState.habits[habitIndex] = {
                    ...appState.habits[habitIndex],
                    name,
                    frequency,
                    exempt_weekends: exemptWeekends,
                    weekly_target_days: weeklyTarget,
                    emoji
                };
            }
            
            showToast('Habit updated!', 'success');
        } else {
            const maxOrder = Math.max(0, ...appState.habits.map(h => h.user_order || 0));
            
            const { data, error } = await supabaseClient
                .from('habits')
                .insert({
                    name,
                    frequency,
                    exempt_weekends: exemptWeekends,
                    weekly_target_days: weeklyTarget,
                    emoji,
                    current_streak: 0,
                    user_order: maxOrder + 1,
                    archived: false
                })
                .select()
                .single();
            
            if (error) throw error;
            
            appState.habits.push(data);
            
            showToast('Habit created!', 'success');
        }
        
        renderHabits();
        closeHabitModal();
    } catch (error) {
        console.error('Error saving habit:', error);
        showToast('Failed to save habit', 'error');
    }
}

async function deleteHabit() {
    if (!editingHabitId) return;
    
    if (!confirm('Are you sure you want to delete this habit? This will also delete all completion history.')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('habits')
            .update({ archived: true })
            .eq('id', editingHabitId);
        
        if (error) throw error;
        
        appState.habits = appState.habits.filter(h => h.id !== editingHabitId);
        
        renderHabits();
        closeHabitModal();
        showToast('Habit deleted', 'success');
    } catch (error) {
        console.error('Error deleting habit:', error);
        showToast('Failed to delete habit', 'error');
    }
}
