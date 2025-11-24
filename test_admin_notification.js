const axios = require('axios');

async function testAdminNotification() {
    try {
        console.log('🧪 Testing admin notification...\n');

        const response = await axios.post('http://localhost:3000/test-notification');

        console.log('✅ Response received:');
        console.log('Success:', response.data.success);
        console.log('Message:', response.data.message);

        console.log('\n📱 Customer Result:');
        console.log('  Messaging Product:', response.data.customerResult?.messaging_product);
        console.log('  Messages:', response.data.customerResult?.messages?.length || 0);

        console.log('\n📱 Admin Result:');
        console.log('  Messaging Product:', response.data.adminResult?.messaging_product);
        console.log('  Messages:', response.data.adminResult?.messages?.length || 0);

        if (response.data.adminResult?.messages) {
            console.log('  Message ID:', response.data.adminResult.messages[0]?.id);
        }

        console.log('\n✅ Test completed successfully!');
        console.log('Check WhatsApp on: 919758911480');

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testAdminNotification();
