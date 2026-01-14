// ============================================
// PRODUCTIVITY HUB - DEMO DATA & LOCALSTORAGE ADAPTER
// ============================================

// Initialize demo data in localStorage
function initializeDemoData() {
    const demoData = generateDemoData();
    
    localStorage.setItem('demo_categories', JSON.stringify(demoData.categories));
    localStorage.setItem('demo_habits', JSON.stringify(demoData.habits));
    localStorage.setItem('demo_tasks', JSON.stringify(demoData.tasks));
    localStorage.setItem('demo_goals', JSON.stringify(demoData.goals));
    localStorage.setItem('demo_habit_completions', JSON.stringify(demoData.habitCompletions));
    localStorage.setItem('demo_habit_streaks', JSON.stringify(demoData.habitStreaks));
    
    console.log('✅ Demo data initialized');
}

// Check if demo data exists, if not initialize
function ensureDemoData() {
    if (!localStorage.getItem('demo_categories')) {
        initializeDemoData();
    }
}

// Reset demo data to original state
function resetDemoData() {
    localStorage.clear();
    initializeDemoData();
    window.location.reload();
}

// Generate comprehensive demo data
function generateDemoData() {
    const now = new Date();
    
    // Categories with diverse colors
    const categories = [
        { id: 'cat-1', name: 'Work', color_hex: '#3B82F6', display_order: 0 },
        { id: 'cat-2', name: 'Personal', color_hex: '#10B981', display_order: 1 },
        { id: 'cat-3', name: 'Health', color_hex: '#EF4444', display_order: 2 },
        { id: 'cat-4', name: 'Finance', color_hex: '#F59E0B', display_order: 3 },
        { id: 'cat-5', name: 'Learning', color_hex: '#8B5CF6', display_order: 4 },
        { id: 'cat-6', name: 'Family', color_hex: '#EC4899', display_order: 5 },
        { id: 'cat-7', name: 'Travel', color_hex: '#06B6D4', display_order: 6 },
        { id: 'cat-8', name: 'Hobbies', color_hex: '#84CC16', display_order: 7 },
        { id: 'cat-9', name: 'Home', color_hex: '#F97316', display_order: 8 },
        { id: 'cat-10', name: 'Social', color_hex: '#6366F1', display_order: 9 }
    ];
    
    // Habits with variety
    const habits = [
        { id: 'hab-1', name: 'Morning Exercise', emoji: '🏃', frequency: 'daily', exempt_weekends: false, user_order: 0, archived: false, created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-2', name: 'Drink Water', emoji: '💧', frequency: 'daily', exempt_weekends: false, user_order: 1, archived: false, created_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-3', name: 'Read 30 minutes', emoji: '📚', frequency: 'daily', exempt_weekends: false, user_order: 2, archived: false, created_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-4', name: 'Meditate', emoji: '🧘', frequency: 'daily', exempt_weekends: true, user_order: 3, archived: false, created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-5', name: 'Journal', emoji: '✍️', frequency: 'daily', exempt_weekends: true, user_order: 4, archived: false, created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-6', name: 'Practice Guitar', emoji: '🎸', frequency: 'weekly', weekly_target_days: 3, exempt_weekends: false, user_order: 5, archived: false, created_at: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-7', name: 'Meal Prep', emoji: '🥗', frequency: 'weekly', weekly_target_days: 2, exempt_weekends: false, user_order: 6, archived: false, created_at: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-8', name: 'Learn Spanish', emoji: '🇪🇸', frequency: 'daily', exempt_weekends: true, user_order: 7, archived: false, created_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'hab-9', name: 'Stretch', emoji: '🤸', frequency: 'daily', exempt_weekends: false, user_order: 8, archived: false, created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() }
    ];
    
    // Generate habit completions for the last 30 days
    const habitCompletions = [];
    const habitStreaks = [];
    
    habits.forEach(habit => {
        let streakCount = 0;
        let lastCompleted = true;
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            // Skip weekends for exempt habits
            if (habit.exempt_weekends && isWeekend) continue;
            
            // Vary completion rates by habit
            let completionChance = 0.7; // Default 70%
            if (habit.id === 'hab-1') completionChance = 0.9; // Morning exercise - high
            if (habit.id === 'hab-2') completionChance = 0.95; // Water - very high
            if (habit.id === 'hab-8') completionChance = 0.6; // Spanish - medium
            
            const shouldComplete = Math.random() < completionChance;
            
            if (shouldComplete) {
                habitCompletions.push({
                    id: `comp-${habit.id}-${i}`,
                    habit_id: habit.id,
                    completion_date: dateStr,
                    logged_at: date.toISOString()
                });
                
                if (i === 0 || lastCompleted) streakCount++;
                lastCompleted = true;
            } else {
                lastCompleted = false;
            }
        }
        
        habitStreaks.push({
            habit_id: habit.id,
            current_streak: streakCount
        });
    });
    
    // Goals with different progress levels
    const goals = [
        { id: 'goal-1', name: 'Complete Q1 Report', emoji: '📊', description: 'Finish quarterly analysis', type: 'career', target_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-2', name: 'Run Marathon', emoji: '🏃', description: '26.2 miles race prep', type: 'health', target_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-3', name: 'Learn Python', emoji: '🐍', description: 'Complete online course', type: 'personal', target_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-4', name: 'Save $5000', emoji: '💰', description: 'Emergency fund', type: 'finance', target_date: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-5', name: 'Read 12 Books', emoji: '📚', description: 'One book per month', type: 'personal', target_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-6', name: 'Home Renovation', emoji: '🏠', description: 'Kitchen remodel', type: 'home', target_date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-7', name: 'Visit Japan', emoji: '✈️', description: 'Two week trip', type: 'travel', target_date: new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-8', name: 'Launch Side Project', emoji: '🚀', description: 'New app release', type: 'career', target_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-9', name: 'Lose 15 lbs', emoji: '⚖️', description: 'Health goal', type: 'health', target_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false },
        { id: 'goal-10', name: 'Master Guitar', emoji: '🎸', description: 'Play 20 songs', type: 'hobby', target_date: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'active', is_archived: false }
    ];
    
    // Tasks with variety (overdue, upcoming, completed)
    const tasks = [
        // Overdue tasks
        { id: 'task-1', title: 'Submit tax documents', notes: 'Gather W2 and 1099 forms', category_id: 'cat-4', goal_id: null, due_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-2', title: 'Call dentist', notes: 'Schedule cleaning', category_id: 'cat-3', goal_id: null, due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-3', title: 'Respond to client email', notes: 'About project timeline', category_id: 'cat-1', goal_id: 'goal-1', due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString() },
        
        // Today's tasks
        { id: 'task-4', title: 'Grocery shopping', notes: 'Milk, eggs, bread, vegetables', category_id: 'cat-2', goal_id: null, due_date: now.toISOString().split('T')[0], is_completed: false, is_recurring: true, recurrence_type: 'weekly', recurrence_interval: 1, status: 'active', created_at: now.toISOString() },
        { id: 'task-5', title: 'Review Q1 data', notes: 'Prepare charts and summary', category_id: 'cat-1', goal_id: 'goal-1', due_date: now.toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        
        // Tomorrow
        { id: 'task-6', title: 'Team standup meeting', notes: '9 AM daily sync', category_id: 'cat-1', goal_id: null, due_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: true, recurrence_type: 'daily', recurrence_interval: 1, status: 'active', created_at: now.toISOString() },
        { id: 'task-7', title: 'Python tutorial chapter 3', notes: 'Functions and loops', category_id: 'cat-5', goal_id: 'goal-3', due_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        
        // This week
        { id: 'task-8', title: 'Gym session', notes: 'Leg day workout', category_id: 'cat-3', goal_id: 'goal-2', due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: true, recurrence_type: 'weekly', recurrence_interval: 1, status: 'active', created_at: now.toISOString() },
        { id: 'task-9', title: 'Book flight to Japan', notes: 'Check dates and prices', category_id: 'cat-7', goal_id: 'goal-7', due_date: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        { id: 'task-10', title: 'Update portfolio website', notes: 'Add recent projects', category_id: 'cat-1', goal_id: 'goal-8', due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        { id: 'task-11', title: 'Meal prep Sunday', notes: 'Chicken, rice, veggies', category_id: 'cat-3', goal_id: null, due_date: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: true, recurrence_type: 'weekly', recurrence_interval: 1, status: 'active', created_at: now.toISOString() },
        
        // Later this month
        { id: 'task-12', title: 'Research kitchen contractors', notes: 'Get 3 quotes', category_id: 'cat-9', goal_id: 'goal-6', due_date: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        { id: 'task-13', title: 'Birthday gift for mom', notes: 'Check her wishlist', category_id: 'cat-6', goal_id: null, due_date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        { id: 'task-14', title: 'Car insurance renewal', notes: 'Compare rates', category_id: 'cat-4', goal_id: null, due_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        { id: 'task-15', title: 'Finish reading "Atomic Habits"', notes: 'Chapter 10-15', category_id: 'cat-5', goal_id: 'goal-5', due_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: false, is_recurring: false, status: 'active', created_at: now.toISOString() },
        
        // Completed tasks
        { id: 'task-16', title: 'Morning workout', notes: '30 min cardio', category_id: 'cat-3', goal_id: 'goal-2', due_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-17', title: 'Water plants', notes: '', category_id: 'cat-9', goal_id: null, due_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-18', title: 'Python tutorial chapter 2', notes: 'Variables and data types', category_id: 'cat-5', goal_id: 'goal-3', due_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-19', title: 'Weekly budget review', notes: 'Track expenses', category_id: 'cat-4', goal_id: 'goal-4', due_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: true, recurrence_type: 'weekly', recurrence_interval: 1, status: 'active', created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-20', title: 'Organize desk', notes: 'Clean and declutter', category_id: 'cat-9', goal_id: null, due_date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-21', title: 'Coffee with Sarah', notes: 'Catch up', category_id: 'cat-10', goal_id: null, due_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-22', title: 'Read "The Lean Startup"', notes: 'Finished!', category_id: 'cat-5', goal_id: 'goal-5', due_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-23', title: 'Guitar practice', notes: 'Learned new chord', category_id: 'cat-8', goal_id: 'goal-10', due_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-24', title: 'Submit expense report', notes: 'Monthly expenses', category_id: 'cat-1', goal_id: null, due_date: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: true, recurrence_type: 'monthly', recurrence_interval: 1, status: 'active', created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString() },
        { id: 'task-25', title: 'Long run 10 miles', notes: 'Marathon training', category_id: 'cat-3', goal_id: 'goal-2', due_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_completed: true, completed_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), is_recurring: false, status: 'active', created_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString() }
    ];
    
    // Add category objects to tasks
    tasks.forEach(task => {
        if (task.category_id) {
            task.category = categories.find(c => c.id === task.category_id);
        }
        if (task.goal_id) {
            task.goal = goals.find(g => g.id === task.goal_id);
        }
    });
    
    return {
        categories,
        habits,
        tasks,
        goals,
        habitCompletions,
        habitStreaks
    };
}

// ============================================
// LOCALSTORAGE ADAPTER - Mimics Supabase API
// ============================================

// ============================================
// LOCALSTORAGE ADAPTER - Mimics Supabase API with Full Chaining
// ============================================

const demoSupabase = {
    from: function(table) {
        // Create a query builder that supports full chaining
        const queryBuilder = {
            _table: table,
            _columns: '*',
            _filters: [],
            _orderColumn: null,
            _orderOptions: {},
            _limitCount: null,
            
            select: function(columns = '*') {
                this._columns = columns;
                return this;
            },
            
            eq: function(column, value) {
                this._filters.push({ column, operator: '=', value });
                return this;
            },
            
            order: function(column, options = {}) {
                this._orderColumn = column;
                this._orderOptions = options;
                return this;
            },
            
            limit: function(count) {
                this._limitCount = count;
                return this;
            },
            
            single: async function() {
                const result = await this._execute();
                if (result.data && result.data.length > 0) {
                    return { data: result.data[0], error: null };
                }
                return { data: null, error: { message: 'No rows found' } };
            },
            
            then: function(callback) {
                return this._execute().then(callback);
            },
            
            _execute: async function() {
                ensureDemoData();
                let data = JSON.parse(localStorage.getItem(`demo_${this._table}`) || '[]');
                
                // Apply filters
                this._filters.forEach(filter => {
                    if (filter.operator === '=') {
                        data = data.filter(row => row[filter.column] === filter.value);
                    }
                });
                
                // Apply ordering
                if (this._orderColumn) {
                    const column = this._orderColumn;
                    const nullsFirst = this._orderOptions.nullsFirst !== false;
                    
                    data.sort((a, b) => {
                        const aVal = a[column];
                        const bVal = b[column];
                        
                        // Handle nulls
                        if (aVal === null || aVal === undefined) return nullsFirst ? -1 : 1;
                        if (bVal === null || bVal === undefined) return nullsFirst ? 1 : -1;
                        
                        // Compare values
                        if (aVal < bVal) return -1;
                        if (aVal > bVal) return 1;
                        return 0;
                    });
                }
                
                // Apply limit
                if (this._limitCount) {
                    data = data.slice(0, this._limitCount);
                }
                
                return { data, error: null };
            }
        };
        
        return queryBuilder;
    },
    
    insert: function(table) {
        return {
            _table: table,
            _records: null,
            
            records: function(records) {
                this._records = records;
                return this;
            },
            
            select: function() {
                return this;
            },
            
            single: async function() {
                ensureDemoData();
                const data = JSON.parse(localStorage.getItem(`demo_${this._table}`) || '[]');
                const record = Array.isArray(this._records) ? this._records[0] : this._records;
                
                // Generate ID if not provided
                if (!record.id) {
                    record.id = `${this._table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
                
                data.push(record);
                localStorage.setItem(`demo_${this._table}`, JSON.stringify(data));
                
                return { data: record, error: null };
            }
        };
    }
};

// Wrap from() to support both syntaxes
demoSupabase.from = function(table) {
    return {
        select: function(columns = '*') {
            const queryBuilder = {
                _table: table,
                _columns: columns,
                _filters: [],
                _orderColumn: null,
                _orderOptions: {},
                _limitCount: null,
                
                eq: function(column, value) {
                    this._filters.push({ column, operator: '=', value });
                    return this;
                },
                
                order: function(column, options = {}) {
                    this._orderColumn = column;
                    this._orderOptions = options;
                    return this;
                },
                
                limit: function(count) {
                    this._limitCount = count;
                    return this;
                },
                
                single: async function() {
                    const result = await this._execute();
                    if (result.data && result.data.length > 0) {
                        return { data: result.data[0], error: null };
                    }
                    return { data: null, error: { message: 'No rows found' } };
                },
                
                then: function(callback) {
                    return this._execute().then(callback);
                },
                
                _execute: async function() {
                    ensureDemoData();
                    let data = JSON.parse(localStorage.getItem(`demo_${this._table}`) || '[]');
                    
                    // Apply filters
                    this._filters.forEach(filter => {
                        if (filter.operator === '=') {
                            data = data.filter(row => row[filter.column] === filter.value);
                        }
                    });
                    
                    // Apply ordering
                    if (this._orderColumn) {
                        const column = this._orderColumn;
                        const nullsFirst = this._orderOptions.nullsFirst !== false;
                        
                        data.sort((a, b) => {
                            const aVal = a[column];
                            const bVal = b[column];
                            
                            // Handle nulls
                            if (aVal === null || aVal === undefined) return nullsFirst ? -1 : 1;
                            if (bVal === null || bVal === undefined) return nullsFirst ? 1 : -1;
                            
                            // Compare values
                            if (aVal < bVal) return -1;
                            if (aVal > bVal) return 1;
                            return 0;
                        });
                    }
                    
                    // Apply limit
                    if (this._limitCount) {
                        data = data.slice(0, this._limitCount);
                    }
                    
                    return { data, error: null };
                }
            };
            
            return queryBuilder;
        },
        
        insert: function(records) {
            return {
                select: function() {
                    return this;
                },
                single: async function() {
                    ensureDemoData();
                    const data = JSON.parse(localStorage.getItem(`demo_${table}`) || '[]');
                    const record = Array.isArray(records) ? records[0] : records;
                    
                    // Generate ID if not provided
                    if (!record.id) {
                        record.id = `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    }
                    
                    data.push(record);
                    localStorage.setItem(`demo_${table}`, JSON.stringify(data));
                    
                    return { data: record, error: null };
                }
            };
        },
        
        update: function(updates) {
            return {
                eq: async function(column, value) {
                    ensureDemoData();
                    const data = JSON.parse(localStorage.getItem(`demo_${table}`) || '[]');
                    const index = data.findIndex(row => row[column] === value);
                    
                    if (index !== -1) {
                        data[index] = { ...data[index], ...updates };
                        localStorage.setItem(`demo_${table}`, JSON.stringify(data));
                        return { data: data[index], error: null };
                    }
                    
                    return { data: null, error: { message: 'No rows found' } };
                }
            };
        },
        
        delete: function() {
            return {
                eq: async function(column, value) {
                    ensureDemoData();
                    let data = JSON.parse(localStorage.getItem(`demo_${table}`) || '[]');
                    data = data.filter(row => row[column] !== value);
                    localStorage.setItem(`demo_${table}`, JSON.stringify(data));
                    
                    return { data: null, error: null };
                }
            };
        }
    };
};

// Make demo supabase available globally
if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE) {
    window.supabaseClient = demoSupabase;
    console.log('✅ Demo supabaseClient set on window:', typeof window.supabaseClient);
    console.log('   - from() method available?', typeof window.supabaseClient.from === 'function');
} else {
    console.warn('⚠️ DEMO_MODE not enabled, skipping demo supabase setup');
}
