const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const { initializeFirebase } = require('./config/firebase');
const FirestoreMonitor = require('./services/firestoreMonitor');
const WhatsAppService = require('./services/whatsappService');
const weatherService = require('./services/weatherService');
const WeatherScheduler = require('./services/weatherScheduler');
const path = require('path');
require('dotenv').config();

const app = express();

// PORT Configuration - Multiple ways to set port:
// 1. Command line: node index.js --port 8080 or node index.js -p 8080
// 2. Environment variable: PORT=8080 npm start
// 3. .env file: PORT=8080
// 4. Default: 3000 (if nothing is specified)

function getPortFromArgs() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--port' || args[i] === '-p') && args[i + 1]) {
      return args[i + 1];
    }
    // Support --port=8080 format
    if (args[i].startsWith('--port=')) {
      return args[i].split('=')[1];
    }
  }
  return null;
}

const PORT = getPortFromArgs() || process.env.PORT || process.env.SERVER_PORT || '3000';
const SERVER_PORT = parseInt(PORT, 10);

if (isNaN(SERVER_PORT) || SERVER_PORT < 1 || SERVER_PORT > 65535) {
  console.error('❌ Error: Invalid PORT value. Must be between 1 and 65535');
  process.exit(1);
}

// Session middleware with FileStore for production
app.use(session({
  store: new FileStore({
    path: path.join(__dirname, 'sessions'),
    ttl: 86400, // 24 hours in seconds
    retries: 0,
    logFn: () => {} // Suppress file store logs
  }),
  secret: process.env.SESSION_SECRET || 'pivokart_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true // Prevent XSS attacks
  }
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/asset', express.static('asset'));

// Auth middleware (protect all except login/logout/assets)
app.use((req, res, next) => {
  const openPaths = [
    '/login', '/logout', '/asset', '/favicon.ico', '/public', '/api-keys', '/set-multi-api-keys', '/scheduler/trigger', '/weather-notification', '/test-notification'
  ];
  if (
    openPaths.some(p => req.path.startsWith(p)) ||
    req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.png') || req.path.endsWith('.svg')
  ) {
    return next();
  }
  if (req.session && req.session.authenticated) {
    return next();
  }
  // If not authenticated, send 401 for API or redirect for HTML
  if (req.accepts('html')) {
    return res.status(401).sendFile(__dirname + '/public/index.html');
  } else {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  // Simple check (replace with DB/user check as needed)
  if ((email === 'Abhishekbhatt08130@gmail.com' || email === 'admin') && password === 'Abhishek@') {
    req.session.authenticated = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Initialize services
let firestoreMonitor;
let whatsappService;
let weatherScheduler;

async function initializeApp() {
  try {
    // Initialize Firebase
    initializeFirebase();

    // Initialize services
    firestoreMonitor = new FirestoreMonitor();
    whatsappService = new WhatsAppService();
    weatherScheduler = new WeatherScheduler();

    console.log('🚀 Application initialized successfully');

    // Start monitoring Firestore
    firestoreMonitor.startListening();

    // Start weather scheduler
    weatherScheduler.start();

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Test notification endpoint
app.post('/test-notification', async (req, res) => {
  try {
    const testOrder = {
      id: 'test-order-' + Date.now(),
      orderId: 'TEST-001',
      customerName: 'Test Customer',
      totalAmount: 850,
      customerPhone: '+919758911480',
      deliveryAddress: 'Test Address, City',
      items: [
        { name: 'Butter Chicken', quantity: 2, price: 300 },
        { name: 'Naan', quantity: 3, price: 50 },
        { name: 'Rice', quantity: 1, price: 100 }
      ],
      createdAt: new Date()
    };

    // Send customer notification
    console.log('📱 Sending customer notification...');
    const customerResult = await whatsappService.sendCustomerTemplateMessage(testOrder);

    // Send admin notification
    console.log('📱 Sending admin notification...');
    const adminResult = await whatsappService.sendTemplateMessage(testOrder);

    res.json({
      success: true,
      message: 'Test notifications sent',
      customerResult,
      adminResult
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent orders endpoint
app.get('/recent-orders', async (req, res) => {
  try {
    const orders = await firestoreMonitor.getRecentOrders(10);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    firebase: 'connected',
    whatsapp: 'configured'
  });
});

// Weather notification endpoint
app.post('/weather-notification', async (req, res) => {
  try {
    const { city = 'Tanakpur', provider = 'gemini' } = req.body;

    // Validate provider
    if (provider !== 'gemini' && provider !== 'openai') {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be either "gemini" or "openai"',
        validProviders: ['gemini', 'openai']
      });
    }

    console.log(`🌤️ Starting weather notification process for ${city} using ${provider} AI...`);

    // Step 1: Get weather data and generate Bollywood notification with specified provider
    const weatherResult = await weatherService.getWeatherAndMessage(city, provider);

    console.log('📱 Weather data and notification generated:', {
      city: weatherResult.weatherInfo.city,
      weather: weatherResult.weatherInfo.description,
      isRainy: weatherResult.weatherInfo.isRainy,
      title: weatherResult.notification.title,
      body: weatherResult.notification.body,
      provider: weatherResult.provider,
      timestamp: new Date().toISOString(), // Add timestamp to show it's newly generated
      uniqueId: Math.random().toString(36).substring(2, 10) // Add unique ID for each notification
    });

    console.log('🆕 Generated a fresh notification at:', new Date().toLocaleString(), 'using', provider);

    // Step 2: Get all customer FCM tokens
    const tokens = await firestoreMonitor.getAllCustomerFcmTokens();
    console.log(`[DEBUG] Weather notification: Found ${tokens.length} FCM tokens`);

    if (!tokens.length) {
      return res.json({
        success: false,
        error: 'No customer FCM tokens found',
        suggestion: 'Make sure your orders have FCM tokens in author.fcmToken, fcmToken, customer.fcmToken, or user.fcmToken fields',
        weatherInfo: weatherResult.weatherInfo,
        notification: weatherResult.notification,
        provider: weatherResult.provider
      });
    }

    // Step 3: Send FCM notification with generated title and body
    const title = weatherResult.notification.title;
    const body = weatherResult.notification.body;

    const fcmResult = await firestoreMonitor.sendFcmNotification(tokens, title, body);

    console.log('📱 FCM notification sent:', fcmResult);

    res.json({
      success: true,
      message: `Weather notification sent successfully using ${provider}!`,
      weatherInfo: weatherResult.weatherInfo,
      notification: weatherResult.notification,
      provider: weatherResult.provider,
      fcmResult: fcmResult
    });

  } catch (error) {
    console.error('❌ Weather notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Test FCM endpoint for debugging
app.post('/test-fcm', async (req, res) => {
  try {
    const { title = 'Test Notification', body = 'This is a test FCM notification' } = req.body;

    // Get all customer FCM tokens
    const tokens = await firestoreMonitor.getAllCustomerFcmTokens();
    console.log(`[DEBUG] Test FCM: Found ${tokens.length} FCM tokens`);

    if (!tokens.length) {
      return res.json({
        success: false,
        error: 'No customer FCM tokens found',
        suggestion: 'Make sure your orders have FCM tokens in author.fcmToken, fcmToken, customer.fcmToken, or user.fcmToken fields'
      });
    }

    // Send test FCM notification
    const fcmResult = await firestoreMonitor.sendFcmNotification(tokens, title, body);

    res.json({
      success: fcmResult.success,
      fcmResult,
      message: fcmResult.success ?
        `Test notification sent to ${fcmResult.summary?.successful || 0} devices` :
        `Failed to send test notifications: ${fcmResult.error}`
    });
  } catch (error) {
    console.error('Test FCM error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get FCM tokens endpoint for debugging
app.get('/fcm-tokens', async (req, res) => {
  try {
    const tokens = await firestoreMonitor.getAllCustomerFcmTokens();
    res.json({
      success: true,
      count: tokens.length,
      tokens: tokens.map(token => token.substring(0, 10) + '...'),
      message: `Found ${tokens.length} FCM tokens`
    });
  } catch (error) {
    console.error('Get FCM tokens error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test with specific FCM token
app.post('/test-specific-fcm', async (req, res) => {
  try {
    const { title = 'Test Notification', body = 'This is a test FCM notification' } = req.body;

    // Use the specific FCM token provided
    const specificToken = 'cbbTRN-XR_ioSPHsIJlaBt:APA91bHXxTGAXFZgq8yjVc9Ioqep6lf3NMMI6ZkDSpSxhMWBuEWEaDE6-zuoDTnu4rBrT45kE_XwPwKUdFQHphK-MSiYqiEDKRxL39me7wmtlcobMou0MPI';

    console.log(`[DEBUG] Testing FCM with specific token: ${specificToken.substring(0, 20)}...`);

    // Send test FCM notification to the specific token
    const fcmResult = await firestoreMonitor.sendFcmNotification([specificToken], title, body);

    res.json({
      success: fcmResult.success,
      fcmResult,
      message: fcmResult.success ?
        `Test notification sent to specific token` :
        `Failed to send test notification: ${fcmResult.error}`,
      tokenUsed: specificToken.substring(0, 20) + '...'
    });
  } catch (error) {
    console.error('Test specific FCM error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set multiple API keys endpoint
app.post('/set-multi-api-keys', async (req, res) => {
  try {
    const { openweather, gemini, openai } = req.body;

    if (!openweather || !gemini || !openai) {
      return res.status(400).json({
        success: false,
        error: 'All API keys are required: openweather, gemini, openai'
      });
    }

    await weatherService.setMultiApiKeys({ openweather, gemini, openai });

    res.json({
      success: true,
      message: 'All API keys saved successfully!',
      keys: {
        openweather: openweather.substring(0, 8) + '...',
        gemini: gemini.substring(0, 8) + '...',
        openai: openai.substring(0, 8) + '...'
      }
    });
  } catch (error) {
    console.error('Set multi API keys error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get API keys endpoint
app.get('/api-keys', async (req, res) => {
  try {
    const keys = {
      openweather: weatherService.getApiKey('openweather'),
      gemini: weatherService.getApiKey('gemini'),
      openai: weatherService.getApiKey('openai')
    };

    // Mask the keys for security
    const maskedKeys = {};
    Object.entries(keys).forEach(([service, key]) => {
      if (key) {
        maskedKeys[service] = key.substring(0, 8) + '...' + key.substring(key.length - 4);
      } else {
        maskedKeys[service] = null;
      }
    });

    res.json({
      success: true,
      keys: maskedKeys,
      configured: Object.values(keys).filter(key => key).length
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Auth check endpoint
app.get('/auth-check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

// Weather Scheduler Control Endpoints
app.get('/scheduler/status', (req, res) => {
  try {
    if (!weatherScheduler) {
      return res.status(500).json({
        success: false,
        error: 'Weather scheduler not initialized'
      });
    }

    const status = weatherScheduler.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/scheduler/start', (req, res) => {
  try {
    if (!weatherScheduler) {
      return res.status(500).json({
        success: false,
        error: 'Weather scheduler not initialized'
      });
    }

    weatherScheduler.start();
    res.json({
      success: true,
      message: 'Weather scheduler started successfully',
      status: weatherScheduler.getStatus()
    });
  } catch (error) {
    console.error('Start scheduler error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/scheduler/stop', (req, res) => {
  try {
    if (!weatherScheduler) {
      return res.status(500).json({
        success: false,
        error: 'Weather scheduler not initialized'
      });
    }

    weatherScheduler.stop();
    res.json({
      success: true,
      message: 'Weather scheduler stopped successfully',
      status: weatherScheduler.getStatus()
    });
  } catch (error) {
    console.error('Stop scheduler error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/scheduler/trigger', async (req, res) => {
  try {
    if (!weatherScheduler) {
      return res.status(500).json({
        success: false,
        error: 'Weather scheduler not initialized'
      });
    }

    await weatherScheduler.manualTrigger();
    res.json({
      success: true,
      message: 'Manual weather notification triggered successfully',
      status: weatherScheduler.getStatus()
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/scheduler/reset', (req, res) => {
  try {
    if (!weatherScheduler) {
      return res.status(500).json({
        success: false,
        error: 'Weather scheduler not initialized'
      });
    }

    weatherScheduler.resetCount();
    res.json({
      success: true,
      message: 'Notification count reset successfully',
      status: weatherScheduler.getStatus()
    });
  } catch (error) {
    console.error('Reset scheduler error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(SERVER_PORT, () => {
  console.log(`🌐 Server running on http://localhost:${SERVER_PORT}`);
  console.log(`   💡 Tip: Set port via --port flag, PORT env variable, or .env file`);
  initializeApp();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (firestoreMonitor) {
    firestoreMonitor.stopListening();
  }
  if (weatherScheduler) {
    weatherScheduler.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (firestoreMonitor) {
    firestoreMonitor.stopListening();
  }
  if (weatherScheduler) {
    weatherScheduler.stop();
  }
  process.exit(0);
}); 
