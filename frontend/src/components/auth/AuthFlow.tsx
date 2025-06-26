import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AuthStep1Credentials from "./AuthStep1Credentials";
import AuthStep2SecurityQuestion from "./AuthStep2SecurityQuestion";
import AuthStep3CaesarCipher from "./AuthStep3CaesarCipher";
import { CheckIcon } from "@heroicons/react/24/solid";

const stepLabels = ["Credentials", "Security", "Cipher"];

const AuthFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const { resetAuth } = useAuth();
  const navigate = useNavigate();

  const handleStep1Success = () => {
    setCurrentStep(2);
  };

  const handleStep2Success = () => {
    setCurrentStep(3);
  };

  const handleStep3Success = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate("/dashboard");
    }, 2000);
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
    resetAuth();
  };

  const handleBackToStep2 = () => {
    setCurrentStep(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Indicator */}
        <div className="mb-8">
          {/* Circles and lines */}
          <div className="flex flex-row items-center justify-between w-full">
            {[1, 2, 3].map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex items-center z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors duration-200 ${
                      currentStep > step
                        ? "bg-blue-600 text-white border-blue-600"
                        : currentStep === step
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300"
                    }`}
                  >
                    {currentStep > step ? (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                </div>
                {/* Draw line except after last step */}
                {idx < 2 && (
                  <div className="flex-1 h-1 flex items-center">
                    <div
                      className={`h-1 w-full rounded-full transition-colors duration-200 ${
                        currentStep > step ? "bg-blue-600" : "bg-gray-300/50"
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Step labels */}
          <div className="flex flex-row justify-between mt-2">
            {stepLabels.map((label, idx) => (
              <div
                key={label}
                className="w-8 text-center text-xs text-gray-600 font-normal"
                style={{ flex: 1, minWidth: 0 }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Success Notification */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Authentication successful! Redirecting to dashboard...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step Components */}
        {currentStep === 1 && (
          <AuthStep1Credentials onSuccess={handleStep1Success} />
        )}
        {currentStep === 2 && (
          <AuthStep2SecurityQuestion
            onSuccess={handleStep2Success}
            onBack={handleBackToStep1}
          />
        )}
        {currentStep === 3 && (
          <AuthStep3CaesarCipher
            onSuccess={handleStep3Success}
            onBack={handleBackToStep2}
          />
        )}

        {/* Sign Up Link */}
        {currentStep === 1 && (
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?
            </span>
            <button
              onClick={() => navigate("/signup")}
              className="ml-2 text-blue-600 hover:underline text-sm font-medium"
            >
              Sign Up
            </button>
          </div>
        )}

        {/* App Info */}
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DALScooter</h1>
          <p className="text-gray-600">3-Factor Authentication System</p>
        </div>
      </div>
    </div>
  );
};

export default AuthFlow;
