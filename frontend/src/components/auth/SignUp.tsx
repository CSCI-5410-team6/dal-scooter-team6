import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "aws-amplify";
import { User, Mail, Lock, Shield, Key, RefreshCw, ArrowRight, UserCheck } from 'lucide-react';

// Security questions
const securityQuestions = [
  "What is your favorite color?",
  "What is your pet's name?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was your first school?",
  "What is your favorite food?",
  "What is your favorite movie?",
  "What street did you grow up on?",
];

const userTypes = [
  { value: "customer", label: "Customer" },
  { value: "admin", label: "Franchise (Admin)" },
];

// Caesar cipher helper
const caesarCipher = (text: string, shift: number): string => {
  return text
    .split("")
    .map((char) => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const base = code >= 65 && code <= 90 ? 65 : 97;
        return String.fromCharCode(((code - base + shift + 26) % 26) + base);
      }
      return char;
    })
    .join("");
};

// Random word & shift
const generateRandomString = (): string => {
  const words = ["HELLO", "WORLD", "CIPHER", "SECRET", "DECODE", "PUZZLE", "HIDDEN", "MYSTERY"];
  return words[Math.floor(Math.random() * words.length)];
};

const generateRandomShift = (): number => {
  return Math.floor(Math.random() * 5) + 1;
};

const SignUp: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "customer",
    securityQuestion1: securityQuestions[0],
    securityAnswer1: "",
    securityQuestion2: securityQuestions[1],
    securityAnswer2: "",
    securityQuestion3: securityQuestions[2],
    securityAnswer3: "",
    cipherAnswer: "",
  });

  const [cipher, setCipher] = useState({
    originalString: "",
    encodedString: "",
    key: 0,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const originalString = generateRandomString();
    const key = generateRandomShift();
    const encodedString = caesarCipher(originalString, key);
    setCipher({ originalString, encodedString, key });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const regenerateCipher = () => {
    const originalString = generateRandomString();
    const key = generateRandomShift();
    const encodedString = caesarCipher(originalString, key);
    setCipher({ originalString, encodedString, key });
    setForm({ ...form, cipherAnswer: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    // Basic validations
    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword ||
      !form.securityAnswer1 ||
      !form.securityAnswer2 ||
      !form.securityAnswer3 ||
      !form.cipherAnswer
    ) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const questions = [form.securityQuestion1, form.securityQuestion2, form.securityQuestion3];
    if (new Set(questions).size !== questions.length) {
      setError("Please select different security questions.");
      setLoading(false);
      return;
    }

    if (form.cipherAnswer.toUpperCase() !== cipher.originalString) {
      setError("Cipher answer is incorrect.");
      setLoading(false);
      return;
    }

    try {
      const questionsData = {
        q1: form.securityQuestion1,
        a1: form.securityAnswer1.toLowerCase(),
        q2: form.securityQuestion2,
        a2: form.securityAnswer2.toLowerCase(),
        q3: form.securityQuestion3,
        a3: form.securityAnswer3.toLowerCase(),
      };

      const cipherData = {
        cipherChallenge: cipher.encodedString,
        cipherKey: String(cipher.key),
        cipherResponse: form.cipherAnswer.toUpperCase(),
      };

      const clientMetadata = {
        userType: form.userType,
        questions: JSON.stringify(questionsData),
        cipherData: JSON.stringify(cipherData),
      };

      await Auth.signUp({
        username: form.email,
        password: form.password,
        attributes: {
          email: form.email,
          name: form.name,
          "custom:userType": form.userType,
          "custom:questions": JSON.stringify(questionsData),
        },
        clientMetadata,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/verify-email", { state: { email: form.email } });
      }, 2000);
    } catch (err: any) {
      if (err.name === "UsernameExistsException") {
        setError("An account with this email already exists.");
      } else if (err.name === "InvalidPasswordException") {
        setError("Password must include uppercase, lowercase, number, and special character.");
      } else {
        setError(`Sign-up failed: ${err.message || "Unknown error occurred."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-lime-500">DAL</span>
              <span className="text-white">Scooter</span>
            </h1>
            <p className="text-gray-400">Create your account</p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-xl text-green-400 text-center">
              Registration successful! Redirecting...
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm Password"
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* User type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">User Type</label>
              <select
                name="userType"
                value={form.userType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                disabled={loading}
              >
                {userTypes.map((ut) => (
                  <option key={ut.value} value={ut.value}>
                    {ut.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Security Questions */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-lime-500" />
                Security Questions
              </h3>
              {[1, 2, 3].map((n) => (
                <div key={n} className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Security Question {n}
                  </label>
                  <select
                    name={`securityQuestion${n}`}
                    value={form[`securityQuestion${n}` as keyof typeof form]}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white mb-2 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                  >
                    {securityQuestions.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name={`securityAnswer${n}`}
                      value={form[`securityAnswer${n}` as keyof typeof form]}
                      onChange={handleChange}
                      placeholder="Your answer"
                      className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Cipher */}
            <div className="border-t border-gray-600 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2 text-lime-500" />
                Cipher Challenge
              </h3>
              <div className="bg-gray-700 border border-gray-600 p-4 rounded-xl mb-4">
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Decode this Caesar cipher:</strong>
                </p>
                <p className="text-lg font-mono bg-gray-800 p-3 rounded-lg border border-gray-600 text-center text-white">
                  {cipher.encodedString}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Hint: Shift is -{cipher.key}
                </p>
                <button
                  type="button"
                  onClick={regenerateCipher}
                  disabled={loading}
                  className="mt-2 text-lime-500 hover:text-lime-400 text-sm font-medium transition-colors duration-200 flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Generate New Cipher
                </button>
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="cipherAnswer"
                  value={form.cipherAnswer}
                  onChange={handleChange}
                  placeholder="Decoded word"
                  className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                  required
                />
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
                  Sign Up
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-gray-400">Already have an account?</span>
            <button
              onClick={() => navigate("/login")}
              className="ml-2 text-lime-500 hover:text-lime-400 font-medium transition-colors duration-200"
              disabled={loading}
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;