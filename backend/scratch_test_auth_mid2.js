import { connectDB } from './src/config/db.js';
import { User } from './src/models/user.model.js';
import { Organization } from './src/models/organization.model.js';
import { userRepository } from './src/repositories/user.repository.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';
import mongoose from 'mongoose';

const testAuth = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@gmail.com' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, organizationId: null }, config.jwtSecret);
    
    console.log('Verifying token...');
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log('Fetching user...');
    const fetchedUser = await userRepository.findById(decoded.id, null, { populate: 'organizationId' });
    
    console.log('Success!', fetchedUser._id);
  } catch (error) {
    console.error('Inner Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
testAuth();
