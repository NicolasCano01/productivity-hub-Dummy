// ============================================
// PRODUCTIVITY HUB - CATEGORY MANAGEMENT
// ============================================


// Available colors for categories
const CATEGORY_COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#10B981',
    '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#64748B'
];

let selectedColor = CATEGORY_COLORS[0];
let draggedCategoryId = null;

// NOTE: Categories should be fetched from database ordered by display_order
// Ensure supabase.js fetches with: .order('display_order', { nullsFirst: false })

// Open category management modal
function openCategoryModal() {
    const modal = document.getElementById('category-modal');
    modal.classList.remove('hidden');
    
    // Reset form
    editingCategoryId = null;
    document.getElementById('category-form').reset();
    selectedColor = CATEGORY_COLORS[0];
    
    // Render color picker
    renderColorPicker();
    
    // Render category list
    renderCategoryList();
}

// Close category modal
function closeCategoryModal() {
    document.getElementById('category-modal').classList.add('hidden');
    editingCategoryId = null;
}

// Render color picker circles
function renderColorPicker() {
    const container = document.getElementById('color-picker');
    container.innerHTML = CATEGORY_COLORS.map(color => 
        '<button type="button" class="w-10 h-10 rounded-full border-2 transition-all ' + 
        (color === selectedColor ? 'border-gray-800 scale-110' : 'border-transparent') + 
        '" style="background-color: ' + color + ';" onclick="selectColor(\'' + color + '\')"></button>'
    ).join('');
}

// Select a color
function selectColor(color) {
    selectedColor = color;
    renderColorPicker();
}

// Render list of existing categories with drag-drop
function renderCategoryList() {
    const list = document.getElementById('category-list');
    
    if (appState.categories.length === 0) {
        list.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No categories yet</p>';
        return;
    }
    
    list.innerHTML = appState.categories.map(cat => 
        '<div class="category-item flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition cursor-move" ' +
        'draggable="true" ' +
        'data-category-id="' + cat.id + '" ' +
        'ondragstart="handleCategoryDragStart(event, \'' + cat.id + '\')" ' +
        'ondragend="handleCategoryDragEnd(event)" ' +
        'ondragover="handleCategoryDragOver(event)" ' +
        'ondrop="handleCategoryDrop(event, \'' + cat.id + '\')" ' +
        'ondragleave="handleCategoryDragLeave(event)">' +
        '<div class="flex items-center gap-3">' +
        '<i class="fas fa-grip-vertical text-gray-400 text-sm"></i>' +
        '<div class="w-6 h-6 rounded-full" style="background-color: ' + cat.color_hex + ';"></div>' +
        '<span class="font-medium text-gray-800">' + escapeHtml(cat.name) + '</span>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
        '<button onclick="event.stopPropagation(); editCategory(\'' + cat.id + '\')" class="text-primary hover:text-blue-700 p-1" title="Edit">' +
        '<i class="fas fa-pen text-sm"></i>' +
        '</button>' +
        '<button onclick="event.stopPropagation(); deleteCategory(\'' + cat.id + '\')" class="text-danger hover:text-red-700 p-1" title="Delete">' +
        '<i class="fas fa-trash text-sm"></i>' +
        '</button>' +
        '</div>' +
        '</div>'
    ).join('');
}

// Drag and drop handlers for categories
function handleCategoryDragStart(event, categoryId) {
    draggedCategoryId = categoryId;
    event.currentTarget.style.opacity = '0.4';
    event.dataTransfer.effectAllowed = 'move';
}

function handleCategoryDragEnd(event) {
    event.currentTarget.style.opacity = '1';
    
    // Remove all drag-over classes
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    
    draggedCategoryId = null;
}

function handleCategoryDragOver(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    
    event.dataTransfer.dropEffect = 'move';
    
    const targetElement = event.currentTarget;
    if (targetElement.dataset.categoryId !== draggedCategoryId) {
        targetElement.classList.add('drag-over');
    }
    
    return false;
}

function handleCategoryDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

