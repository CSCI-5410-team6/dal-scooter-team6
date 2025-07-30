import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "aws-amplify";
import "../../config/amplifyConfig";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
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
        password: password,
      });
      setCognitoUser(session);
      console.log("SignIn response:", session);

      // Handle different challenge states
      switch (session.challengeName) {
        case "PASSWORD_VERIFIER":
          // Password verification successful, proceed to Q&A challenge
          console.log("Password verified, proceeding to Q&A challenge");
          navigate("/auth-challenge", {
            state: {
              email,
              challengeSession: session,
              challengeName: "CUSTOM_CHALLENGE_QA",
              challengeParameters: session.challengeParam || {},
            },
          });
          break;

        case "CUSTOM_CHALLENGE":
          // This could be either Q&A or Cipher challenge
          // Check private challenge parameters to determine which one
          tempUser = session;

          if (session.challengeParam?.question) {
            console.log("Q&A challenge detected");

            // 🔐 Store the Session token in localStorage

            navigate("/auth-challenge", {
              state: {
                email,
                challengeName: "CUSTOM_CHALLENGE_QA",
                challengeParameters: session.challengeParam || {},
              },
            });
          } else if (session.challengeParam?.cipherChallenge) {
            console.log("Cipher challenge detected");
            navigate("/auth-challenge", {
              state: {
                email,
                challengeSession: session,
                challengeName: "CUSTOM_CHALLENGE_CIPHER",
                challengeParameters: session.challengeParam || {},
              },
            });
          }
          break;

        case "NEW_PASSWORD_REQUIRED":
          setError("Password reset required. Please reset your password.");
          break;

        case "MFA_SETUP":
        case "SMS_MFA":
        case "SOFTWARE_TOKEN_MFA":
          setError("MFA setup required. Please complete MFA setup.");
          break;

        case null:
        case undefined:
          // No challenge means authentication is complete
          try {
            await Auth.currentSession(); // Verify tokens are available
            // Check user type from .userData
            const userDataKey = Object.keys(localStorage).find((key) =>
              key.endsWith(".userData")
            );
            if (userDataKey) {
              const userDataStr = localStorage.getItem(userDataKey);
              if (userDataStr) {
                try {
                  const userData = JSON.parse(userDataStr);
                  const attrs = userData.UserAttributes || [];
                  const userTypeAttr = attrs.find(
                    (a: any) => a.Name === "custom:userType"
                  );
                  if (userTypeAttr && userTypeAttr.Value === "admin") {
                    navigate("/admin");
                    break;
                  }
                } catch {}
              }
            }
            navigate("/");
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
      setError(
        "Device metadata missing. Please try again on a trusted browser."
      );
    } else if (error.name === "InvalidParameterException") {
      setError("Invalid login parameters. Please try again.");
    } else {
      setError(`Login failed: ${error.message || "Unknown error occurred"}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">
              Step 1: Sign in with your credentials
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-10 border border-red-400 rounded text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-500 hover:bg-lime-600 disabled:bg-gray-600 text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center group"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Continue to Step 2
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-lime-500 hover:text-lime-400 font-medium transition-colors duration-200"
                disabled={loading}
              >
                Sign up now
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-lime-500 hover:text-lime-400 font-medium transition-colors duration-200"
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthStep1Credentials;
