import { connectDB } from './src/config/db.js';
import { User } from './src/models/user.model.js';
import { authMiddleware } from './src/middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';
import { config } from './src/config/env.js';
import mongoose from 'mongoose';

const testAuth = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'admin@gmail.com' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, organizationId: null }, config.jwtSecret);
    
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = (err) => {
      if (err) console.error('Next called with error:', err);
      else console.log('Auth middleware succeeded, req.user:', req.user._id);
    };
    
    await authMiddleware(req, res, next);
  } catch (error) {
    console.error('Middleware Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};
testAuth();
