// promote-admin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const targetEmail = process.env.ADMIN_EMAIL || 'benitcbabu@gmail.com';

(async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined. Set it in your .env file.');
    }

    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });

    const result = await User.findOneAndUpdate(
      { email: targetEmail },
      { role: 'admin' },
      { new: true }
    );

    if (!result) {
      console.log(`No user found with email ${targetEmail}`);
    } else {
      console.log(`Promoted user ${result.email} to admin.`);
    }
  } catch (error) {
    console.error('Failed to promote user:', error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
