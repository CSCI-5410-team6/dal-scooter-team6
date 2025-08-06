import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contextStore/AuthContext";
import AuthStep1Credentials from "./components/auth/AuthStep1Credentials";
import AuthChallenge from "./components/auth/AuthChallenge";
import EmailOTPVerification from "./components/auth/EmailOTPVerification";
import SignUp from "./components/auth/SignUp";
import About from "./components/homepage/About";
import Service from "./components/homepage/Service";
import Contact from "./components/homepage/Contact";
import Chatbot from "./components/chatbot/ChatBot";
import HomePage from "./components/homepage/HomePage";
import AdminDashboard from "./components/admin/AdminDashboard";
import MyBookings from "./components/MyBookings";

const App: React.FC = () => {
  return (
    <>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="about" element={<About />} />
            <Route path="service" element={<Service />} />
            <Route path="contact" element={<Contact />} />
            <Route path="auth-challenge" element={<AuthChallenge />} />
            <Route path="/login" element={<AuthStep1Credentials />} />
            <Route path="/verify-email" element={<EmailOTPVerification />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>

          <Chatbot />
        </Router>
      </AuthProvider>
    </>
  );
};
export default App;
