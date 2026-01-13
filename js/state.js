// ============================================
// PRODUCTIVITY HUB - STATE MANAGEMENT
// ============================================

// Global Supabase Client
let supabaseClient = null;

// Current Panel State
let currentPanel = 'habits';
let currentTaskView = 'all'; // 'all', 'overdue', 'upcoming'

// Modal State
let editingHabitId = null;
let editingTaskId = null;
let editingGoalId = null;
let editingCategoryId = null; 

// Application State
const appState = {
    categories: [],
    habits: [],
    tasks: [],
    goals: [],
    habitCompletions: [],
    habitStreaks: [],
    isLoading: true,
    error: null
};
