// seeders/initialAdmin.js
const User = require('../models/User');

async function seedAdmin() {
  try {
    const exists = await User.countDocuments({ role: 'admin' });

    if (exists > 0) {
      console.log('Admin already exists → skipping');
      return;
    }

    await User.create({
      name:     'Mohsin Admin',
      email:    'admin@mohsinmobiles.com',
      password: 'admin123',
      role:     'admin',
    });

    console.log('====================================');
    console.log('Default admin created:');
    console.log('Email    → admin@mohsinmobiles.com');
    console.log('Password → ChangeMe2026!   ← CHANGE NOW');
    console.log('====================================');
  } catch (err) {
    console.error('Could not create initial admin:');
    console.error(err.message);
  }
}

module.exports = seedAdmin;