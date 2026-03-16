import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import StudentLayout from './components/layout/StudentLayout';

// Auth
import Login from './pages/Login';

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

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentFees from './pages/student/StudentFees';
import StudentLedger from './pages/student/StudentLedger';
import StudentLeave from './pages/student/StudentLeave';
import StudentOutpass from './pages/student/StudentOutpass';
import StudentCirculars from './pages/student/StudentCirculars';
import StudentProfile from './pages/student/StudentProfile';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

const ADMIN_ROLES = ['super_admin', 'class_teacher', 'hostel_warden', 'shop_operator', 'canteen_operator', 'librarian'];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center text-gray-600 text-xl">403 – Not Authorized</div>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/add" element={<AddStudent />} />
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
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><StudentLayout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="fees" element={<StudentFees />} />
            <Route path="ledger" element={<StudentLedger />} />
            <Route path="leave" element={<StudentLeave />} />
            <Route path="outpass" element={<StudentOutpass />} />
            <Route path="circulars" element={<StudentCirculars />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
