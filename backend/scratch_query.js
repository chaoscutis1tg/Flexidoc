import { connectDB } from './src/config/db.js';
import { User } from './src/models/user.model.js';
import mongoose from 'mongoose';

const checkUser = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@gmail.com' }).lean();
    console.log('User document from DB:');
    console.dir(user);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
checkUser();
