import React, { useState, useEffect } from "react";
import { Star, X, MessageSquare, ThumbsUp, Edit } from "lucide-react";
import API_CONFIG from "../config/apiConfig";

interface Feedback {
  feedbackId: string;
  bikeId: string;
  userId: string;
  rating: number;
  comment: string;
  bikeType: string;
  submittedAt: string;
  username?: string; // Optional username field
  sentiment?: string; // Optional sentiment field
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: any;
  userType: "customer" | "admin" | null;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  bike,
  userType,
}) => {
  const [activeTab, setActiveTab] = useState<"submit" | "view">("submit");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentUsername, setCurrentUsername] = useState<string>("");

  // Edit state
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // Load feedbacks when modal opens
  useEffect(() => {
    if (isOpen && bike) {
      loadFeedbacks();
      getCurrentUsername();
    }
  }, [isOpen, bike]);

  // Debug logging
  useEffect(() => {
    if (feedbacks.length > 0) {
      console.log("userType:", userType, "feedbacks:", feedbacks);
    }
  }, [feedbacks, userType]);

  const getCurrentUsername = () => {
    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (idToken) {
        // Try to parse as JWT first
        if (idToken.includes(".")) {
          const tokenParts = idToken.split(".");
          if (tokenParts.length === 3) {
            try {
              const payload = JSON.parse(atob(tokenParts[1]));
              const username =
                payload["name"] ||
                payload["cognito:username"] ||
                "Unknown User";
              setCurrentUsername(username);
              return;
            } catch (e) {
              console.log("JWT parsing failed, trying alternative format");
            }
          }
        }

        // Fallback: try to parse as a simple token
        try {
          const payload = JSON.parse(idToken);
          const username = payload.name || payload.username || "Unknown User";
          setCurrentUsername(username);
        } catch (e) {
          setCurrentUsername("Unknown User");
        }
      }
    } catch (error) {
      console.error("Error parsing username from token:", error);
      setCurrentUsername("Unknown User");
    }
  };

  const getCurrentUserId = () => {
    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (idToken) {
        // Try to parse as JWT first
        if (idToken.includes(".")) {
          const tokenParts = idToken.split(".");
          if (tokenParts.length === 3) {
            try {
              const payload = JSON.parse(atob(tokenParts[1]));
              return payload["sub"] || null;
            } catch (e) {
              console.log("JWT parsing failed, trying alternative format");
            }
          }
        }

        // Fallback: try to parse as a simple token
        try {
          const payload = JSON.parse(idToken);
          return payload.sub || payload.userId || null;
        } catch (e) {
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing user ID from token:", error);
      return null;
    }
  };

  const loadFeedbacks = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (idToken) {
        headers.Authorization = idToken;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.FEEDBACK.GET_FEEDBACK_BY_BIKE(
          bike.bikeId
        )}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load feedbacks: ${response.status}`);
      }

      const data = await response.json();
      // Sort feedbacks by submittedAt in descending order (latest first)
      const sortedFeedbacks = (data.feedbacks || []).sort(
        (a: Feedback, b: Feedback) => {
          return (
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
          );
        }
      );
      console.log("line number 189 - sortedFeedbacks:", sortedFeedbacks);
      setFeedbacks(sortedFeedbacks);
      setAverageRating(data.averageRating || 0);
    } catch (err: any) {
      setLoadError(err.message || "Failed to load feedbacks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!comment.trim()) {
      setSubmitError("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("Please log in to submit feedback");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.FEEDBACK.POST_FEEDBACK}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify({
            bikeId: bike.bikeId,
            rating,
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setSubmitSuccess("Feedback submitted successfully!");
      setComment("");
      setRating(5);

      // Switch to View Reviews tab after successful submission
      setActiveTab("view");

      // Reload feedbacks to show the new one
      setTimeout(() => {
        loadFeedbacks();
      }, 1000);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFeedback = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setEditRating(feedback.rating);
    setEditComment(feedback.comment);
    setUpdateError("");
    setUpdateSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingFeedback(null);
    setEditRating(5);
    setEditComment("");
    setUpdateError("");
    setUpdateSuccess("");
  };

  const handleUpdateFeedback = async () => {
    if (!editingFeedback || !editComment.trim()) {
      setUpdateError("Please enter a comment");
      return;
    }

    setIsUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("Please log in to update feedback");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.FEEDBACK.UPDATE_FEEDBACK(
          editingFeedback.feedbackId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify({
            rating: editRating,
            comment: editComment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update feedback");
      }

      setUpdateSuccess("Feedback updated successfully!");

      // Reload feedbacks to show the updated one
      setTimeout(() => {
        loadFeedbacks();
        handleCancelEdit();
      }, 1000);
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSentimentTag = (sentiment: string) => {
    const sentimentConfig = {
      POSITIVE: {
        color: "bg-green-500 text-white",
        text: "Positive"
      },
      NEGATIVE: {
        color: "bg-red-500 text-white",
        text: "Negative"
      },
      NEUTRAL: {
        color: "bg-blue-500 text-white",
        text: "Neutral"
      }
    };

    const config = sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.NEUTRAL;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onRatingChange?: (rating: number) => void
  ) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              if (interactive) {
                if (onRatingChange) {
                  onRatingChange(star);
                } else {
                  setRating(star);
                }
              }
            }}
            className={`${interactive ? "cursor-pointer" : "cursor-default"}`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-400"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-green-400" />
            <h2 className="text-xl font-semibold text-white">
              Reviews & Feedback
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Bike Info */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <img
              src={
                bike.imageUrl ||
                "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400"
              }
              alt={bike.type}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h3 className="text-lg font-semibold text-white">{bike.type}</h3>
              <p className="text-gray-300">${bike.hourlyRate}/hour</p>
              {averageRating > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  {renderStars(averageRating)}
                  <span className="text-sm text-gray-300">
                    {averageRating.toFixed(1)} ({feedbacks.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("view")}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
              activeTab === "view"
                ? "text-green-400 border-b-2 border-green-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <ThumbsUp className="h-4 w-4" />
              <span>View Reviews ({feedbacks.length})</span>
            </div>
          </button>
          {userType === "customer" && (
            <button
              onClick={() => setActiveTab("submit")}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === "submit"
                  ? "text-green-400 border-b-2 border-green-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Write Review</span>
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === "submit" ? (
            // Submit Feedback Tab
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating
                </label>
                {renderStars(rating, true)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this bike..."
                  className="w-full h-32 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {submitError && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded-lg">
                  {submitSuccess}
                </div>
              )}

              <button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !comment.trim()}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // View Feedback Tab
            <div>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading reviews...</p>
                </div>
              ) : loadError ? (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">{loadError}</p>
                  <button
                    onClick={loadFeedbacks}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No reviews yet</p>
                  {userType === "customer" && (
                    <p className="text-gray-500 text-sm mt-2">
                      Be the first to review this bike!
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div
                      key={feedback.feedbackId}
                      className="bg-gray-700 rounded-lg p-4"
                    >
                      {editingFeedback?.feedbackId === feedback.feedbackId ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                              Editing your review
                            </span>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-400 hover:text-white text-sm"
                            >
                              Cancel
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Rating
                            </label>
                            {renderStars(editRating, true, setEditRating)}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Comment
                            </label>
                            <textarea
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              placeholder="Update your review..."
                              className="w-full h-24 bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                            />
                          </div>

                          {updateError && (
                            <div className="bg-red-900 border border-red-700 text-red-200 px-3 py-2 rounded-lg text-sm">
                              {updateError}
                            </div>
                          )}

                          {updateSuccess && (
                            <div className="bg-green-900 border border-green-700 text-green-200 px-3 py-2 rounded-lg text-sm">
                              {updateSuccess}
                            </div>
                          )}

                          <button
                            onClick={handleUpdateFeedback}
                            disabled={isUpdating || !editComment.trim()}
                            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                          >
                            {isUpdating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-4 w-4" />
                                <span>Update Review</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {renderStars(feedback.rating)}
                              <span className="text-sm text-gray-400">
                                by{" "}
                                {feedback.username ||
                                  `User ${feedback.userId.slice(-8)}`}
                              </span>
                              {feedback.sentiment && (
                                renderSentimentTag(feedback.sentiment)
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(feedback.submittedAt)}
                              </span>
                              {userType === "customer" && (
                                <button
                                  onClick={() => {
                                    console.log(
                                      "Edit clicked for feedback:",
                                      feedback
                                    );
                                    console.log(
                                      "Current user ID:",
                                      getCurrentUserId()
                                    );
                                    console.log(
                                      "Feedback user ID:",
                                      feedback.userId
                                    );
                                    handleEditFeedback(feedback);
                                  }}
                                  className="text-gray-400 hover:text-green-400 transition-colors p-1"
                                  title="Edit your review"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-300">{feedback.comment}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
