import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import OperatorLayout from './components/layout/OperatorLayout';
import StudentLayout from './components/layout/StudentLayout';
import ParentLayout from './components/layout/ParentLayout';

// Auth Pages
import Login from './pages/Login';
import OperatorLogin from './pages/OperatorLogin';
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
import CheckInOut from './pages/admin/CheckInOut';
import InventoryPage from './pages/admin/InventoryPage';
import { CircularsAdmin, CoursesPage, ExpensePage, LibraryAdmin, OutpassManagement, StaffManagement } from './pages/admin/AdminPages';
import LibraryDashboard from './pages/admin/LibraryDashboard';
import HostelWardenDashboard from './pages/admin/HostelWardenDashboard';
import ReportsPage from './pages/admin/ReportsPage';
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

import CanteenOperator from './pages/admin/CanteenOperator';
import ShopOperator from './pages/admin/ShopOperator';

import { FiAlertOctagon } from './components/common/icons';
import { getHomePathForRole, OPERATOR_ROLES } from './utils/authRedirect';

// ── Loader ────────────────────────────────────────────────────────────────────
const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
  </div>
);

// ── Protected Route ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles, redirectTo = '/login' }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to={redirectTo} replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/unauthorized" replace />;
  return children;
};

const ADMIN_ROLES = [
  'super_admin', 'admin', 'class_teacher', 'hostel_warden', 'librarian',
];

const RoleHomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getHomePathForRole(user?.role)} replace />;
};

const AdminHome = () => {
  const { user } = useAuth();
  if (user?.role === 'class_teacher') {
    return <Navigate to="/admin/students" replace />;
  }
  if (user?.role === 'librarian') {
    return <Navigate to="/admin/library/dashboard" replace />;
  }
  if (user?.role === 'hostel_warden') {
    return <Navigate to="/admin/hostel/dashboard" replace />;
  }
  return <Dashboard />;
};

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>

          {/* ── Public Routes ─────────────────────────────────────────── */}
          <Route path="/login" element={<StudentLogin />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/operator/login" element={<OperatorLogin />} />
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
            <Route index element={<AdminHome />} />
            <Route path="students" element={<Students />} />
            <Route path="students/add" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <AddStudent />
              </ProtectedRoute>
            } />
            <Route path="students/:id/edit" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <AddStudent />
              </ProtectedRoute>
            } />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="fees/structure" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <FeesStructure />
              </ProtectedRoute>
            } />
            <Route path="fees/assign" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <AssignFees />
              </ProtectedRoute>
            } />
            <Route path="fees/list" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <FeesList />
              </ProtectedRoute>
            } />
            <Route path="payments" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <PaymentsAdmin />
              </ProtectedRoute>
            } />
            <Route path="leave" element={
              <ProtectedRoute roles={['super_admin', 'admin', 'class_teacher']}>
                <LeaveManagement />
              </ProtectedRoute>
            } />
            <Route path="outpass" element={
              <ProtectedRoute roles={['super_admin', 'admin', 'hostel_warden']}>
                <OutpassManagement />
              </ProtectedRoute>
            } />
            <Route path="checkin" element={
              <ProtectedRoute roles={['super_admin', 'admin', 'hostel_warden', 'class_teacher']}>
                <CheckInOut />
              </ProtectedRoute>
            } />
            <Route path="inventory" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <InventoryPage />
              </ProtectedRoute>
            } />
            <Route path="expense" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <ExpensePage />
              </ProtectedRoute>
            } />
            <Route path="circulars" element={
              <ProtectedRoute roles={['super_admin', 'admin', 'class_teacher']}>
                <CircularsAdmin />
              </ProtectedRoute>
            } />
            <Route path="library/dashboard" element={
              <ProtectedRoute roles={['librarian']}>
                <LibraryDashboard />
              </ProtectedRoute>
            } />
            <Route path="library" element={
              <ProtectedRoute roles={['super_admin', 'admin', 'librarian']}>
                <LibraryAdmin />
              </ProtectedRoute>
            } />
            <Route path="hostel/dashboard" element={
              <ProtectedRoute roles={['hostel_warden']}>
                <HostelWardenDashboard />
              </ProtectedRoute>
            } />
            <Route path="staff" element={
              <ProtectedRoute roles={['super_admin']}>
                <StaffManagement />
              </ProtectedRoute>
            } />
            <Route path="courses" element={
              <ProtectedRoute roles={['super_admin']}>
                <CoursesPage />
              </ProtectedRoute>
            } />
            <Route path="reports" element={
              <ProtectedRoute roles={['super_admin', 'admin']}>
                <ReportsPage />
              </ProtectedRoute>
            } />
            <Route path="notifications" element={
              <ProtectedRoute roles={['super_admin', 'admin', 'class_teacher', 'hostel_warden', 'librarian']}>
                <NotificationsPage />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/operator" element={
            <ProtectedRoute roles={OPERATOR_ROLES} redirectTo="/operator/login">
              <OperatorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<RoleHomeRedirect />} />
            <Route path="shop" element={
              <ProtectedRoute roles={['shop_operator']} redirectTo="/operator/login">
                <ShopOperator />
              </ProtectedRoute>
            } />
            <Route path="canteen" element={
              <ProtectedRoute roles={['shop_operator']} redirectTo="/operator/login">
                <CanteenOperator />
              </ProtectedRoute>
            } />
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
