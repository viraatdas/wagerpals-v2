import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testPushNotification() {
  console.log('🔔 Testing Push Notifications...\n');
  console.log(`Target: ${BASE_URL}`);
  console.log('');

  try {
    const payload = {
      title: '🧪 Test Notification',
      body: 'This is a test push notification from WagerPals!',
      url: '/',
      tag: 'test-notification',
    };

    console.log('Sending test notification...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('');

    const response = await fetch(`${BASE_URL}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log('');
      console.log('Results:');
      console.log(`  - Sent successfully: ${data.success || 0}`);
      console.log(`  - Failed: ${data.failed || 0}`);
      console.log('');
      
      if (data.success === 0) {
        console.log('⚠️  No subscribers found!');
        console.log('');
        console.log('To test:');
        console.log('1. Open your app in a browser');
        console.log('2. Click "Enable" on the notification prompt');
        console.log('3. Grant notification permission');
        console.log('4. Run this script again');
      } else {
        console.log('🎉 Notification sent! Check your browser/device.');
      }
    } else {
      console.error('❌ Error:', data.error);
      console.error('Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to send test notification:');
    console.error(error);
    console.log('');
    console.log('Make sure your server is running:');
    console.log('  npm run dev');
  }
}

// Run the test
testPushNotification();

