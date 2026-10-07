import { connectDB } from './src/config/db.js';
import { User } from './src/models/user.model.js';
import mongoose from 'mongoose';

const createAdmin = async () => {
  try {
    await connectDB();

    const email = 'admin@gmail.com';
    const password = '123456';
    
    // Check if user already exists
    let admin = await User.findOne({ email });

    if (admin) {
      console.log(`User with email ${email} already exists.`);
      // Update password and ensure they are SUPER_ADMIN
      admin.passwordHash = password; // pre('save') will hash this
      admin.role = 'SUPER_ADMIN';
      admin.status = 'ACTIVE';
      await admin.save();
      console.log('Password and role updated for existing admin.');
    } else {
      admin = new User({
        email: email,
        passwordHash: password, // pre('save') will hash this
        fullName: 'System Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      });
      await admin.save();
      console.log('Successfully created admin user!');
    }

    console.log(`
--------------------------------------------------
Admin account is ready:
Email:    ${email}
Password: ${password}
--------------------------------------------------
`);
    
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
