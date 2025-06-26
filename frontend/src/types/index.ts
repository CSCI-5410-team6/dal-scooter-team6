export type UserType = "guest" | "customer" | "admin";

export interface User {
  id: string;
  username: string;
  userType: UserType;
  email?: string;
  securityQuestion?: string;
  securityAnswer?: string;
}

export interface Scooter {
  id: string;
  name: string;
  type: "Gyroscooter" | "eBike" | "Segway";
  price: number;
  features: string[];
  image: string;
  available: boolean;
}

export interface Booking {
  id: string;
  scooterId: string;
  scooterName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bookingReference: string;
  scooterCode: string;
  status: "active" | "completed" | "cancelled";
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  date: string;
  userType: UserType;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface AuthStep {
  step: 1 | 2 | 3;
  completed: boolean;
}

export interface AuthState {
  currentStep: AuthStep;
  userId: string;
  password: string;
  securityAnswer: string;
  caesarAnswer: string;
  isAuthenticated: boolean;
  currentUser: User | null;
}
