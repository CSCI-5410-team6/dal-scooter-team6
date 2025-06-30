import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthFlow from "./components/auth/AuthFlow";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import SignUp from "./components/auth/SignUp";
import PublicDashboard from "./components/dashboard/PublicDashboard";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authState } = useAuth();

  if (!authState.isAuthenticated) {
    return <PublicDashboard />;
  }

  return <>{children}</>;
};

// Main App Content
const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthFlow />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<PublicDashboard />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
