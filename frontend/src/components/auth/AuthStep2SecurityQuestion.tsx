import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { securityQuestions } from "../../data/dummyData";

interface AuthStep2SecurityQuestionProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AuthStep2SecurityQuestion: React.FC<AuthStep2SecurityQuestionProps> = ({
  onSuccess,
  onBack,
}) => {
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const { authState, loginStep2 } = useAuth();

  const question =
    securityQuestions[authState.userId as keyof typeof securityQuestions];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!securityAnswer) {
      setError("Please answer the security question");
      return;
    }

    const success = loginStep2(securityAnswer);
    if (success) {
      onSuccess();
    } else {
      setError("Incorrect answer. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Step 2: Security Question
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Security Question
          </label>
          <div className="p-3 bg-gray-50 rounded-md text-gray-900">
            {question}
          </div>
        </div>

        <div>
          <label
            htmlFor="securityAnswer"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Answer
          </label>
          <input
            type="text"
            id="securityAnswer"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your answer"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue to Step 3
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Demo Answers:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Guest: blue</li>
          <li>• Customer: buddy</li>
          <li>• Admin: toronto</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthStep2SecurityQuestion;
