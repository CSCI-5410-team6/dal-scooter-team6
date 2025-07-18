import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from 'aws-amplify';

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

const caesarCipher = (text: string, shift: number): string => {
  return text
    .split("")
    .map((char) => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const base = code >= 65 && code <= 90 ? 65 : 97;
        return String.fromCharCode(((code - base + shift) % 26) + base);
      }
      return char;
    })
    .join("");
};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

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
      setError("Cipher answer is incorrect. Please try again.");
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

      await Auth.signUp({
        username: form.email,
        password: form.password,
        attributes: {
          email: form.email,
          name: form.name,
          'custom:userType': form.userType,
          'custom:questions': JSON.stringify(questionsData),
          'custom:cipher': JSON.stringify(cipherData),
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/verify-email", { state: { email: form.email } });
      }, 2000);
    } catch (error: any) {
      if (error.name === "UsernameExistsException") {
        setError("An account with this email already exists.");
      } else if (error.name === "InvalidPasswordException") {
        setError("Password does not meet requirements. Must include uppercase, lowercase, number, and special character.");
      } else if (error.name === "InvalidParameterException") {
        setError("Invalid input parameters. Please check your information.");
      } else {
        setError(`Sign-up failed: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const regenerateCipher = () => {
    const originalString = generateRandomString();
    const key = generateRandomShift();
    const encodedString = caesarCipher(originalString, key);
    setCipher({ originalString, encodedString, key });
    setForm({ ...form, cipherAnswer: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          <span className="text-3xl font-extrabold tracking-tight select-none">
            <span className="text-blue-600">DAL</span>
            <span className="text-gray-900">Scooter</span>
          </span>
        </h2>
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-center">
            Registration successful! Redirecting to verification...
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm Password"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Type
            </label>
            <select
              name="userType"
              value={form.userType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {userTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Questions</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Question 1
                </label>
                <select
                  name="securityQuestion1"
                  value={form.securityQuestion1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  disabled={loading}
                >
                  {securityQuestions.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="securityAnswer1"
                  value={form.securityAnswer1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your answer"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Question 2
                </label>
                <select
                  name="securityQuestion2"
                  value={form.securityQuestion2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  disabled={loading}
                >
                  {securityQuestions.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="securityAnswer2"
                  value={form.securityAnswer2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your answer"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Question 3
                </label>
                <select
                  name="securityQuestion3"
                  value={form.securityQuestion3}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  disabled={loading}
                >
                  {securityQuestions.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="securityAnswer3"
                  value={form.securityAnswer3}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your answer"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cipher Challenge</h3>
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Decode this Caesar cipher:</strong>
              </p>
              <p className="text-lg font-mono bg-white p-2 rounded border text-center">
                {cipher.encodedString}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Hint: This is a Caesar cipher with a shift of -{cipher.key}
              </p>
              <button
                type="button"
                onClick={regenerateCipher}
                className="mt-2 text-blue-600 hover:underline text-sm"
                disabled={loading}
              >
                Generate New Cipher
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Answer
              </label>
              <input
                type="text"
                name="cipherAnswer"
                value={form.cipherAnswer}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the decoded word"
                required
                disabled={loading}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md font-semibold transition-colors ${loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Already have an account?
          </span>
          <button
            onClick={() => navigate("/login")}
            className="ml-2 text-blue-600 hover:underline text-sm font-medium"
            disabled={loading}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;