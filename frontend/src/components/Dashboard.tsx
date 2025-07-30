import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Star,
  MapPin,
  CheckCircle,
  XCircle,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import FeedbackModal from "./FeedbackModal";
import API_CONFIG from "../config/apiConfig";

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [bikesLoading, setBikesLoading] = useState(false);
  const [bikesError, setBikesError] = useState("");
  const [availabilityData, setAvailabilityData] = useState<{
    [bikeId: string]: AvailabilityData;
  }>({});
  const [availabilityLoading, setAvailabilityLoading] = useState<{
    [bikeId: string]: boolean;
  }>({});
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);

  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBikeForFeedback, setSelectedBikeForFeedback] =
    useState<any>(null);

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
      console.log("Fetched bikes:", data);
      setBikes(data);
    } catch (err: any) {
      setBikesError(err.message || "Failed to fetch bikes.");
    } finally {
      setBikesLoading(false);
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

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization header if user is logged in
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

  // Load bikes on component mount
  useEffect(() => {
    console.log("Dashboard component mounted, fetching bikes...");
    fetchBikes();
  }, [fetchBikes]);

  // Fetch availability when bikes load (only for logged-in users)
  useEffect(() => {
    if (bikes.length > 0 && isUserLoggedIn()) {
      console.log("Bikes loaded, fetching availability");
      bikes.forEach((bike) => {
        fetchAvailability(bike.bikeId);
      });
    }
  }, [bikes, fetchAvailability]);

  const handleCheckAvailability = (bike: Bike) => {
    // Check if user is logged in
    const idTokenKey = Object.keys(localStorage).find(
      (key) =>
        key.includes("CognitoIdentityServiceProvider") &&
        key.includes("idToken")
    );
    const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

    if (!idToken) {
      // Guest user - redirect to login
      alert("Please log in to check bike availability.");
      navigate("/login");
      return;
    }

    setSelectedBike(bike);
    setShowAvailabilityModal(true);
    // Fetch availability for the selected bike
    fetchAvailability(bike.bikeId);
  };

  const handleCloseAvailabilityModal = () => {
    setShowAvailabilityModal(false);
    setSelectedBike(null);
  };

  const getAvailabilityStatus = (bikeId: string) => {
    const data = availabilityData[bikeId];
    if (!data)
      return { status: "unknown", text: "Loading...", color: "text-gray-400" };

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

  const isValidDate = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Helper function to check if user is logged in
  const isUserLoggedIn = () => {
    const idTokenKey = Object.keys(localStorage).find(
      (key) =>
        key.includes("CognitoIdentityServiceProvider") &&
        key.includes("idToken")
    );
    return idTokenKey ? !!localStorage.getItem(idTokenKey) : false;
  };

  const handleBookNow = (bike: Bike, slotTime: string) => {
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

    setSelectedBike(bike);
    setSelectedSlot(slotTime);
    setShowBookingModal(true);
    setBookingError("");
    setBookingSuccess("");
    setBookingDetails(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBike || !selectedSlot) {
      setBookingError("Missing booking information");
      return;
    }

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
            bikeId: selectedBike.bikeId,
            slotTime: selectedSlot,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            "This time slot is already reserved. Please choose another time."
          );
        }
        throw new Error(data.error || `Booking failed: ${response.status}`);
      }

      setBookingSuccess("Booking created successfully!");
      setBookingDetails(data.booking);

      // Refresh availability for this bike
      fetchAvailability(selectedBike.bikeId);

      // Close modal after 3 seconds
      setTimeout(() => {
        setShowBookingModal(false);
        setBookingSuccess("");
        setBookingDetails(null);
      }, 3000);
    } catch (err: any) {
      setBookingError(err.message || "Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedSlot("");
    setBookingError("");
    setBookingSuccess("");
    setBookingDetails(null);
  };

  const handleOpenFeedbackModal = (bike: any) => {
    setSelectedBikeForFeedback(bike);
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setSelectedBikeForFeedback(null);
  };

  if (bikesLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading bikes...</p>
        </div>
      </div>
    );
  }

  if (bikesError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{bikesError}</p>
          <button
            onClick={fetchBikes}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-green-400">
                  Available Bikes
                </h1>
                {!isUserLoggedIn() && (
                  <p className="text-blue-300 text-sm mt-1">
                    💡 Guest Mode: Login to check availability and book
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="text-gray-300">Daily Availability</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bikes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bikes.length === 0 && !bikesLoading ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map((bike) => {
              const availability = getAvailabilityStatus(bike.bikeId);
              const isLoading = availabilityLoading[bike.bikeId];

              return (
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
                        <span className="text-sm text-gray-300">4.8</span>
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

                    {/* Reviews and Availability Buttons */}
                    <div className="flex space-x-2 mb-4">
                      <button
                        onClick={() => handleOpenFeedbackModal(bike)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Reviews</span>
                      </button>
                      {isUserLoggedIn() ? (
                        <button
                          onClick={() => handleCheckAvailability(bike)}
                          disabled={isLoading}
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Availability</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate("/login")}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Login</span>
                        </button>
                      )}
                    </div>

                    {/* Availability Status */}
                    <div className="mb-4">
                      {!isUserLoggedIn() ? (
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Clock className="h-5 w-5" />
                          <span className="text-sm">
                            Login to check availability
                          </span>
                        </div>
                      ) : isLoading ? (
                        <div className="flex items-center space-x-2 text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                          <span className="text-sm">
                            Checking availability...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {availability.status === "available" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className={`text-sm ${availability.color}`}>
                            {availability.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && selectedBike && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Availability for {selectedBike.type}
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
                <span className="text-lg font-semibold text-white">
                  Daily Availability
                </span>
              </div>

              <img
                src={
                  selectedBike.imageUrl ||
                  "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400"
                }
                alt={selectedBike.type}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            </div>

            {availabilityLoading[selectedBike.bikeId] ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading availability...</p>
              </div>
            ) : (
              <div>
                {availabilityData[selectedBike.bikeId] ? (
                  <div>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {availabilityData[selectedBike.bikeId].availableCount}
                        </div>
                        <div className="text-sm text-gray-300">Available</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {availabilityData[selectedBike.bikeId].reservedCount}
                        </div>
                        <div className="text-sm text-gray-300">Reserved</div>
                      </div>
                      <div className="text-center p-4 bg-gray-700 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {availabilityData[selectedBike.bikeId].totalSlots}
                        </div>
                        <div className="text-sm text-gray-300">Total</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Time Slots</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(
                          availabilityData[selectedBike.bikeId].slotStatuses
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

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Available Time Slots
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {availabilityData[
                          selectedBike.bikeId
                        ].availableSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleBookNow(selectedBike, time)}
                            className="p-3 rounded-lg text-center text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                          >
                            {formatTime(time)}
                          </button>
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

      {/* Booking Confirmation Modal */}
      {showBookingModal && selectedBike && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400">
                Confirm Booking
              </h2>
              <button
                onClick={handleCloseBookingModal}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center">
                <div className="mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-400 mb-2">
                    Booking Successful!
                  </h3>
                  <p className="text-gray-300 mb-4">{bookingSuccess}</p>
                </div>

                {bookingDetails && (
                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-white mb-2">
                      Booking Details:
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Reference Code:</span>
                        <span className="text-green-400 font-mono">
                          {bookingDetails.referenceCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Access Code:</span>
                        <span className="text-green-400 font-mono">
                          {bookingDetails.accessCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Bike ID:</span>
                        <span className="text-white">
                          {bookingDetails.bikeId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Date:</span>
                        <span className="text-white">
                          {bookingDetails.bookingDate}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Time:</span>
                        <span className="text-white">
                          {bookingDetails.slotTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Status:</span>
                        <span className="text-yellow-400 capitalize">
                          {bookingDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-4">
                  Please save your reference code and access code for your
                  booking.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={
                        selectedBike.imageUrl ||
                        "https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400"
                      }
                      alt={selectedBike.type}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">
                        {selectedBike.type}
                      </h3>
                      <p className="text-gray-300">
                        ${selectedBike.hourlyRate}/hour
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Booking Type:</span>
                        <span className="text-white">Daily Booking</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Time:</span>
                        <span className="text-white">{selectedSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Bike ID:</span>
                        <span className="text-white">
                          {selectedBike.bikeId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-400 text-center">
                    {bookingError}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={handleCloseBookingModal}
                    disabled={bookingLoading}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingLoading}
                    className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    {bookingLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                </div>
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
          userType={isUserLoggedIn() ? "customer" : null}
        />
      )}
    </div>
  );
};

export default Dashboard;
