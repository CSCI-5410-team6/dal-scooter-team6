import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Auth } from "aws-amplify";
import "../../config/amplifyConfig"; // Import the config
import { useAuthContext } from "../../contextStore/AuthContext"; // Import Auth context
import { Lock, Eye, EyeOff, ArrowRight, Shield, Key } from "lucide-react";

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
  const {
    email: stateEmail,
    challengeSession: initialSession,
    challengeParameters,
  } = location.state || {};

  const email = stateEmail || localStorage.getItem("authEmail") || "";

  useEffect(() => {
    console.log("Challenge parameters received:", challengeParameters);
    if (challengeParameters) {
      if (challengeParameters.question) {
        setChallengeQuestion(challengeParameters.question);
        setView("question");
      } else if (challengeParameters.cipherChallenge) {
        setChallengeClue(challengeParameters.cipherChallenge);
        setChallengeShift(challengeParameters.cipherShift);
        setView("caesar");
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
      setError("Please provide an answer.");
      setLoading(false);
      return;
    }

    try {
      console.log("challenge session", challengeSession || cognitoUser);
      console.log("challenge answer", challengeAnswer);

      const sessionToUse = challengeSession || cognitoUser;
      const response = await Auth.sendCustomChallengeAnswer(
        sessionToUse,
        challengeAnswer.trim()
      );
      console.log("Challenge response:", response);

      if (response.challengeName === "CUSTOM_CHALLENGE") {
        setChallengeSession(response);
        setCognitoUser(response); // Update context
        setChallengeType(response.challengeParam.challengeMetadata);
        console.log("Response ::::::::", response);

        if (
          response.challengeParam.challengeMetadata === "QUESTION_CHALLENGE"
        ) {
          setChallengeQuestion(
            response.challengeParam.publicChallengeParameters.question
          );
          setView("question");
        } else {
          console.log("challengeParam ::::::::", response.challengeParam);
          setChallengeClue(response.challengeParam.clue);
          setChallengeShift(response.challengeParam.shift);
          setView("caesar");
        }
        setChallengeAnswer("");
      } else {
        setSuccess("Login successful!");
        console.log("🎉 Authentication successful!");
        setTimeout(() => {
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
                  return;
                }
              } catch {}
            }
          }
          navigate("/");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Challenge error:", err);
      setError("Challenge response failed. Please try again.");
      setChallengeAnswer("");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/login");

  const renderQuestionView = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-lime-500">DAL</span>
              <span className="text-white">Scooter</span>
            </h1>
            <p className="text-gray-400">Step 2: Security Question</p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-xl text-green-400 text-center">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleChallengeAnswer} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Security Question
              </label>
              <div className="p-4 bg-gray-700 border border-gray-600 rounded-xl text-white">
                {challengeQuestion || "Loading question..."}
              </div>
            </div>

            <div>
              <label
                htmlFor="challengeAnswer"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Your Answer
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="challengeAnswer"
                  value={challengeAnswer}
                  onChange={(e) =>
                    setChallengeAnswer(e.target.value.toLowerCase())
                  }
                  className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your answer"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={loading || !challengeAnswer}
                className="flex-1 bg-lime-500 hover:bg-lime-600 disabled:bg-gray-600 text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Having trouble? Please contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCaesarView = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-lime-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-gray-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              <span className="text-lime-500">DAL</span>
              <span className="text-white">Scooter</span>
            </h1>
            <p className="text-gray-400">Step 3: Caesar Cipher Challenge</p>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Final Authentication Step
            </h3>
            <p className="text-sm text-gray-400">
              Complete the final authentication step
            </p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-xl text-green-400 text-center">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleChallengeAnswer} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Caesar Cipher Puzzle
              </label>
              <div className="p-4 bg-gray-700 border border-gray-600 rounded-xl text-center">
                <p className="text-xl font-mono text-white mb-2">
                  {challengeClue || "LOADING..."}
                </p>
                <p className="text-xs text-gray-400">
                  Encrypted message - decode to continue
                </p>
              </div>
            </div>

            <div className="p-4 bg-lime-900/20 border border-lime-500/30 rounded-xl">
              <h3 className="text-sm font-medium text-lime-400 mb-2 flex items-center">
                <Lock className="w-4 h-4 mr-1" />
                How to solve:
              </h3>
              <p className="text-sm text-lime-300">
                Shift each letter -{challengeShift || "?"} positions backward in
                the alphabet.
              </p>
              <p className="text-xs text-lime-400 mt-1">
                Example: If shift is 3, then D→A, E→B, F→C, etc.
              </p>
            </div>

            <div>
              <label
                htmlFor="challengeAnswer"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Your Answer
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="challengeAnswer"
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter the decoded message"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 bg-gray-700 text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                Back to Login
              </button>
              <button
                type="submit"
                disabled={loading || !challengeAnswer.trim()}
                className="flex-1 bg-lime-500 hover:bg-lime-600 disabled:bg-gray-600 text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Complete Login
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Having trouble? Please contact support for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return view === "question" ? renderQuestionView() : renderCaesarView();
};

export default AuthChallenge;
