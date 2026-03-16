import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.model.js';
import Course from '../models/Course.model.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_mgmt');
  console.log('Connected to DB');

  // Super Admin
  const existing = await User.findOne({ phone: '8056712010' });
  if (!existing) {
    await User.create({
      name: 'Super Admin',
      phone: '8056712010',
      email: 'admin@cms.com',
      password: 'Admin123',
      role: 'super_admin',
    });
    console.log('✅ Admin created: 8056712010 / Admin123');
  } else {
    console.log('Admin already exists');
  }

  // Sample Courses
  const courses = [
    { name: 'Bachelor of Computer Applications', code: 'BCA', department: 'Computer Science', duration: 3, semesters: 6 },
    { name: 'Bachelor of Business Administration', code: 'BBA', department: 'Management', duration: 3, semesters: 6 },
    { name: 'Bachelor of Commerce', code: 'BCOM', department: 'Commerce', duration: 3, semesters: 6 },
    { name: 'Master of Computer Applications', code: 'MCA', department: 'Computer Science', duration: 2, semesters: 4 },
  ];
  for (const c of courses) {
    const ex = await Course.findOne({ code: c.code });
    if (!ex) { await Course.create(c); console.log(`✅ Course: ${c.name}`); }
  }

  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}
seed().catch(err => { console.error(err); process.exit(1); });
