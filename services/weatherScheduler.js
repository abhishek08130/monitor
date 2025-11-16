const weatherService = require('./weatherService');
const FirestoreMonitor = require('./firestoreMonitor');

class WeatherScheduler {
  constructor() {
    this.isRunning = false;
    this.schedulerInterval = null;
    this.firestoreMonitor = new FirestoreMonitor();
    this.startTime = 9; // 9:00 AM
    this.endTime = 21; // 9:00 PM (21:00)
    this.lastNotificationTime = null;
    this.notificationCount = 0;
  }

  // Check if current time is within notification hours
  isWithinNotificationHours() {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= this.startTime && currentHour < this.endTime;
  }

  // Get current time in readable format
  getCurrentTimeString() {
    const now = new Date();
    return now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Send weather notification
  async sendWeatherNotification() {
    try {
      console.log(`\n${'🌤️'.repeat(30)}`);
      console.log(`🕐 Time: ${this.getCurrentTimeString()}`);
      console.log(`📱 Sending automatic weather notification #${this.notificationCount + 1}`);
      console.log(`${'🌤️'.repeat(30)}`);

      // Get weather data and generate notification
      const weatherResult = await weatherService.getWeatherAndMessage('Tanakpur', 'gemini');
      
      console.log('📊 Weather Data:');
      console.log(`   City: ${weatherResult.weatherInfo.city}`);
      console.log(`   Weather: ${weatherResult.weatherInfo.description}`);
      console.log(`   Temperature: ${weatherResult.weatherInfo.temperature}°C`);
      console.log(`   Is Rainy: ${weatherResult.weatherInfo.isRainy ? 'Yes' : 'No'}`);
      
      console.log('🎵 Generated Song-Style Notification:');
      console.log(`   Title: ${weatherResult.notification.title}`);
      console.log(`   Body: ${weatherResult.notification.body}`);
      console.log(`   Provider: ${weatherResult.provider.toUpperCase()}`);

      // Get all customer FCM tokens
      const tokens = await this.firestoreMonitor.getAllCustomerFcmTokens();
      console.log(`📱 Found ${tokens.length} FCM tokens`);

      if (tokens.length > 0) {
        // Send FCM notification
        const fcmResult = await this.firestoreMonitor.sendFcmNotification(
          tokens, 
          weatherResult.notification.title, 
          weatherResult.notification.body
        );

        console.log('📱 FCM Notification Results:');
        console.log(`   Total Tokens: ${fcmResult.summary?.total || 0}`);
        console.log(`   Successful: ${fcmResult.summary?.successful || 0}`);
        console.log(`   Failed: ${fcmResult.summary?.failed || 0}`);

        this.notificationCount++;
        this.lastNotificationTime = new Date();
        
        console.log(`✅ Automatic notification sent successfully!`);
        console.log(`📊 Total notifications sent today: ${this.notificationCount}`);
      } else {
        console.log('⚠️ No FCM tokens found - notification not sent');
      }

    } catch (error) {
      console.error('❌ Error sending automatic weather notification:', error.message);
    }
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️ Weather scheduler is already running');
      return;
    }

    console.log(`\n${'⏰'.repeat(30)}`);
    console.log('🚀 Starting Weather Notification Scheduler');
    console.log(`📅 Schedule: Every hour from ${this.startTime}:00 AM to ${this.endTime}:00 PM`);
    console.log(`🌍 Timezone: Asia/Kolkata`);
    console.log(`🎵 Style: Bollywood Song-Style Notifications`);
    console.log(`${'⏰'.repeat(30)}\n`);

    this.isRunning = true;

    // Send initial notification if within hours
    if (this.isWithinNotificationHours()) {
      console.log('🕐 Current time is within notification hours - sending initial notification');
      this.sendWeatherNotification();
    } else {
      console.log('⏰ Current time is outside notification hours - waiting for 9:00 AM');
    }

    // Set up hourly interval
    this.schedulerInterval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if it's the start of an hour and within notification hours
      if (currentMinute === 0 && this.isWithinNotificationHours()) {
        console.log(`\n🕐 Hourly trigger at ${currentHour}:00`);
        this.sendWeatherNotification();
      }
    }, 60000); // Check every minute

    console.log('✅ Weather scheduler started successfully');
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Weather scheduler is not running');
      return;
    }

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    this.isRunning = false;
    console.log('⏹️ Weather scheduler stopped');
  }

  // Get scheduler status
  getStatus() {
    const now = new Date();
    const currentHour = now.getHours();
    const isActive = this.isRunning && this.isWithinNotificationHours();

    return {
      isRunning: this.isRunning,
      isActive: isActive,
      currentTime: this.getCurrentTimeString(),
      currentHour: currentHour,
      startTime: this.startTime,
      endTime: this.endTime,
      notificationCount: this.notificationCount,
      lastNotificationTime: this.lastNotificationTime ? this.lastNotificationTime.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
      }) : null,
      nextNotificationTime: this.isWithinNotificationHours() ? 
        `${currentHour + 1}:00` : 
        `${this.startTime}:00 tomorrow`
    };
  }

  // Manual trigger for testing
  async manualTrigger() {
    console.log('🎯 Manual trigger activated');
    await this.sendWeatherNotification();
  }

  // Reset notification count (useful for daily reset)
  resetCount() {
    this.notificationCount = 0;
    console.log('🔄 Notification count reset to 0');
  }
}

module.exports = WeatherScheduler;
