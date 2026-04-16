import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import PublicLayout from "./layouts/PublicLayout";
import AboutPage from "./pages/AboutPage";
import BookingsPage from "./pages/BookingsPage";
import DashboardPage from "./pages/DashboardPage";
import FeaturesPage from "./pages/FeaturesPage";
import LandingPage from "./pages/LandingPage";
import ModulesPage from "./pages/ModulesPage";
import ProfilePage from "./pages/ProfilePage";
import ResourcesPage from "./pages/ResourcesPage";
import UsersPage from "./pages/UsersPage";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>

      <Route
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/resources" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ResourcesPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/users" element={<ProtectedRoute allowedRoles={["ADMIN"]}><UsersPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
