import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';
import ParentLayout from './components/layout/ParentLayout';

// Auth Pages
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import ParentLogin from './pages/ParentLogin';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import StudentDetail from './pages/admin/StudentDetail';
import AddStudent from './pages/admin/AddStudent';
import FeesStructure from './pages/admin/FeesStructure';
import AssignFees from './pages/admin/AssignFees';
import PaymentsAdmin from './pages/admin/PaymentsAdmin';
import FeesList from './pages/admin/FeesList';
import LeaveManagement from './pages/admin/LeaveManagement';
import OutpassManagement from './pages/admin/OutpassManagement';
import CheckInOut from './pages/admin/CheckInOut';
import InventoryPage from './pages/admin/InventoryPage';
import ExpensePage from './pages/admin/ExpensePage';
import CircularsAdmin from './pages/admin/CircularsAdmin';
import LibraryAdmin from './pages/admin/LibraryAdmin';
import ShopAdmin from './pages/admin/ShopAdmin';
import StaffManagement from './pages/admin/StaffManagement';
import CoursesPage from './pages/admin/CoursesPage';
import ReportsPage from './pages/admin/ReportsPage';
import WalletAdmin from './pages/admin/WalletAdmin';
import NotificationsPage from './pages/admin/NotificationsPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentFees from './pages/student/StudentFees';
import StudentLedger from './pages/student/StudentLedger';
import StudentLeave from './pages/student/StudentLeave';
import StudentOutpass from './pages/student/StudentOutpass';
import StudentCirculars from './pages/student/StudentCirculars';
import StudentProfile from './pages/student/StudentProfile';
import StudentWallet from './pages/student/StudentWallet';

// Parent Pages
import ParentRegister from './pages/parent/ParentRegister';
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentStudentView from './pages/parent/ParentStudentView';
import ParentFees from './pages/parent/ParentFees';
import ParentPayments from './pages/parent/ParentPayments';
import ParentLedger from './pages/parent/ParentLedger';
import ParentWallet from './pages/parent/ParentWallet';
import ParentLeave from './pages/parent/ParentLeave';
import ParentOutpass from './pages/parent/ParentOutpass';
import ParentCheckIn from './pages/parent/ParentCheckIn';
import ParentCirculars from './pages/parent/ParentCirculars';

import SetPassword from './pages/student/SetPassword';

import { FiAlertOctagon } from './components/common/icons';

// ── Loader ────────────────────────────────────────────────────────────────────
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
  </div>
);

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return children;
};

const ADMIN_ROLES = [
  'super_admin', 'class_teacher', 'hostel_warden',
  'shop_operator', 'canteen_operator', 'librarian',
];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>

          {/* ── Public Routes ─────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/parent/register" element={<ParentRegister />} />
          <Route path="/unauthorized" element={
            <div className="min-h-screen flex flex-col items-center
              justify-center text-gray-600">
              <FiAlertOctagon className="text-6xl mb-4 text-red-500" />
              <p className="text-2xl font-bold mb-2">Access Denied</p>
              <a href="/login"
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg">
                Go to Login
              </a>
            </div>
          } />

          {/* ── Admin Routes ──────────────────────────────────────────── */}
          <Route path="/admin" element={
            <ProtectedRoute roles={ADMIN_ROLES}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/add" element={<AddStudent />} />
            <Route path="students/:id/edit" element={<AddStudent />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="fees/structure" element={<FeesStructure />} />
            <Route path="fees/assign" element={<AssignFees />} />
            <Route path="fees/list" element={<FeesList />} />
            <Route path="payments" element={<PaymentsAdmin />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="outpass" element={<OutpassManagement />} />
            <Route path="checkin" element={<CheckInOut />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="expense" element={<ExpensePage />} />
            <Route path="circulars" element={<CircularsAdmin />} />
            <Route path="library" element={<LibraryAdmin />} />
            <Route path="shop" element={<ShopAdmin />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="wallet" element={<WalletAdmin />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          {/* ── Student Routes ────────────────────────────────────────── */}
          <Route path="/student" element={
            <ProtectedRoute roles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="set-password" element={<SetPassword />} />   {/* ← add this */}
            <Route path="fees" element={<StudentFees />} />
            <Route path="ledger" element={<StudentLedger />} />
            <Route path="leave" element={<StudentLeave />} />
            <Route path="outpass" element={<StudentOutpass />} />
            <Route path="circulars" element={<StudentCirculars />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="wallet" element={<StudentWallet />} />
          </Route>

          {/* ── Parent Routes ─────────────────────────────────────────── */}
          <Route path="/parent" element={
            <ProtectedRoute roles={['parent']}>
              <ParentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ParentDashboard />} />
            <Route path="student" element={<ParentStudentView />} />
            <Route path="fees" element={<ParentFees />} />
            <Route path="payments" element={<ParentPayments />} />
            <Route path="ledger" element={<ParentLedger />} />
            <Route path="wallet" element={<ParentWallet />} />
            <Route path="leave" element={<ParentLeave />} />
            <Route path="outpass" element={<ParentOutpass />} />
            <Route path="checkin" element={<ParentCheckIn />} />
            <Route path="circulars" element={<ParentCirculars />} />
          </Route>

          {/* ── Fallback ──────────────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}