import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contextStore/AuthContext";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import SignUp from "./components/auth/SignUp";
import PublicDashboard from "./components/dashboard/PublicDashboard";
import EmailOTPVerification from "./components/auth/EmailOTPVerification";
import AuthStep1Credentials from "./components/auth/AuthStep1Credentials";
import AuthChallenge from "./components/auth/AuthChallenge"; 

 const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
 }) => {
   // const { authState } = useAuth();

//   if (!authState.isAuthenticated) {
//     return <PublicDashboard />;
//   }

  return <>{children}</>;
};

// Main App Content

const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthStep1Credentials />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/verify-email" element={<EmailOTPVerification />} />
      <Route path="/auth-challenge" element={<AuthChallenge />} />
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
