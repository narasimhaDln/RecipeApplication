// Config
const API_BASE = 'http://localhost:5000/api';

// State
let authToken = localStorage.getItem('token') || '';
let selectedRecipeIds = new Set();
let ingredientsState = [];
let currentWeek = new Date();
let collections = [];
let searchTimeout = null;
let favoriteRecipes = new Set(); // Track favorited recipes

// Utilities
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function setAuth(token) {
  authToken = token || '';
  if (token) {
    localStorage.setItem('token', token);
    $('#logoutBtn').style.display = 'inline-flex';
  } else {
    localStorage.removeItem('token');
    $('#logoutBtn').style.display = 'none';
  }
}

function headers(isJson = true) {
  const h = {};
  if (isJson) h['Content-Type'] = 'application/json';
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: headers(false) });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    if (res.status === 401) {
      // Token expired or invalid, clear auth and redirect to login
      setAuth('');
      showView('authView');
      throw new Error('Please login again');
    }
    if (res.status === 403) {
      // Forbidden - token issue
      setAuth('');
      showView('authView');
      throw new Error('Authentication failed. Please login again.');
    }
    throw new Error(errorData.error || res.statusText);
  }
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
    headers: headers(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: headers(true),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: headers(false),
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

function toast(msg, type = 'info') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove('hidden');
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.add('hidden'), 2500);
}

function showView(id) {
  $$('.view').forEach((v) => v.classList.remove('active'));
  $(`#${id}`).classList.add('active');
  $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === id));
  
  // Add loading state for views that need data, targeting inner containers (not replacing whole section)
  const loadingTargets = {
    favoritesView: '#favorites',
    recentView: '#recent',
    recsView: '#recs',
    plannerView: '#planner',
    shoppingView: '#shopping',
    profileView: '#profileForm',
    dashboardView: '.dashboard-grid',
  };
  if (authToken && loadingTargets[id]) {
    const target = $(loadingTargets[id]);
    if (target) target.innerHTML = '<div class="loading" style="margin: 40px auto; display: block;"></div>';
  }
}

function requireAuth() {
  if (!authToken) {
    showView('authView');
    return false;
  }
  return true;
}

// Debounced search
function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(searchTimeout);
      func(...args);
    };
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(later, wait);
  };
}

