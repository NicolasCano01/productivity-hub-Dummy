// ============================================
// PRODUCTIVITY HUB - SUPABASE DATABASE
// ============================================

// Initialize Supabase Client
async function initializeSupabase() {
    // Skip Supabase initialization if in demo mode
    if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE) {
    console.log('🎮 Demo mode enabled - skipping Supabase connection');
    supabaseClient = window.supabaseClient;  // <-- ADD THIS LINE
    updateConnectionStatus(true);
    return true;
    }
    
    try {
        console.log('🔌 Connecting to Supabase...');
        
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Test connection
        const { data, error } = await supabaseClient
            .from('categories')
            .select('count')
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Supabase connected successfully');
        updateConnectionStatus(true);
        
        return true;
    } catch (error) {
        console.error('❌ Supabase connection failed:', error);
        updateConnectionStatus(false, error.message);
        return false;
    }
}

// Fetch all initial data
async function fetchInitialData() {
    try {
        console.log('📥 Fetching initial data...');
        
        // Fetch categories
        const { data: categories, error: catError } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order', { nullsFirst: false });
        
        if (catError) throw catError;
        appState.categories = categories;
        console.log(`✅ Loaded ${categories.length} categories`);
        
        // Fetch habits
        const { data: habits, error: habitError } = await supabaseClient
            .from('habits')
            .select('*')
            .eq('archived', false)
            .order('user_order');
        
        if (habitError) throw habitError;
        appState.habits = habits;
        console.log(`✅ Loaded ${habits.length} habits`);
        
        // Fetch habit streaks
        const { data: streaks, error: streakError } = await supabaseClient
            .from('habit_streaks')
            .select('*');
        
        if (streakError) throw streakError;
        appState.habitStreaks = streaks;
        console.log(`✅ Loaded ${streaks.length} habit streaks`);
        
        // Fetch tasks
        const { data: tasks, error: taskError } = await supabaseClient
            .from('tasks')
            .select(`
                *,
                category:categories(id, name, color_hex),
                goal:goals(id, name)
            `)
            .eq('status', 'active')
            .order('due_date', { nullsFirst: false });
        
        if (taskError) throw taskError;
        appState.tasks = tasks;
        console.log(`✅ Loaded ${tasks.length} tasks`);
        
        // Fetch goals
        const { data: goals, error: goalError } = await supabaseClient
            .from('goals')
            .select('*')
            .eq('status', 'active')
            .order('due_date', { nullsFirst: false });
        
        if (goalError) throw goalError;
        appState.goals = goals;
        console.log(`✅ Loaded ${goals.length} goals`);
        
        // Fetch today's habit completions
        const today = new Date().toISOString().split('T')[0];
        const { data: completions, error: compError } = await supabaseClient
            .from('habit_completions')
            .select('*')
            .eq('completion_date', today);
        
        if (compError) throw compError;
        appState.habitCompletions = completions;
        console.log(`✅ Loaded ${completions.length} habit completions for today`);
        
        // Populate filter dropdowns
        populateFilterDropdowns();
        
        appState.isLoading = false;
        
        return true;
    } catch (error) {
        console.error('❌ Error fetching initial data:', error);
        appState.error = error.message;
        showToast('Failed to load data', 'error');
        return false;
    }
}
