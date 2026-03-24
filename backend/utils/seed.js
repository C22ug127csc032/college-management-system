import mongoose from 'mongoose';
import dotenv from 'dotenv';

import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Student from '../models/Student.model.js';

dotenv.config();

const SAMPLE_COURSES = [
  { name: 'Bachelor of Computer Applications', code: 'BCA', department: 'Computer Science', duration: 3, semesters: 6 },
  { name: 'Bachelor of Business Administration', code: 'BBA', department: 'Management Studies', duration: 3, semesters: 6 },
  { name: 'Bachelor of Commerce', code: 'BCOM', department: 'Commerce', duration: 3, semesters: 6 },
  { name: 'Master of Computer Applications', code: 'MCA', department: 'Computer Applications', duration: 2, semesters: 4 },
];

const MALE_FIRST_NAMES = [
  'Arun', 'Bala', 'Charan', 'Deepak', 'Eswar', 'Farhan', 'Gokul', 'Hari', 'Irfan', 'Jai',
  'Kavin', 'Lokesh', 'Madhan', 'Naveen', 'Pranav', 'Rahul', 'Sanjay', 'Tarun', 'Varun', 'Yash',
];

const FEMALE_FIRST_NAMES = [
  'Anitha', 'Bhavya', 'Chitra', 'Divya', 'Esha', 'Fathima', 'Gayathri', 'Harini', 'Ishwarya', 'Janani',
  'Kirthika', 'Lavanya', 'Monisha', 'Nandhini', 'Pavithra', 'Rithika', 'Sangeetha', 'Tharani', 'Vaishnavi', 'Yamuna',
];

const LAST_NAMES = [
  'Kumar', 'Raj', 'Shankar', 'Prasad', 'Raman', 'Krishnan', 'Narayan', 'Babu', 'Sundar', 'Mohan',
  'Devi', 'Priya', 'Lakshmi', 'Meena', 'Selvi', 'Rani', 'Mary', 'Begum', 'Balan', 'Vel',
];

const today = new Date();
const currentYear = today.getFullYear();

const formatNumber = (value, size = 3) => String(value).padStart(size, '0');

const buildBatchLabel = duration => `${currentYear}-${currentYear + duration}`;

const buildAdmissionNo = globalIndex => `ADM${currentYear}${formatNumber(globalIndex, 4)}`;

const buildPhone = globalIndex => `9${String(600000000 + globalIndex).padStart(9, '0')}`;
const buildParentPhone = globalIndex => `8${String(500000000 + globalIndex).padStart(9, '0')}`;

const pickName = (index, gender) => ({
  firstName: (gender === 'Female' ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES)[
    index % (gender === 'Female' ? FEMALE_FIRST_NAMES.length : MALE_FIRST_NAMES.length)
  ],
  lastName: LAST_NAMES[Math.floor(index / FIRST_NAME_POOL_SIZE) % LAST_NAMES.length],
});

const FIRST_NAME_POOL_SIZE = Math.max(MALE_FIRST_NAMES.length, FEMALE_FIRST_NAMES.length);

async function ensureSuperAdmin() {
  const existing = await User.findOne({ phone: '8056712010' });

  if (existing) {
    console.log('Admin already exists');
    return existing;
  }

  const admin = await User.create({
    name: 'CMS',
    phone: '8056712010',
    email: 'admin@cms.com',
    password: 'Admin@123',
    role: 'super_admin',
  });

  console.log('Admin created: 8056712010 / Admin@123');
  return admin;
}

async function ensureCourses() {
  const createdCourses = [];

  for (const courseData of SAMPLE_COURSES) {
    let course = await Course.findOne({ code: courseData.code });

    if (!course) {
      course = await Course.create({
        ...courseData,
        maxStrength: 60,
        sectionsPerYear: 2,
      });
      console.log(`Created course: ${course.code}`);
    } else {
      console.log(`Course already exists: ${course.code}`);
    }

    createdCourses.push(course);
  }

  return createdCourses;
}

async function createStudentWithLogin({ course, courseIndex, sequenceNumber, globalIndex }) {
  const gender = sequenceNumber <= 30 ? 'Male' : 'Female';
  const { firstName, lastName } = pickName(globalIndex - 1, gender);
  const semester = 1;
  const admissionNo = buildAdmissionNo(globalIndex);
  const phone = buildPhone(globalIndex);
  const email = `${admissionNo.toLowerCase()}@cms.local`;
  const parentPhone = buildParentPhone(globalIndex);
  const batch = buildBatchLabel(course.duration || 3);
  const admissionDate = new Date(currentYear, 5, (globalIndex % 27) + 1);

  const student = await Student.create({
    admissionNo,
    firstName,
    lastName,
    dob: new Date(2005, globalIndex % 12, (globalIndex % 27) + 1),
    gender,
    bloodGroup: ['A+', 'B+', 'O+', 'AB+'][globalIndex % 4],
    category: ['General', 'OBC', 'SC', 'ST', 'EWS'][globalIndex % 5],
    nationality: 'Indian',
    address: {
      street: `${globalIndex} College Street`,
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: `600${formatNumber(globalIndex % 999, 3)}`,
    },
    phone,
    email,
    father: {
      name: `${LAST_NAMES[(globalIndex + 3) % LAST_NAMES.length]} Father`,
      phone: parentPhone,
      occupation: 'Business',
    },
    mother: {
      name: `${LAST_NAMES[(globalIndex + 7) % LAST_NAMES.length]} Mother`,
      phone: `7${String(400000000 + globalIndex).padStart(9, '0')}`,
      occupation: 'Teacher',
    },
    guardian: {
      name: `${firstName} Guardian`,
      relation: 'Uncle',
      phone: `6${String(300000000 + globalIndex).padStart(9, '0')}`,
    },
    annualIncome: ['', 'below_1L', '1L_3L', '3L_6L', '6L_10L', 'above_10L'][globalIndex % 6],
    course: course._id,
    semester,
    admissionDate,
    academicYear: `${currentYear}-${currentYear + 1}`,
    batch,
    admissionType: ['management', 'government', 'nri', 'lateral'][globalIndex % 4],
    isHosteler: globalIndex % 5 === 0,
    hostelRoom: globalIndex % 5 === 0 ? `H-${courseIndex + 1}${formatNumber(sequenceNumber, 2)}` : '',
    status: 'admission_pending',
  });

  const user = await User.create({
    name: `${firstName} ${lastName}`,
    email,
    phone,
    password: admissionNo,
    role: 'student',
    isFirstLogin: true,
    studentRef: student._id,
  });

  student.userRef = user._id;
  await student.save();
}

async function ensureStudentsForCourse(course, courseIndex) {
  const existingCount = await Student.countDocuments({ course: course._id });
  const targetCount = 60;

  if (existingCount >= targetCount) {
    console.log(`${course.code}: already has ${existingCount} students`);
    return;
  }

  console.log(`${course.code}: creating ${targetCount - existingCount} students`);

  for (let sequenceNumber = existingCount + 1; sequenceNumber <= targetCount; sequenceNumber += 1) {
    const globalIndex = courseIndex * targetCount + sequenceNumber;
    await createStudentWithLogin({
      course,
      courseIndex,
      sequenceNumber,
      globalIndex,
    });
  }
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_mgmt');
  console.log('Connected to DB');

  await ensureSuperAdmin();
  const courses = await ensureCourses();

  for (const [courseIndex, course] of courses.entries()) {
    await ensureStudentsForCourse(course, courseIndex);
  }

  console.log('\nSeeding complete');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
