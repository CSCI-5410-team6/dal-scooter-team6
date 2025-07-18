import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contextStore/AuthContext';
import AuthStep1Credentials from './components/auth/AuthStep1Credentials';
import AuthChallenge from './components/auth/AuthChallenge';
import EmailOTPVerification from './components/auth/EmailOTPVerification';
import SignUp from './components/auth/SignUp';
import BookingForm from './components/booking/BookingForm';
import ChatWidget from './components/chatbot/ChatWidget';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="text-center py-6">
            <h1 className="text-3xl font-extrabold text-gray-900">
              <span className="text-blue-600">DAL</span>
              <span>Scooter Booking</span>
            </h1>
            <nav className="mt-4">
              <a href="/login" className="text-blue-600 hover:underline mx-2">Login</a>
              <a href="/signup" className="text-blue-600 hover:underline mx-2">Sign Up</a>
              <a href="/booking" className="text-blue-600 hover:underline mx-2">Book Now</a>
              <a href="/dashboard" className="text-blue-600 hover:underline mx-2">Dashboard</a>
            </nav>
          </header>
          <main className="max-w-4xl mx-auto p-4">
            <Routes>
              <Route path="/login" element={<AuthStep1Credentials />} />
              <Route path="/auth-challenge" element={<AuthChallenge />} />
              <Route path="/verify-email" element={<EmailOTPVerification />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/booking" element={<BookingForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </main>
          <ChatWidget />
        </div>
      </Router>
    </AuthProvider>
  );
};
export default App;