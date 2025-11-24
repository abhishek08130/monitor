require('dotenv').config();

console.log('📋 Current WhatsApp Configuration:\n');
console.log('Admin Number:', process.env.ADMIN_WHATSAPP_NUMBER);
console.log('Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
console.log('Access Token:', process.env.WHATSAPP_ACCESS_TOKEN ? 'Configured ✅' : 'Not configured ❌');

console.log('\n📱 Admin notifications will be sent to:', process.env.ADMIN_WHATSAPP_NUMBER);
console.log('\nIf this is not your number, update ADMIN_WHATSAPP_NUMBER in .env file');