// Date utilities
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getWeekDates(date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Auth UI
function initAuthUI() {
  // Tabs
  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.tab').forEach((tab) => tab.classList.remove('active'));
      $(`#${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Login
  $('#loginTab').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const email = $('#loginEmail').value.trim();
      const password = $('#loginPassword').value;
      const res = await apiPost('/users/login', { email, password });
      setAuth(res.token);
      toast('Logged in', 'success');
      $('#logoutBtn').style.display = 'inline-flex';
      showView('searchView');
      await afterLoginBootstrap();
    } catch (err) {
      toast(err.message || 'Login failed', 'error');
    }
  });

  // Register
  $('#registerTab').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: $('#regUsername').value.trim(),
        email: $('#regEmail').value.trim(),
        password: $('#regPassword').value,
        dietaryPreferences: csvToArray($('#regDietPrefs').value),
        allergies: csvToArray($('#regAllergies').value),
        skillLevel: $('#regSkill').value,
      };
      await apiPost('/users/register', payload);
      toast('Account created. Please login.', 'success');
      // switch to login tab
      $$('button.tab-btn').forEach((b) => b.classList.remove('active'));
      $$('form.tab').forEach((t) => t.classList.remove('active'));
      $$('button.tab-btn')[0].classList.add('active');
      $('#loginTab').classList.add('active');
    } catch (err) {
      toast(err.message || 'Register failed', 'error');
    }
  });

  // Logout
  $('#logoutBtn').addEventListener('click', () => {
    setAuth('');
    toast('Logged out');
    $('#logoutBtn').style.display = 'none';
    showView('authView');
  });
}

function csvToArray(str) {
  if (!str) return [];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function safeParseArray(arr) {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (typeof arr === 'string') {
    try {
      const parsed = JSON.parse(arr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Error handling utility
function handleError(error, defaultMessage = 'An error occurred') {
  console.error('Error:', error);
  const message = error.message || defaultMessage;
  toast(message, 'error');
}

// Navigation
function initNav() {
  $('#logoutBtn').style.display = authToken ? 'inline-flex' : 'none';
  $$('#nav .nav-btn').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const view = btn.dataset.view;
      if (view === 'searchView') {
        showView(view);
        return;
      }
      if (!requireAuth()) return;
      showView(view);
      switch (view) {
        case 'favoritesView':
          await loadFavorites();
      break;
        case 'recentView':
          await loadRecent();
      break;
        case 'recsView':
          await loadRecommendations();
      break;
        case 'plannerView':
          await loadPlanner();
      break;
        case 'shoppingView':
          await loadShopping();
      break;
        case 'collectionsView':
          await loadCollections();
          break;
        case 'profileView':
          await loadProfile();
          await loadIngredients();
          break;
        case 'dashboardView':
          await loadDashboard();
      break;
  }
    }),
  );
}

// Enhanced Search
function initSearch() {
  // Real-time search with debouncing
  const searchInput = $('#q');
  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) return;
    
    try {
      const params = new URLSearchParams({ query: query.trim() });
      const results = await apiGet(`/recipes/search?${params.toString()}`);
      renderRecipeGrid('#results', results, { selectable: true });
      $('#resultsCount').textContent = results.length;
    } catch (err) {
      toast(err.message || 'Search failed', 'error');
    }
  }, 500);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query.length >= 3) {
      debouncedSearch(query);
    }
  });

  $('#searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    selectedRecipeIds.clear();

    const params = new URLSearchParams({
      query: $('#q').value.trim(),
    });
    const cuisine = $('#cuisine').value;
    const mealType = $('#mealType').value;
    const maxTime = $('#maxTime').value;
    const difficulty = $('#difficulty').value;
    if (cuisine) params.set('cuisine', cuisine);
    if (mealType) params.set('mealType', mealType);
    if (maxTime) params.set('maxTime', maxTime);
    if (difficulty) params.set('difficulty', difficulty);

    try {
      const results = await apiGet(`/recipes/search?${params.toString()}`);
      renderRecipeGrid('#results', results, { selectable: true });
      $('#resultsCount').textContent = results.length;
    } catch (err) {
      toast(err.message || 'Search failed', 'error');
    }
  });

  // Clear filters
  $('#clearFiltersBtn').addEventListener('click', () => {
    $('#cuisine').value = '';
    $('#mealType').value = '';
    $('#maxTime').value = '';
    $('#difficulty').value = '';
    $('#q').value = '';
    $('#results').innerHTML = '';
    $('#resultsCount').textContent = '0';
  });

  // Generate shopping list
  $('#generateShoppingBtn').addEventListener('click', async () => {
    if (!requireAuth()) return;
    try {
      if (selectedRecipeIds.size === 0)
        return toast('Select at least one recipe');
      const recipeIds = Array.from(selectedRecipeIds);
      await apiPost('/shopping/list', { recipeIds });
      toast('Shopping list generated', 'success');
    } catch (err) {
      toast(err.message || 'Failed to generate shopping list', 'error');
    }
  });

  // Save to collection
  $('#saveCollectionBtn').addEventListener('click', () => {
    if (selectedRecipeIds.size === 0) {
      return toast('Select recipes to save');
    }
    $('#collectionModal').classList.remove('hidden');
  });
}

// Favorites / Recent / Recs
async function loadFavorites() {
  try {
    const favorites = await apiGet('/recipes/favorites');
    const container = $('#favorites');
    if (!container) return;
    if (!favorites || favorites.length === 0) {
      container.innerHTML = '<div class="muted">No favorites yet.</div>';
      favoriteRecipes.clear();
      return;
    }
    // Update favorite recipes set
    favoriteRecipes.clear();
    favorites.forEach(recipe => {
      const id = recipe.id || recipe.recipe_id || recipe.recipeId;
      if (id) favoriteRecipes.add(id);
    });
    renderRecipeGrid('#favorites', favorites);
  } catch (err) {
    const container = $('#favorites');
    if (container) container.innerHTML = '<div class="muted">Failed to load favorites.</div>';
    toast(err.message || 'Failed to load favorites', 'error');
  }
}

async function loadRecent() {
  try {
    const recent = await apiGet('/recipes/recent');
    const container = $('#recent');
    if (!container) return;
    if (!recent || recent.length === 0) {
      container.innerHTML = '<div class="muted">No recent items.</div>';
      return;
    }
    renderRecipeGrid('#recent', recent);
  } catch (err) {
    const container = $('#recent');
    if (container) container.innerHTML = '<div class="muted">Failed to load recent.</div>';
    toast(err.message || 'Failed to load recent', 'error');
  }
}

async function loadRecommendations() {
  try {
    const recs = await apiGet('/recipes/recommendations');
    const container = '#recs';
    const el = document.querySelector(container);
    if (!el) return;
    if (!recs || recs.length === 0) {
      el.innerHTML = '<div class="muted">No recommendations yet.</div>';
    return;
    }
    renderRecipeGrid(container, recs);
  } catch (err) {
    const el = document.querySelector('#recs');
    if (el) el.innerHTML = '<div class="muted">Failed to load recommendations.</div>';
    toast(err.message || 'Failed to load recommendations', 'error');
  }
}

// Enhanced Planner with Calendar
async function loadPlanner() {
  try {
    const plans = await apiGet('/planner/get_meal_plan');
    renderCalendarView(plans);
  } catch (err) {
    toast(err.message || 'Failed to load planner', 'error');
  }
}

function renderCalendarView(plans) {
  const container = $('#planner');
  const weekDates = getWeekDates(currentWeek);
  
  container.innerHTML = '';
  
  weekDates.forEach((date, index) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = date.getDate();
    const dateStr = formatDate(date);
    
    const dayPlans = plans.filter(p => p.plan_date === dateStr);
    
    const dayCard = document.createElement('div');
    dayCard.className = 'calendar-day';
    dayCard.innerHTML = `
      <div class="day-header">
        <div class="day-name">${dayName}</div>
        <div class="day-number">${dayNumber}</div>
                            </div>
      <div class="day-content">
        ${dayPlans.map(plan => `
          <div class="meal-item" data-id="${plan.id}" data-recipe="${plan.recipe_id}">
            <div class="meal-title">${escapeHtml(plan.title || 'Recipe')}</div>
            <div class="meal-actions">
              <button class="btn small" data-action="view" data-id="${plan.recipe_id}">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn small" data-action="remove" data-id="${plan.id}">
                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
        `).join('')}
        <button class="add-meal-btn" data-date="${dateStr}">
          <i class="fas fa-plus"></i> Add Meal
        </button>
                </div>
    `;
    container.appendChild(dayCard);
  });

  // Calendar navigation
  $('#prevWeek').onclick = () => {
    currentWeek.setDate(currentWeek.getDate() - 7);
    $('#weekDisplay').textContent = `Week of ${currentWeek.toLocaleDateString()}`;
    loadPlanner();
  };
  
  $('#nextWeek').onclick = () => {
    currentWeek.setDate(currentWeek.getDate() + 7);
    $('#weekDisplay').textContent = `Week of ${currentWeek.toLocaleDateString()}`;
    loadPlanner();
  };
  
  // Initialize week display
  $('#weekDisplay').textContent = `Week of ${currentWeek.toLocaleDateString()}`;

  // Calendar event handlers
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const date = btn.dataset.date;
    
    if (action === 'view') {
      showRecipeDetail(id);
    } else if (action === 'remove') {
      try {
        await apiDelete(`/planner/${id}`);
        toast('Removed from plan', 'success');
        await loadPlanner();
      } catch (err) {
        toast(err.message || 'Failed to remove', 'error');
      }
    } else if (btn.classList.contains('add-meal-btn')) {
      showAddMealModal(date);
    }
  });
}

function showAddMealModal(date) {
  const modal = $('#recipeModal');
  const detail = $('#recipeDetail');
  detail.innerHTML = `
    <div class="add-meal-modal">
      <h3><i class="fas fa-plus"></i> Add Meal to ${new Date(date).toLocaleDateString()}</h3>
      <form id="addMealForm">
        <div class="field">
          <label>Recipe ID</label>
          <input id="mealRecipeId" type="number" required placeholder="Enter recipe ID" />
                </div>
        <div class="modal-actions">
          <button type="button" onclick="$('#recipeModal').classList.add('hidden')" class="btn">Cancel</button>
          <button type="submit" class="btn primary">Add</button>
                    </div>
      </form>
                    </div>
  `;
  modal.classList.remove('hidden');
  
  $('#addMealForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      const recipeId = $('#mealRecipeId').value;
      await apiPost('/planner/add_recipe_to_meal_plan', { recipeId, date });
      toast('Added to planner', 'success');
      modal.classList.add('hidden');
      await loadPlanner();
    } catch (err) {
      toast(err.message || 'Failed to add meal', 'error');
    }
  };
}

// Enhanced Shopping List
async function loadShopping() {
  try {
    const items = await apiGet('/shopping/list');
    const container = $('#shopping');
    if (!container) return;
    
    if (!items || !items.length) {
      container.innerHTML = '<div class="muted">No shopping items yet.</div>';
      updateShoppingStats(0, 0);
      return;
    }
    
    // Group by category
    const categories = {};
    items.forEach(item => {
      const category = item.category || 'Other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(item);
    });
    
    let html = '';
    for (const [category, categoryItems] of Object.entries(categories)) {
      html += `
        <div class="shopping-category">
          <h3><i class="fas fa-tag"></i> ${escapeHtml(category)}</h3>
          <div class="category-items">
            ${categoryItems.map(item => `
              <div class="shopping-item ${item.purchased ? 'completed' : ''}" data-id="${item.id}">
                <input type="checkbox" ${item.purchased ? 'checked' : ''} onchange="toggleShoppingItem(${item.id}, this.checked)">
                <span class="item-name">${escapeHtml(item.ingredient_name)}</span>
                <span class="item-quantity">${item.amount} ${escapeHtml(item.unit || '')}</span>
                <span class="item-category">${escapeHtml(category)}</span>
                <div class="item-actions">
                  <button onclick="editShoppingItem(${item.id})" title="Edit Item">
                    <i class="fas fa-edit"></i>
                    </button>
                  <button onclick="removeShoppingItem(${item.id})" title="Remove Item">
                    <i class="fas fa-trash"></i>
                    </button>
                </div>
              </div>
            `).join('')}
                    </div>
                </div>
            `;
    }
    container.innerHTML = html;
    
    // Update stats
    const total = items.length;
    const purchased = items.filter(item => item.purchased).length;
    updateShoppingStats(total, purchased);
  } catch (err) {
    const container = $('#shopping');
    if (container) container.innerHTML = '<div class="muted">Failed to load shopping list.</div>';
    toast(err.message || 'Failed to load shopping list', 'error');
  }
}

function updateShoppingStats(total, purchased) {
  const totalEl = $('#totalItems');
  const purchasedEl = $('#purchasedItems');
  const progressEl = $('#progressPercent');
  const progressFillEl = $('#progressFill');
  
  if (totalEl) totalEl.textContent = total;
  if (purchasedEl) purchasedEl.textContent = purchased;
  
  const progress = total > 0 ? Math.round((purchased / total) * 100) : 0;
  if (progressEl) progressEl.textContent = `${progress}%`;
  if (progressFillEl) progressFillEl.style.width = `${progress}%`;
}

async function toggleShoppingItem(id, purchased) {
  try {
    await apiPut(`/shopping/list/${id}`, { purchased });
    await loadShopping(); // Refresh to update stats
    toast(purchased ? 'Item marked as purchased' : 'Item marked as pending', 'success');
  } catch (err) {
    toast(err.message || 'Failed to update item', 'error');
  }
}

async function removeShoppingItem(id) {
  if (!confirm('Are you sure you want to remove this item?')) return;
  
  try {
    await apiDelete(`/shopping/list/${id}`);
    await loadShopping();
    toast('Item removed from shopping list', 'success');
  } catch (err) {
    toast(err.message || 'Failed to remove item', 'error');
  }
}

function editShoppingItem(id) {
  // For now, just show a simple prompt
  const newName = prompt('Enter new item name:');
  if (newName && newName.trim()) {
    apiPut(`/shopping/list/${id}`, { ingredient_name: newName.trim() })
      .then(() => {
        loadShopping();
        toast('Item updated', 'success');
      })
      .catch(err => {
        toast(err.message || 'Failed to update item', 'error');
      });
  }
}

function initShoppingActions() {
  $('#refreshShoppingBtn').addEventListener('click', loadShopping);
  $('#clearShoppingBtn').addEventListener('click', async () => {
    if (!requireAuth()) return;
    try {
      await apiDelete('/shopping/list');
      toast('Cleared', 'success');
      await loadShopping();
    } catch (err) {
      toast(err.message || 'Failed to clear', 'error');
    }
  });
  $('#updateShoppingBtn').addEventListener('click', async () => {
    if (!requireAuth()) return;
    try {
      const items = $$('#shopping input[type="checkbox"]').map((cb) => ({
        id: Number(cb.dataset.id),
        purchased: cb.checked,
      }));
      await apiPut('/shopping/list', { items });
      toast('Updated', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update list', 'error');
    }
  });
  
  // Initialize filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      filterBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      const filter = btn.dataset.filter;
      filterShoppingItems(filter);
    });
  });
}

function filterShoppingItems(filter) {
  const items = document.querySelectorAll('.shopping-item');
  
  items.forEach(item => {
    const isCompleted = item.classList.contains('completed');
    
    switch(filter) {
      case 'all':
        item.style.display = 'flex';
        break;
      case 'pending':
        item.style.display = isCompleted ? 'none' : 'flex';
        break;
      case 'purchased':
        item.style.display = isCompleted ? 'flex' : 'none';
        break;
    }
  });
}

// Collections
async function loadCollections() {
  try {
    // For now, we'll use localStorage for collections
    collections = JSON.parse(localStorage.getItem('collections') || '[]');
    renderCollections();
  } catch (err) {
    toast(err.message || 'Failed to load collections', 'error');
  }
}

function renderCollections() {
  const container = $('#collections');
  container.innerHTML = '';
  
  if (!collections.length) {
    container.innerHTML = '<div class="muted">No collections yet. Create your first one!</div>';
    return;
  }
  
  collections.forEach((collection, index) => {
    const collectionEl = document.createElement('div');
    collectionEl.className = 'collection-card';
    collectionEl.innerHTML = `
      <div class="collection-header">
        <h3><i class="fas fa-folder"></i> ${escapeHtml(collection.name)}</h3>
        <div class="collection-actions">
          <button class="btn small" data-action="view" data-index="${index}">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn small danger" data-action="delete" data-index="${index}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <p class="collection-desc">${escapeHtml(collection.description || 'No description')}</p>
      <div class="collection-stats">
        <span><i class="fas fa-utensils"></i> ${collection.recipes?.length || 0} recipes</span>
      </div>
    `;
    container.appendChild(collectionEl);
  });
  
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const index = Number(btn.dataset.index);
    
    if (action === 'view') {
      showCollectionDetail(collections[index]);
    } else if (action === 'delete') {
      collections.splice(index, 1);
      localStorage.setItem('collections', JSON.stringify(collections));
      renderCollections();
      toast('Collection deleted', 'success');
    }
  });
}

function showCollectionDetail(collection) {
  const modal = $('#recipeModal');
  const detail = $('#recipeDetail');
  detail.innerHTML = `
    <div class="collection-detail">
      <h2><i class="fas fa-folder"></i> ${escapeHtml(collection.name)}</h2>
      <p>${escapeHtml(collection.description || 'No description')}</p>
      <div class="collection-recipes">
        ${collection.recipes?.map(recipe => `
          <div class="recipe-item">
            <img src="${recipe.image || 'https://source.unsplash.com/100x100/?food'}" alt="${escapeHtml(recipe.title)}" />
            <div class="recipe-info">
              <h4>${escapeHtml(recipe.title)}</h4>
              <button class="btn small" onclick="showRecipeDetail(${recipe.id})">
                <i class="fas fa-eye"></i> View
              </button>
            </div>
          </div>
        `).join('') || '<p class="muted">No recipes in this collection</p>'}
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function initCollections() {
  $('#createCollectionBtn').addEventListener('click', () => {
    $('#collectionModal').classList.remove('hidden');
  });
  
  $('#collectionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#collectionName').value.trim();
    const description = $('#collectionDesc').value.trim();
    
    if (!name) return toast('Collection name is required');
    
    const newCollection = {
      id: Date.now(),
      name,
      description,
      recipes: Array.from(selectedRecipeIds).map(id => ({ id }))
    };
    
    collections.push(newCollection);
    localStorage.setItem('collections', JSON.stringify(collections));
    
    $('#collectionModal').classList.add('hidden');
    $('#collectionName').value = '';
    $('#collectionDesc').value = '';
    selectedRecipeIds.clear();
    
    renderCollections();
    toast('Collection created', 'success');
  });
  
  $('#cancelCollection').addEventListener('click', () => {
    $('#collectionModal').classList.add('hidden');
  });
}

// Profile
async function loadProfile() {
  try {
    const profile = await apiGet('/users/profile');
    const usernameEl = $('#pfUsername');
    const emailEl = $('#pfEmail');
    const dietEl = $('#pfDiet');
    const allergiesEl = $('#pfAllergies');
    const skillEl = $('#pfSkill');
    
    if (usernameEl) usernameEl.value = profile.username || '';
    if (emailEl) emailEl.value = profile.email || '';
    if (dietEl) dietEl.value = safeParseArray(profile.dietary_preferences).join(', ');
    if (allergiesEl) allergiesEl.value = safeParseArray(profile.allergies).join(', ');
    if (skillEl) skillEl.value = profile.skill_level || 'beginner';
  } catch (err) {
    handleError(err, 'Failed to load profile');
  }
}

function initProfileActions() {
  $('#profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiPut('/users/profile', {
        username: $('#pfUsername').value.trim(),
        email: $('#pfEmail').value.trim(),
        password: $('#pfPassword').value || undefined,
        dietaryPreferences: csvToArray($('#pfDiet').value),
        allergies: csvToArray($('#pfAllergies').value),
        skillLevel: $('#pfSkill').value,
      });
      $('#pfPassword').value = '';
      toast('Profile updated', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update profile', 'error');
    }
  });
}

