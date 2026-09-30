const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/quanlycongviec').then(async () => {
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ $or: [{ username: 'khoadv' }, { email: { $regex: 'khoadv', $options: 'i' } }] });
  console.log('JussStudio:', JSON.stringify(user, null, 2));
  mongoose.disconnect();
}).catch(console.error);
