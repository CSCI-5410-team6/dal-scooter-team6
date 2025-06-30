import React from "react";
import { useNavigate } from "react-router-dom";
import { dummyScooters } from "../../data/dummyData";
import Chatbot from "../chatbot/Chatbot";

const PublicDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-100 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <span className="text-2xl font-extrabold tracking-tight select-none">
            <span className="text-blue-600">DAL</span>
            <span className="text-gray-900">Scooter</span>
          </span>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to DALScooter
          </h2>
          <p className="text-gray-600">
            Browse our available scooters. Login or create an account to book,
            leave feedback, or contact admin.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Available Scooters
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dummyScooters
                .filter((scooter) => scooter.available)
                .map((scooter) => (
                  <div
                    key={scooter.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <img
                      src={scooter.image}
                      alt={scooter.name}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {scooter.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {scooter.type}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${scooter.price}/day
                      </p>
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-1">
                          Features:
                        </h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {scooter.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
      <Chatbot />
    </div>
  );
};

export default PublicDashboard;
