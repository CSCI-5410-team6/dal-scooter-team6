import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface AuthStep1CredentialsProps {
  onSuccess: () => void;
}

const AuthStep1Credentials: React.FC<AuthStep1CredentialsProps> = ({
  onSuccess,
}) => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginStep1 } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId || !password) {
      setError("Please fill in all fields");
      return;
    }

    const success = loginStep1(userId, password);
    if (success) {
      onSuccess();
    } else {
      setError(
        "Invalid credentials. Try: guest1/guestpass, cust1/custpass, or admin1/adminpass"
      );
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Step 1: Login Credentials
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="userId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            User ID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your user ID"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Continue to Step 2
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Demo Credentials:
        </h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Guest: guest1 / guestpass</li>
          <li>• Customer: cust1 / custpass</li>
          <li>• Admin: admin1 / adminpass</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthStep1Credentials;
