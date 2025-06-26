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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">DALScooter</h1>
              <span
                className={`ml-3 px-2 py-1 text-xs font-medium text-white rounded-full ${getUserTypeColor(
                  currentUser.userType
                )}`}
              >
                {getUserTypeLabel(currentUser.userType)}
              </span>
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
