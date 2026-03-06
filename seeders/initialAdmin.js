// seeders/initialAdmin.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  try {

    const exists = await User.countDocuments({ role: 'admin' });

    if (exists > 0) {
      console.log('Admin already exists → skipping');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create({
      name: 'Mohsin Admin',
      email: 'admin@mohsinmobiles.com',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('====================================');
    console.log('Default admin created:');
    console.log('Email    → admin@mohsinmobiles.com');
    console.log('Password → admin123');
    console.log('====================================');

  } catch (err) {
    console.error('Could not create initial admin:');
    console.error(err.message);
  }
}

module.exports = seedAdmin;