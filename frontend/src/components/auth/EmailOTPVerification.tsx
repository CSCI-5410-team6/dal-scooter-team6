import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from "aws-amplify";
import { ArrowRight, ArrowLeft, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import "../../config/amplifyConfig";

const EmailOTPVerification: React.FC = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  useEffect(() => {
    if (timeLeft > 0 && resendDisabled) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [timeLeft, resendDisabled]);

  useEffect(() => {
    if (!email) {
      setError("No email provided. Please sign up again.");
      setTimeout(() => navigate("/signup"), 2000);
    }
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const result = await Auth.confirmSignUp(email, otpValue);

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
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setTimeLeft(60);
    setError("");
    setSuccess(false);
    setOtp(["", "", "", "", "", ""]);

    try {
      await Auth.resendSignUp(email);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      setError(`Failed to resend OTP: ${error.message || "Unknown error occurred"}`);
      setResendDisabled(false);
      setTimeLeft(0);
    }
  };

  const isComplete = otp.every((digit) => digit !== "");

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Check Your Email</h1>
            <p className="text-gray-400 mb-4">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-lime-500 font-medium break-all">{email}</p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-center">
              Email verified successfully! Redirecting to login...
            </div>
          )}

          {error && (
            <p className="mb-4 text-sm text-red-400 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                Enter Verification Code
              </label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`w-12 h-12 bg-gray-700 border rounded-xl text-white text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200 ${
                      error ? "border-red-500" : "border-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">
                Didn't receive the code?
              </p>
              {resendDisabled ? (
                <p className="text-gray-500 text-sm">
                  Resend available in {timeLeft}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendDisabled}
                  className="text-lime-500 hover:text-lime-400 font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resend Code
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center group"
              >
                <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                Back
              </button>

              <button
                type="submit"
                disabled={!isComplete || loading}
                className="flex-1 bg-lime-500 hover:bg-lime-600 disabled:bg-gray-600 text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Verify
                    <CheckCircle2 className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By verifying, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailOTPVerification;
