import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Clock,
  MapPin,
  Star,
  MessageSquare,
  XCircle,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API_CONFIG from "../../config/apiConfig";
import FeedbackModal from "../FeedbackModal";

// Helper for base64url decoding (same as HomePage)
function base64UrlDecode(str: string) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return atob(str);
}

interface AvailabilityData {
  bikeId: string;
  date: string;
  slotStatuses: { [key: string]: string };
  availableSlots: string[];
  reservedSlots: string[];
  totalSlots: number;
  availableCount: number;
  reservedCount: number;
}

const ADMIN_TABS = [
  { key: "home", label: "Home" },
  { key: "bikes", label: "Bike List" },
  { key: "approve-bookings", label: "Approve Bookings" },
  { key: "bookings", label: "Booking Stats" },
  { key: "tickets", label: "Tickets" },
  { key: "analytics", label: "Analytics" },
];

const AdminDashboard: React.FC = () => {
  const [bikes, setBikes] = useState<any[]>([]);
  const [bikesLoading, setBikesLoading] = useState(false);
  const [bikesError, setBikesError] = useState("");
  const [showEditBikeModal, setShowEditBikeModal] = useState(false);
  const [editingBike, setEditingBike] = useState<any>(null);
  const [editBikeLoading, setEditBikeLoading] = useState(false);
  const [editBikeError, setEditBikeError] = useState("");
  const [editBikeImageKey, setEditBikeImageKey] = useState(0);
  const [showBikeDetailModal, setShowBikeDetailModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState<any>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<string | null>(null);

  // Availability state
  const [availabilityData, setAvailabilityData] = useState<{
    [bikeId: string]: AvailabilityData;
  }>({});
  const [availabilityLoading, setAvailabilityLoading] = useState<{
    [bikeId: string]: boolean;
  }>({});
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedBikeForAvailability, setSelectedBikeForAvailability] =
    useState<any>(null);

  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBikeForFeedback, setSelectedBikeForFeedback] =
    useState<any>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading, false = not admin, true = admin
  const [userName, setUserName] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});
  const [debugTokens, setDebugTokens] = useState<any[]>([]);
  const [debugUserData, setDebugUserData] = useState<any>({});
  const [userType, setUserType] = useState<string | null>(null);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [newBike, setNewBike] = useState({
    bikeId: "",
    type: "gyroscooter",
    features: {
      batteryLife: "",
      heightAdjustable: false,
    },
    hourlyRate: 0,
    discountCode: "",
    imageBase64: "",
  });
  const [imageInputKey, setImageInputKey] = useState(0);
  const [addBikeLoading, setAddBikeLoading] = useState(false);
  const [addBikeError, setAddBikeError] = useState("");

  // Bike ratings state (for franchise admin to see ratings)
  const [bikeRatings, setBikeRatings] = useState<{ [bikeId: string]: number }>(
    {}
  );
  const [bikeReviewCounts, setBikeReviewCounts] = useState<{
    [bikeId: string]: number;
  }>({});
  const [ratingsLoading, setRatingsLoading] = useState<{
    [bikeId: string]: boolean;
  }>({});
  const [addBikeSuccess, setAddBikeSuccess] = useState("");

  // Bike management modal state
  const [showBikeManagementModal, setShowBikeManagementModal] = useState(false);
  const [selectedBikeForManagement, setSelectedBikeForManagement] =
    useState<any>(null);

  // Booking detail modal state
  const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const bikesPerPage = 3;

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketSearchTerm, setTicketSearchTerm] = useState("");
  const [bookingSearchTerm, setBookingSearchTerm] = useState("");

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  // Approve bookings state
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [pendingBookingsLoading, setPendingBookingsLoading] = useState(false);
  const [pendingBookingsError, setPendingBookingsError] = useState("");
  const [approveBookingLoading, setApproveBookingLoading] = useState<
    string | null
  >(null);

  // Bookings state
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  // Availability update state
  const [showUpdateAvailabilityModal, setShowUpdateAvailabilityModal] =
    useState(false);
  const [selectedBikeForUpdate, setSelectedBikeForUpdate] = useState<any>(null);
  const [updateAvailabilityLoading, setUpdateAvailabilityLoading] =
    useState(false);
  const [updateAvailabilityError, setUpdateAvailabilityError] = useState("");
  const [updateAvailabilitySuccess, setUpdateAvailabilitySuccess] =
    useState("");
  const [availabilityForm, setAvailabilityForm] = useState({
    isAvailable: true,
    timeSlots: ["09:00-11:00", "14:00-16:00"],
    notes: "",
  });

  // Ticket state
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [createTicketLoading, setCreateTicketLoading] = useState(false);
  const [createTicketError, setCreateTicketError] = useState("");
  const [createTicketSuccess, setCreateTicketSuccess] = useState("");
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "medium",
    category: "technical",
    bikeId: "",
  });

  // Ticket resolution state
  const [resolutionForm, setResolutionForm] = useState({
    message: "",
  });
  const [resolveTicketLoading, setResolveTicketLoading] = useState(false);
  const [resolveTicketError, setResolveTicketError] = useState("");

  const navigate = useNavigate();

  // Fetch pending bookings
  const fetchPendingBookings = useCallback(async () => {
    setPendingBookingsLoading(true);
    setPendingBookingsError("");
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BOOKINGS.GET_ALL_BOOKINGS_ADMIN}`,
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
      console.log("DEBUG: All bookings data:", data);
      console.log("DEBUG: Bookings array:", data.bookings);

      if (data.bookings && data.bookings.length > 0) {
        console.log(
          "DEBUG: All booking statuses:",
          data.bookings.map((b: any) => b.status)
        );
      }

      // Filter only REQUESTED bookings (pending approval)
      const pending = data.bookings
        ? data.bookings.filter((booking: any) => {
            console.log("DEBUG: Booking status:", booking.status);
            return booking.status === "REQUESTED";
          })
        : [];

      console.log("DEBUG: Filtered pending bookings:", pending);
      setPendingBookings(pending);
    } catch (err: any) {
      setPendingBookingsError(
        err.message || "Failed to fetch pending bookings"
      );
    } finally {
      setPendingBookingsLoading(false);
    }
  }, []);

  // Approve or reject booking
  const handleApproveBooking = useCallback(
    async (referenceCode: string, status: "APPROVED" | "REJECTED") => {
      setApproveBookingLoading(referenceCode);
      try {
        const idTokenKey = Object.keys(localStorage).find(
          (key) =>
            key.includes("CognitoIdentityServiceProvider") &&
            key.includes("idToken")
        );
        const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

        console.log("DEBUG: ID Token Key:", idTokenKey);
        console.log("DEBUG: ID Token exists:", !!idToken);
        console.log("DEBUG: Reference Code:", referenceCode);
        console.log("DEBUG: Status:", status);

        if (!idToken) {
          throw new Error("ID token not found. Please log in again.");
        }

        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.BOOKINGS.APPROVE(
          referenceCode
        )}`;
        console.log("DEBUG: Request URL:", url);
        console.log("DEBUG: Request body:", { status });

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify({ status }),
        });

        console.log("DEBUG: Response status:", response.status);
        console.log("DEBUG: Response headers:", response.headers);

        if (!response.ok) {
          const errorText = await response.text();
          console.log("DEBUG: Error response:", errorText);
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Show success notification
        toast.success(`Booking ${status.toLowerCase()} successfully!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Refresh pending bookings
        fetchPendingBookings();
      } catch (err: any) {
        toast.error(
          err.message || `Failed to ${status.toLowerCase()} booking`,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } finally {
        setApproveBookingLoading(null);
      }
    },
    [fetchPendingBookings]
  );

  // Load pending bookings when tab is active
  useEffect(() => {
    if (activeTab === "approve-bookings") {
      fetchPendingBookings();
    }
  }, [activeTab, fetchPendingBookings]);

  const fetchBikes = useCallback(async () => {
    setBikesLoading(true);
    setBikesError("");
    try {
      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.GET_ALL}`,
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
      setBikes(data);

      // Calculate ratings for all bikes
      if (data && data.length > 0) {
        data.forEach((bike: any) => {
          calculateBikeRating(bike.bikeId);
        });
      }
    } catch (err: any) {
      setBikesError(err.message || "Failed to fetch bikes.");
    } finally {
      setBikesLoading(false);
    }
  }, []);

  const fetchAllBookings = useCallback(async () => {
    setBookingsLoading(true);
    setBookingsError("");
    try {
      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BOOKINGS.GET_ALL_BOOKINGS_ADMIN}`,
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
      console.log("Fetched all bookings:", data);
      console.log("First booking object:", data.bookings?.[0]);
      setAllBookings(data.bookings || []);
    } catch (err: any) {
      console.error("Failed to fetch all bookings:", err.message);
      setBookingsError(err.message || "Failed to fetch bookings");
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const fetchBikeById = useCallback(async (bikeId: string) => {
    setEditBikeLoading(true);
    setEditBikeError("");
    try {
      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.GET_BY_ID(bikeId)}`,
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
      setEditingBike(data);
      setShowEditBikeModal(true);
    } catch (err: any) {
      setEditBikeError(err.message || "Failed to fetch bike details.");
    } finally {
      setEditBikeLoading(false);
    }
  }, []);

  // Fetch availability for a specific bike
  const fetchAvailability = useCallback(async (bikeId: string) => {
    setAvailabilityLoading((prev) => ({ ...prev, [bikeId]: true }));
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.GET_AVAILABILITY(bikeId)}`,
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
      setAvailabilityData((prev) => ({ ...prev, [bikeId]: data }));
    } catch (err: any) {
      console.error(`Failed to fetch availability for ${bikeId}:`, err.message);
    } finally {
      setAvailabilityLoading((prev) => ({ ...prev, [bikeId]: false }));
    }
  }, []);

  const handleCheckAvailability = (bike: any) => {
    setSelectedBikeForAvailability(bike);
    setShowAvailabilityModal(true);
    // Fetch availability for the selected bike
    fetchAvailability(bike.bikeId);
  };

  const handleCloseAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    setSelectedBikeForAvailability(null);
  };

  const handleOpenFeedbackModal = (bike: any) => {
    setSelectedBikeForFeedback(bike);
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedBikeForFeedback(null);
  };

  // Calculate average rating for a bike (for franchise admin)
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
      setBikeReviewCounts((prev) => ({ ...prev, [bikeId]: 0 }));
    } finally {
      setRatingsLoading((prev) => ({ ...prev, [bikeId]: false }));
    }
  };

  // Bike management modal handlers
  const handleOpenBikeManagementModal = (bike: any) => {
    setSelectedBikeForManagement(bike);
    setShowBikeManagementModal(true);
    // Calculate rating for this bike if not already calculated
    if (!bikeRatings[bike.bikeId]) {
      calculateBikeRating(bike.bikeId);
    }
  };

  const handleCloseBikeManagementModal = () => {
    setShowBikeManagementModal(false);
    setSelectedBikeForManagement(null);
  };

  // Booking detail modal handlers
  const handleOpenBookingDetailModal = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingDetailModal(true);
  };

  const handleCloseBookingDetailModal = () => {
    setShowBookingDetailModal(false);
    setSelectedBooking(null);
  };

  // Pagination functions
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  // Filtered tickets for search
  const filteredTickets = allTickets.filter((ticket) => {
    const searchLower = ticketSearchTerm.toLowerCase();
    return (
      ticket.subject.toLowerCase().includes(searchLower) ||
      ticket.category.toLowerCase().includes(searchLower) ||
      ticket.status.toLowerCase().includes(searchLower) ||
      ticket.priority.toLowerCase().includes(searchLower) ||
      (ticket.bikeId && ticket.bikeId.toLowerCase().includes(searchLower))
    );
  });

  // Filtered bookings for search
  const filteredBookings = allBookings.filter((booking) => {
    const searchLower = bookingSearchTerm.toLowerCase();
    return (
      booking.bikeId.toLowerCase().includes(searchLower) ||
      booking.status.toLowerCase().includes(searchLower) ||
      (booking.displayName &&
        booking.displayName.toLowerCase().includes(searchLower)) ||
      booking.bookingId.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination for filtered bikes
  const indexOfLastBike = currentPage * bikesPerPage;
  const indexOfFirstBike = indexOfLastBike - bikesPerPage;
  const currentBikes = filteredBikes.slice(indexOfFirstBike, indexOfLastBike);
  const totalPages = Math.ceil(filteredBikes.length / bikesPerPage);

  const handleOpenUpdateAvailabilityModal = (bike: any) => {
    setSelectedBikeForUpdate(bike);
    setShowUpdateAvailabilityModal(true);
    setAvailabilityForm({
      isAvailable: true,
      timeSlots: ["09:00-11:00", "14:00-16:00"],
      notes: "",
    });
  };

  const handleCloseUpdateAvailabilityModal = () => {
    setShowUpdateAvailabilityModal(false);
    setSelectedBikeForUpdate(null);
    setUpdateAvailabilityError("");
    setUpdateAvailabilitySuccess("");
  };

  const handleUpdateAvailability = () => {
    if (selectedBikeForUpdate) {
      updateAvailability(selectedBikeForUpdate.bikeId, availabilityForm);
    }
  };

  const handleAddTimeSlot = () => {
    setAvailabilityForm((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, "09:00-11:00"],
    }));
  };

  const handleRemoveTimeSlot = (index: number) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index),
    }));
  };

  const handleTimeSlotChange = (index: number, value: string) => {
    setAvailabilityForm((prev) => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => (i === index ? value : slot)),
    }));
  };

  const getAvailabilityStatus = (bikeId: string) => {
    const data = availabilityData[bikeId];
    if (!data)
      return {
        status: "unknown",
        text: "Check Availability",
        color: "text-gray-400",
      };

    if (data.availableCount > 0) {
      return {
        status: "available",
        text: `${data.availableCount} slots available`,
        color: "text-green-500",
      };
    } else {
      return {
        status: "unavailable",
        text: "Fully booked",
        color: "text-red-500",
      };
    }
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getBookingStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "active":
        return "text-green-500";
      case "cancelled":
        return "text-red-500";
      case "pending":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const isValidDate = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  useEffect(() => {
    // Use .userData key for admin check
    const userDataKey = Object.keys(localStorage).find((key) =>
      key.endsWith(".userData")
    );
    let debugObj: any = {
      userDataKey,
      userDataStr: null,
      parsed: null,
      userType: null,
      name: null,
    };
    if (userDataKey) {
      const userDataStr = localStorage.getItem(userDataKey);
      debugObj.userDataStr = userDataStr;
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          debugObj.parsed = userData;
          // UserAttributes is an array of { Name, Value }
          const attrs = userData.UserAttributes || [];
          const userTypeAttr = attrs.find(
            (a: any) => a.Name === "custom:userType"
          );
          const nameAttr = attrs.find((a: any) => a.Name === "name");
          debugObj.userType = userTypeAttr ? userTypeAttr.Value : null;
          debugObj.name = nameAttr ? nameAttr.Value : null;
          setUserType(debugObj.userType);
          setUserName(debugObj.name);
          if (userTypeAttr && userTypeAttr.Value === "admin") {
            setIsAdmin(true);
            setDebugUserData(debugObj);
            // Fetch bikes after admin check passes
            fetchBikes();
            return;
          }
        } catch (e) {
          debugObj.error = (e as any)?.message || String(e);
        }
      }
    }
    setIsAdmin(false);
    setDebugUserData(debugObj);
    // Do not redirect for now, just show debug info
  }, [fetchBikes]);

  // Fetch bookings when bookings tab is active
  useEffect(() => {
    if (activeTab === "bookings" && isAdmin) {
      fetchAllBookings();
    }
  }, [activeTab, isAdmin, fetchAllBookings]);

  const updateAvailability = useCallback(
    async (bikeId: string, availabilityData: any) => {
      setUpdateAvailabilityLoading(true);
      setUpdateAvailabilityError("");
      setUpdateAvailabilitySuccess("");
      try {
        // Get the id token from localStorage
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
          `${API_CONFIG.BASE_URL}${API_CONFIG.AVAILABILITY.UPDATE_AVAILABILITY(
            bikeId
          )}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: idToken,
            },
            body: JSON.stringify(availabilityData),
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Availability updated:", data);
        setUpdateAvailabilitySuccess("Availability updated successfully!");

        // Close modal after a short delay
        setTimeout(() => {
          setShowUpdateAvailabilityModal(false);
          setSelectedBikeForUpdate(null);
          setUpdateAvailabilitySuccess("");
        }, 2000);
      } catch (err: any) {
        console.error("Failed to update availability:", err.message);
        setUpdateAvailabilityError(
          err.message || "Failed to update availability"
        );
      } finally {
        setUpdateAvailabilityLoading(false);
      }
    },
    []
  );

  const fetchAllTickets = useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError("");
    try {
      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.TICKETS.GET_ALL_ADMIN}`,
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
      console.log("Fetched all tickets:", data);
      setAllTickets(data.tickets || []);
    } catch (err: any) {
      console.error("Failed to fetch all tickets:", err.message);
      setTicketsError(err.message || "Failed to fetch tickets");
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      // Use the existing working APIs - fetch bookings directly
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const bookingsResponse = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BOOKINGS.GET_ALL_BOOKINGS_ADMIN}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
        }
      );

      if (!bookingsResponse.ok) {
        throw new Error(`API error: ${bookingsResponse.status}`);
      }

      const bookingsData = await bookingsResponse.json();

      // Get all feedback by fetching for each bike
      let allFeedbacks: any[] = [];
      let totalRating = 0;
      let totalReviews = 0;
      const bikeRatings: any = {};

      // Fetch feedback for each bike using the working calculateBikeRating logic
      for (const bike of bikes) {
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

          if (response.ok) {
            const data = await response.json();
            if (data && data.feedbacks && data.feedbacks.length > 0) {
              allFeedbacks.push(...data.feedbacks);

              // Calculate ratings
              data.feedbacks.forEach((feedback: any) => {
                if (feedback.rating) {
                  totalRating += feedback.rating;
                  totalReviews++;

                  if (!bikeRatings[bike.bikeId]) {
                    bikeRatings[bike.bikeId] = { total: 0, count: 0 };
                  }
                  bikeRatings[bike.bikeId].total += feedback.rating;
                  bikeRatings[bike.bikeId].count++;
                }
              });
            }
          }
        } catch (error) {
          console.error(
            `Error fetching feedback for bike ${bike.bikeId}:`,
            error
          );
        }
      }

      // Calculate analytics from fetched data
      const totalBookings = bookingsData.bookings?.length || 0;

      // Calculate revenue by getting bike details and multiplying with hourly rate
      let totalRevenue = 0;
      if (bookingsData.bookings) {
        for (const booking of bookingsData.bookings) {
          // Find the bike details to get the hourly rate
          const bike = bikes.find((b) => b.bikeId === booking.bikeId);
          if (bike && bike.hourlyRate) {
            const hoursBooked = 1; // Assuming each booking is for 1 hour
            totalRevenue += bike.hourlyRate * hoursBooked;
          }
        }
      }

      const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

      // Get top rated bikes
      const topRatedBikes = Object.entries(bikeRatings)
        .map(([bikeId, data]: [string, any]) => ({
          bikeId,
          averageRating: data.count > 0 ? data.total / data.count : 0,
          type: bikes.find((b) => b.bikeId === bikeId)?.type || "Unknown",
        }))
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      // Get recent bookings
      const recentBookings =
        bookingsData.bookings
          ?.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5) || [];

      setAnalyticsData({
        totalRevenue,
        averageRating,
        totalBookings,
        totalReviews,
        recentBookings,
        topRatedBikes,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setAnalyticsError(
        error instanceof Error
          ? error.message
          : "Failed to fetch analytics data"
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, [bikes]);

  const createTicket = useCallback(
    async (ticketData: any) => {
      setCreateTicketLoading(true);
      setCreateTicketError("");
      setCreateTicketSuccess("");
      try {
        // Get the id token from localStorage
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
        setCreateTicketSuccess("Ticket created successfully!");

        // Close modal after a short delay
        setTimeout(() => {
          setShowCreateTicketModal(false);
          setCreateTicketSuccess("");
          setTicketForm({
            subject: "",
            description: "",
            priority: "medium",
            category: "technical",
            bikeId: "",
          });
        }, 2000);

        // Refresh tickets list
        fetchAllTickets();
      } catch (err: any) {
        console.error("Failed to create ticket:", err.message);
        setCreateTicketError(err.message || "Failed to create ticket");
      } finally {
        setCreateTicketLoading(false);
      }
    },
    [fetchAllTickets]
  );

  const getTicketById = useCallback(async (ticketId: string) => {
    try {
      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.TICKETS.GET_BY_ID(ticketId)}`,
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
      console.log("Ticket details:", data);
      setSelectedTicket(data.ticket || data);
      setShowTicketDetailModal(true);
    } catch (err: any) {
      console.error("Failed to fetch ticket details:", err.message);
      alert(err.message || "Failed to fetch ticket details");
    }
  }, []);

  // Fetch tickets when tickets tab is active
  useEffect(() => {
    if (activeTab === "tickets" && isAdmin) {
      fetchAllTickets();
    }
  }, [activeTab, isAdmin, fetchAllTickets]);

  useEffect(() => {
    if (activeTab === "analytics" && isAdmin) {
      fetchAnalyticsData();
    }
  }, [activeTab, isAdmin, fetchAnalyticsData]);

  const handleOpenCreateTicketModal = () => {
    setShowCreateTicketModal(true);
    setTicketForm({
      subject: "",
      description: "",
      priority: "medium",
      category: "technical",
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

  const handleCloseTicketDetailModal = () => {
    setShowTicketDetailModal(false);
    setSelectedTicket(null);
    setResolutionForm({ message: "" });
    setResolveTicketError("");
  };

  // Resolve ticket function
  const handleResolveTicket = useCallback(
    async (ticketId: string) => {
      setResolveTicketLoading(true);
      setResolveTicketError("");
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
          `${API_CONFIG.BASE_URL}${API_CONFIG.TICKETS.GET_BY_ID(ticketId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: idToken,
            },
            body: JSON.stringify({
              status: "resolved",
              message: resolutionForm.message,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Ticket resolved:", data);

        // Show success toast notification
        toast.success("Ticket resolved successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Close modal and refresh tickets
        setShowTicketDetailModal(false);
        setSelectedTicket(null);
        setResolutionForm({ message: "" });
        fetchAllTickets();
      } catch (err: any) {
        console.error("Failed to resolve ticket:", err.message);
        setResolveTicketError(err.message || "Failed to resolve ticket");
      } finally {
        setResolveTicketLoading(false);
      }
    },
    [resolutionForm.message, fetchAllTickets]
  );

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
        return "bg-green-500 text-white";
      case "in_progress":
        return "bg-yellow-500 text-white";
      case "resolved":
        return "bg-blue-500 text-white";
      case "closed":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (isAdmin === null) return null; // loading, render nothing
  if (!isAdmin)
    return (
      <div className="p-8 text-yellow-400">
        <b>DEBUG: Admin userData Check</b>
        <div>
          <b>userDataKey:</b> {String(debugUserData.userDataKey)}
        </div>
        <div>
          <b>userDataStr:</b>{" "}
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {debugUserData.userDataStr}
          </pre>
        </div>
        <div>
          <b>parsed:</b>{" "}
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(debugUserData.parsed, null, 2)}
          </pre>
        </div>
        <div>
          <b>userType:</b> {String(debugUserData.userType)}
        </div>
        <div>
          <b>name:</b> {String(debugUserData.name)}
        </div>
        {debugUserData.error && (
          <div style={{ color: "red" }}>
            <b>error:</b> {debugUserData.error}
          </div>
        )}
        <div>
          Access denied or not admin. (This debug info will be removed after
          troubleshooting.)
        </div>
      </div>
    );

  const handleLogout = () => {
    localStorage.removeItem("idToken");
    // Remove all Cognito tokens
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("CognitoIdentityServiceProvider")) {
        localStorage.removeItem(key);
      }
    });
    setIsAdmin(false);
    setUserName(null);
    navigate("/login");
  };

  const handleAddBike = async () => {
    setAddBikeLoading(true);
    setAddBikeError("");
    setAddBikeSuccess("");
    try {
      // Prepare imageBase64 (strip data URL prefix)
      let imageBase64 = newBike.imageBase64;
      if (imageBase64.startsWith("data:")) {
        imageBase64 = imageBase64.substring(imageBase64.indexOf(",") + 1);
      }
      const payload = {
        bikeId: newBike.bikeId,
        type: newBike.type,
        features: {
          batteryLife: newBike.features.batteryLife,
          heightAdjustable: String(newBike.features.heightAdjustable),
        },
        hourlyRate: newBike.hourlyRate,
        discountCode: newBike.discountCode,
        imageBase64,
      };
      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.CREATE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setAddBikeSuccess(data.message || "Bike created successfully.");

      // Show success toast notification
      toast.success("Bike added successfully!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reset form and close modal
      setNewBike({
        bikeId: "",
        type: "gyroscooter",
        features: {
          batteryLife: "",
          heightAdjustable: false,
        },
        hourlyRate: 0,
        discountCode: "",
        imageBase64: "",
      });
      setShowAddBikeModal(false);
      // Refresh the bikes list
      fetchBikes();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add bike.";
      setAddBikeError(errorMessage);

      // Show error toast notification
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setAddBikeLoading(false);
    }
  };

  const resetForm = () => {
    setNewBike({
      bikeId: "",
      type: "gyroscooter",
      features: {
        batteryLife: "",
        heightAdjustable: false,
      },
      hourlyRate: 0,
      discountCode: "",
      imageBase64: "",
    });
    setShowAddBikeModal(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setNewBike((prev) => ({
          ...prev,
          imageBase64: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewBike((prev) => ({
      ...prev,
      imageBase64: "",
    }));
    setImageInputKey((prev) => prev + 1); // Reset the file input
  };

  const handleBikeClick = (bike: any) => {
    setSelectedBike(bike);
    setShowBikeDetailModal(true);
  };

  const handleEditBike = (bikeId: string) => {
    fetchBikeById(bikeId);
  };

  const handleCloseEditModal = () => {
    setShowEditBikeModal(false);
    setEditingBike(null);
    setEditBikeError("");
  };

  const handleCloseBikeDetailModal = () => {
    setShowBikeDetailModal(false);
    setSelectedBike(null);
  };

  const handleDeleteBike = (bikeId: string) => {
    setBikeToDelete(bikeId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteBike = async () => {
    if (!bikeToDelete) return;

    // Close modal immediately
    setShowDeleteConfirmModal(false);
    setBikeToDelete(null);
    handleCloseBikeDetailModal();
    handleCloseEditModal();

    try {
      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.DELETE(bikeToDelete)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Refresh bikes list
      fetchBikes();

      // Show success toast notification
      toast.success(`Bike ${bikeToDelete} deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (err: any) {
      const errorMessage = `Failed to delete bike: ${err.message}`;

      // Show error toast notification
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const cancelDeleteBike = () => {
    setShowDeleteConfirmModal(false);
    setBikeToDelete(null);
  };

  const handleEditBikeImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditingBike((prev: any) => ({
          ...prev,
          imageBase64: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditBikeImage = () => {
    setEditingBike((prev: any) => ({
      ...prev,
      imageBase64: "",
    }));
    setEditBikeImageKey((prev) => prev + 1);
  };

  const handleUpdateBike = async () => {
    setEditBikeLoading(true);
    setEditBikeError("");
    try {
      // Prepare imageBase64 (strip data URL prefix)
      let imageBase64 = editingBike.imageBase64;
      if (imageBase64 && imageBase64.startsWith("data:")) {
        imageBase64 = imageBase64.substring(imageBase64.indexOf(",") + 1);
      }

      const payload: any = {
        features: {
          batteryLife: editingBike.features.batteryLife,
          heightAdjustable: String(editingBike.features.heightAdjustable),
        },
        hourlyRate: Number(editingBike.hourlyRate),
        discountCode: editingBike.discountCode,
      };

      // Include image if a new one was uploaded
      if (imageBase64) {
        payload.imageBase64 = imageBase64;
      }

      // Get the id token from localStorage
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
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.UPDATE(editingBike.bikeId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Close modal immediately and refresh bikes list
      handleCloseEditModal();
      fetchBikes();

      // Show success notification
      alert("Bike updated successfully!");
    } catch (err: any) {
      setEditBikeError(err.message || "Failed to update bike.");
    } finally {
      setEditBikeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar */}
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
                  {ADMIN_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                        activeTab === tab.key
                          ? "text-green-400 border-b-2 border-green-400"
                          : "text-gray-300 hover:text-green-400"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {userName && (
                <>
                  <span className="ml-4 font-semibold text-green-400">
                    Welcome, {userName}!
                  </span>
                  <button
                    onClick={handleLogout}
                    className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200 transform hover:scale-105"
                  >
                    Log Out
                  </button>
                  <span className="ml-2 text-sm font-medium text-green-400">
                    Admin
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto pt-24 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-400">
            Franchise Admin Dashboard
          </h1>
        </div>

        {/* Add Bike Button - positioned above tabs */}
        <div className="flex justify-end mb-0.5">
          <button
            onClick={() => setShowAddBikeModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Add Bike</span>
          </button>
        </div>

        {/* Add Bike Modal */}
        {showAddBikeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-400">
                  Add New Bike
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Bike ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bike ID *
                  </label>
                  <input
                    type="text"
                    value={newBike.bikeId}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        bikeId: e.target.value,
                      }))
                    }
                    placeholder="e.g., GYRO-1001"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Bike Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bike Type *
                  </label>
                  <select
                    value={newBike.type}
                    onChange={(e) =>
                      setNewBike((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                  >
                    <option value="gyroscooter">Gyro Scooter</option>
                    <option value="ebike">E-Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>

                {/* Battery Life */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Battery Life *
                  </label>
                  <input
                    type="text"
                    value={newBike.features.batteryLife}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          batteryLife: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g., 12hr, 8hr, 24hr"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Height Adjustable */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newBike.features.heightAdjustable}
                      onChange={(e) =>
                        setNewBike((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            heightAdjustable: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-green-400 bg-gray-700 border-gray-600 rounded focus:ring-green-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      Height Adjustable
                    </span>
                  </label>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hourly Rate (USD) *
                  </label>
                  <input
                    type="number"
                    value={newBike.hourlyRate}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        hourlyRate: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 10"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Discount Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discount Code
                  </label>
                  <input
                    type="text"
                    value={newBike.discountCode}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        discountCode: e.target.value,
                      }))
                    }
                    placeholder="e.g., WINTER25, SUMMER10"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bike Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="bike-image-upload"
                      key={imageInputKey}
                    />
                    <label
                      htmlFor="bike-image-upload"
                      className="cursor-pointer"
                    >
                      {newBike.imageBase64 ? (
                        <div className="space-y-2 relative">
                          <div className="relative inline-block">
                            <img
                              src={newBike.imageBase64}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveImage();
                              }}
                              className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-sm text-green-400">
                            Image uploaded successfully!
                          </p>
                          <p className="text-xs text-gray-400">
                            Click to change image
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg
                            className="w-12 h-12 text-gray-400 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-sm text-gray-300">
                            Click to upload bike image
                          </p>
                          <p className="text-xs text-gray-400">
                            Supports: JPG, PNG, GIF (Max 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                {addBikeError && (
                  <div className="text-red-400 text-center mb-2">
                    {addBikeError}
                  </div>
                )}
                {addBikeSuccess && (
                  <div className="text-green-400 text-center mb-2">
                    {addBikeSuccess}
                  </div>
                )}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={handleAddBike}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                    disabled={addBikeLoading}
                  >
                    {addBikeLoading ? "Adding..." : "Add Bike"}
                  </button>
                  <button
                    onClick={() => setShowAddBikeModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bike Modal */}
        {showEditBikeModal && editingBike && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-400">
                  Edit Bike: {editingBike.bikeId}
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {editBikeLoading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <svg
                      className="animate-spin h-8 w-8 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div className="text-green-400 font-medium">
                      Loading bike details...
                    </div>
                  </div>
                </div>
              ) : editBikeError ? (
                <div className="text-center py-8">
                  <div className="text-red-400">Error: {editBikeError}</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bike ID (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike ID
                    </label>
                    <input
                      type="text"
                      value={editingBike.bikeId}
                      disabled
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  {/* Bike Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike Type *
                    </label>
                    <select
                      value={editingBike.type}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="gyroscooter">Gyro Scooter</option>
                      <option value="ebike">E-Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="bicycle">Bicycle</option>
                    </select>
                  </div>

                  {/* Battery Life */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Battery Life *
                    </label>
                    <input
                      type="text"
                      value={editingBike.features.batteryLife}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            batteryLife: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g., 12hr, 8hr, 24hr"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Height Adjustable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Height Adjustable
                    </label>
                    <select
                      value={editingBike.features.heightAdjustable}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            heightAdjustable: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hourly Rate (USD) *
                    </label>
                    <input
                      type="text"
                      value={editingBike.hourlyRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only numbers and decimal point
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setEditingBike((prev: any) => ({
                            ...prev,
                            hourlyRate: value,
                          }));
                        }
                      }}
                      placeholder="e.g., 10"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Discount Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Code
                    </label>
                    <input
                      type="text"
                      value={editingBike.discountCode || ""}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          discountCode: e.target.value,
                        }))
                      }
                      placeholder="e.g., WINTER25, SUMMER10"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike Image
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditBikeImageUpload}
                        className="hidden"
                        id="edit-bike-image-upload"
                        key={editBikeImageKey}
                      />
                      <label
                        htmlFor="edit-bike-image-upload"
                        className="cursor-pointer"
                      >
                        {editingBike.imageBase64 ? (
                          <div className="space-y-2 relative">
                            <div className="relative inline-block">
                              <img
                                src={editingBike.imageBase64}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded-lg mx-auto"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveEditBikeImage();
                                }}
                                className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-sm text-green-400">
                              New image uploaded!
                            </p>
                            <p className="text-xs text-gray-400">
                              Click to change image
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <img
                              src={editingBike.imageUrl}
                              alt="Current"
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                            <p className="text-sm text-gray-300">
                              Click to upload new image
                            </p>
                            <p className="text-xs text-gray-400">
                              Supports: JPG, PNG, GIF (Max 5MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Error Message */}
                  {editBikeError && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
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
                          Error: {editBikeError}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleUpdateBike}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50 flex items-center justify-center space-x-2"
                      disabled={editBikeLoading}
                    >
                      {editBikeLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Updating Bike...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          <span>Update Bike</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCloseEditModal}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      disabled={editBikeLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bike Detail Modal */}
        {showBikeDetailModal && selectedBike && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-400">
                  Bike Details: {selectedBike.bikeId}
                </h2>
                <button
                  onClick={handleCloseBikeDetailModal}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bike Image */}
                <div>
                  <img
                    src={selectedBike.imageUrl}
                    alt={selectedBike.type}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>

                {/* Bike Information */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Bike ID:</span>
                    <span className="text-white font-medium">
                      {selectedBike.bikeId}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Bike Type:</span>
                    <span className="text-white font-medium">
                      {selectedBike.type}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Battery Life:</span>
                    <span className="text-white font-medium">
                      {selectedBike.features.batteryLife}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Height Adjustable:</span>
                    <span className="text-white font-medium">
                      {selectedBike.features.heightAdjustable === "true"
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Hourly Rate:</span>
                    <span className="text-green-400 font-semibold">
                      ${selectedBike.hourlyRate}/hour
                    </span>
                  </div>

                  {selectedBike.discountCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Discount Code:</span>
                      <span className="text-red-400 font-semibold">
                        {selectedBike.discountCode}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Status:</span>
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-700">
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleCloseBikeDetailModal();
                      handleEditBike(selectedBike.bikeId);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Bike</span>
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        handleCloseBikeDetailModal();
                        handleOpenFeedbackModal(selectedBike);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>View Reviews</span>
                    </button>
                    <button
                      onClick={() => {
                        handleCloseBikeDetailModal();
                        handleCheckAvailability(selectedBike);
                      }}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Check Availability</span>
                    </button>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        handleCloseBikeDetailModal();
                        handleOpenUpdateAvailabilityModal(selectedBike);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Clock className="h-4 w-4" />
                      <span>Update Time Slots</span>
                    </button>
                    <button
                      onClick={() => {
                        handleCloseBikeDetailModal();
                        handleDeleteBike(selectedBike.bikeId);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Bike</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && bikeToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-red-400">Delete Bike</h2>
                <button
                  onClick={cancelDeleteBike}
                  className="text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-lg font-semibold text-white">
                    Warning
                  </span>
                </div>
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete bike{" "}
                  <span className="font-semibold text-white">
                    {bikeToDelete}
                  </span>
                  ?
                </p>
                <p className="text-red-400 text-sm">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={confirmDeleteBike}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Delete Bike
                </button>
                <button
                  onClick={cancelDeleteBike}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4 border-b border-gray-700 mb-8">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-semibold transition-all duration-200 transform hover:scale-105 rounded-t ${
                activeTab === tab.key
                  ? "bg-green-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-green-700 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-6 min-h-[400px]">
          {activeTab === "home" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  Franchise Admin Dashboard
                </h2>

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
                          setCurrentPage(1); // Reset to first page when searching
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {bikesLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <svg
                        className="animate-spin h-8 w-8 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <div className="text-green-400 font-medium">
                        Loading bikes...
                      </div>
                    </div>
                  </div>
                ) : bikesError ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-red-400">Error: {bikesError}</div>
                  </div>
                ) : bikes.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-400">No bikes found</div>
                  </div>
                ) : (
                  currentBikes.map((bike: any) => (
                    <div
                      key={bike.bikeId}
                      className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      onClick={() => handleBikeClick(bike)}
                    >
                      <img
                        src={bike.imageUrl}
                        alt={bike.bikeId}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold">
                            {bike.bikeId}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-500 text-white">
                            Active
                          </span>
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
                              {bike.features.heightAdjustable}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-gray-300">
                              Type: {bike.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-400 mb-2">
                          Hourly Rate:{" "}
                          <span className="text-green-400 font-bold">
                            ${bike.hourlyRate}/hour
                          </span>
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center space-x-2 mb-4">
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

                        <div className="flex justify-start mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBikeManagementModal(bike);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination Controls */}
                {bikes.length > 0 && totalPages > 1 && (
                  <div className="col-span-full flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === pageNumber
                                ? "bg-green-500 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-white"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "bikes" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Bike List</h2>

                {/* Search Bar for Bikes Tab */}
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
                          setCurrentPage(1); // Reset to first page when searching
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2">
                {bikesLoading ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <svg
                        className="animate-spin h-8 w-8 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <div className="text-green-400 font-medium">
                        Loading bikes...
                      </div>
                    </div>
                  </div>
                ) : bikesError ? (
                  <div className="text-center py-8">
                    <div className="text-red-400">Error: {bikesError}</div>
                  </div>
                ) : bikes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">No bikes found</div>
                  </div>
                ) : (
                  currentBikes.map((bike: any) => (
                    <div
                      key={bike.bikeId}
                      className="flex bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      onClick={() => handleBikeClick(bike)}
                    >
                      <img
                        src={bike.imageUrl}
                        alt={bike.bikeId}
                        className="w-32 h-32 object-cover flex-shrink-0"
                      />
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold">
                              {bike.bikeId}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-500 text-white">
                              Active
                            </span>
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
                                {bike.features.heightAdjustable}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-gray-300">
                                Type: {bike.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-gray-400 mb-2">
                            Hourly Rate:{" "}
                            <span className="text-green-400 font-bold">
                              ${bike.hourlyRate}/hour
                            </span>
                          </div>

                          {/* Star Rating */}
                          <div className="flex items-center space-x-2 mb-4">
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
                        <div className="flex justify-start mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBikeManagementModal(bike);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                          >
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Pagination Controls for Bikes Tab */}
                {bikes.length > 0 && totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === pageNumber
                                ? "bg-green-500 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-white"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "approve-bookings" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Approve Bookings</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchPendingBookings}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-400">
                  Review and approve/reject pending booking requests.
                </p>
              </div>

              {pendingBookingsLoading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <svg
                      className="animate-spin h-8 w-8 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div className="text-green-400 font-medium">
                      Loading pending bookings...
                    </div>
                  </div>
                </div>
              ) : pendingBookingsError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-4">
                    {pendingBookingsError}
                  </div>
                  <button
                    onClick={fetchPendingBookings}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : pendingBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No pending bookings
                  </h3>
                  <p className="text-gray-400 mb-6">
                    All booking requests have been processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">
                        {pendingBookings.length}
                      </div>
                      <div className="text-sm text-gray-300">
                        Pending Approval
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingBookings.map((booking) => (
                      <div
                        key={booking.bookingId}
                        className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-xl font-semibold text-white">
                              {booking.bikeId}
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white">
                              Pending Approval
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">
                              {formatDate(booking.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              Date: {booking.bookingDate}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              Time: {booking.slotTime}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">
                              Reference: {booking.referenceCode}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">
                              Email: {booking.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                          <button
                            onClick={() =>
                              handleApproveBooking(
                                booking.referenceCode,
                                "APPROVED"
                              )
                            }
                            disabled={
                              approveBookingLoading === booking.referenceCode
                            }
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-2"
                          >
                            {approveBookingLoading === booking.referenceCode ? (
                              <>
                                <svg
                                  className="animate-spin h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span>Approving...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleApproveBooking(
                                booking.referenceCode,
                                "REJECTED"
                              )
                            }
                            disabled={
                              approveBookingLoading === booking.referenceCode
                            }
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-2"
                          >
                            {approveBookingLoading === booking.referenceCode ? (
                              <>
                                <svg
                                  className="animate-spin h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span>Rejecting...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                <span>Reject</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "bookings" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">All Bookings</h2>
                <div className="flex items-center space-x-4">
                  {/* Search Bar */}
                  {allBookings.length > 0 && (
                    <div className="w-80">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search bookings..."
                          value={bookingSearchTerm}
                          onChange={(e) => setBookingSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={fetchAllBookings}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-400">
                  View and manage all bookings across all bikes.
                </p>
              </div>

              {bookingsLoading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <svg
                      className="animate-spin h-8 w-8 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div className="text-green-400 font-medium">
                      Loading bookings...
                    </div>
                  </div>
                </div>
              ) : bookingsError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-4">{bookingsError}</div>
                  <button
                    onClick={fetchAllBookings}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : allBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No bookings found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    No bookings have been made yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-400">
                          {allBookings.length}
                        </div>
                        <div className="text-sm text-gray-300">
                          Total Bookings
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400">
                          {
                            allBookings.filter(
                              (b) =>
                                b.status === "confirmed" ||
                                b.status === "active"
                            ).length
                          }
                        </div>
                        <div className="text-sm text-gray-300">Active</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {
                            allBookings.filter((b) => b.status === "pending")
                              .length
                          }
                        </div>
                        <div className="text-sm text-gray-300">Pending</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-400">
                          {
                            allBookings.filter((b) => b.status === "cancelled")
                              .length
                          }
                        </div>
                        <div className="text-sm text-gray-300">Cancelled</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredBookings.map((booking) => (
                      <div
                        key={booking.bookingId}
                        onClick={() => handleOpenBookingDetailModal(booking)}
                        className="bg-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-xl font-semibold text-white">
                              {booking.bikeId}
                            </h3>
                            <div className="flex items-center space-x-1">
                              {getBookingStatusIcon(booking.status)}
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(
                                  booking.status
                                )}`}
                              >
                                {booking.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">
                              {formatDate(booking.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-green-400" />
                            <span className="text-gray-300">
                              {formatDate(booking.bookingDate)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span className="text-gray-300">
                              {formatTime(booking.slotTime)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">
                              {(() => {
                                return (
                                  booking.displayName ||
                                  booking.mail ||
                                  booking.username ||
                                  booking.userName ||
                                  (booking.userId
                                    ? `User ${booking.userId.substring(
                                        0,
                                        8
                                      )}...`
                                    : "Unknown User")
                                );
                              })()}
                            </span>
                          </div>
                          {booking.hourlyRate && (
                            <div className="flex items-center space-x-2">
                              <span className="text-green-400 font-medium">
                                ${booking.hourlyRate}/hour
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-700">
                          <div className="space-y-2">
                            <div className="text-xs text-gray-400">
                              ID: {booking.bookingId}
                            </div>
                            {booking.accessCode && (
                              <div className="text-xs text-gray-400">
                                Access: {booking.accessCode}
                              </div>
                            )}
                            {booking.referenceCode && (
                              <div className="text-xs text-gray-400">
                                Ref: {booking.referenceCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "tickets" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">All Tickets</h2>
                <div className="flex items-center space-x-4">
                  {/* Search Bar */}
                  {allTickets.length > 0 && (
                    <div className="w-80">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search tickets..."
                          value={ticketSearchTerm}
                          onChange={(e) => setTicketSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-400">
                  View and manage all support tickets and complaints.
                </p>
              </div>

              {ticketsLoading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <svg
                      className="animate-spin h-8 w-8 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div className="text-green-400 font-medium">
                      Loading tickets...
                    </div>
                  </div>
                </div>
              ) : ticketsError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-4">{ticketsError}</div>
                  <button
                    onClick={fetchAllTickets}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : allTickets.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    No tickets found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    No support tickets have been created yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredTickets.map((ticket) => {
                    // Check if current admin can resolve this ticket
                    const userDataKey = Object.keys(localStorage).find((key) =>
                      key.endsWith(".userData")
                    );
                    let currentAdminEmail = "";
                    if (userDataKey) {
                      const userDataStr = localStorage.getItem(userDataKey);
                      if (userDataStr) {
                        try {
                          const userData = JSON.parse(userDataStr);
                          const attrs = userData.UserAttributes || [];
                          const emailAttr = attrs.find(
                            (a: any) => a.Name === "email"
                          );
                          currentAdminEmail = emailAttr ? emailAttr.Value : "";
                        } catch (e) {
                          console.error("Error parsing user data:", e);
                        }
                      }
                    }

                    const isAssignedToMe =
                      ticket.assignedToEmail === currentAdminEmail;
                    const isReadOnly =
                      ticket.status === "resolved" || !isAssignedToMe;

                    return (
                      <div
                        key={ticket.ticketId}
                        onClick={() => getTicketById(ticket.ticketId)}
                        className={`rounded-xl p-6 border transition-all duration-300 ${
                          isReadOnly
                            ? "bg-gray-800 border-gray-600 cursor-pointer opacity-75"
                            : "bg-gray-900 border-gray-700 hover:border-gray-600 hover:bg-gray-800 transform hover:scale-105 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {ticket.subject}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">
                              {formatDate(ticket.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">Category:</span>
                            <span className="text-green-400 font-medium">
                              {ticket.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">Priority:</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTicketPriorityColor(
                                ticket.priority
                              )}`}
                            >
                              {ticket.priority}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">Status:</span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTicketStatusColor(
                                ticket.status
                              )}`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          {ticket.bikeId && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-300">Bike:</span>
                              <span className="text-blue-400 font-medium">
                                {ticket.bikeId}
                              </span>
                            </div>
                          )}
                          {ticket.assignedToEmail && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-300">
                                Assigned To:
                              </span>
                              <span className="text-purple-400 font-medium">
                                {ticket.assignedToEmail}
                              </span>
                            </div>
                          )}
                          <div className="text-gray-300">
                            {ticket.description?.substring(0, 80)}...
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-700">
                          <div className="text-xs text-gray-400">
                            ID: {ticket.ticketId}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === "messages" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Messages</h2>
              <p className="text-gray-400">
                Chat-style threaded messages with customers.
              </p>
            </div>
          )}
          {activeTab === "analytics" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Analytics Summary</h2>
                <button
                  onClick={() => {
                    fetchAnalyticsData();
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Refresh Analytics
                </button>
              </div>

              {analyticsLoading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <svg
                      className="animate-spin h-8 w-8 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div className="text-green-400 font-medium">
                      Loading analytics...
                    </div>
                  </div>
                </div>
              ) : analyticsError ? (
                <div className="text-center py-8">
                  <div className="text-red-400 mb-4">{analyticsError}</div>
                  <button
                    onClick={fetchAnalyticsData}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">
                            Total Revenue
                          </p>
                          <p className="text-2xl font-bold text-green-400">
                            ${analyticsData.totalRevenue?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                        <div className="bg-green-500 bg-opacity-20 p-3 rounded-full">
                          <svg
                            className="h-6 w-6 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">
                            Average Rating
                          </p>
                          <p className="text-2xl font-bold text-yellow-400">
                            {analyticsData.averageRating?.toFixed(1) || "0.0"}
                          </p>
                        </div>
                        <div className="bg-yellow-500 bg-opacity-20 p-3 rounded-full">
                          <svg
                            className="h-6 w-6 text-yellow-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">
                            Total Bookings
                          </p>
                          <p className="text-2xl font-bold text-blue-400">
                            {analyticsData.totalBookings || 0}
                          </p>
                        </div>
                        <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full">
                          <svg
                            className="h-6 w-6 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm font-medium">
                            Total Reviews
                          </p>
                          <p className="text-2xl font-bold text-purple-400">
                            {analyticsData.totalReviews || 0}
                          </p>
                        </div>
                        <div className="bg-purple-500 bg-opacity-20 p-3 rounded-full">
                          <svg
                            className="h-6 w-6 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Analytics */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Bookings */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">
                        Recent Bookings
                      </h3>
                      <div className="space-y-3">
                        {analyticsData.recentBookings
                          ?.slice(0, 5)
                          .map((booking: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                            >
                              <div>
                                <p className="text-white font-medium">
                                  {booking.bikeId}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {formatDate(booking.bookingDate)}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(
                                  booking.status
                                )}`}
                              >
                                {booking.status}
                              </span>
                            </div>
                          ))}
                        {(!analyticsData.recentBookings ||
                          analyticsData.recentBookings.length === 0) && (
                          <p className="text-gray-400 text-center py-4">
                            No recent bookings
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Top Rated Bikes */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                      <h3 className="text-lg font-semibold mb-4">
                        Top Rated Bikes
                      </h3>
                      <div className="space-y-3">
                        {analyticsData.topRatedBikes
                          ?.slice(0, 5)
                          .map((bike: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                            >
                              <div>
                                <p className="text-white font-medium">
                                  {bike.bikeId}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {bike.type}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-yellow-400">★</span>
                                <span className="text-white font-medium">
                                  {bike.averageRating?.toFixed(1) || "0.0"}
                                </span>
                              </div>
                            </div>
                          ))}
                        {(!analyticsData.topRatedBikes ||
                          analyticsData.topRatedBikes.length === 0) && (
                          <p className="text-gray-400 text-center py-4">
                            No rated bikes
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 py-12 px-4 sm:px-6 lg:px-8 mt-16">
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
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 008.48 19h7.04a2 2 0 001.83-1.3L17 13M7 13l1.5-6h7l1.5 6"
                    />
                  </svg>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 12a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V8a4 4 0 00-8 0v4m8 0v4a4 4 0 01-8 0v-4"
                    />
                  </svg>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
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

      {/* Availability Modal */}
      {showAvailabilityModal && selectedBikeForAvailability && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Availability for {selectedBikeForAvailability.bikeId}
              </h2>
              <button
                onClick={handleCloseAvailabilityModal}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <Clock className="h-5 w-5 text-green-400" />
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-semibold text-white">
                    Daily Availability
                  </span>
                </div>
              </div>

              <img
                src={
                  selectedBikeForAvailability.imageUrl ||
                  "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400"
                }
                alt={selectedBikeForAvailability.bikeId}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            </div>

            {availabilityLoading[selectedBikeForAvailability.bikeId] ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading availability...</p>
              </div>
            ) : (
              <div>
                {availabilityData[selectedBikeForAvailability.bikeId] ? (
                  <div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {
                            availabilityData[selectedBikeForAvailability.bikeId]
                              .availableCount
                          }
                        </div>
                        <div className="text-sm text-gray-300">Available</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {
                            availabilityData[selectedBikeForAvailability.bikeId]
                              .reservedCount
                          }
                        </div>
                        <div className="text-sm text-gray-300">Reserved</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {
                            availabilityData[selectedBikeForAvailability.bikeId]
                              .totalSlots
                          }
                        </div>
                        <div className="text-sm text-gray-300">Total</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Time Slots</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(
                          availabilityData[selectedBikeForAvailability.bikeId]
                            .slotStatuses
                        ).map(([time, status]) => (
                          <div
                            key={time}
                            className={`p-3 rounded-lg text-center text-sm font-medium ${
                              status === "available"
                                ? "bg-green-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {formatTime(time)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleCloseAvailabilityModal}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-300">No availability data found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {selectedBikeForFeedback && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={handleCloseFeedbackModal}
          bike={selectedBikeForFeedback}
          userType="admin"
        />
      )}

      {/* Update Availability Modal */}
      {showUpdateAvailabilityModal && selectedBikeForUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Update Availability for {selectedBikeForUpdate.bikeId}
              </h2>
              <button
                onClick={handleCloseUpdateAvailabilityModal}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Availability Status */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={availabilityForm.isAvailable}
                    onChange={(e) =>
                      setAvailabilityForm((prev) => ({
                        ...prev,
                        isAvailable: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-green-400 bg-gray-700 border-gray-600 rounded focus:ring-green-400"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Bike is Available
                  </span>
                </label>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time Slots
                </label>
                <div className="space-y-2">
                  {availabilityForm.timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={slot}
                        onChange={(e) =>
                          handleTimeSlotChange(index, e.target.value)
                        }
                        placeholder="09:00-11:00"
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                      />
                      <button
                        onClick={() => handleRemoveTimeSlot(index)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddTimeSlot}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                  >
                    Add Time Slot
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={availabilityForm.notes}
                  onChange={(e) =>
                    setAvailabilityForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Optional notes about availability..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                />
              </div>

              {/* Error/Success Messages */}
              {updateAvailabilityError && (
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
                      Error: {updateAvailabilityError}
                    </span>
                  </div>
                </div>
              )}

              {updateAvailabilitySuccess && (
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
                      {updateAvailabilitySuccess}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleUpdateAvailability}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                  disabled={updateAvailabilityLoading}
                >
                  {updateAvailabilityLoading
                    ? "Updating..."
                    : "Update Availability"}
                </button>
                <button
                  onClick={handleCloseUpdateAvailabilityModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Create New Ticket
              </h2>
              <button
                onClick={handleCloseCreateTicketModal}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) =>
                    handleTicketFormChange("subject", e.target.value)
                  }
                  placeholder="Brief description of the issue"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) =>
                    handleTicketFormChange("description", e.target.value)
                  }
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) =>
                    handleTicketFormChange("priority", e.target.value)
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={ticketForm.category}
                  onChange={(e) =>
                    handleTicketFormChange("category", e.target.value)
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                >
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="booking">Booking</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Bike ID (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bike ID (Optional)
                </label>
                <input
                  type="text"
                  value={ticketForm.bikeId}
                  onChange={(e) =>
                    handleTicketFormChange("bikeId", e.target.value)
                  }
                  placeholder="e.g., GYRO-1006"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                />
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
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                  disabled={createTicketLoading}
                >
                  {createTicketLoading ? "Creating..." : "Create Ticket"}
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

      {/* Ticket Detail Modal */}
      {showTicketDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Ticket Details
              </h2>
              <button
                onClick={handleCloseTicketDetailModal}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Ticket Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {selectedTicket.subject}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getTicketPriorityColor(
                        selectedTicket.priority
                      )}`}
                    >
                      {selectedTicket.priority}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getTicketStatusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ID: {selectedTicket.ticketId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-300 mb-3">
                    Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Category:</span>
                      <span className="text-white ml-2">
                        {selectedTicket.category}
                      </span>
                    </div>
                    {selectedTicket.bikeId && (
                      <div>
                        <span className="text-gray-400">Bike ID:</span>
                        <span className="text-white ml-2">
                          {selectedTicket.bikeId}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white ml-2">
                        {formatDate(selectedTicket.createdAt)}
                      </span>
                    </div>
                    {selectedTicket.updatedAt && (
                      <div>
                        <span className="text-gray-400">Updated:</span>
                        <span className="text-white ml-2">
                          {formatDate(selectedTicket.updatedAt)}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">User:</span>
                      <span className="text-white ml-2">
                        {selectedTicket.username || selectedTicket.userId}
                      </span>
                    </div>
                    {selectedTicket.assignedToEmail && (
                      <div>
                        <span className="text-gray-400">Assigned To:</span>
                        <span className="text-white ml-2">
                          {selectedTicket.assignedToEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-300 mb-3">
                    Description
                  </h4>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-white whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resolution Form - Only show if ticket is not resolved and admin is assigned */}
              {selectedTicket.status !== "resolved" &&
                selectedTicket.assignedToEmail && (
                  <div className="border-t border-gray-700 pt-6">
                    <h4 className="text-lg font-semibold text-gray-300 mb-3">
                      Resolve Ticket
                    </h4>

                    {/* Check if current admin can resolve this ticket */}
                    {(() => {
                      const userDataKey = Object.keys(localStorage).find(
                        (key) => key.endsWith(".userData")
                      );
                      let currentAdminEmail = "";
                      if (userDataKey) {
                        const userDataStr = localStorage.getItem(userDataKey);
                        if (userDataStr) {
                          try {
                            const userData = JSON.parse(userDataStr);
                            const attrs = userData.UserAttributes || [];
                            const emailAttr = attrs.find(
                              (a: any) => a.Name === "email"
                            );
                            currentAdminEmail = emailAttr
                              ? emailAttr.Value
                              : "";
                          } catch (e) {
                            console.error("Error parsing user data:", e);
                          }
                        }
                      }

                      const canResolve =
                        currentAdminEmail === selectedTicket.assignedToEmail;

                      if (!canResolve) {
                        return (
                          <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <svg
                                className="w-5 h-5 text-yellow-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="text-yellow-400 font-medium">
                                Only the assigned admin (
                                {selectedTicket.assignedToEmail}) can resolve
                                this ticket.
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Resolution Message *
                            </label>
                            <textarea
                              value={resolutionForm.message}
                              onChange={(e) =>
                                setResolutionForm((prev) => ({
                                  ...prev,
                                  message: e.target.value,
                                }))
                              }
                              placeholder="Describe how the issue was resolved..."
                              rows={4}
                              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                            />
                          </div>

                          {resolveTicketError && (
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
                                  Error: {resolveTicketError}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex space-x-4">
                            <button
                              onClick={() =>
                                handleResolveTicket(selectedTicket.ticketId)
                              }
                              disabled={
                                resolveTicketLoading ||
                                !resolutionForm.message.trim()
                              }
                              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none flex items-center justify-center space-x-2"
                            >
                              {resolveTicketLoading ? (
                                <>
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  <span>Resolving...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Resolve Ticket</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  onClick={handleCloseTicketDetailModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bike Management Modal */}
      {showBikeManagementModal && selectedBikeForManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Bike Details: {selectedBikeForManagement.bikeId}
              </h2>
              <button
                onClick={handleCloseBikeManagementModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bike Image */}
              <div>
                <img
                  src={selectedBikeForManagement.imageUrl}
                  alt={selectedBikeForManagement.type}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              {/* Bike Information */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Bike ID:</span>
                  <span className="text-white font-medium">
                    {selectedBikeForManagement.bikeId}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Bike Type:</span>
                  <span className="text-white font-medium">
                    {selectedBikeForManagement.type}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Battery Life:</span>
                  <span className="text-white font-medium">
                    {selectedBikeForManagement.features.batteryLife}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Height Adjustable:</span>
                  <span className="text-white font-medium">
                    {selectedBikeForManagement.features.heightAdjustable ===
                    "true"
                      ? "Yes"
                      : "No"}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Hourly Rate:</span>
                  <span className="text-green-400 font-semibold">
                    ${selectedBikeForManagement.hourlyRate}/hour
                  </span>
                </div>

                {selectedBikeForManagement.discountCode && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Discount Code:</span>
                    <span className="text-red-400 font-semibold">
                      {selectedBikeForManagement.discountCode}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Status:</span>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-700">
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleCloseBikeManagementModal();
                    handleEditBike(selectedBikeForManagement.bikeId);
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Bike</span>
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleCloseBikeManagementModal();
                      handleOpenFeedbackModal(selectedBikeForManagement);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>View Reviews</span>
                  </button>
                  <button
                    onClick={() => {
                      handleCloseBikeManagementModal();
                      handleCheckAvailability(selectedBikeForManagement);
                    }}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Check Availability</span>
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleCloseBikeManagementModal();
                      handleOpenUpdateAvailabilityModal(
                        selectedBikeForManagement
                      );
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Update Time Slots</span>
                  </button>
                  <button
                    onClick={() => {
                      handleCloseBikeManagementModal();
                      handleDeleteBike(selectedBikeForManagement.bikeId);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Bike</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      {showBookingDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Booking Details
              </h2>
              <button
                onClick={handleCloseBookingDetailModal}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Booking Header */}
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedBooking.bikeId}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {getBookingStatusIcon(selectedBooking.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(
                        selectedBooking.status
                      )}`}
                    >
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Booking ID</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {selectedBooking.bookingId}
                  </div>
                </div>
              </div>

              {/* Booking Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Booking Date:</span>
                    <span className="text-white font-medium">
                      {formatDate(selectedBooking.bookingDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Time Slot:</span>
                    <span className="text-white font-medium">
                      {formatTime(selectedBooking.slotTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Created:</span>
                    <span className="text-white font-medium">
                      {formatDate(selectedBooking.createdAt)}
                    </span>
                  </div>
                  {selectedBooking.hourlyRate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Hourly Rate:</span>
                      <span className="text-green-400 font-medium">
                        ${selectedBooking.hourlyRate}/hour
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Status:</span>
                    <span
                      className={`px-4 py-2 rounded-full text-white font-medium ${getBookingStatusColor(
                        selectedBooking.status
                      )}`}
                    >
                      {selectedBooking.status}
                    </span>
                  </div>
                  {selectedBooking.accessCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Access Code:</span>
                      <span className="text-green-400 font-medium font-mono">
                        {selectedBooking.accessCode}
                      </span>
                    </div>
                  )}
                  {selectedBooking.referenceCode && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Reference Code:</span>
                      <span className="text-blue-400 font-medium font-mono">
                        {selectedBooking.referenceCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex space-x-3">
                  <button
                    onClick={handleCloseBookingDetailModal}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default AdminDashboard;
