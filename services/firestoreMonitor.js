const { admin } = require('../config/firebase');
const WhatsAppService = require('./whatsappService');

class FirestoreMonitor {
  constructor() {
    this.db = admin.apps.length > 0 ? admin.firestore() : null;
    this.whatsappService = new WhatsAppService();
    this.ordersCollection = process.env.ORDERS_COLLECTION || 'orders';
    this.isListening = false;
  }

  startListening() {
    if (this.isListening) {
      console.log('⚠️ Already listening for orders');
      return;
    }

    if (!this.db) {
      console.log('⚠️ Firebase not initialized. Firestore monitoring disabled.');
      console.log('📝 Please configure Firebase credentials in .env file to enable monitoring.');
      return;
    }

    console.log(`🔍 Starting to monitor Firestore collection: ${this.ordersCollection}`);
    
    this.isListening = true;
    this.startTime = new Date();
    
    // Listen for new documents in the orders collection
    this.db.collection(this.ordersCollection)
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            // Only process orders created after the application started
            const orderCreateTime = change.doc.createTime?.toDate();
            if (orderCreateTime && orderCreateTime > this.startTime) {
              console.log('🆕 New order detected (created after app start)');
              this.handleNewOrder(change.doc);
            } else {
              console.log('⏭️ Skipping old order (created before app start)');
            }
          }
        });
      }, (error) => {
        console.error('❌ Error listening to Firestore:', error);
        this.isListening = false;
      });

    console.log('✅ Firestore monitoring started successfully');
    console.log(`⏰ Only monitoring orders created after: ${this.startTime.toLocaleString()}`);
  }

  async handleNewOrder(docSnapshot) {
    try {
      const orderData = {
        id: docSnapshot.id,
        ...docSnapshot.data(),
        createdAt: docSnapshot.createTime?.toDate() || new Date()
      };

      // Check if notification was already sent for this order
      if (orderData.notificationSent) {
        console.log('⏭️ Skipping order - notification already sent:', orderData.id);
        return;
      }

      console.log('🆕 New order detected:', orderData);

      // Extract order details from the nested structure
      const orderDetails = this.extractOrderDetails(orderData);
      
      // Send WhatsApp notification with extracted details
      await this.sendOrderNotification(orderDetails);

      // Optionally update the document to mark notification as sent
      await this.markNotificationSent(docSnapshot.id);

    } catch (error) {
      console.error('❌ Error handling new order:', error);
    }
  }

  extractOrderDetails(orderData) {
    // Helper to get customer name from author
    function getCustomerName(data) {
      if (data.customerName) return data.customerName;
      if (data.author) {
        if (data.author.firstName || data.author.lastName) {
          return [data.author.firstName, data.author.lastName].filter(Boolean).join(' ').trim();
        }
        if (data.author.name) return data.author.name;
      }
      return 'Customer';
    }
    // Helper to get customer phone from author
    function getCustomerPhone(data) {
      return data.customerPhone || (data.author && data.author.phoneNumber) || '';
    }

    let extractedData = {
      id: orderData.id,
      orderId: orderData.orderId || orderData.id,
      customerName: getCustomerName(orderData),
      totalAmount: 0,
      customerPhone: getCustomerPhone(orderData),
      deliveryAddress: '',
      items: [],
      createdAt: orderData.createdAt
    };

    // If orderId is an object containing order details
    if (orderData.orderId && typeof orderData.orderId === 'object') {
      const orderDetails = orderData.orderId;
      extractedData = {
        ...extractedData,
        customerName: getCustomerName(orderDetails) || extractedData.customerName,
        totalAmount: orderDetails.totalAmount || orderDetails.total_amount || orderDetails.amount || 0,
        customerPhone: getCustomerPhone(orderDetails) || extractedData.customerPhone,
        deliveryAddress: orderDetails.deliveryAddress || orderDetails.delivery_address || orderDetails.address || '',
        items: orderDetails.items || orderDetails.orderItems || [],
        orderStatus: orderDetails.status || orderDetails.orderStatus || 'pending'
      };
    } else {
      // If orderId is just a string, try to get details from other fields
      extractedData = {
        ...extractedData,
        totalAmount: orderData.totalAmount || orderData.total_amount || orderData.amount || 0,
        deliveryAddress: orderData.deliveryAddress || orderData.delivery_address || orderData.address || '',
        items: orderData.items || orderData.orderItems || orderData.products || [],
        orderStatus: orderData.status || orderData.orderStatus || 'pending'
      };
    }

    console.log('📋 Extracted order details:', extractedData);
    return extractedData;
  }

  async sendOrderNotification(orderData) {
    try {
      // Send notification to customer
      console.log('📱 Sending notification to customer...');
      await this.whatsappService.sendCustomerTemplateMessage(orderData);
      console.log('✅ Customer notification sent successfully');

      // Send notification to admin
      console.log('📱 Sending notification to admin...');
      await this.whatsappService.sendTemplateMessage(orderData);
      console.log('✅ Admin notification sent successfully');
    } catch (error) {
      console.log('⚠️ Notification failed:', error.message);
    }
  }

  createSimpleMessage(orderData) {
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata'
    });

    let itemsText = '';
    if (orderData.items && orderData.items.length > 0) {
      itemsText = orderData.items.slice(0, 3).map(item => 
        `• ${item.name || item.itemName || 'Item'} x${item.quantity || 1}`
      ).join('\n');
      if (orderData.items.length > 3) {
        itemsText += `\n• ... and ${orderData.items.length - 3} more items`;
      }
    }

    return `🆕 *New Restaurant Order!*

📋 *Order ID:* ${orderData.orderId || orderData.id}
👤 *Customer:* ${orderData.customerName || 'N/A'}
💰 *Total Amount:* ${orderData.totalAmount ? `₹${orderData.totalAmount}` : 'N/A'}
📦 *Items:* ${orderData.items ? orderData.items.length : 0}
📞 *Phone:* ${orderData.customerPhone || 'N/A'}
📍 *Address:* ${orderData.deliveryAddress || 'N/A'}
⏰ *Time:* ${timestamp}

${itemsText ? `\n*Order Items:*\n${itemsText}` : ''}

Please check your restaurant dashboard for more details.`;
  }

  async markNotificationSent(orderId) {
    try {
      await this.db.collection(this.ordersCollection)
        .doc(orderId)
        .update({
          notificationSent: true,
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`✅ Notification status updated for order: ${orderId}`);
    } catch (error) {
      console.error(`❌ Error updating notification status for order ${orderId}:`, error);
    }
  }

  async getAllCustomerFcmTokens() {
    if (!this.db) {
      console.log('⚠️ Firebase not initialized. Cannot fetch FCM tokens.');
      return [];
    }
    
    try {
    const snapshot = await this.db.collection(this.ordersCollection).get();
    const tokens = new Set();
      
      console.log(`[DEBUG] Scanning ${snapshot.size} documents for FCM tokens...`);
      
    snapshot.forEach(doc => {
      const data = doc.data();
        
        // Check multiple possible locations for FCM tokens
        let fcmToken = null;
        
        // Check author.fcmToken (current structure)
      if (data.author && data.author.fcmToken) {
          fcmToken = data.author.fcmToken;
        }
        // Check direct fcmToken field
        else if (data.fcmToken) {
          fcmToken = data.fcmToken;
        }
        // Check customer.fcmToken
        else if (data.customer && data.customer.fcmToken) {
          fcmToken = data.customer.fcmToken;
        }
        // Check user.fcmToken
        else if (data.user && data.user.fcmToken) {
          fcmToken = data.user.fcmToken;
        }
        
        if (fcmToken && fcmToken.trim() !== '') {
          tokens.add(fcmToken.trim());
          console.log(`[DEBUG] Found FCM token: ${fcmToken.substring(0, 10)}...`);
        }
      });
      
      const tokenArray = Array.from(tokens);
      console.log(`[DEBUG] Total unique FCM tokens found: ${tokenArray.length}`);
      
      return tokenArray;
    } catch (error) {
      console.error('❌ Error fetching FCM tokens:', error);
      return [];
    }
  }

  async sendFcmNotification(tokens, title, body) {
    if (!tokens || tokens.length === 0) {
      console.log('[DEBUG] No FCM tokens provided for notification');
      return { success: false, error: 'No FCM tokens provided' };
    }
    
    if (!admin.apps.length) {
      console.log('[DEBUG] Firebase not initialized, cannot send FCM');
      return { success: false, error: 'Firebase not initialized' };
    }
    
    const message = {
      notification: { 
        title, 
        body 
      },
      // Add data payload for better mobile app handling
      data: {
        title: title,
        body: body,
        timestamp: new Date().toISOString(),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };
    
    try {
      console.log(`[DEBUG] Sending FCM to ${tokens.length} tokens`);
      console.log(`[DEBUG] Message: ${title} - ${body}`);
      
      let results = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const token of tokens) {
        try {
          console.log(`[DEBUG] Sending to token: ${token.substring(0, 10)}...`);
          const response = await admin.messaging().send({ ...message, token });
          results.push({ token: token.substring(0, 10) + '...', success: true, response });
          successCount++;
          console.log(`✅ FCM sent successfully to ${token.substring(0, 10)}...`);
        } catch (err) {
          errorCount++;
          console.error(`❌ FCM error for token ${token.substring(0, 10)}...:`, err.message);
          results.push({ 
            token: token.substring(0, 10) + '...', 
            success: false, 
            error: err.message,
            errorCode: err.code || 'UNKNOWN'
          });
          
          // Handle specific FCM error codes
          if (err.code === 'messaging/invalid-registration-token' || 
              err.code === 'messaging/registration-token-not-registered') {
            console.log(`⚠️ Invalid/expired token detected: ${token.substring(0, 10)}...`);
          }
        }
      }
      
      console.log(`[DEBUG] FCM Summary: ${successCount} successful, ${errorCount} failed`);
      return { 
        success: successCount > 0, 
        results,
        summary: {
          total: tokens.length,
          successful: successCount,
          failed: errorCount
        }
      };
    } catch (error) {
      console.error('[DEBUG] FCM general error:', error.message);
      return { success: false, error: error.message };
    }
  }

  stopListening() {
    if (this.isListening) {
      // Note: Firestore listeners don't have a direct stop method
      // The listener will continue until the process ends
      this.isListening = false;
      console.log('⏹️ Firestore monitoring stopped');
    }
  }

  // Method to get recent orders (for testing)
  async getRecentOrders(limit = 10) {
    try {
      if (!this.db) {
        console.log('⚠️ Firebase not initialized. Cannot fetch orders.');
        return [];
      }

      const snapshot = await this.db.collection(this.ordersCollection)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error fetching recent orders:', error);
      return [];
    }
  }
}

module.exports = FirestoreMonitor; 