const axios = require('axios');
require('dotenv').config();

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.adminNumbers = (process.env.ADMIN_WHATSAPP_NUMBER || '').split(',').map(num => num.trim()).filter(num => num);
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  async sendTemplateMessage(orderData) {
    try {
      // Check if WhatsApp credentials are configured
      if (!this.accessToken || !this.phoneNumberId || this.adminNumbers.length === 0) {
        console.log('⚠️ WhatsApp credentials not configured. Admin message not sent.');
        console.log('📝 Please configure WhatsApp Business API credentials in .env file.');
        return { success: false, message: 'WhatsApp not configured' };
      }

      // Format order time
      const orderTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Format items for template
      let itemsList = '';
      if (orderData.items && orderData.items.length > 0) {
        itemsList = orderData.items.map(item =>
          `${item.name || item.itemName || 'Item'} x${item.quantity || 1}`
        ).join(', ');

        // Truncate if too long (WhatsApp has character limits for template variables)
        if (itemsList.length > 150) {
          itemsList = itemsList.substring(0, 147) + '...';
        }
      } else {
        itemsList = 'Order items';
      }

      console.log('📱 Sending admin notification using "order" template to:', this.adminNumbers.join(', '));

      const results = [];
      const errors = [];

      for (const adminNumber of this.adminNumbers) {
        // Prepare template message data for admin notification (using 'order' template)
        const templateMessageData = {
          messaging_product: 'whatsapp',
          to: adminNumber,
          type: 'template',
          template: {
            name: 'order',
            language: {
              code: 'en'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: 'Admin'
                  },
                  {
                    type: 'text',
                    text: orderData.orderId || orderData.id || 'N/A'
                  },
                  {
                    type: 'text',
                    text: orderTime
                  },
                  {
                    type: 'text',
                    text: itemsList
                  }
                ]
              }
            ]
          }
        };

        try {
          // Send template message
          const response = await axios.post(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            templateMessageData,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log(`✅ Admin template message sent successfully to ${adminNumber}:`, response.data);
          results.push({ number: adminNumber, success: true, data: response.data });
        } catch (templateError) {
          // If template message fails, fall back to text message
          console.error(`❌ Error sending admin template message to ${adminNumber}:`, templateError.response?.data || templateError.message);
          console.log(`⚠️ Falling back to text message for admin ${adminNumber}...`);
          errors.push({ number: adminNumber, error: templateError });

          // Use the fallback text message method for this specific number
          try {
            const fallbackResult = await this.sendAdminTextMessageToNumber(orderData, adminNumber);
            results.push(fallbackResult);
          } catch (fallbackError) {
            console.error(`❌ Fallback failed for ${adminNumber}`);
          }
        }
      }

      return { success: true, results };

    } catch (error) {
      console.error('❌ Error in admin notification process:', error.response?.data || error.message);
      throw error;
    }
  }

  // Rename original method to be internal helper or keep it as entry point but make it loop?
  // Actually, sendTemplateMessage is the main entry point. 
  // Let's modify sendAdminTextMessage to also handle multiple numbers or accept a specific number.
  // The easiest way is to refactor sendAdminTextMessage to accept an optional number, 
  // or make a new helper `sendAdminTextMessageToNumber` and have `sendAdminTextMessage` loop.

  async sendAdminTextMessage(orderData) {
    const results = [];
    for (const adminNumber of this.adminNumbers) {
      try {
        const result = await this.sendAdminTextMessageToNumber(orderData, adminNumber);
        results.push(result);
      } catch (e) {
        console.error(`Failed to send text message to ${adminNumber}`);
      }
    }
    return { success: true, results };
  }

  async sendAdminTextMessageToNumber(orderData, adminNumber) {
    try {
      // Check if WhatsApp credentials are configured
      if (!this.accessToken || !this.phoneNumberId || !adminNumber) {
        console.log('⚠️ WhatsApp credentials not configured or no number. Message not sent.');
        return { success: false, message: 'WhatsApp not configured' };
      }

      // Create a simple text message as fallback
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

      const messageText = `🆕 *New Pivokart Order!*

📋 *Order ID:* ${orderData.orderId || orderData.id}
👤 *Customer:* ${orderData.customerName || 'N/A'}
💰 *Total Amount:* ${orderData.totalAmount ? `₹${orderData.totalAmount}` : 'N/A'}
📦 *Items:* ${orderData.items ? orderData.items.length : 0}
📞 *Phone:* ${orderData.customerPhone || 'N/A'}
📍 *Address:* ${orderData.deliveryAddress || 'N/A'}
⏰ *Time:* ${timestamp}

${itemsText ? `\n*Order Items:*\n${itemsText}` : ''}

Please check your Pivokart dashboard for more details.`;

      const messageData = {
        messaging_product: 'whatsapp',
        to: adminNumber,
        type: 'text',
        text: {
          body: messageText
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Admin fallback text message sent successfully to ${adminNumber}:`, response.data);
      return { number: adminNumber, success: true, data: response.data };
    } catch (error) {
      console.error(`❌ Error sending admin fallback text message to ${adminNumber}:`, error.response?.data || error.message);

      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('🔑 WhatsApp Access Token is invalid or expired!');
        return { success: false, message: 'Access token expired.' };
      }

      throw error;
    }
  }

  async sendCustomerTemplateMessage(orderData) {
    try {
      // Check if WhatsApp credentials are configured
      if (!this.accessToken || !this.phoneNumberId) {
        console.log('⚠️ WhatsApp credentials not configured. Customer message not sent.');
        return { success: false, message: 'WhatsApp not configured' };
      }

      // Get customer phone number from order data (support nested author.phoneNumber)
      let customerPhone = orderData.customerPhone;
      if (!customerPhone && orderData.author && orderData.author.phoneNumber) {
        customerPhone = orderData.author.phoneNumber;
      }
      if (!customerPhone) {
        console.log('⚠️ Customer phone number not found in order data');
        return { success: false, message: 'Customer phone number not found' };
      }

      // Extract customer name
      const customerName = orderData.customerName || (orderData.author && orderData.author.name) || 'Customer';
      const firstName = customerName.split(' ')[0]; // Get first name only

      // Format order time
      const orderTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // Format items for template
      let itemsList = '';
      if (orderData.items && orderData.items.length > 0) {
        itemsList = orderData.items.map(item =>
          `${item.name || item.itemName || 'Item'} x${item.quantity || 1}`
        ).join(', ');

        // Truncate if too long (WhatsApp has character limits for template variables)
        if (itemsList.length > 150) {
          itemsList = itemsList.substring(0, 147) + '...';
        }
      } else {
        itemsList = 'Your ordered items';
      }

      console.log('📱 Sending template message to customer:', customerPhone);

      // Prepare template message data
      const templateMessageData = {
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'template',
        template: {
          name: 'order',
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: firstName
                },
                {
                  type: 'text',
                  text: orderData.orderId || orderData.id || 'N/A'
                },
                {
                  type: 'text',
                  text: orderTime
                },
                {
                  type: 'text',
                  text: itemsList
                }
              ]
            }
          ]
        }
      };

      try {
        // Send template message
        const response = await axios.post(
          `${this.baseURL}/${this.phoneNumberId}/messages`,
          templateMessageData,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✅ Customer template message sent successfully:', response.data);
        return response.data;
      } catch (templateError) {
        // If template message fails, fall back to text message
        console.error('❌ Error sending template message:', templateError.response?.data || templateError.message);
        console.log('⚠️ Falling back to text message...');

        // Use the fallback text message method
        return await this.sendCustomerTextMessage(orderData);
      }
    } catch (error) {
      console.error('❌ Error in customer notification process:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendCustomerTextMessage(orderData) {
    try {
      // Check if WhatsApp credentials are configured
      if (!this.accessToken || !this.phoneNumberId) {
        console.log('⚠️ WhatsApp credentials not configured. Customer message not sent.');
        return { success: false, message: 'WhatsApp not configured' };
      }

      // Get customer phone number from order data (support nested author.phoneNumber)
      let customerPhone = orderData.customerPhone;
      if (!customerPhone && orderData.author && orderData.author.phoneNumber) {
        customerPhone = orderData.author.phoneNumber;
      }
      if (!customerPhone) {
        console.log('⚠️ Customer phone number not found in order data');
        return { success: false, message: 'Customer phone number not found' };
      }

      // Extract customer first name
      const customerName = orderData.customerName || (orderData.author && orderData.author.name) || 'Customer';
      const firstName = customerName.split(' ')[0]; // Get first name only

      // Create a simple customer notification message
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

      const messageText = `🎉 *Thank you for your Pivokart order!*

Hi ${firstName}! 👋

Your order has been received and is being processed.

📋 *Order ID:* ${orderData.orderId || orderData.id}
💰 *Total Amount:* ${orderData.totalAmount ? `₹${orderData.totalAmount}` : 'N/A'}
⏰ *Order Time:* ${timestamp}

${itemsText ? `\n*Your Order:*\n${itemsText}` : ''}

We'll notify you when your order is ready for delivery! 🚚

Thank you for choosing Pivokart! ❤️`;

      console.log('📱 Sending fallback text message to customer:', customerPhone);

      const messageData = {
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'text',
        text: {
          body: messageText
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Customer fallback text message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending customer fallback text message:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendSimpleMessage({ to, message }) {
    try {
      // Check if WhatsApp credentials are configured
      if (!this.accessToken || !this.phoneNumberId || !this.adminNumber) {
        console.log('⚠️ WhatsApp credentials not configured. Message not sent.');
        console.log('📝 Please configure WhatsApp Business API credentials in .env file.');
        return { success: false, message: 'WhatsApp not configured' };
      }

      const targets = to ? [to] : this.adminNumbers;
      const results = [];

      for (const target of targets) {
        const messageData = {
          messaging_product: 'whatsapp',
          to: target,
          type: 'text',
          text: {
            body: message
          }
        };

        try {
          const response = await axios.post(
            `${this.baseURL}/${this.phoneNumberId}/messages`,
            messageData,
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log(`✅ WhatsApp message sent successfully to ${target}:`, response.data);
          results.push({ number: target, success: true, data: response.data });
        } catch (e) {
          console.error(`❌ Error sending WhatsApp message to ${target}:`, e.message);
          results.push({ number: target, success: false, error: e.message });
        }
      }
      return { success: true, results };
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error.response?.data || error.message);
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.error('🔑 WhatsApp Access Token is invalid or expired!');
        console.error('📝 Please get a new access token from Meta Developer Console:');
        console.error('   1. Go to https://developers.facebook.com/');
        console.error('   2. Navigate to your WhatsApp Business API app');
        console.error('   3. Generate a new access token');
        console.error('   4. Update the WHATSAPP_ACCESS_TOKEN in your .env file');
        return { success: false, message: 'Access token expired. Please get a new token from Meta Developer Console.' };
      }
      throw error;
    }
  }
}

module.exports = WhatsAppService;