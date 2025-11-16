const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if required environment variables are set
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('⚠️ Firebase environment variables not configured. Running in demo mode.');
      console.log('📝 Please set up your .env file with Firebase credentials to enable full functionality.');
      return null;
    }

    // Check if Firebase app is already initialized
    if (admin.apps.length > 0) {
      console.log('✅ Firebase Admin SDK already initialized');
      return admin.firestore();
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Test FCM messaging initialization
    try {
      const messaging = admin.messaging();
      console.log('✅ Firebase Cloud Messaging initialized successfully');
    } catch (fcmError) {
      console.error('❌ FCM initialization error:', fcmError.message);
      console.log('📝 Make sure FCM is enabled in your Firebase project settings');
    }
    
    return admin.firestore();
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    console.log('⚠️ Running in demo mode without Firebase connection.');
    return null;
  }
};

module.exports = { initializeFirebase, admin }; 