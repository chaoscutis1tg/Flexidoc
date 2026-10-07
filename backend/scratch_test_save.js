import { connectDB } from './src/config/db.js';
import { User } from './src/models/user.model.js';
import mongoose from 'mongoose';
import { authService } from './src/services/auth.service.js';

const testChange = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@gmail.com' });
    console.log('User before save:', user);
    user.passwordHash = 'newhash';
    await user.save();
    console.log('User saved successfully');
  } catch (error) {
    console.error('Save error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
testChange();