// Ingredients
async function loadIngredients() {
  try {
    const items = await apiGet('/users/ingredients');
    ingredientsState = items.map((i) => ({ name: i.name, preference: i.preference }));
    renderIngredients();
  } catch (err) {
    // if none, ignore
    ingredientsState = [];
    renderIngredients();
  }
}

function renderIngredients() {
  const list = $('#ingredientsList');
  if (!list) return;
  
  list.innerHTML = '';
  if (!ingredientsState.length) {
    list.innerHTML = '<div class="muted">No ingredients added yet.</div>';
    return;
  }
  ingredientsState.forEach((ing, idx) => {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.innerHTML = `
      <span>${escapeHtml(ing.name)}</span>
      <select data-idx="${idx}">
        <option value="like" ${ing.preference === 'like' ? 'selected' : ''}>Like</option>
        <option value="neutral" ${ing.preference === 'neutral' ? 'selected' : ''}>Neutral</option>
        <option value="dislike" ${ing.preference === 'dislike' ? 'selected' : ''}>Dislike</option>
      </select>
      <button class="icon-btn" data-action="delete" data-idx="${idx}">
        <i class="fas fa-times"></i>
      </button>
    `;
    list.appendChild(row);
  });

  list.addEventListener('change', (e) => {
    const sel = e.target.closest('select');
    if (!sel) return;
    const idx = Number(sel.dataset.idx);
    ingredientsState[idx].preference = sel.value;
  }, { once: true });

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    ingredientsState.splice(idx, 1);
    renderIngredients();
  }, { once: true });
}

