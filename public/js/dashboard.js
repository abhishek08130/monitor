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
    logs: {
        main: document.getElementById('logs'),
        whatsapp: document.getElementById('whatsapp-logs'),
        weather: document.getElementById('weather-logs')
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    initCharts();
    checkAuth();
    setupEventListeners();
    startPeriodicUpdates();
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
    addLog('👋 Welcome back, Admin!');
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
        target.style.animation = 'fadeIn 0.5s ease-out';
    }

    // Update nav active state
    els.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === sectionId) {
            link.classList.add('active');
        }
    });
}

// Charts
function initCharts() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.05)';

    const ctxBar = document.getElementById('barChart')?.getContext('2d');
    if (ctxBar) {
        charts.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Notifications',
                    data: [12, 19, 3, 5, 2, 3, 9],
                    backgroundColor: '#6366f1',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
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
                    backgroundColor: ['#6366f1', '#ec4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

// Logging
function addLog(message, type = 'info', section = 'main') {
    const container = els.logs[section];
    if (!container) return;

    const entry = document.createElement('div');
    entry.className = `log-entry ${type === 'error' ? 'error' : ''}`;
    entry.innerHTML = `
        <span style="opacity:0.7; margin-right:8px">[${new Date().toLocaleTimeString()}]</span>
        ${message}
    `;

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

// API Actions
async function getRecentOrders() {
    try {
        addLog('🔄 Fetching recent orders...');
        const res = await fetch('/recent-orders');
        const orders = await res.json();
        addLog(`✅ Found ${orders.length} recent orders`);
        document.getElementById('stat-total-orders').textContent = orders.length;
    } catch (err) {
        addLog(`❌ Error: ${err.message}`, 'error');
    }
}

async function sendWeatherNotification() {
    const provider = document.querySelector('input[name="ai-provider"]:checked').value;
    try {
        addLog(`🌤️ Sending weather notification via ${provider.toUpperCase()}...`, 'info', 'weather');
        const res = await fetch('/weather-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city: 'Tanakpur', provider })
        });
        const result = await res.json();

        if (result.success) {
            addLog(`✅ Notification sent! Temp: ${result.weatherInfo.temperature}°C`, 'success', 'weather');
            alert(`Weather Notification Sent!\n\n${result.notification.title}`);
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        addLog(`❌ Failed: ${err.message}`, 'error', 'weather');
        alert('Failed to send notification');
    }
}

// Event Listeners
function setupEventListeners() {
    // Nav clicks
    els.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.target;
            if (target) switchSection(target);
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
                alert(result.error || 'Login failed');
            }
        } catch (err) {
            alert('Login error');
        }
    });

    // Global buttons
    window.logout = logout;
    window.getRecentOrders = getRecentOrders;
    window.sendWeatherNotification = sendWeatherNotification;

    // Mobile menu toggle (if added later)
}

function startPeriodicUpdates() {
    setInterval(() => {
        if (isAuthenticated) {
            // Update logic here
        }
    }, 30000);
}
