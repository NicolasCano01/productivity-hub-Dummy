// ============================================
// PRODUCTIVITY HUB - MAIN APP INITIALIZATION
// ============================================

// Main app initialization function
async function initApp() {
    console.log('🚀 Initializing Productivity Hub...');
    
    // Step 1: Initialize Supabase
    const supabaseReady = await initializeSupabase();
    if (!supabaseReady) {
        hideLoadingScreen();
        document.getElementById('habits-panel').innerHTML = `
            <div class="text-center text-danger py-8">
                <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                <p class="font-bold">Failed to connect to database</p>
                <p class="text-sm mt-2">Please check your internet connection</p>
                <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg">
                    Retry
                </button>
            </div>
        `;
        return;
    }
    
    // Step 2: Fetch initial data
    const dataLoaded = await fetchInitialData();
    if (!dataLoaded) {
        hideLoadingScreen();
        document.getElementById('habits-panel').innerHTML = `
            <div class="text-center text-danger py-8">
                <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                <p class="font-bold">Failed to load data</p>
                <p class="text-sm mt-2">${appState.error || 'Unknown error'}</p>
                <button onclick="location.reload()" class="mt-4 px-6 py-2 bg-primary text-white rounded-lg">
                    Retry
                </button>
            </div>
        `;
        return;
    }
    
    // Step 3: Render initial views
    renderHabits();
    renderTasks();
    renderGoals();
    
    // Step 4: Hide loading screen and show first panel
    hideLoadingScreen();
    
    // Step 5: Show success message
    showToast('✨ All data loaded successfully!', 'success');
    
    console.log('✅ App initialization complete!');
    console.log('📊 App State:', appState);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Habit frequency change listener
    const frequencySelect = document.getElementById('habit-frequency');
    if (frequencySelect) {
        frequencySelect.addEventListener('change', (e) => {
            const weeklyTargetContainer = document.getElementById('weekly-target-container');
            if (e.target.value === 'weekly') {
                weeklyTargetContainer.style.display = 'block';
            } else {
                weeklyTargetContainer.style.display = 'none';
            }
        });
    }
});

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
