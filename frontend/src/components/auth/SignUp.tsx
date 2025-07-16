import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
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

// Caesar cipher function
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

// Generate random string
const generateRandomString = (): string => {
  const words = ["HELLO", "WORLD", "CIPHER", "SECRET", "DECODE", "PUZZLE", "HIDDEN", "MYSTERY"];
  return words[Math.floor(Math.random() * words.length)];
};

// Generate random shift (1-5)
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

  // Generate cipher challenge on component mount
  useEffect(() => {
    const originalString = generateRandomString();
    const key = generateRandomShift();
    const encodedString = caesarCipher(originalString, key);

    setCipher({
      originalString,
      encodedString,
      key,
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setSuccess(false);
  setLoading(true);

  console.log("Form submitted!", form);
  console.log("Cipher data:", cipher);

  // Validation
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
    console.log("Validation failed: Missing fields");
    setError("Please fill in all fields.");
    setLoading(false);
    return;
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    console.log("Validation failed: Invalid email");
    setError("Please enter a valid email address.");
    setLoading(false);
    return;
  }

  if (form.password.length < 8) {
    console.log("Validation failed: Password too short");
    setError("Password must be at least 8 characters.");
    setLoading(false);
    return;
  }

  if (form.password !== form.confirmPassword) {
    console.log("Validation failed: Passwords don't match");
    setError("Passwords do not match.");
    setLoading(false);
    return;
  }

  const questions = [
    form.securityQuestion1,
    form.securityQuestion2,
    form.securityQuestion3,
  ];
  if (new Set(questions).size !== questions.length) {
    console.log("Validation failed: Duplicate security questions");
    setError("Please select different security questions.");
    setLoading(false);
    return;
  }

  console.log("Cipher check:", {
    userAnswer: form.cipherAnswer.toUpperCase(),
    correctAnswer: cipher.originalString,
    match: form.cipherAnswer.toUpperCase() === cipher.originalString,
  });

  if (form.cipherAnswer.toUpperCase() !== cipher.originalString) {
    console.log("Validation failed: Incorrect cipher answer");
    setError("Cipher answer is incorrect. Please try again.");
    setLoading(false);
    return;
  }

  if (
    cipher.key === undefined ||
    cipher.key === null ||
    isNaN(cipher.key)
  ) {
    console.error("Validation failed: cipher.key is missing or invalid", cipher);
    setError("Internal error: Cipher key is missing. Please refresh and try again.");
    setLoading(false);
    return;
  }

  console.log("All validations passed, sending request...");

  try {
    const cipherData = {
      cipherChallenge: cipher.encodedString || "",
      cipherKey: String(cipher.key), // Safe conversion to string
      cipherResponse: form.cipherAnswer.toUpperCase(),
    };

    const questionsData = {
      q1: form.securityQuestion1,
      a1: form.securityAnswer1,
      q2: form.securityQuestion2,
      a2: form.securityAnswer2,
      q3: form.securityQuestion3,
      a3: form.securityAnswer3,
    };

    console.log("Prepared cipherData:", cipherData);
    console.log("Prepared questionsData:", questionsData);

const signUpResult= await Auth.signUp({
  username: form.email,
  password: form.password,
  attributes: {
    email: form.email,
    name: form.name,
    'custom:userType': form.userType,
  },
  clientMetadata: {
    cipherData: JSON.stringify(cipherData),
    questions: JSON.stringify(questionsData),
    userType: form.userType,
  },
  validationData: {
    // Optional, usually ignored by Cognito but you can still include it
    cipherData: JSON.stringify(cipherData),
    questions: JSON.stringify(questionsData),
    userType: form.userType,
  }
});

    console.log("Final SignUp payload:", JSON.stringify(signUpResult, null, 2));

    console.log("SignUp response:", signUpResult);

    if (!signUpResult.userConfirmed) {
      setSuccess(true);
      setTimeout(() => {
        navigate("/verify-email", { state: { email: form.email } });
      }, 2000);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  } catch (error: any) {
    console.error("Sign-up error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    if (error.name === "UsernameExistsException") {
      setError("An account with this email already exists.");
    } else if (error.name === "InvalidPasswordException") {
      setError("Password does not meet requirements. Must include uppercase, lowercase, number, and special character.");
    } else if (error.name === "InvalidParameterException") {
      setError("Invalid input parameters. Please check your information.");
    } else if (error.message?.includes("Pre Sign-up validation failed")) {
      const errorMatch = error.message.match(/Pre Sign-up validation failed: (.+)/);
      const specificError = errorMatch ? errorMatch[1] : "Validation failed";
      setError(`Validation failed: ${specificError}`);
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

    setCipher({
      originalString,
      encodedString,
      key,
    });

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
            Registration successful! Redirecting to login...
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
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
            >
              {userTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Security Questions */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Questions</h3>
            
            <div className="space-y-4">
              {/* Security Question 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Question 1
                </label>
                <select
                  name="securityQuestion1"
                  value={form.securityQuestion1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
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
                />
              </div>
              
              {/* Security Question 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Question 2
                </label>
                <select
                  name="securityQuestion2"
                  value={form.securityQuestion2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
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
                />
              </div>
              
              {/* Security Question 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Question 3
                </label>
                <select
                  name="securityQuestion3"
                  value={form.securityQuestion3}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
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
                />
              </div>
            </div>
          </div>
          
          {/* Cipher Challenge */}
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
                Hint: This is a Caesar cipher with a shift of {cipher.key}
              </p>
              <button
                type="button"
                onClick={regenerateCipher}
                className="mt-2 text-blue-600 hover:underline text-sm"
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
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold"
          >
            Sign Up
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <span className="text-sm text-gray-600">
            Already have an account?
          </span>
          <button
            onClick={() => navigate("/login")}
            className="ml-2 text-blue-600 hover:underline text-sm font-medium"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

