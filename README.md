# 🎓 College Management System

A production-grade, full-stack College Management System built with **Node.js + Express + MongoDB (Mongoose)** for the backend and **React + Tailwind CSS** for the frontend. MVC architecture throughout.

---

## 🏗️ Project Structure

```
college-mgmt/
├── backend/                    # Node.js + Express + Mongoose
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── razorpay.js         # Razorpay config
│   ├── controllers/            # Business logic (MVC Controllers)
│   │   ├── auth.controller.js
│   │   ├── student.controller.js
│   │   ├── fees.controller.js
│   │   ├── payment.controller.js
│   │   ├── leave.controller.js
│   │   ├── outpass.controller.js
│   │   ├── checkin.controller.js
│   │   ├── inventory.controller.js
│   │   ├── misc.controller.js  # Expense, Circular, Library, Shop, Canteen
│   │   └── report.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT protect + role authorization
│   │   └── upload.middleware.js# Multer file upload
│   ├── models/                 # Mongoose Models (MVC Models)
│   │   ├── User.model.js
│   │   ├── Student.model.js
│   │   ├── Course.model.js
│   │   ├── FeesStructure.model.js
│   │   ├── StudentFees.model.js
│   │   ├── Payment.model.js
│   │   ├── Ledger.model.js
│   │   ├── Leave.model.js
│   │   ├── Outpass.model.js
│   │   ├── CheckIn.model.js
│   │   ├── Inventory.model.js
│   │   ├── Expense.model.js
│   │   ├── Circular.model.js
│   │   ├── Library.model.js
│   │   ├── Shop.model.js
│   │   └── Notification.model.js
│   ├── routes/                 # Express Routers (MVC Routes/Views layer)
│   │   ├── auth.routes.js
│   │   ├── student.routes.js
│   │   ├── fees.routes.js
│   │   ├── payment.routes.js
│   │   ├── ledger.routes.js
│   │   ├── leave.routes.js
│   │   ├── outpass.routes.js
│   │   ├── checkin.routes.js
│   │   ├── inventory.routes.js
│   │   ├── expense.routes.js
│   │   ├── circular.routes.js
│   │   ├── library.routes.js
│   │   ├── shop.routes.js
│   │   ├── canteen.routes.js
│   │   ├── staff.routes.js
│   │   ├── course.routes.js
│   │   └── report.routes.js
│   ├── utils/
│   │   ├── notifications.js    # SMS (Twilio) + Email (Nodemailer)
│   │   ├── pdfGenerator.js     # Payment receipt PDF (PDFKit)
│   │   ├── cronJobs.js         # Due-date alert cron job
│   │   └── seed.js             # DB seeder
│   ├── uploads/                # File uploads (auto-created)
│   ├── server.js               # Entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                   # React + Tailwind CSS
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── axios.js        # Axios instance + interceptors
    │   ├── components/
    │   │   ├── common/
    │   │   │   └── index.jsx   # Spinner, Modal, Table, StatusBadge, StatCard...
    │   │   └── layout/
    │   │       ├── AdminLayout.jsx   # Sidebar nav for admin
    │   │       └── StudentLayout.jsx # Sidebar nav for student
    │   ├── context/
    │   │   └── AuthContext.jsx  # Auth state + login/logout
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── admin/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── Students.jsx
    │   │   │   ├── StudentDetail.jsx
    │   │   │   ├── AddStudent.jsx
    │   │   │   ├── FeesStructure.jsx
    │   │   │   ├── AssignFees.jsx
    │   │   │   ├── FeesList.jsx
    │   │   │   ├── PaymentsAdmin.jsx
    │   │   │   ├── LeaveManagement.jsx
    │   │   │   ├── OutpassManagement.jsx
    │   │   │   ├── CheckInOut.jsx
    │   │   │   ├── InventoryPage.jsx
    │   │   │   ├── ExpensePage.jsx
    │   │   │   ├── CircularsAdmin.jsx
    │   │   │   ├── LibraryAdmin.jsx
    │   │   │   ├── ShopAdmin.jsx
    │   │   │   ├── StaffManagement.jsx
    │   │   │   ├── CoursesPage.jsx
    │   │   │   └── ReportsPage.jsx
    │   │   └── student/
    │   │       ├── StudentDashboard.jsx
    │   │       ├── StudentFees.jsx      # Razorpay online payment
    │   │       ├── StudentLedger.jsx
    │   │       ├── StudentLeave.jsx
    │   │       ├── StudentOutpass.jsx
    │   │       ├── StudentCirculars.jsx
    │   │       └── StudentProfile.jsx
    │   ├── App.jsx              # Router + Protected Routes
    │   ├── index.js
    │   └── index.css            # Tailwind + custom utilities
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, Razorpay keys, etc.
```

