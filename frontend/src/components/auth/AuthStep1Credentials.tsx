import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from 'aws-amplify';
import '../../config/amplifyConfig';
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useAuthContext } from "../../contextStore/AuthContext";
export let tempUser: any = null;

const AuthStep1Credentials: React.FC = () => {
  const { setCognitoUser } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting to sign in with:", { email });

      // Initiate authentication with Cognito
      const session = await Auth.signIn({
        username: email,
        password: password
      });
      setCognitoUser(session); 
      console.log("SignIn response:", session);

      // Handle different challenge states
      switch (session.challengeName) {
        case 'PASSWORD_VERIFIER':
          // Password verification successful, proceed to Q&A challenge
          console.log("Password verified, proceeding to Q&A challenge");
          navigate("/auth-challenge", {
            state: {
              email,
              challengeSession: session,
              challengeName: 'CUSTOM_CHALLENGE_QA',
              challengeParameters: session.challengeParam || {},
            },
          });
          break;

        case 'CUSTOM_CHALLENGE':
          // This could be either Q&A or Cipher challenge
          // Check private challenge parameters to determine which one
          tempUser = session;

          if (session.challengeParam?.question) {
            console.log("Q&A challenge detected");

            // 🔐 Store the Session token in localStorage
           

            navigate("/auth-challenge", {
              state: {
                email,
                challengeName: 'CUSTOM_CHALLENGE_QA',
                challengeParameters: session.challengeParam || {},
              },
            });
          } else if (session.challengeParam?.cipherChallenge) {
            console.log("Cipher challenge detected");
            navigate("/auth-challenge", {
              state: {
                email,
                challengeSession: session,
                challengeName: 'CUSTOM_CHALLENGE_CIPHER',
                challengeParameters: session.challengeParam || {},
              },
            });
          }
          break;

        case 'NEW_PASSWORD_REQUIRED':
          setError("Password reset required. Please reset your password.");
          break;

        case 'MFA_SETUP':
        case 'SMS_MFA':
        case 'SOFTWARE_TOKEN_MFA':
          setError("MFA setup required. Please complete MFA setup.");
          break;

        case null:
        case undefined:
          // No challenge means authentication is complete
          try {
            await Auth.currentSession(); // Verify tokens are available
            navigate("/dashboard");
          } catch (sessionError) {
            console.error("Token/session not available:", sessionError);
            setError("Login succeeded but session could not be established.");
          }
          break;

        default:
          console.warn("Unhandled challenge:", session.challengeName);
          setError(`Unsupported challenge: ${session.challengeName}`);
      }

    } catch (error: any) {
      console.error("Login error:", error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    if (error.name === "NotAuthorizedException") {
      setError("Invalid email or password.");
    } else if (error.name === "UserNotFoundException") {
      setError("No account found with this email.");
    } else if (error.name === "UserNotConfirmedException") {
      setError("Please verify your email before logging in.");
      setTimeout(() => {
        navigate("/verify-email", { state: { email } });
      }, 2000);
    } else if (error?.message?.includes("NewDeviceMetadata")) {
      setError("Device metadata missing. Please try again on a trusted browser.");
    } else if (error.name === "InvalidParameterException") {
      setError("Invalid login parameters. Please try again.");
    } else {
      setError(`Login failed: ${error.message || 'Unknown error occurred'}`);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="text-3xl font-extrabold tracking-tight select-none">
              <span className="text-blue-600">DAL</span>
              <span className="text-gray-900">Scooter</span>
            </span>
          </h2>
          <p className="text-gray-600">Step 1: Login Credentials</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-700"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              } text-white`}
          >
            {loading ? 'Signing In...' : 'Continue to Step 2'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?
          </span>
          <button
            onClick={() => navigate("/signup")}
            className="ml-2 text-blue-600 hover:underline text-sm font-medium"
            disabled={loading}
          >
            Sign Up
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-blue-600 hover:underline text-sm font-medium"
            disabled={loading}
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthStep1Credentials;