async function handleCategoryDrop(event, targetCategoryId) {
    if (event.stopPropagation) {
        event.stopPropagation();
    }
    
    event.currentTarget.classList.remove('drag-over');
    
    if (draggedCategoryId === targetCategoryId) {
        return false;
    }
    
    // Find indices
    const draggedIndex = appState.categories.findIndex(c => c.id === draggedCategoryId);
    const targetIndex = appState.categories.findIndex(c => c.id === targetCategoryId);
    
    if (draggedIndex === -1 || targetIndex === -1) return false;
    
    // Reorder in appState
    const draggedCategory = appState.categories[draggedIndex];
    appState.categories.splice(draggedIndex, 1);
    appState.categories.splice(targetIndex, 0, draggedCategory);
    
    // Update display order values
    appState.categories.forEach((category, index) => {
        category.display_order = index;
    });
    
    // Re-render immediately
    renderCategoryList();
    
    // Save to database
    try {
        const updates = appState.categories.map(category => ({
            id: category.id,
            display_order: category.display_order
        }));
        
        for (const update of updates) {
            const { error } = await supabaseClient
                .from('categories')
                .update({ display_order: update.display_order })
                .eq('id', update.id);
            
            if (error) throw error;
        }
        
        console.log('✅ Category order updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating category order:', error);
        showToast('Failed to update category order', 'error');
    }
    
    return false;
}

// Edit existing category
function editCategory(categoryId) {
    const category = appState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    editingCategoryId = categoryId;
    document.getElementById('category-name').value = category.name;
    selectedColor = category.color_hex;
    renderColorPicker();
    
    // Scroll to top
    document.querySelector('#category-modal .modal-content').scrollTop = 0;
}

// Save category (create or update)
async function saveCategory(event) {
    event.preventDefault();
    
    const categoryName = document.getElementById('category-name').value.trim();
    
    if (!categoryName) {
        showToast('Category name is required', 'error');
        return;
    }
    
    try {
        if (editingCategoryId) {
            // Update existing category
            const { error } = await supabaseClient
                .from('categories')
                .update({
                    name: categoryName,
                    color_hex: selectedColor
                })
                .eq('id', editingCategoryId);
            
            if (error) throw error;
            
            // Update in appState
            const categoryIndex = appState.categories.findIndex(c => c.id === editingCategoryId);
            if (categoryIndex !== -1) {
                appState.categories[categoryIndex].name = categoryName;
                appState.categories[categoryIndex].color_hex = selectedColor;
            }
            
            showToast('Category updated!', 'success');
            
        } else {
            // Create new category
            const newCategory = {
                name: categoryName,
                color_hex: selectedColor,
                display_order: appState.categories.length
            };
            
            const { data, error } = await supabaseClient
                .from('categories')
                .insert([newCategory])
                .select()
                .single();
            
            if (error) throw error;
            
            // Add to appState
            appState.categories.push(data);
            
            showToast('Category created!', 'success');
        }
        
        // Reset form
        document.getElementById('category-form').reset();
        selectedColor = CATEGORY_COLORS[0];
        editingCategoryId = null;
        renderColorPicker();
        renderCategoryList();
        
        // Update filter dropdowns
        populateFilterDropdowns();
        
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Failed to save category', 'error');
    }
}

// Delete category
async function deleteCategory(categoryId) {
    const category = appState.categories.find(c => c.id === categoryId);
    if (!category) return;
    
    const confirmed = confirm(`Delete category "${category.name}"?\n\nTasks using this category will have their category removed.`);
    if (!confirmed) return;
    
    try {
        // First, remove category from all tasks
        const { error: updateError } = await supabaseClient
            .from('tasks')
            .update({ category_id: null })
            .eq('category_id', categoryId);
        
        if (updateError) throw updateError;
        
        // Delete category
        const { error: deleteError } = await supabaseClient
            .from('categories')
            .delete()
            .eq('id', categoryId);
        
        if (deleteError) throw deleteError;
        
        // Remove from appState
        appState.categories = appState.categories.filter(c => c.id !== categoryId);
        
        // Update tasks in appState
        appState.tasks.forEach(task => {
            if (task.category_id === categoryId) {
                task.category_id = null;
                task.category = null;
            }
        });
        
        showToast('Category deleted!', 'success');
        renderCategoryList();
        
        // Update filter dropdowns
        populateFilterDropdowns();
        
        // Re-render tasks if on tasks panel
        if (currentPanel === 'tasks') {
            renderTasks();
        }
        
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Failed to delete category', 'error');
    }
}