function initIngredientsActions() {
  $('#addIngredientBtn').addEventListener('click', () => {
    const name = $('#ingName').value.trim();
    const preference = $('#ingPref').value;
    if (!name) return toast('Enter ingredient name');
    ingredientsState.push({ name, preference });
    $('#ingName').value = '';
    renderIngredients();
  });

  $('#saveIngredientsBtn').addEventListener('click', async () => {
    if (!requireAuth()) return;
    try {
      // Use create for first time; update otherwise
      const method = ingredientsState._savedOnce ? 'PUT' : 'POST';
      const path = '/users/ingredients';
      if (method === 'POST') {
        await apiPost(path, { ingredients: ingredientsState });
        ingredientsState._savedOnce = true;
      } else {
        await apiPut(path, { ingredients: ingredientsState });
      }
      toast('Ingredients saved', 'success');
    } catch (err) {
      toast(err.message || 'Failed to save ingredients', 'error');
    }
  });
}

// Enhanced Dashboard
async function loadDashboard() {
  try {
    const stats = await apiGet('/users/dashboard');
    const viewedEl = $('#viewedCount');
    const favoritedEl = $('#favoritedCount');
    const ratedEl = $('#ratedCount');
    const commentedEl = $('#commentedCount');
    
    if (viewedEl) viewedEl.textContent = stats.viewed ?? 0;
    if (favoritedEl) favoritedEl.textContent = stats.favorited ?? 0;
    if (ratedEl) ratedEl.textContent = stats.rated ?? 0;
    if (commentedEl) commentedEl.textContent = stats.commented ?? 0;
    
    // Load recent activity
    await loadRecentActivity();
    await loadCuisineStats();
  } catch (err) {
    const dashboardEl = $('#dashboard');
    if (dashboardEl) dashboardEl.innerHTML = '<div class="muted">Unable to load dashboard.</div>';
  }
}

