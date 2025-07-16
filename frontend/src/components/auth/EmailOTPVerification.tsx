import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from 'aws-amplify';
import "../../config/amplifyConfig"; // Amplify is configured here, no need to import Amplify again

const EmailOTPVerification: React.FC = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Redirect to sign-up if email is missing
  useEffect(() => {
    if (!email) {
      setError("No email provided. Please sign up again.");
      setTimeout(() => navigate("/signup"), 2000);
    }
  }, [email, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code.");
      setLoading(false);
      return;
    }

    try {
     const result = await Auth.confirmSignUp(email, otp);

      console.log("Confirmation result:", result);
      
      if (result === "SUCCESS") {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError("Verification incomplete. Please try again.");
      }
    } catch (error: any) {
      console.error("Verification error:", error);

      if (error.name === "CodeMismatchException") {
        setError("Invalid OTP code. Please try again.");
      } else if (error.name === "NotAuthorizedException") {
        setError("User cannot be confirmed. Please sign up again.");
      } else if (error.name === "ExpiredCodeException") {
        setError("OTP code has expired. Please resend the code.");
      } else if (error.name === "InvalidParameterException") {
        setError("Invalid input parameters. Check your email or OTP code.");
      } else {
        setError(`Verification failed: ${error.message || "Unknown error occurred"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendDisabled(true);
    setCountdown(60);
    setError("");
    setSuccess(false);
    setOtp("");

    try {
      await Auth.resendSignUp(email);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      setError(`Failed to resend OTP: ${error.message || "Unknown error occurred"}`);
      setResendDisabled(false);
      setCountdown(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          <span className="text-3xl font-extrabold tracking-tight select-none">
            <span className="text-blue-600">DAL</span>
            <span className="text-gray-900">Scooter</span>
          </span>
        </h2>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verify Your Email
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            We've sent a 6-digit verification code to:
          </p>
          <p className="text-sm font-medium text-blue-600">
            {email}
          </p>
        </div>
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-center">
            Email verified successfully! Proceeding to login...
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-wider"
              placeholder="000000"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
              disabled={loading}
            />
            <p className="text-xs text-gray-500 text-center mt-1">
              Enter the 6-digit code sent to your email
            </p>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !otp || otp.length !== 6}
            className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${
              loading || !otp || otp.length !== 6
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
          
          <div className="text-center">
            <span className="text-sm text-gray-600">Didn't receive the code? </span>
            <button
              onClick={handleResendOTP}
              disabled={resendDisabled}
              className={`text-sm font-medium ${
                resendDisabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:underline'
              }`}
            >
              {resendDisabled ? `Resend in ${countdown}s` : "Resend OTP"}
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline text-sm font-medium"
            disabled={loading}
          >
            ← Back to Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailOTPVerification;