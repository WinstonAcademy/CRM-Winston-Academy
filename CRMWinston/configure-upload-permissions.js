const { exec } = require('child_process');

console.log('🔧 Configuring Strapi upload permissions...');
console.log('');
console.log('📋 Manual steps required:');
console.log('');
console.log('1. Open Strapi Admin Panel: http://localhost:1337/admin');
console.log('2. Log in with your admin credentials');
console.log('3. Go to Settings > Roles & Permissions');
console.log('4. Click on "Public" role');
console.log('5. Under "Upload" section, enable:');
console.log('   - Upload');
console.log('   - Get uploads');
console.log('6. Click "Save"');
console.log('');
console.log('OR for Authenticated users:');
console.log('1. Go to Settings > Roles & Permissions');
console.log('2. Click on "Authenticated" role');
console.log('3. Under "Upload" section, enable:');
console.log('   - Upload');
console.log('   - Get uploads');
console.log('4. Click "Save"');
console.log('');
console.log('This will allow authenticated users to upload files.');
console.log('');
console.log('🌐 Opening Strapi Admin Panel...');

// Open the admin panel
exec('open http://localhost:1337/admin', (error) => {
  if (error) {
    console.log('❌ Could not open browser automatically. Please manually go to: http://localhost:1337/admin');
  } else {
    console.log('✅ Admin panel opened in browser');
  }
});
