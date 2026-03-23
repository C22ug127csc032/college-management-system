import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.model.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_mgmt');
  console.log('Connected to DB');

  // Super Admin
  const existing = await User.findOne({ phone: '8056712010' });
  if (!existing) {
    await User.create({
      name: 'CMS',
      phone: '8056712010',
      email: 'admin@cms.com',
      password: 'Admin@123',
      role: 'super_admin',
    });
    console.log('✅ Admin created: 8056712010 / Admin@123');
  } else {
    console.log('Admin already exists');
  }

  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}
seed().catch(err => { console.error(err); process.exit(1); });
