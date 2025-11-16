# 🔥 Firebase Cloud Messaging (FCM) Troubleshooting Guide

## 🚨 Common FCM Issues & Solutions

### 1. **No FCM Tokens Found**

**Problem**: `No customer FCM tokens found` error

**Solutions**:
- Check your Firestore data structure - FCM tokens should be in one of these fields:
  - `author.fcmToken`
  - `fcmToken` 
  - `customer.fcmToken`
  - `user.fcmToken`

**Debug Steps**:
1. Visit `http://localhost:3000/fcm-tokens` to see how many tokens are found
2. Check your Firestore console to verify token storage
3. Ensure tokens are valid FCM registration tokens

### 2. **Firebase Not Initialized**

**Problem**: `Firebase not initialized` error

**Solutions**:
- Verify your `.env` file has correct Firebase credentials:
  ```
  FIREBASE_PROJECT_ID=your-project-id
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
  ```

### 3. **FCM Not Enabled in Firebase Project**

**Problem**: FCM initialization fails

**Solutions**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Cloud Messaging**
4. Enable Firebase Cloud Messaging
5. Generate a new server key if needed

### 4. **Invalid/Expired FCM Tokens**

**Problem**: `messaging/invalid-registration-token` errors

**Solutions**:
- FCM tokens expire and need to be refreshed by mobile apps
- Check if your mobile app is properly refreshing tokens
- Remove expired tokens from your database

### 5. **Service Account Permissions**

**Problem**: Permission denied errors

**Solutions**:
1. Go to Firebase Console → **Project Settings** → **Service Accounts**
2. Generate a new private key
3. Ensure the service account has these roles:
   - Firebase Admin SDK Administrator Service Agent
   - Cloud Messaging Admin

## 🛠️ Debugging Tools

### New Debug Endpoints Added:

1. **Test FCM Notification**:
   ```
   POST /test-fcm
   Body: { "title": "Test", "body": "Test message" }
   ```

2. **Get FCM Tokens**:
   ```
   GET /fcm-tokens
   ```

3. **Enhanced Weather Notification**:
   ```
   POST /weather-notification
   Body: { "city": "Delhi,IN" }
   ```

### Console Logging

The updated code now provides detailed logging:
- Token discovery process
- FCM sending attempts
- Success/failure counts
- Specific error codes

## 📱 Mobile App Requirements

For FCM to work, your mobile app must:

1. **Register for FCM tokens**:
   ```javascript
   // Flutter example
   String? token = await FirebaseMessaging.instance.getToken();
   ```

2. **Store tokens in Firestore**:
   ```javascript
   // When user places order
   await firestore.collection('restaurant_orders').add({
     // ... order data
     author: {
       fcmToken: token,
       // ... other user data
     }
   });
   ```

3. **Handle token refresh**:
   ```javascript
   // Flutter example
   FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
     // Update token in your database
   });
   ```

## 🔍 Testing Steps

1. **Check Firebase Connection**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check FCM Tokens**:
   ```bash
   curl http://localhost:3000/fcm-tokens
   ```

3. **Test FCM Notification**:
   ```bash
   curl -X POST http://localhost:3000/test-fcm \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","body":"Hello FCM!"}'
   ```

4. **Test Weather Notification**:
   ```bash
   curl -X POST http://localhost:3000/weather-notification \
     -H "Content-Type: application/json" \
     -d '{"city":"Delhi,IN"}'
   ```

## 📊 Expected Response Format

**Success Response**:
```json
{
  "success": true,
  "fcmResult": {
    "success": true,
    "summary": {
      "total": 5,
      "successful": 4,
      "failed": 1
    },
    "results": [
      {
        "token": "abc123...",
        "success": true,
        "response": "..."
      }
    ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "No customer FCM tokens found",
  "suggestion": "Make sure your orders have FCM tokens..."
}
```

## 🎯 Quick Fix Checklist

- [ ] Firebase project has FCM enabled
- [ ] Service account has proper permissions
- [ ] `.env` file has correct Firebase credentials
- [ ] Firestore documents contain valid FCM tokens
- [ ] Mobile app is generating and storing tokens
- [ ] Test with the new debug endpoints

## 🆘 Still Having Issues?

1. Check the console logs for detailed error messages
2. Use the new debug endpoints to isolate the problem
3. Verify your Firebase project settings
4. Test with a simple FCM token to rule out token issues
5. Check if your mobile app is properly configured for FCM
