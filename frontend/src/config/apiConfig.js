// API Configuration
const API_CONFIG = {
  // Base URL for the API
  BASE_URL: "https://ez4f6tok6h.execute-api.ca-central-1.amazonaws.com/dev",

  // Bike endpoints
  BIKES: {
    CREATE: "/bikes",
    GET_ALL: "/bikes",
    GET_BY_ID: (bikeId) => `/bikes/${bikeId}`,
    UPDATE: (bikeId) => `/bikes/${bikeId}`,
    DELETE: (bikeId) => `/bikes/${bikeId}`,
    GET_AVAILABILITY: (bikeId) => `/availability/${bikeId}`,
  },

  // Booking endpoints
  BOOKINGS: {
    GET_ALL: "/bookings",
    GET_BY_ID: (bookingId) => `/bookings/${bookingId}`,
    CREATE: "/booking",
    UPDATE: (bookingId) => `/bookings/${bookingId}`,
    DELETE: (bookingId) => `/bookings/${bookingId}`,
    GET_USER_BOOKINGS: "/booking/user",
    GET_ALL_BOOKINGS_ADMIN: "/booking/admin",
    APPROVE: (referenceCode) => `/booking/${referenceCode}`,
  },

  // User endpoints (for future use)
  USERS: {
    GET_ALL: "/users",
    GET_BY_ID: (userId) => `/users/${userId}`,
    UPDATE: (userId) => `/users/${userId}`,
  },

  // Feedback endpoints
  FEEDBACK: {
    POST_FEEDBACK: "/feedback",
    GET_FEEDBACK_BY_BIKE: (bikeId) => `/feedback/bike/${bikeId}`,
    GET_FRANCHISE_FEEDBACK: (franchiseId) =>
      `/feedback/franchise/${franchiseId}`,
    UPDATE_FEEDBACK: (feedbackId) => `/feedback/${feedbackId}`,
  },

  // Ticket endpoints
  TICKETS: {
    CREATE: "/tickets",
    GET_ALL_ADMIN: "/tickets/admin",
    GET_USER_TICKETS: "/tickets/user",
    GET_BY_ID: (ticketId) => `/tickets/${ticketId}`,
  },

  // Availability endpoints
  AVAILABILITY: {
    UPDATE_AVAILABILITY: (bikeId) => `/availability/${bikeId}`,
  },
};

export default API_CONFIG;
