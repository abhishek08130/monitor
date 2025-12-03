# 🛍️ Firestore WhatsApp Notifier

A Node.js application that monitors Firestore database for new orders and automatically sends WhatsApp template messages to admin using WhatsApp Business API.

## ✨ Features

- 🔍 **Real-time Firestore Monitoring**: Listens for new documents in the orders collection
- 📱 **WhatsApp Template Messages**: Sends structured notifications using WhatsApp Business API
- 🎨 **Beautiful Web Interface**: Modern dashboard to monitor system status and test notifications
- 🔄 **Fallback System**: Falls back to simple text messages if template fails
- 📊 **Order Tracking**: Marks notifications as sent and tracks order status
- 🛡️ **Error Handling**: Robust error handling and logging

## 🚀 Quick Start

### Prerequisites

- Node.js v16.x (required)
- Firebase project with Firestore enabled
- WhatsApp Business API access
- Service account key from Firebase

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

   # WhatsApp Business API Configuration
   WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX

   # Application Configuration
   PORT=3000
   ORDERS_COLLECTION=orders
   
   # API Keys for Weather Service
   OPENWEATHER_API_KEY=your_openweather_api_key
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   
   # Session Configuration
   SESSION_SECRET=your-secret-key-here
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Access the dashboard:**
   Open http://localhost:3000 in your browser

## 🔧 Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate new private key
6. Download the JSON file and extract the values

### WhatsApp Business API Setup

1. Create a Meta Developer account
2. Set up WhatsApp Business API
3. Get your access token and phone number ID
4. Create a message template named `adminnotify`

#### WhatsApp Template Structure

Create a template named `adminnotify` with your desired message content. This template will be sent without any variables when a new order is detected.

Example template body:
```
New order received! Please check your dashboard for details.
```

## 📱 WhatsApp Template Message

The application sends structured messages with order details:

**Template Message:**
- Template name: `adminnotify`
- No variables required

**Fallback Simple Message:**
```
🆕 New Order Received!

📋 Order ID: ORD-001
👤 Customer: John Doe
💰 Amount: ₹1500
📦 Items: 3
📞 Phone: +91XXXXXXXXXX
📍 Address: 123 Main St, City
⏰ Time: 2024-01-15 14:30:00

Please check your dashboard for more details.
```

## 🗂️ Firestore Data Structure

Expected order document structure:
```javascript
{
  orderId: "ORD-001",
  customerName: "John Doe",
  customerPhone: "+91XXXXXXXXXX",
  deliveryAddress: "123 Main St, City",
  totalAmount: 1500,
  items: [
    {
      name: "Product 1",
      quantity: 2,
      price: 500
    }
  ],
  createdAt: Timestamp,
  status: "pending"
}
```

## 🛠️ API Endpoints

- `GET /` - Web dashboard
- `POST /test-notification` - Send test WhatsApp notification
- `GET /recent-orders` - Get recent orders from Firestore
- `GET /health` - Health check endpoint

## 📊 Monitoring

The application provides real-time monitoring through:

1. **Console Logs**: Detailed logging of all operations
2. **Web Dashboard**: Visual interface showing system status
3. **Health Checks**: API endpoint for monitoring systems

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Connection Error:**
   - Verify service account credentials
   - Check project ID and permissions

2. **WhatsApp API Error:**
   - Verify access token and phone number ID
   - Check template name and parameters
   - Ensure admin number is in correct format

3. **Template Message Fails:**
   - The app automatically falls back to simple text messages
   - Check template approval status in Meta Developer Console

### Logs

Check console output for detailed error messages:
```bash
npm start
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables for Production
- Set all environment variables in your hosting platform
- Ensure Firebase service account has proper permissions
- Configure WhatsApp Business API for production use

## 📝 License

MIT License - feel free to use this project for your business needs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Firebase and WhatsApp API documentation
- Create an issue in the repository

---

**Made with ❤️ for seamless order management** 