### 3. Seed the Database

```bash
cd backend
node utils/seed.js
```

This creates:
- **Super Admin** → Phone: `9999999999` | Password: `admin123`
- Sample courses (BCA, BBA, BCOM, MCA)

### 4. Run Development

```bash
# Terminal 1 – Backend (port 5000)
cd backend
npm run dev

# Terminal 2 – Frontend (port 3000)
cd frontend
npm start
```

### 5. Open Browser
- **Admin Portal** → http://localhost:3000/admin
- **Student Portal** → http://localhost:3000/student

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access to all modules |
| `class_teacher` | Students, Leave approval, Circulars |
| `hostel_warden` | Outpass, CheckIn/Out |
| `shop_operator` | Shop module |
| `canteen_operator` | Canteen module |
| `librarian` | Library module |
| `student` | Student portal only |

---

## 📦 Modules

| # | Module | Features |
|---|--------|---------|
| 1 | Student Management | Auto Reg No, Full Profile, Parent Details, Course Allocation |
| 2 | Fees Management | Custom Fee Heads, Installments, Fine, Advance Payment |
| 3 | Online Payments | Razorpay Integration (Sandbox), Receipt PDF |
| 4 | Student Ledger | Debit/Credit entries, Running balance |
| 5 | Leave Management | Apply → Approve/Reject → SMS notification |
| 6 | Outpass Management | Request → Approve → Return tracking |
| 7 | Check-In/Out | Gate/Hostel movement + Parent SMS |
| 8 | Inventory | Academic/Hostel/General stock with transactions |
| 9 | Expense | Category-wise expense with reports |
| 10 | Circulars | Publish announcements, exam schedules, events |
| 11 | Library | Book catalog, Issue/Return, Fine calculation |
| 12 | Shop & Canteen | Billing, Credit/Prepaid, Daily sales |
| 13 | Reports | Dashboard, Fee reports, Payment reports, Expense reports |
| 14 | Staff Management | All roles with activation control |
| 15 | Courses | Course CRUD with teacher assignment |

---

## 💳 Razorpay (Sandbox)

1. Create account at https://razorpay.com
2. Go to Settings → API Keys → Generate Test Key
3. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=your_test_secret
   ```

---

## 📱 SMS (Twilio)

1. Create account at https://twilio.com
2. Add to `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE=+1234567890
   ```
> If not configured, SMS is **mocked** (logged to console).

---

## 📧 Email (Gmail SMTP)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password   # Use Gmail App Password
```

---

## 🏗️ MVC Architecture

```
Request → Route (routes/) → Controller (controllers/) → Model (models/) → Response
                                     ↕
                              Middleware (middleware/)
                              Utils (utils/)
```

---

## 🌐 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/students | List students |
| POST | /api/students | Create student |
| POST | /api/fees/structure | Create fee structure |
| POST | /api/fees/assign | Assign fees to student |
| POST | /api/payments/create-order | Razorpay order |
| POST | /api/payments/verify | Verify payment |
| POST | /api/payments/manual | Manual payment |
| GET | /api/payments/receipt/:id | Download PDF receipt |
| GET | /api/ledger/student/:id | Student ledger |
| POST | /api/leave | Apply leave |
| PUT | /api/leave/:id/status | Approve/reject leave |
| POST | /api/outpass | Request outpass |
| PUT | /api/outpass/:id/status | Approve/reject outpass |
| POST | /api/checkin | Record check-in/out |
| GET | /api/reports/dashboard | Dashboard stats |

---

## 🔐 Security Features
- JWT Authentication (7-day tokens)
- Role-based Authorization
- Password hashing (bcrypt, 12 rounds)
- File upload validation (type + size)
- CORS configured for frontend URL

---

## 📋 Tech Stack

**Backend:** Node.js, Express.js, Mongoose, JWT, Multer, PDFKit, Razorpay, Nodemailer, Twilio, node-cron

**Frontend:** React 18, React Router v6, Tailwind CSS, Chart.js, Axios, react-hot-toast

**Database:** MongoDB

---

*Built with ❤️ for educational institutions*