async function loadRecentActivity() {
  try {
    const recent = await apiGet('/recipes/recent');
    const container = $('#recentActivity');
    if (!container) return;
    
    container.innerHTML = '';
    
    recent.slice(0, 5).forEach(recipe => {
      const activityEl = document.createElement('div');
      activityEl.className = 'activity-item';
      activityEl.innerHTML = `
        <img src="${recipe.image || 'https://source.unsplash.com/50x50/?food'}" alt="${escapeHtml(recipe.title)}" />
        <div class="activity-info">
          <div class="activity-title">${escapeHtml(recipe.title)}</div>
          <div class="activity-time">Recently viewed</div>
        </div>
      `;
      container.appendChild(activityEl);
    });
  } catch (err) {
    const container = $('#recentActivity');
    if (container) container.innerHTML = '<div class="muted">No recent activity</div>';
  }
}

async function loadCuisineStats() {
  try {
    const favorites = await apiGet('/recipes/favorites');
    const cuisineCounts = {};
    
    favorites.forEach(recipe => {
      const cuisine = recipe.cuisines?.[0] || 'Other';
      cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
    });
    
    const container = $('#cuisineStats');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(cuisineCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([cuisine, count]) => {
        const cuisineEl = document.createElement('div');
        cuisineEl.className = 'cuisine-stat';
        cuisineEl.innerHTML = `
          <div class="cuisine-name">${escapeHtml(cuisine)}</div>
          <div class="cuisine-bar">
            <div class="cuisine-fill" style="width: ${(count / Math.max(...Object.values(cuisineCounts))) * 100}%"></div>
          </div>
          <div class="cuisine-count">${count}</div>
        `;
        container.appendChild(cuisineEl);
      });
  } catch (err) {
    const container = $('#cuisineStats');
    if (container) container.innerHTML = '<div class="muted">No cuisine data</div>';
  }
}

