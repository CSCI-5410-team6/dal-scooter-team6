import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { UserType } from "../../types";
import GuestDashboard from "./GuestDashboard";
import CustomerDashboard from "./CustomerDashboard";
import AdminDashboard from "./AdminDashboard";
import Chatbot from "../chatbot/Chatbot";

const DashboardLayout: React.FC = () => {
  const { authState, logout } = useAuth();
  const { currentUser } = authState;

  const getUserTypeColor = (userType: UserType) => {
    switch (userType) {
      case "guest":
        return "bg-gray-500";
      case "customer":
        return "bg-blue-500";
      case "admin":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getUserTypeLabel = (userType: UserType) => {
    switch (userType) {
      case "guest":
        return "Guest";
      case "customer":
        return "Customer";
      case "admin":
        return "Admin";
      default:
        return "User";
    }
  };

  const renderDashboard = () => {
    if (!currentUser) return null;

    switch (currentUser.userType) {
      case "guest":
        return <GuestDashboard />;
      case "customer":
        return <CustomerDashboard />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <GuestDashboard />;
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-100 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-extrabold tracking-tight select-none">
                <span className="text-blue-600">DAL</span>
                <span className="text-gray-900">Scooter</span>
              </span>
              {currentUser.userType === "admin" && (
                <span className="ml-4 text-base text-gray-700 font-semibold">
                  Admin
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {currentUser.username}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderDashboard()}
      </main>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
};

export default DashboardLayout;
