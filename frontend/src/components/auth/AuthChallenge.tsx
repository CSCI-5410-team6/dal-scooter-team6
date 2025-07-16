

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from 'aws-amplify';
import '../../config/amplifyConfig'; // Import the config
import { useAuthContext } from "../../contextStore/AuthContext"; // Import Auth context

const AuthChallenge: React.FC = () => {
  const { cognitoUser, setCognitoUser } = useAuthContext();
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("question"); // 'question' or 'caesar'
  const [challengeSession, setChallengeSession] = useState(null);
  const [challengeType, setChallengeType] = useState("");
  const [challengeQuestion, setChallengeQuestion] = useState("");
  const [challengeClue, setChallengeClue] = useState("");
  const [challengeShift, setChallengeShift] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { email: stateEmail, challengeSession: initialSession, challengeParameters } = location.state || {};

  const email = stateEmail || localStorage.getItem("authEmail") || "";

  useEffect(() => {
    console.log("Challenge parameters received:", challengeParameters);
    if (challengeParameters) {
      if (challengeParameters.question) {
        setChallengeQuestion(challengeParameters.question);
        setView('question');
      } else if (challengeParameters.cipherChallenge) {
        setChallengeClue(challengeParameters.cipherChallenge);
        setChallengeShift(challengeParameters.cipherShift);
        setView('caesar');
      }
    }
    if (initialSession) {
      setChallengeSession(initialSession);
    }
  }, [challengeParameters, initialSession]);

  const handleChallengeAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!challengeAnswer) {
      setError('Please provide an answer.');
      setLoading(false);
      return;
    }

    try {
      console.log('challenge session', challengeSession || cognitoUser);
      console.log('challenge answer', challengeAnswer);
      
      const sessionToUse = challengeSession || cognitoUser;
      const response = await Auth.sendCustomChallengeAnswer(sessionToUse, challengeAnswer.trim());
      console.log('Challenge response:', response);

      if (response.challengeName === 'CUSTOM_CHALLENGE') {
        setChallengeSession(response);
        setCognitoUser(response); // Update context
        setChallengeType(response.challengeParam.challengeMetadata);
        console.log('Response ::::::::', response);

        if (response.challengeParam.challengeMetadata === 'QUESTION_CHALLENGE') {
          setChallengeQuestion(response.challengeParam.publicChallengeParameters.question);
          setView('question');
        } else {
          console.log('challengeParam ::::::::', response.challengeParam);
          setChallengeClue(response.challengeParam.clue);
          setChallengeShift(response.challengeParam.shift);
          setView('caesar');
        }
        setChallengeAnswer('');
      } else {
        setSuccess('Login successful!');
        console.log("🎉 Authentication successful!");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err: any) {
      console.error('Challenge error:', err);
      setError('Challenge response failed. Please try again.');
      setChallengeAnswer('');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/login");

  const renderQuestionView = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="text-3xl font-extrabold tracking-tight select-none">
              <span className="text-blue-600">DAL</span>
              <span className="text-gray-900">Scooter</span>
            </span>
          </h2>
          <p className="text-gray-600">Step 2: Security Question</p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-center">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleChallengeAnswer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Security Question
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-gray-900 border">
              {challengeQuestion || "Loading question..."}
            </div>
          </div>

          <div>
            <label htmlFor="challengeAnswer" className="block text-sm font-medium text-gray-700 mb-1">
              Your Answer
            </label>
            <input
              type="text"
              id="challengeAnswer"
              value={challengeAnswer}
              onChange={(e) => setChallengeAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your answer"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                }`}
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading || !challengeAnswer}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${loading || !challengeAnswer
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                } text-white`}
            >
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Please contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );

  const renderCaesarView = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="text-3xl font-extrabold tracking-tight select-none">
              <span className="text-blue-600">DAL</span>
              <span className="text-gray-900">Scooter</span>
            </span>
          </h2>
          <p className="text-gray-600">Step 3: Caesar Cipher Challenge</p>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Final Authentication Step
          </h3>
          <p className="text-sm text-gray-600">
            Complete the final authentication step
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-center">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleChallengeAnswer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caesar Cipher Puzzle
            </label>
            <div className="p-4 bg-gray-50 rounded-md border text-center">
              <p className="text-xl font-mono text-gray-900 mb-2">
                {challengeClue || "LOADING..."}
              </p>
              <p className="text-xs text-gray-500">
                Encrypted message - decode to continue
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How to solve:
            </h3>
            <p className="text-sm text-blue-800">
              Shift each letter -{challengeShift || "?"} positions backward in the alphabet.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Example: If shift is 3, then D→A, E→B, F→C, etc.
            </p>
          </div>

          <div>
            <label htmlFor="challengeAnswer" className="block text-sm font-medium text-gray-700 mb-1">
              Your Answer
            </label>
            <input
              type="text"
              id="challengeAnswer"
              value={challengeAnswer}
              onChange={(e) => setChallengeAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the decoded message"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                }`}
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={loading || !challengeAnswer.trim()}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${loading || !challengeAnswer.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                } text-white`}
            >
              {loading ? 'Verifying...' : 'Complete Login'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Having trouble? Please contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );

  return view === 'question' ? renderQuestionView() : renderCaesarView();
};

export default AuthChallenge;
