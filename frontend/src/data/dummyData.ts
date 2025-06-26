import { User, Scooter, Booking, Feedback, Message } from "../types";

// Dummy users (mimicking DynamoDB)
export const dummyUsers: User[] = [
  {
    id: "1",
    username: "guest1",
    userType: "guest",
    email: "guest@example.com",
    securityQuestion: "What is your favorite color?",
    securityAnswer: "blue",
  },
  {
    id: "2",
    username: "cust1",
    userType: "customer",
    email: "customer@example.com",
    securityQuestion: "What is your pet's name?",
    securityAnswer: "buddy",
  },
  {
    id: "3",
    username: "admin1",
    userType: "admin",
    email: "admin@example.com",
    securityQuestion: "What city were you born in?",
    securityAnswer: "toronto",
  },
];

// Dummy scooters
export const dummyScooters: Scooter[] = [
  {
    id: "1",
    name: "Gyro-X Pro",
    type: "Gyroscooter",
    price: 25,
    features: [
      "Self-balancing",
      "LED lights",
      "Bluetooth speaker",
      "15km range",
    ],
    image: "/scooter-images/gyro1.jpg",
    available: true,
  },
  {
    id: "2",
    name: "E-Bike Deluxe",
    type: "eBike",
    price: 35,
    features: ["Electric assist", "Comfortable seat", "Basket", "30km range"],
    image: "/scooter-images/ebike1.jpg",
    available: true,
  },
  {
    id: "3",
    name: "Segway Ninebot",
    type: "Segway",
    price: 40,
    features: [
      "Two-wheel balance",
      "Smart connectivity",
      "App control",
      "25km range",
    ],
    image: "/scooter-images/segway1.jpg",
    available: true,
  },
  {
    id: "4",
    name: "Gyro Mini",
    type: "Gyroscooter",
    price: 20,
    features: ["Compact design", "Lightweight", "Quick charge", "10km range"],
    image: "/scooter-images/gyro2.jpg",
    available: false,
  },
  {
    id: "5",
    name: "E-Bike City",
    type: "eBike",
    price: 30,
    features: ["Urban design", "Long battery", "Lightweight", "25km range"],
    image: "/scooter-images/ebike2.jpg",
    available: true,
  },
];

// Dummy bookings
export const dummyBookings: Booking[] = [
  {
    id: "1",
    scooterId: "1",
    scooterName: "Gyro-X Pro",
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    totalPrice: 75,
    bookingReference: "BK2024001",
    scooterCode: "GYRO001",
    status: "active",
  },
  {
    id: "2",
    scooterId: "2",
    scooterName: "E-Bike Deluxe",
    startDate: "2024-01-10",
    endDate: "2024-01-12",
    totalPrice: 105,
    bookingReference: "BK2024002",
    scooterCode: "EBIKE002",
    status: "completed",
  },
];

// Dummy feedback
export const dummyFeedback: Feedback[] = [
  {
    id: "1",
    rating: 5,
    comment: "Amazing experience! The Gyro-X Pro was so much fun to ride.",
    date: "2024-01-18",
    userType: "customer",
  },
  {
    id: "2",
    rating: 4,
    comment: "Great service and easy booking process.",
    date: "2024-01-16",
    userType: "customer",
  },
  {
    id: "3",
    rating: 5,
    comment: "The E-Bike was perfect for exploring the city.",
    date: "2024-01-14",
    userType: "customer",
  },
  {
    id: "4",
    rating: 3,
    comment: "Good but could use more charging stations.",
    date: "2024-01-12",
    userType: "guest",
  },
];

// Dummy messages
export const dummyMessages: Message[] = [
  {
    id: "1",
    from: "cust1",
    to: "admin",
    subject: "Booking Issue",
    content:
      "I have a problem with my recent booking. The scooter code is not working.",
    date: "2024-01-18",
    read: false,
  },
  {
    id: "2",
    from: "cust1",
    to: "admin",
    subject: "Feature Request",
    content: "Would it be possible to add more electric bikes to the fleet?",
    date: "2024-01-15",
    read: true,
  },
];

// Login credentials (hardcoded as requested)
export const loginCredentials = {
  guest1: { password: "guestpass", userType: "guest" as const },
  cust1: { password: "custpass", userType: "customer" as const },
  admin1: { password: "adminpass", userType: "admin" as const },
};

// Security questions for step 2
export const securityQuestions = {
  guest1: "What is your favorite color?",
  cust1: "What is your pet's name?",
  admin1: "What city were you born in?",
};

// Caesar cipher puzzle for step 3
export const caesarPuzzle = {
  question: 'Decode this message: "KHOOR ZRUOG" (shift: 3)',
  answer: "hello world",
};
