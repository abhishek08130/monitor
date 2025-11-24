// Dashboard Logic

// State
let isAuthenticated = false;
let charts = {};

// DOM Elements
const els = {
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    dashboardContent: document.getElementById('dashboard-content'),
    whatsappSection: document.getElementById('whatsapp-automation-section'),
    firebaseSection: document.getElementById('firebase-services-section'),
    sidebar: document.querySelector('.sidebar'),
    main: document.querySelector('.main'),
    navLinks: document.querySelectorAll('.nav-item'),
    profileMenu: document.getElementById('profile-menu'),
    logs: {
        main: document.getElementById('logs'),
        whatsapp: document.getElementById('whatsapp-logs'),
        weather: document.getElementById('weather-logs'),
        notifications: document.getElementById('notification-list')
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    initCharts();
    checkAuth();
    setupEventListeners();
    startPeriodicUpdates();
    
    // Add toast container
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 1000; display: flex; flex-direction: column; gap: 10px;';
    document.body.appendChild(toastContainer);
});

// Authentication
async function checkAuth() {
    try {
        const res = await fetch('/auth-check', { credentials: 'same-origin' });
        const result = await res.json();
        if (result.authenticated) {
            handleLoginSuccess();
        } else {
            showLogin();
        }
    } catch (err) {
        showLogin();
    }
}

function showLogin() {
    els.loginModal.classList.add('active');
    document.querySelector('.layout').style.filter = 'blur(5px)';
}

function handleLoginSuccess() {
    isAuthenticated = true;
    els.loginModal.classList.remove('active');
    document.querySelector('.layout').style.filter = 'none';
    addLog('👋 Welcome back, Admin!', 'success');
}

async function logout() {
    await fetch('/logout', { method: 'POST' });
    window.location.reload();
}

// Navigation
function switchSection(sectionId) {
    // Hide all sections
    [els.dashboardContent, els.whatsappSection, els.firebaseSection].forEach(el => {
        if (el) el.style.display = 'none';
    });

    // Show target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        // Reset animation
        target.style.animation = 'none';
        target.offsetHeight; /* trigger reflow */
        target.style.animation = 'slideUpFade 0.6s cubic-bezier(0.215, 0.61, 0.355, 1)';
    }

    // Update nav active state
    els.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === sectionId) {
            link.classList.add('active');
        }
    });
}

// UI Functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('profile-menu');
    const profile = document.querySelector('.user-profile');
    if (menu && profile && !menu.contains(e.target) && !profile.contains(e.target)) {
        menu.style.display = 'none';
    }
});

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    let bg = 'rgba(30, 41, 59, 0.9)';
    let border = 'var(--primary)';
    let icon = 'fa-info-circle';
    
    if (type === 'success') {
        border = 'var(--success)';
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        border = 'var(--danger)';
        icon = 'fa-exclamation-circle';
    }
    
    toast.style.cssText = `
        background: ${bg};
        backdrop-filter: blur(10px);
        border-left: 4px solid ${border};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        font-family: 'Outfit', sans-serif;
    `;
    
    toast.innerHTML = `<i class="fa-solid ${icon}" style="color: ${border}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Charts
function initCharts() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    const ctxBar = document.getElementById('barChart')?.getContext('2d');
    if (ctxBar) {
        // Gradient for bar chart
        const gradient = ctxBar.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#d946ef');

        charts.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Notifications',
                    data: [12, 19, 3, 5, 2, 3, 9],
                    backgroundColor: gradient,
                    borderRadius: 8,
                    barThickness: 20,
                    hoverBackgroundColor: '#818cf8'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.02)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    const ctxDoughnut = document.getElementById('donutChart')?.getContext('2d');
    if (ctxDoughnut) {
        charts.doughnut = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: ['Admin', 'Customer'],
                datasets: [{
                    data: [30, 70],
                    backgroundColor: ['#6366f1', '#d946ef'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { padding: 20, usePointStyle: true }
                    } 
                }
            }
        });
    }
}

function updateChartFilter(days) {
    showToast(`Filtering data for last ${days} days...`);
    // Mock data update
    if (charts.bar) {
        const newData = Array.from({length: 7}, () => Math.floor(Math.random() * 20) + 1);
        charts.bar.data.datasets[0].data = newData;
        charts.bar.update();
    }
}

// Logging
function addLog(message, type = 'info', section = 'main') {
    const container = els.logs[section];
    if (!container) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    if (message.includes('Weather')) icon = 'fa-cloud';

    entry.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div>
            <div style="color: var(--text-main); font-weight: 500;">${message}</div>
            <div style="font-size: 0.75rem; opacity: 0.5;">${new Date().toLocaleTimeString()}</div>
        </div>
    `;

    container.insertBefore(entry, container.firstChild);
    // Limit logs
    if (container.children.length > 50) {
        container.removeChild(container.lastChild);
    }
}

// API Actions
async function getRecentOrders() {
    try {
        const btn = document.querySelector('button[onclick="getRecentOrders()"] i');
        if(btn) btn.classList.add('fa-spin');
        
        addLog('🔄 Fetching recent orders...');
        const res = await fetch('/recent-orders');
        const orders = await res.json();
        
        setTimeout(() => {
            if(btn) btn.classList.remove('fa-spin');
            addLog(`✅ Found ${orders.length} recent orders`, 'success');
            document.getElementById('stat-total-orders').textContent = orders.length;
            showToast('Orders updated successfully', 'success');
        }, 800);
        
    } catch (err) {
        addLog(`❌ Error: ${err.message}`, 'error');
        showToast('Failed to fetch orders', 'error');
    }
}

async function sendWeatherNotification() {
    const provider = document.querySelector('input[name="ai-provider"]:checked').value;
    try {
        addLog(`🌤️ Sending weather notification via ${provider.toUpperCase()}...`, 'info', 'weather');
        showToast(`Generating weather alert with ${provider.toUpperCase()}...`);
        
        const res = await fetch('/weather-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: 'Tanakpur', provider })
        });
        const result = await res.json();

        if (result.success) {
            addLog(`✅ Notification sent! Temp: ${result.weatherInfo.temperature}°C`, 'success', 'weather');
            showToast('Weather notification sent successfully!', 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        addLog(`❌ Failed: ${err.message}`, 'error', 'weather');
        showToast('Failed to send notification', 'error');
    }
}

async function confirmStopServices() {
    try {
        closeModal('stop-services-modal');
        showToast('Stopping services...', 'error');
        
        const res = await fetch('/scheduler/stop', { method: 'POST' });
        const result = await res.json();
        
        if (result.success) {
            addLog('🛑 Services stopped by user', 'error');
            showToast('All services have been stopped', 'success');
        }
    } catch (err) {
        showToast('Failed to stop services', 'error');
    }
}

// Event Listeners
function setupEventListeners() {
    // Nav clicks
    els.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            if (target) {
                switchSection(target);
            }
        });
    });

    // Login form
    els.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await res.json();

            if (result.success) {
                handleLoginSuccess();
            } else {
                showToast(result.error || 'Login failed', 'error');
            }
        } catch (err) {
            showToast('Login error', 'error');
        }
    });

    // Global buttons
    window.logout = logout;
    window.getRecentOrders = getRecentOrders;
    window.sendWeatherNotification = sendWeatherNotification;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.confirmStopServices = confirmStopServices;
    window.toggleProfileMenu = toggleProfileMenu;
    window.showToast = showToast;
    window.updateChartFilter = updateChartFilter;
}

function startPeriodicUpdates() {
    setInterval(() => {
        if (isAuthenticated) {
            // Update logic here
        }
    }, 30000);
}
