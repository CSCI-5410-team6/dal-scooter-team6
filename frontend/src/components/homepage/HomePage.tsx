import React, { useState, useEffect, useCallback } from "react";
import {
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Star,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Search,
} from "lucide-react";
import Chatbot from "../chatbot/ChatBot";
import About from "./About";
import Service from "./Service";
import Contact from "./Contact";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contextStore/AuthContext";
import { Auth } from "aws-amplify";
import API_CONFIG from "../../config/apiConfig";
import FeedbackModal from "../FeedbackModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Bike {
  bikeId: string;
  type: string;
  hourlyRate: number;
  discountCode: string;
  imageUrl: string;
  features: {
    batteryLife: string;
    heightAdjustable: string;
  };
  createdAt: string;
}

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [bikesLoading, setBikesLoading] = useState(false);
  const [bikesError, setBikesError] = useState("");

  // Pagination state
  const [currentBikePage, setCurrentBikePage] = useState(1);
  const [itemsPerPage] = useState(3);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Bike details modal state
  const [showBikeDetailsModal, setShowBikeDetailsModal] = useState(false);
  const [selectedBikeForDetails, setSelectedBikeForDetails] =
    useState<Bike | null>(null);

  // Reviews and Availability modal state
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedBikeForAction, setSelectedBikeForAction] =
    useState<Bike | null>(null);

  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Availability state
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Reviews state
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  // Bike ratings state
  const [bikeRatings, setBikeRatings] = useState<{ [bikeId: string]: number }>(
    {}
  );
  const [bikeReviewCounts, setBikeReviewCounts] = useState<{
    [bikeId: string]: number;
  }>({});
  const [ratingsLoading, setRatingsLoading] = useState<{
    [bikeId: string]: boolean;
  }>({});

  // FeedbackModal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBikeForFeedback, setSelectedBikeForFeedback] =
    useState<any>(null);

  // Complaints state
  const [showComplaintsModal, setShowComplaintsModal] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [createTicketLoading, setCreateTicketLoading] = useState(false);
  const [createTicketError, setCreateTicketError] = useState("");
  const [createTicketSuccess, setCreateTicketSuccess] = useState("");
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: "general",
    bikeId: "",
  });

  const navigate = useNavigate();
  const { cognitoUser, setCognitoUser } = useAuthContext();

  // Helper for base64url decoding
  function base64UrlDecode(str: string) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) {
      str += "=";
    }
    return atob(str);
  }

  // Helper to extract name and user type from idToken in localStorage, and debug info
  function getUserInfoAndDebug() {
    let debug: {
      idTokenKey: string | undefined;
      rawToken?: string | null;
      splitParts?: string[];
      payload: any;
      name: string | null;
      userType: string | null;
      error?: string;
    } = { idTokenKey: undefined, payload: null, name: null, userType: null };
    try {
      const idTokenKey = Object.keys(localStorage).find((key) =>
        key.includes(".idToken")
      );
      debug.idTokenKey = idTokenKey;
      if (idTokenKey) {
        const idToken = localStorage.getItem(idTokenKey);
        debug.rawToken = idToken;
        if (idToken) {
          const parts = idToken.split(".");
          debug.splitParts = parts;
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(base64UrlDecode(parts[1]));
              debug.payload = payload;
              debug.name = payload.name || null;
              debug.userType = payload["custom:userType"] || null;
            } catch (err: any) {
              debug.error =
                "base64UrlDecode/JSON.parse error: " +
                (err?.message || String(err));
            }
          } else {
            debug.error = "Token does not have 3 parts";
          }
        } else {
          debug.error = "idToken not found in localStorage";
        }
      } else {
        debug.error = "idTokenKey not found";
      }
    } catch (err: any) {
      debug.error = "Outer error: " + (err?.message || String(err));
    }
    return debug;
  }
  const debugInfo = getUserInfoAndDebug();
  const userName = debugInfo.name;
  const userType = debugInfo.userType;

  // Fetch all bikes
  const fetchBikes = useCallback(async () => {
    setBikesLoading(true);
    setBikesError("");
    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization header if user is logged in
      if (idToken) {
        headers.Authorization = idToken;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.GET_ALL}`,
        {
          method: "GET",
          headers,
        }
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log("HomePage: Fetched bikes:", data);
      setBikes(data);

      // Calculate ratings for all bikes
      if (data && data.length > 0) {
        data.forEach((bike: Bike) => {
          calculateBikeRating(bike.bikeId);
        });
      }
    } catch (err: any) {
      setBikesError(err.message || "Failed to fetch bikes.");
    } finally {
      setBikesLoading(false);
    }
  }, []);

  // Load bikes on component mount
  useEffect(() => {
    console.log("HomePage: Component mounted, fetching bikes...");
    fetchBikes();
  }, [fetchBikes]);

  // Log out handler
  const handleLogout = async () => {
    try {
      await Auth.signOut(); // If using aws-amplify Auth
    } catch (e) {}
    // Remove all Cognito tokens from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("CognitoIdentityServiceProvider")) {
        localStorage.removeItem(key);
      }
    });
    setCognitoUser(null);
    navigate("/");
  };

  // Bike details modal handlers
  const handleOpenBikeDetailsModal = (bike: Bike) => {
    setSelectedBikeForDetails(bike);
    setShowBikeDetailsModal(true);
    // Calculate rating for this bike if not already calculated
    if (!bikeRatings[bike.bikeId]) {
      calculateBikeRating(bike.bikeId);
    }
  };

  const handleCloseBikeDetailsModal = () => {
    setShowBikeDetailsModal(false);
    setSelectedBikeForDetails(null);
  };

  // Reviews modal handlers
  const handleOpenReviewsModal = (bike: Bike) => {
    setSelectedBikeForAction(bike);
    setShowReviewsModal(true);
    setShowBikeDetailsModal(false);
    fetchReviews(bike.bikeId);
  };

  const handleCloseReviewsModal = () => {
    setShowReviewsModal(false);
    setSelectedBikeForAction(null);
    setReviewsData([]);
    setReviewsError("");
  };

  // FeedbackModal handlers
  const handleOpenFeedbackModal = (bike: any) => {
    setSelectedBikeForFeedback(bike);
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedBikeForFeedback(null);
  };

  // Authentication helper
  const isUserLoggedIn = () => {
    const idTokenKey = Object.keys(localStorage).find(
      (key) =>
        key.includes("CognitoIdentityServiceProvider") &&
        key.includes("idToken")
    );
    return idTokenKey ? !!localStorage.getItem(idTokenKey) : false;
  };

  // Complaints handlers
  const handleOpenComplaintsModal = () => {
    setShowComplaintsModal(true);
    fetchUserTickets();
  };

  const handleCloseComplaintsModal = () => {
    setShowComplaintsModal(false);
    setTicketsError("");
  };

  const handleOpenCreateTicketModal = () => {
    setShowCreateTicketModal(true);
    setTicketForm({
      subject: "",
      description: "",
      priority: "medium",
      category: "general",
      bikeId: "",
    });
  };

  const handleCloseCreateTicketModal = () => {
    setShowCreateTicketModal(false);
    setCreateTicketError("");
    setCreateTicketSuccess("");
  };

  const handleCreateTicket = () => {
    if (ticketForm.subject && ticketForm.description) {
      createTicket(ticketForm);
    } else {
      setCreateTicketError("Subject and description are required");
    }
  };

  const handleTicketFormChange = (field: string, value: string) => {
    setTicketForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Fetch user tickets
  const fetchUserTickets = useCallback(async () => {
    if (!isUserLoggedIn()) return;

    setTicketsLoading(true);
    setTicketsError("");
    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.TICKETS.GET_USER_TICKETS}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched user tickets:", data);
      setUserTickets(data.tickets || []);
    } catch (err: any) {
      console.error("Failed to fetch user tickets:", err.message);
      setTicketsError(err.message || "Failed to fetch tickets");
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  // Create ticket
  const createTicket = useCallback(
    async (ticketData: any) => {
      setCreateTicketLoading(true);
      setCreateTicketError("");
      setCreateTicketSuccess("");
      try {
        const idTokenKey = Object.keys(localStorage).find(
          (key) =>
            key.includes("CognitoIdentityServiceProvider") &&
            key.includes("idToken")
        );
        const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

        if (!idToken) {
          throw new Error("ID token not found. Please log in again.");
        }

        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.TICKETS.CREATE}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: idToken,
            },
            body: JSON.stringify(ticketData),
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ticket created:", data);
        setCreateTicketSuccess("Complaint submitted successfully!");

        // Close modal after a short delay
        setTimeout(() => {
          setShowCreateTicketModal(false);
          setCreateTicketSuccess("");
          setTicketForm({
            subject: "",
            description: "",
            priority: "medium",
            category: "general",
            bikeId: "",
          });
        }, 2000);

        // Refresh tickets list
        fetchUserTickets();
      } catch (err: any) {
        console.error("Failed to create ticket:", err.message);
        setCreateTicketError(err.message || "Failed to submit complaint");
      } finally {
        setCreateTicketLoading(false);
      }
    },
    [fetchUserTickets]
  );

  // Ticket helper functions
  const getTicketPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "text-red-500";
      case "in_progress":
        return "text-yellow-500";
      case "resolved":
        return "text-green-500";
      case "closed":
        return "text-gray-500";
      default:
        return "text-gray-500";
    }
  };

  // Fetch reviews
  const fetchReviews = async (bikeId: string) => {
    setReviewsLoading(true);
    setReviewsError("");

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
          bikeId
        )}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status}`);
      }

      const data = await response.json();
      setReviewsData(data);
    } catch (err: any) {
      setReviewsError(err.message || "Failed to fetch reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  // Calculate average rating for a bike
  const calculateBikeRating = async (bikeId: string) => {
    setRatingsLoading((prev) => ({ ...prev, [bikeId]: true }));
    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization header if user is logged in
      if (idToken) {
        headers.Authorization = idToken;
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.FEEDBACK.GET_FEEDBACK_BY_BIKE(
          bikeId
        )}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ratings: ${response.status}`);
      }

      const data = await response.json();

      // Use the same logic as FeedbackModal
      if (data && data.feedbacks && data.feedbacks.length > 0) {
        const averageRating = data.averageRating || 0;
        const reviewCount = data.feedbacks.length;
        console.log(
          `Calculated rating for bike ${bikeId}:`,
          averageRating,
          "from",
          reviewCount,
          "reviews"
        );
        setBikeRatings((prev) => ({ ...prev, [bikeId]: averageRating }));
        setBikeReviewCounts((prev) => ({ ...prev, [bikeId]: reviewCount }));
      } else {
        // No reviews yet, set default rating
        console.log(`No reviews found for bike ${bikeId}`);
        setBikeRatings((prev) => ({ ...prev, [bikeId]: 0 }));
        setBikeReviewCounts((prev) => ({ ...prev, [bikeId]: 0 }));
      }
    } catch (err: any) {
      console.error(
        `Failed to calculate rating for bike ${bikeId}:`,
        err.message
      );
      // Set default rating on error
      setBikeRatings((prev) => ({ ...prev, [bikeId]: 0 }));
    } finally {
      setRatingsLoading((prev) => ({ ...prev, [bikeId]: false }));
    }
  };

  // Availability modal handlers
  const handleOpenAvailabilityModal = (bike: Bike) => {
    setSelectedBikeForAction(bike);
    setShowAvailabilityModal(true);
    setShowBikeDetailsModal(false);
    fetchAvailability(bike.bikeId);
  };

  const handleCloseAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    setSelectedBikeForAction(null);
    setAvailabilityData(null);
    setAvailabilityError("");
  };

  // Fetch availability
  const fetchAvailability = async (bikeId: string) => {
    setAvailabilityLoading(true);
    setAvailabilityError("");

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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.GET_AVAILABILITY(bikeId)}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.status}`);
      }

      const data = await response.json();
      setAvailabilityData(data);
    } catch (err: any) {
      setAvailabilityError(err.message || "Failed to fetch availability");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Book now handler
  const handleBookNow = (bike: Bike) => {
    // Check if user is logged in
    const idTokenKey = Object.keys(localStorage).find(
      (key) =>
        key.includes("CognitoIdentityServiceProvider") &&
        key.includes("idToken")
    );
    const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

    if (!idToken) {
      // Guest user - redirect to login
      alert("Please log in to book a bike.");
      navigate("/login");
      return;
    }

    setSelectedBikeForAction(bike);
    setSelectedSlots([]);
    setShowBookingModal(true);
    setShowBikeDetailsModal(false);
    setBookingError("");
    setBookingSuccess("");
    setBookingDetails(null);
    fetchAvailability(bike.bikeId);
  };

  // Booking handlers
  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedSlots([]);
    setBookingError("");
    setBookingSuccess("");
    setBookingDetails(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBikeForAction || selectedSlots.length === 0) {
      setBookingError("Please select a time slot");
      return;
    }

    // For single booking, only use the first selected slot
    const selectedSlot = selectedSlots[0];

    setBookingLoading(true);
    setBookingError("");
    setBookingSuccess("");

    try {
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;
      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BOOKINGS.CREATE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify({
            bikeId: selectedBikeForAction.bikeId,
            bookingDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
            slotTime: selectedSlot, // Single slot time
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            "One or more time slots are already reserved. Please choose different times."
          );
        }
        throw new Error(data.error || `Booking failed: ${response.status}`);
      }

      // Show toast notification
      toast.success(
        "Your booking request has been submitted and is waiting for approval!",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );

      // Close modal immediately
      setShowBookingModal(false);
      setBookingSuccess("");
      setBookingDetails(null);
      setSelectedSlots([]); // Reset selected slots
    } catch (err: any) {
      setBookingError(err.message || "Failed to create bookings");
    } finally {
      setBookingLoading(false);
    }
  };

  // Search functionality
  const filteredBikes = bikes.filter((bike) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bike.bikeId.toLowerCase().includes(searchLower) ||
      bike.type.toLowerCase().includes(searchLower) ||
      bike.features.batteryLife.toLowerCase().includes(searchLower) ||
      bike.hourlyRate.toString().includes(searchLower)
    );
  });

  // Calculate pagination for filtered bikes
  const indexOfLastBike = currentBikePage * itemsPerPage;
  const indexOfFirstBike = indexOfLastBike - itemsPerPage;
  const currentBikes = filteredBikes.slice(indexOfFirstBike, indexOfLastBike);
  const totalPages = Math.ceil(filteredBikes.length / itemsPerPage);

  // Debug logging
  console.log("HomePage Debug:", {
    userName,
    userType,
    bikesCount: bikes.length,
    searchTerm,
    currentBikePage,
    totalPages,
    filteredBikesCount: filteredBikes.length,
    currentBikesCount: currentBikes.length,
  });

  const handlePageChange = (page: number) => {
    setCurrentBikePage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "about":
        return <About />;
      case "service":
        return <Service />;
      case "complaints":
        return (
          <div className="min-h-screen bg-gray-900 text-white py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-green-400 mb-4">
                  Complaints & Support
                </h1>
                <p className="text-gray-300 text-lg">
                  We're here to help. Submit your complaints or get support.
                </p>
              </div>

              {isUserLoggedIn() ? (
                <div className="bg-gray-800 rounded-lg p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-white">
                      My Complaints
                    </h2>
                    <button
                      onClick={handleOpenCreateTicketModal}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Submit New Complaint</span>
                    </button>
                  </div>

                  {ticketsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-300">Loading complaints...</p>
                    </div>
                  ) : ticketsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-4">{ticketsError}</p>
                      <button
                        onClick={fetchUserTickets}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                      >
                        Retry
                      </button>
                    </div>
                  ) : userTickets && userTickets.length > 0 ? (
                    <div className="space-y-4">
                      {userTickets.map((ticket: any, index: number) => (
                        <div key={index} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {ticket.subject}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                ticket.status === "open"
                                  ? "bg-red-500 text-white"
                                  : ticket.status === "in_progress"
                                  ? "bg-yellow-500 text-white"
                                  : ticket.status === "resolved"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-500 text-white"
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-gray-300 mb-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span>Priority: {ticket.priority}</span>
                            <span>
                              Created:{" "}
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No complaints found
                      </h3>
                      <p className="text-gray-300">
                        You haven't submitted any complaints yet.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-8">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold mb-4">
                      Submit a Complaint
                    </h2>
                    <p className="text-gray-300 mb-6">
                      Please login to submit complaints and get support.
                    </p>
                    <button
                      onClick={() => navigate("/login")}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Login to Submit Complaint
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "contact":
        return <Contact />;
      default:
        return renderHomePage();
    }
  };

  const renderHomePage = () => (
    <>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  New 2024 E-Bike
                  <span className="block text-green-400">Overview</span>
                </h1>
                <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
                  Experience the future of urban mobility with our premium
                  e-bike fleet. Eco-friendly, efficient, and designed for the
                  modern commuter. Book your ride today and transform your daily
                  journey.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    const bikesSection =
                      document.getElementById("available-bikes");
                    bikesSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center group"
                >
                  GET BIKE
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Find Location
                </button>
              </div>

              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-gray-300">50k+ Riders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm text-gray-300">
                    {bikes.length > 0
                      ? (() => {
                          const totalRating = Object.values(bikeRatings).reduce(
                            (sum, rating) => sum + rating,
                            0
                          );
                          const averageRating =
                            totalRating / Object.keys(bikeRatings).length;
                          return averageRating > 0
                            ? `${averageRating.toFixed(1)} Rating`
                            : "4.8 Rating";
                        })()
                      : "4.8 Rating"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-gray-300">24/7 Service</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Premium E-Bike"
                  className="w-full h-auto max-w-lg mx-auto"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* All Available Bikes Section */}
      <section
        id="available-bikes"
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Available E-Bikes
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl">
                Choose from our premium selection of electric bikes, each
                designed for different adventures and lifestyles.
              </p>
            </div>
            {/* Search Bar */}
            {bikes.length > 0 && (
              <div className="w-80">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bikes..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentBikePage(1); // Reset to first page when searching
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>
            )}
          </div>

          {bikesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading bikes...</p>
            </div>
          ) : bikesError ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{bikesError}</p>
              <button
                onClick={fetchBikes}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : bikes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">
                No bikes available at the moment.
              </p>
              <button
                onClick={fetchBikes}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentBikes.map((bike) => (
                  <div
                    key={bike.bikeId}
                    className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all duration-300 transform hover:scale-105 border border-gray-700"
                  >
                    <div className="relative">
                      <img
                        src={
                          bike.imageUrl ||
                          "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400"
                        }
                        alt={bike.type}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ${bike.hourlyRate}/hour
                      </div>
                      {bike.discountCode && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {bike.discountCode}
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold">{bike.type}</h3>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-300">
                            {ratingsLoading[bike.bikeId] ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-400"></div>
                            ) : bikeRatings[bike.bikeId] ? (
                              `${bikeRatings[bike.bikeId].toFixed(1)} (${
                                bikeReviewCounts[bike.bikeId] || 0
                              } reviews)`
                            ) : (
                              "No reviews"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-300">
                            Battery: {bike.features.batteryLife}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-gray-300">
                            Height Adjustable:{" "}
                            {bike.features.heightAdjustable === "true"
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenBikeDetailsModal(bike)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentBikePage - 1)}
                    disabled={currentBikePage === 1}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg transition-colors ${
                          currentBikePage === page
                            ? "bg-green-500 text-white"
                            : "bg-gray-700 hover:bg-gray-600 text-white"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentBikePage + 1)}
                    disabled={currentBikePage === totalPages}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">150+</div>
              <div className="text-gray-300">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">50k+</div>
              <div className="text-gray-300">Happy Riders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">
                99.9%
              </div>
              <div className="text-gray-300">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
              <div className="text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold text-green-400">E-Ride</div>
              <p className="text-gray-300">
                Revolutionizing urban transportation with premium electric
                bikes.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <div className="space-y-2 text-gray-300">
                <div>Hourly Rentals</div>
                <div>Daily Packages</div>
                <div>Corporate Plans</div>
                <div>Group Bookings</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-gray-300">
                <div>Help Center</div>
                <div>Contact Us</div>
                <div>Safety Guide</div>
                <div>Terms & Conditions</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-300">
                <div>About Us</div>
                <div>Careers</div>
                <div>Press</div>
                <div>Partnerships</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 E-Ride. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-green-400">
                  E-Ride
                </span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <button
                    onClick={() => setCurrentPage("home")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === "home"
                        ? "text-white"
                        : "text-gray-300 hover:text-green-400"
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setCurrentPage("about")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === "about"
                        ? "text-white"
                        : "text-gray-300 hover:text-green-400"
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setCurrentPage("service")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === "service"
                        ? "text-white"
                        : "text-gray-300 hover:text-green-400"
                    }`}
                  >
                    Services
                  </button>
                  <button
                    onClick={() => setCurrentPage("complaints")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === "complaints"
                        ? "text-white"
                        : "text-gray-300 hover:text-green-400"
                    }`}
                  >
                    Complaints
                  </button>
                  <button
                    onClick={() => setCurrentPage("contact")}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === "contact"
                        ? "text-white"
                        : "text-gray-300 hover:text-green-400"
                    }`}
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {userName && (
                <>
                  <span className="ml-4 font-semibold text-green-400">
                    Welcome, {userName}!
                  </span>
                  {userType === "customer" && (
                    <button
                      onClick={() => navigate("/my-bookings")}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      My Bookings
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors"
                  >
                    Log Out
                  </button>
                </>
              )}
              {!userName && (
                <button
                  onClick={() => navigate("/login")}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Login
                </button>
              )}
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-white focus:outline-none focus:text-white"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
              <button
                onClick={() => {
                  setCurrentPage("home");
                  setIsMenuOpen(false);
                }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === "home"
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentPage("about");
                  setIsMenuOpen(false);
                }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === "about"
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                About
              </button>
              <button
                onClick={() => {
                  setCurrentPage("service");
                  setIsMenuOpen(false);
                }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === "service"
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Services
              </button>
              <button
                onClick={() => {
                  setCurrentPage("complaints");
                  setIsMenuOpen(false);
                }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === "complaints"
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Complaints
              </button>
              <button
                onClick={() => {
                  setCurrentPage("contact");
                  setIsMenuOpen(false);
                }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === "contact"
                    ? "text-white"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Contact
              </button>
              {userName && userType === "customer" && (
                <button
                  onClick={() => {
                    navigate("/my-bookings");
                  }}
                  className="w-full text-left bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium mt-4"
                >
                  My Bookings
                </button>
              )}
              {!userName && (
                <button
                  onClick={() => {
                    navigate("/login");
                  }}
                  className="w-full text-left bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium mt-4"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      {renderPage()}

      {/* Bike Details Modal */}
      {showBikeDetailsModal && selectedBikeForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                {selectedBikeForDetails.type} - Details
              </h2>
              <button
                onClick={handleCloseBikeDetailsModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bike Image */}
              <div>
                <img
                  src={
                    selectedBikeForDetails.imageUrl ||
                    "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400"
                  }
                  alt={selectedBikeForDetails.type}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              {/* Bike Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {selectedBikeForDetails.type}
                  </h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-gray-300">
                      {ratingsLoading[selectedBikeForDetails.bikeId] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b border-yellow-400"></div>
                      ) : bikeRatings[selectedBikeForDetails.bikeId] ? (
                        `${bikeRatings[selectedBikeForDetails.bikeId].toFixed(
                          1
                        )} Rating (${
                          bikeReviewCounts[selectedBikeForDetails.bikeId] || 0
                        } reviews)`
                      ) : (
                        "No reviews"
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Hourly Rate:</span>
                    <span className="text-green-400 font-semibold text-lg">
                      ${selectedBikeForDetails.hourlyRate}/hour
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Battery Life:</span>
                    <span className="text-white">
                      {selectedBikeForDetails.features.batteryLife}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Height Adjustable:</span>
                    <span className="text-white">
                      {selectedBikeForDetails.features.heightAdjustable ===
                      "true"
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>

                  {selectedBikeForDetails.discountCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Discount Code:</span>
                      <span className="text-red-400 font-semibold">
                        {selectedBikeForDetails.discountCode}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Bike ID:</span>
                    <span className="text-blue-400 font-mono">
                      {selectedBikeForDetails.bikeId}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="space-y-3">
                    <button
                      onClick={() => handleBookNow(selectedBikeForDetails)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Book Now</span>
                    </button>
                    <div className="flex space-x-3">
                      <button
                        onClick={() =>
                          handleOpenFeedbackModal(selectedBikeForDetails)
                        }
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Reviews</span>
                      </button>
                      <button
                        onClick={() =>
                          handleOpenAvailabilityModal(selectedBikeForDetails)
                        }
                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Check Availability</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && selectedBikeForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Availability for {selectedBikeForAction.type}
              </h2>
              <button
                onClick={handleCloseAvailabilityModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {availabilityLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading availability...</p>
                </div>
              ) : availabilityError ? (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">{availabilityError}</p>
                  <button
                    onClick={() =>
                      fetchAvailability(selectedBikeForAction.bikeId)
                    }
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : availabilityData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {availabilityData.availableCount || 0}
                      </div>
                      <div className="text-sm text-gray-300">Available</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-red-400">
                        {availabilityData.reservedCount || 0}
                      </div>
                      <div className="text-sm text-gray-300">Reserved</div>
                    </div>
                    <div className="text-center p-4 bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {availabilityData.totalSlots || 0}
                      </div>
                      <div className="text-sm text-gray-300">Total Slots</div>
                    </div>
                  </div>

                  {availabilityData.availableSlots &&
                  availabilityData.availableSlots.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Available Time Slots
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {availabilityData.availableSlots.map(
                          (slot: string, index: number) => (
                            <div
                              key={index}
                              className="bg-green-900/30 border border-green-500 rounded-lg p-3 text-center"
                            >
                              <span className="text-green-400 font-medium">
                                {slot}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-300">
                        No available slots for today
                      </p>
                    </div>
                  )}

                  {/* Book Now Button */}
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={() => {
                        setShowAvailabilityModal(false);
                        setShowBookingModal(true);
                        setSelectedBikeForAction(selectedBikeForAction);
                        setSelectedSlots([]); // Reset selected slots
                        setBookingError("");
                        setBookingSuccess("");
                        setBookingDetails(null);
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      Book This Bike
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No availability data found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedBikeForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Book {selectedBikeForAction.type}
              </h2>
              <button
                onClick={handleCloseBookingModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {availabilityLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading available slots...</p>
                </div>
              ) : availabilityError ? (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-4">{availabilityError}</p>
                  <button
                    onClick={() =>
                      fetchAvailability(selectedBikeForAction.bikeId)
                    }
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : availabilityData &&
                availabilityData.availableSlots &&
                availabilityData.availableSlots.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Select Time Slot (Single Booking)
                  </h3>
                  {selectedSlots.length > 0 && (
                    <div className="mb-4 p-3 bg-green-900/30 border border-green-500 rounded-lg">
                      <p className="text-green-400 text-sm">
                        Selected Time: {selectedSlots[0]}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {availabilityData.availableSlots.map(
                      (slot: string, index: number) => (
                        <div key={index} className="space-y-2">
                          <button
                            onClick={() => {
                              // For single booking, replace the selection instead of adding/removing
                              setSelectedSlots([slot]);
                            }}
                            className={`w-full p-4 rounded-lg border-2 transition-colors ${
                              selectedSlots.includes(slot)
                                ? "border-green-500 bg-green-900/30 text-green-400"
                                : "border-gray-600 bg-gray-700 text-white hover:border-green-400"
                            }`}
                          >
                            <span className="font-medium">{slot}</span>
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-300">No available slots for today</p>
                </div>
              )}

              {/* Error/Success Messages */}
              {bookingError && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-red-400 font-medium">
                      Error: {bookingError}
                    </span>
                  </div>
                </div>
              )}

              {bookingSuccess && (
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-green-400 font-medium">
                      {bookingSuccess}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleConfirmBooking}
                  disabled={bookingLoading || selectedSlots.length === 0}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {bookingLoading
                    ? "Submitting Request..."
                    : "Confirm Single Booking"}
                </button>
                <button
                  onClick={handleCloseBookingModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FeedbackModal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleCloseFeedbackModal}
        bike={selectedBikeForFeedback}
        userType={isUserLoggedIn() ? "customer" : null}
      />

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Submit New Complaint
              </h2>
              <button
                onClick={handleCloseCreateTicketModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) =>
                    handleTicketFormChange("subject", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  placeholder="Enter complaint subject"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description *
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) =>
                    handleTicketFormChange("description", e.target.value)
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  placeholder="Describe your complaint in detail"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Priority
                </label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) =>
                    handleTicketFormChange("priority", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) =>
                    handleTicketFormChange("category", e.target.value)
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="general">General</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="service">Service</option>
                </select>
              </div>

              {/* Error/Success Messages */}
              {createTicketError && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-red-400 font-medium">
                      Error: {createTicketError}
                    </span>
                  </div>
                </div>
              )}

              {createTicketSuccess && (
                <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-green-400 font-medium">
                      {createTicketSuccess}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleCreateTicket}
                  disabled={createTicketLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {createTicketLoading ? "Submitting..." : "Submit Complaint"}
                </button>
                <button
                  onClick={handleCloseCreateTicketModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chatbot */}
      <Chatbot />
      <ToastContainer />
    </div>
  );
}

export default HomePage;
