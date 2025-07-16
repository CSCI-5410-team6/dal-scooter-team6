// we cam remove this one we are not using it
import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { AuthState, User, AuthStep } from "../types";
import { loginCredentials, caesarPuzzle, dummyUsers } from "../data/dummyData";

interface AuthContextType {
  authState: AuthState;
  loginStep1: (userId: string, password: string) => boolean;
  loginStep2: (securityAnswer: string) => boolean;
  loginStep3: (caesarAnswer: string) => boolean;
  logout: () => void;
  resetAuth: () => void;
}
 
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  currentStep: { step: 1, completed: false },
  userId: "",
  password: "",
  securityAnswer: "",
  caesarAnswer: "",
  isAuthenticated: false,
  currentUser: null,
};

type AuthAction =
  | { type: "SET_STEP"; payload: AuthStep }
  | { type: "SET_CREDENTIALS"; payload: { userId: string; password: string } }
  | { type: "SET_SECURITY_ANSWER"; payload: string }
  | { type: "SET_CAESAR_ANSWER"; payload: string }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGOUT" }
  | { type: "RESET" };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_CREDENTIALS":
      return {
        ...state,
        userId: action.payload.userId,
        password: action.payload.password,
      };
    case "SET_SECURITY_ANSWER":
      return { ...state, securityAnswer: action.payload };
    case "SET_CAESAR_ANSWER":
      return { ...state, caesarAnswer: action.payload };
    case "LOGIN_SUCCESS":
      return { ...state, isAuthenticated: true, currentUser: action.payload };
    case "LOGOUT":
      return initialState;
    case "RESET":
      return { ...initialState, currentStep: { step: 1, completed: false } };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  const loginStep1 = (userId: string, password: string): boolean => {
    const credentials =
      loginCredentials[userId as keyof typeof loginCredentials];

    if (credentials && credentials.password === password) {
      dispatch({ type: "SET_CREDENTIALS", payload: { userId, password } });
      dispatch({ type: "SET_STEP", payload: { step: 2, completed: true } });
      return true;
    }
    return false;
  };

  const loginStep2 = (securityAnswer: string): boolean => {
    const user = dummyUsers.find((u) => u.username === authState.userId);
    const expectedAnswer = user?.securityAnswer?.toLowerCase();

    if (expectedAnswer && securityAnswer.toLowerCase() === expectedAnswer) {
      dispatch({ type: "SET_SECURITY_ANSWER", payload: securityAnswer });
      dispatch({ type: "SET_STEP", payload: { step: 3, completed: true } });
      return true;
    }
    return false;
  };

  const loginStep3 = (caesarAnswer: string): boolean => {
    if (caesarAnswer.toLowerCase() === caesarPuzzle.answer.toLowerCase()) {
      dispatch({ type: "SET_CAESAR_ANSWER", payload: caesarAnswer });

      const user = dummyUsers.find((u) => u.username === authState.userId);
      if (user) {
        dispatch({ type: "LOGIN_SUCCESS", payload: user });
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
  };

  const resetAuth = () => {
    dispatch({ type: "RESET" });
  };

  const value: AuthContextType = {
    authState,
    loginStep1,
    loginStep2,
    loginStep3,
    logout,
    resetAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
