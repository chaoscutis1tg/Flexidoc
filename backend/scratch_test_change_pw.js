import { connectDB } from './src/config/db.js';
import { authService } from './src/services/auth.service.js';
import { User } from './src/models/user.model.js';
import mongoose from 'mongoose';

const test = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@gmail.com' });
    console.log('Testing changePassword...');
    await authService.changePassword(user._id, '123456', '12345678');
    console.log('Successfully changed password');
  } catch (error) {
    console.error('Change Password Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
test();
