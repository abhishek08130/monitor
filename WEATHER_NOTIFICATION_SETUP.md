# 🌤️ Weather Notification Service Setup Guide

## 🎯 **Complete Flow: OpenWeather → Gemini AI → FCM**

Your weather notification service now works as follows:

1. **🌤️ Get Weather Data** from OpenWeather API
2. **🎬 Generate Bollywood Notification** using Gemini AI (in Hindi)
3. **📱 Send FCM Notification** to all customer devices

## 🔧 **Setup Instructions**

### **Step 1: Get API Keys**

#### **OpenWeather API Key**
1. Go to [OpenWeather API](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Copy the API key

#### **Gemini API Key**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

#### **OpenAI API Key (Optional)**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up/login to your account
3. Create a new API key
4. Copy the API key

### **Step 2: Configure API Keys**

#### **Option A: Using Dashboard**
1. Start your server: `npm start`
2. Go to: `http://localhost:3000`
3. Click **"Firebase Services"** in the sidebar
4. Click **"Edit"** button next to Weather Notification Service
5. Enter your API keys:
   - **OpenWeather API Key**: Your OpenWeather key
   - **GEMINI_API_KEY**: Your Gemini key
   - **OpenAI API Key**: Your OpenAI key (optional)
6. Click **"Save"**

#### **Option B: Using API Endpoint**
```bash
curl -X POST http://localhost:3000/set-multi-api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "openweather": "your_openweather_api_key",
    "gemini": "your_gemini_api_key",
    "openai": "your_openai_api_key"
  }'
```

### **Step 3: Test the Service**

#### **Option A: Using Dashboard**
1. Go to your dashboard: `http://localhost:3000`
2. Click **"Firebase Services"** in the sidebar
3. Click **"Send Weather Notification"** button
4. Check the logs for detailed results

#### **Option B: Using Test Script**
```bash
node test-weather-flow.js
```

#### **Option C: Using API**
```bash
curl -X POST http://localhost:3000/weather-notification \
  -H "Content-Type: application/json" \
  -d '{"city": "Tanakpur"}'
```

## 📱 **What Happens When You Send a Weather Notification**

### **1. Weather Data Collection**
- Fetches current weather for the specified city
- Checks if it's rainy weather
- Gets temperature, humidity, and weather description

### **2. AI Notification Generation**
- Uses Gemini AI to generate a Bollywood-style notification in Hindi
- Creates an attractive title (like a Bollywood movie name)
- Generates a fun body message with food suggestions for rainy weather

### **3. FCM Notification Delivery**
- Sends the generated notification to all customer FCM tokens
- Provides detailed success/failure reports
- Logs all activities for monitoring

## 🎬 **Example Notifications**

### **Rainy Weather Example:**
- **Title**: "बारिश में गरमागरम चाय की चुस्की! ☔"
- **Body**: "मौसम बारिश का है, मूड मस्ती का! आज घर बैठे ऑर्डर करें और बारिश की बूंदों के साथ स्वाद का मज़ा लें 🌧️🍕"

### **Sunny Weather Example:**
- **Title**: "धूप में ठंडी ठंडी आइसक्रीम! ☀️"
- **Body**: "गर्मी का मौसम है, ठंडक का मज़ा लें! आज आइसक्रीम या कोल्ड ड्रिंक्स ऑर्डर करें और गर्मी को हराएं 🍦🥤"

## 🔍 **Troubleshooting**

### **Common Issues:**

#### **1. "OpenWeather API key not configured"**
- Make sure you've set the OpenWeather API key
- Check if the key is valid and has proper permissions

#### **2. "Gemini API key not configured"**
- Ensure you've set the Gemini API key
- Verify the key is from Google AI Studio

#### **3. "No customer FCM tokens found"**
- Check if your Firestore has orders with FCM tokens
- Tokens should be in: `author.fcmToken`, `fcmToken`, `customer.fcmToken`, or `user.fcmToken`

#### **4. FCM Notifications Not Delivered**
- Verify Firebase project is properly configured
- Check if FCM is enabled in your Firebase project
- Ensure FCM tokens are valid and not expired

### **Debug Commands:**
```bash
# Check API keys
curl http://localhost:3000/api-keys

# Check FCM tokens
curl http://localhost:3000/fcm-tokens

# Test specific FCM token
curl -X POST http://localhost:3000/test-specific-fcm \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Test message"}'
```

## 📊 **Monitoring & Logs**

The service provides detailed logging:
- Weather data fetching status
- AI notification generation progress
- FCM delivery results
- Error details and suggestions

All logs are displayed in the dashboard and console for easy monitoring.

## 🚀 **Ready to Use!**

Once configured, your weather notification service will:
- ✅ Automatically detect rainy weather
- ✅ Generate engaging Bollywood-style notifications in Hindi
- ✅ Send notifications to all customer devices via FCM
- ✅ Provide detailed success/failure reports

Enjoy your automated weather-based marketing notifications! 🌤️🎬📱