// Recipe cards & detail
function renderRecipeGrid(containerSel, recipes, opts = {}) {
  const container = $(containerSel);
  if (!container) return;
  
  container.innerHTML = '';
  if (!recipes || !recipes.length) {
    container.innerHTML = '<div class="muted">No results.</div>';
    return;
  }
  const selectable = !!opts.selectable;
  for (const r of recipes) {
    const id = r.id || r.recipe_id || r.recipeId;
    const title = r.title || r.name || `Recipe #${id}`;
    const image = r.image || `https://source.unsplash.com/480x320/?food,${encodeURIComponent(title)}`;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb">
        <img src="${image}" alt="${escapeHtml(title)}" />
        <div class="card-overlay">
          <button class="btn overlay-btn" data-action="view" data-id="${id}">
            <i class="fas fa-eye"></i> View
          </button>
                    </div>
                </div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(title)}</h3>
        <div class="card-meta">
          ${r.readyInMinutes ? `<span><i class="fas fa-clock"></i> ${r.readyInMinutes}m</span>` : ''}
          ${r.servings ? `<span><i class="fas fa-users"></i> ${r.servings}</span>` : ''}
        </div>
        <div class="card-actions">
          ${selectable ? `<label class="checkbox small"><input type="checkbox" data-id="${id}"/> Select</label>` : ''}
          <button class="btn" data-action="view" data-id="${id}">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn favorite-btn ${favoriteRecipes.has(id) ? 'favorited' : ''}" data-action="fav" data-id="${id}" title="${favoriteRecipes.has(id) ? 'Remove from Favorites' : 'Add to Favorites'}">
            <i class="fas fa-heart"></i>
          </button>
        </div>
      </div>`;
    container.appendChild(card);
  }

  container.addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"][data-id]');
    if (!cb) return;
    const id = Number(cb.dataset.id);
    if (cb.checked) selectedRecipeIds.add(id);
    else selectedRecipeIds.delete(id);
  }, { once: true });

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const action = btn.dataset.action;
    if (action === 'view') showRecipeDetail(id);
    if (action === 'fav') {
      try {
        const isFavorited = favoriteRecipes.has(id);
        if (isFavorited) {
          // Remove from favorites
          await apiDelete(`/recipes/favorites/${id}`);
          favoriteRecipes.delete(id);
          toast('Removed from favorites', 'success');
        } else {
          // Add to favorites
          await apiPost('/recipes/favorites', { recipeId: id });
          favoriteRecipes.add(id);
          toast('Added to favorites', 'success');
        }
        
        // Update button appearance
        btn.classList.toggle('favorited', !isFavorited);
        btn.title = !isFavorited ? 'Remove from Favorites' : 'Add to Favorites';
        
        // Refresh favorites if we're on the favorites view
        if (container.id === 'favorites') {
          await loadFavorites();
        }
      } catch (err) {
        toast(err.message || 'Failed to update favorites', 'error');
      }
    }
  });
}

async function showRecipeDetail(id) {
  try {
    const recipe = await apiGet(`/recipes/${id}`);
    const modal = $('#recipeModal');
    const detail = $('#recipeDetail');
    detail.innerHTML = renderRecipeDetailHtml(recipe);
    modal.classList.remove('hidden');
    $('#closeModal').onclick = () => modal.classList.add('hidden');
    // bind comment / rating actions
    bindCommentsAndRatings(id);
    bindAddToPlanner(id);
    bindImageUpload(id);
  } catch (err) {
    toast(err.message || 'Failed to load recipe', 'error');
  }
}

function renderRecipeDetailHtml(r) {
  const img = r.image || `https://source.unsplash.com/800x400/?dish,${encodeURIComponent(r.title)}`;
  const ingredients = (r.extendedIngredients || []).map((i) => `<li>${escapeHtml(i.original || i.name)}</li>`).join('');
  const instructions = (r.analyzedInstructions?.[0]?.steps || [])
    .map((s) => `<li>${escapeHtml(s.step)}</li>`) 
    .join('');
  
  const nutrition = r.nutrition?.nutrients || [];
  const nutritionHtml = nutrition.length ? `
    <div class="nutrition-info">
      <h4><i class="fas fa-chart-pie"></i> Nutrition (per serving)</h4>
      <div class="nutrition-grid">
        ${nutrition.slice(0, 6).map(n => `
          <div class="nutrition-item">
            <span class="nutrient-name">${escapeHtml(n.name)}</span>
            <span class="nutrient-value">${n.amount}${n.unit}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  return `
    <div class="recipe-detail">
      <img class="hero" src="${img}" alt="${escapeHtml(r.title)}" />
      <h2>${escapeHtml(r.title)}</h2>
      
      <div class="recipe-meta">
        ${r.readyInMinutes ? `<span><i class="fas fa-clock"></i> ${r.readyInMinutes} minutes</span>` : ''}
        ${r.servings ? `<span><i class="fas fa-users"></i> ${r.servings} servings</span>` : ''}
        ${r.healthScore ? `<span><i class="fas fa-heart"></i> Health Score: ${r.healthScore}</span>` : ''}
      </div>
      
      <div class="columns">
        <div>
          <h4><i class="fas fa-carrot"></i> Ingredients</h4>
          <ul>${ingredients || '<li class="muted">No ingredients.</li>'}</ul>
        </div>
        <div>
          <h4><i class="fas fa-list-ol"></i> Instructions</h4>
          <ol>${instructions || '<li class="muted">No instructions.</li>'}</ol>
        </div>
      </div>
      
      ${nutritionHtml}
      
      <div class="recipe-actions">
        <button class="btn primary" id="addToPlannerBtn">
          <i class="fas fa-calendar-plus"></i> Add to Planner
        </button>
        <label class="btn">
          <i class="fas fa-upload"></i> Upload Image
          <input type="file" id="imageUpload" accept="image/*" hidden />
        </label>
      </div>
      
      <div class="divider"></div>
      
      <div class="comments">
        <h3><i class="fas fa-star"></i> Ratings</h3>
        <div class="rating-form">
          <select id="ratingValue">
            <option value="5">5 ★</option>
            <option value="4">4 ★</option>
            <option value="3">3 ★</option>
            <option value="2">2 ★</option>
            <option value="1">1 ★</option>
          </select>
          <input id="ratingReview" placeholder="Optional review" />
          <button class="btn" id="submitRating">
            <i class="fas fa-star"></i> Submit
          </button>
        </div>
        <div id="ratingsList"></div>
        
        <h3><i class="fas fa-comment"></i> Comments</h3>
        <div class="comment-form">
          <input id="commentText" placeholder="Write a comment..." />
          <button class="btn" id="submitComment">
            <i class="fas fa-paper-plane"></i> Send
          </button>
        </div>
        <div id="commentsList"></div>
      </div>
    </div>`;
}

