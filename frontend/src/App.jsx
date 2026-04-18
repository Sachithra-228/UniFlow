import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import PublicLayout from "./layouts/PublicLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLinkRequestsPage from "./pages/AdminLinkRequestsPage";
import AboutPage from "./pages/AboutPage";
import AcademicCalendarPage from "./pages/AcademicCalendarPage";
import BookingsPage from "./pages/BookingsPage";
import EnrollmentsPage from "./pages/EnrollmentsPage";
import FeaturesPage from "./pages/FeaturesPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ModulesPage from "./pages/ModulesPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import RoleDashboardRedirectPage from "./pages/RoleDashboardRedirectPage";
import ResourcesPage from "./pages/ResourcesPage";
import StaffDashboardPage from "./pages/StaffDashboardPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";
import TechnicianDashboardPage from "./pages/TechnicianDashboardPage";
import TechnicianQueuePage from "./pages/TechnicianQueuePage";
import TechnicianSlaPage from "./pages/TechnicianSlaPage";
import TechnicianVisitsPage from "./pages/TechnicianVisitsPage";
import TicketsPage from "./pages/TicketsPage";
import UsersPage from "./pages/UsersPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="/dashboard" element={<RoleDashboardRedirectPage />} />
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["STUDENT"]}><StudentDashboardPage /></ProtectedRoute>} />
        <Route path="/staff/dashboard" element={<ProtectedRoute allowedRoles={["STAFF"]}><StaffDashboardPage /></ProtectedRoute>} />
        <Route path="/technician/dashboard" element={<ProtectedRoute allowedRoles={["TECHNICIAN"]}><TechnicianDashboardPage /></ProtectedRoute>} />
        <Route path="/technician/sla" element={<ProtectedRoute allowedRoles={["TECHNICIAN"]}><TechnicianSlaPage /></ProtectedRoute>} />
        <Route path="/technician/queue" element={<ProtectedRoute allowedRoles={["TECHNICIAN"]}><TechnicianQueuePage /></ProtectedRoute>} />
        <Route path="/technician/visits" element={<ProtectedRoute allowedRoles={["TECHNICIAN"]}><TechnicianVisitsPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ResourcesPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/enrollments" element={<ProtectedRoute allowedRoles={["STUDENT", "STAFF", "ADMIN"]}><EnrollmentsPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute allowedRoles={["STUDENT", "STAFF", "ADMIN"]}><AcademicCalendarPage /></ProtectedRoute>} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin/link-requests" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminLinkRequestsPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={["ADMIN"]}><UsersPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
