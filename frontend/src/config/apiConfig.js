// API Configuration
const API_CONFIG = {
  // Base URL for the API
  BASE_URL: "https://j5xf95pezl.execute-api.ca-central-1.amazonaws.com/dev",

  // Bike endpoints
  BIKES: {
    CREATE: "/bikes",
    GET_ALL: "/bikes",
    GET_BY_ID: (bikeId) => `/bikes/${bikeId}`,
    UPDATE: (bikeId) => `/bikes/${bikeId}`,
    DELETE: (bikeId) => `/bikes/${bikeId}`,
  },

  // Booking endpoints (for future use)
  BOOKINGS: {
    GET_ALL: "/bookings",
    GET_BY_ID: (bookingId) => `/bookings/${bookingId}`,
    CREATE: "/bookings",
    UPDATE: (bookingId) => `/bookings/${bookingId}`,
    DELETE: (bookingId) => `/bookings/${bookingId}`,
  },

  // User endpoints (for future use)
  USERS: {
    GET_ALL: "/users",
    GET_BY_ID: (userId) => `/users/${userId}`,
    UPDATE: (userId) => `/users/${userId}`,
  },
};

export default API_CONFIG;