function bindCommentsAndRatings(recipeId) {
  // load existing
  (async () => {
    try {
      const ratings = await apiGet(`/recipes/${recipeId}/ratings`);
      $('#ratingsList').innerHTML = renderRatings(ratings);
    } catch {}
    try {
      const comments = await apiGet(`/recipes/${recipeId}/comments`);
      $('#commentsList').innerHTML = renderComments(comments);
    } catch {}
  })();

  $('#submitRating').onclick = async () => {
    try {
      const rating = Number($('#ratingValue').value);
      const review = $('#ratingReview').value.trim();
      await apiPost(`/recipes/${recipeId}/ratings`, { rating, review });
      toast('Thanks for rating!', 'success');
      const ratings = await apiGet(`/recipes/${recipeId}/ratings`);
      $('#ratingsList').innerHTML = renderRatings(ratings);
    } catch (err) {
      toast(err.message || 'Failed to rate', 'error');
    }
  };

  $('#submitComment').onclick = async () => {
    try {
      const comment = $('#commentText').value.trim();
      if (!comment) return;
      await apiPost(`/recipes/${recipeId}/comments`, { comment });
      $('#commentText').value = '';
      const comments = await apiGet(`/recipes/${recipeId}/comments`);
      $('#commentsList').innerHTML = renderComments(comments);
    } catch (err) {
      toast(err.message || 'Failed to comment', 'error');
    }
  };
}

