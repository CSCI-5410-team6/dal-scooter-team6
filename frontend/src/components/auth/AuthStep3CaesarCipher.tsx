import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { caesarPuzzle } from "../../data/dummyData";

interface AuthStep3CaesarCipherProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AuthStep3CaesarCipher: React.FC<AuthStep3CaesarCipherProps> = ({
  onSuccess,
  onBack,
}) => {
  const [caesarAnswer, setCaesarAnswer] = useState("");
  const [error, setError] = useState("");
  const { loginStep3 } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!caesarAnswer) {
      setError("Please solve the Caesar cipher puzzle");
      return;
    }

    const success = loginStep3(caesarAnswer);
    if (success) {
      onSuccess();
    } else {
      setError("Incorrect answer. Please try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Step 3: Caesar Cipher Puzzle
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Puzzle
          </label>
          <div className="p-3 bg-gray-50 rounded-md text-gray-900">
            {caesarPuzzle.question}
          </div>
        </div>

        <div>
          <label
            htmlFor="caesarAnswer"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Answer
          </label>
          <input
            type="text"
            id="caesarAnswer"
            value={caesarAnswer}
            onChange={(e) => setCaesarAnswer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the decoded message"
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
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            Complete Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthStep3CaesarCipher;
