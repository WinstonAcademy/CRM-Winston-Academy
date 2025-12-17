// Simple test using curl since we're in Node.js environment
const { exec } = require('child_process');

function testUpload() {
  console.log('🔍 Testing Strapi upload endpoint...');
  
  // Test with curl
  exec('curl -X POST http://localhost:1337/api/upload -v', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    console.log('📊 Response:', stdout);
    console.log('📊 Error output:', stderr);
  });
}

testUpload();
