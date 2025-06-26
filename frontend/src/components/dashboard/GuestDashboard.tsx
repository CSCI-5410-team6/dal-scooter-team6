import React from "react";
import { dummyScooters, dummyFeedback } from "../../data/dummyData";
import { useNavigate } from "react-router-dom";

const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to DALScooter
        </h2>
        <p className="text-gray-600">
          Explore our available scooters and services as a guest user.
        </p>
      </div>

      {/* Available Scooters */}
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
                    <p className="text-sm text-gray-600 mb-2">{scooter.type}</p>
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

      {/* Tariffs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pricing Tariffs</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900">
                Gyroscooter
              </h4>
              <p className="text-3xl font-bold text-blue-600">$25</p>
              <p className="text-sm text-gray-600">per day</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900">E-Bike</h4>
              <p className="text-3xl font-bold text-blue-600">$35</p>
              <p className="text-sm text-gray-600">per day</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900">Segway</h4>
              <p className="text-3xl font-bold text-blue-600">$40</p>
              <p className="text-sm text-gray-600">per day</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback and Sentiment */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Customer Feedback & Sentiment
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dummyFeedback.map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600">
                      {feedback.userType}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {feedback.date}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < feedback.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{feedback.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Ready to Book?
        </h3>
        <p className="text-blue-700 mb-4">
          Register as a customer to book scooters and access more features!
        </p>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => navigate("/signup")}
        >
          Register Now
        </button>
      </div>
    </div>
  );
};

export default GuestDashboard;