function bindAddToPlanner(recipeId) {
  $('#addToPlannerBtn').onclick = async () => {
    try {
      const date = prompt('Plan date (YYYY-MM-DD)');
      if (!date) return;
      await apiPost('/planner/add_recipe_to_meal_plan', { recipeId, date });
      toast('Added to planner', 'success');
    } catch (err) {
      toast(err.message || 'Failed to add to planner', 'error');
    }
  };
}

function bindImageUpload(recipeId) {
  const input = $('#imageUpload');
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE}/recipes/${recipeId}/image`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      toast('Image uploaded', 'success');
    } catch (err) {
      toast(err.message || 'Failed to upload image', 'error');
    }
  };
}

function renderRatings(data) {
  const list = (data.ratings || []).map((r) => `<div class="item">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} — ${escapeHtml(r.username || '')} ${r.review ? '· ' + escapeHtml(r.review) : ''}</div>`);
  return list.join('') || '<div class="muted">No ratings yet.</div>';
}
function renderComments(comments) {
  return (comments || [])
    .map((c) => `<div class="item"><b>${escapeHtml(c.username)}</b>: ${escapeHtml(c.comment)}</div>`)
    .join('') || '<div class="muted">No comments yet.</div>';
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function afterLoginBootstrap() {
  // Load initial data silently
  try { await loadRecent(); } catch {}
  try { await loadFavorites(); } catch {}
  try { await loadRecommendations(); } catch {}
}

function bootstrap() {
  initAuthUI();
  initNav();
  initSearch();
  initShoppingActions();
  initProfileActions();
  initIngredientsActions();
  initCollections();

  // Check if user is authenticated
  if (authToken) {
    // Show logout button
    $('#logoutBtn').style.display = 'inline-flex';
    showView('searchView');
    afterLoginBootstrap();
  } else {
    // Hide logout button and show auth view
    $('#logoutBtn').style.display = 'none';
    showView('authView');
  }

  // Modal close when clicking outside
  $('#recipeModal').addEventListener('click', (e) => {
    if (e.target.id === 'recipeModal') $('#recipeModal').classList.add('hidden');
  });
  
  $('#collectionModal').addEventListener('click', (e) => {
    if (e.target.id === 'collectionModal') $('#collectionModal').classList.add('hidden');
  });
}

window.addEventListener('DOMContentLoaded', bootstrap);
