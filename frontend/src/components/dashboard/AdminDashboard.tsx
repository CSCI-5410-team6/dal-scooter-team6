import React, { useState } from "react";
import {
  dummyScooters,
  dummyBookings,
  dummyMessages,
} from "../../data/dummyData";
import { Scooter } from "../../types";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddScooterForm, setShowAddScooterForm] = useState(false);
  const [showEditScooterForm, setShowEditScooterForm] = useState(false);
  const [selectedScooter, setSelectedScooter] = useState<Scooter | null>(null);
  const [newScooter, setNewScooter] = useState({
    name: "",
    type: "Gyroscooter" as "Gyroscooter" | "eBike" | "Segway",
    price: 0,
    features: [""],
    image: "",
    available: true,
  });

  const handleAddScooter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScooter.name || newScooter.price <= 0) return;

    // In a real app, this would be sent to the backend
    alert("Scooter added successfully!");
    setShowAddScooterForm(false);
    setNewScooter({
      name: "",
      type: "Gyroscooter",
      price: 0,
      features: [""],
      image: "",
      available: true,
    });
  };

  const handleEditScooter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScooter || !newScooter.name || newScooter.price <= 0) return;

    // In a real app, this would be sent to the backend
    alert("Scooter updated successfully!");
    setShowEditScooterForm(false);
    setSelectedScooter(null);
    setNewScooter({
      name: "",
      type: "Gyroscooter",
      price: 0,
      features: [""],
      image: "",
      available: true,
    });
  };

  const handleDeleteScooter = (scooterId: string) => {
    if (window.confirm("Are you sure you want to delete this scooter?")) {
      // In a real app, this would be sent to the backend
      alert("Scooter deleted successfully!");
    }
  };

  const tabs = [
    { id: "overview", name: "Overview" },
    { id: "scooters", name: "Manage Scooters" },
    { id: "analytics", name: "Analytics" },
    { id: "messages", name: "Customer Messages" },
    { id: "bookings", name: "All Bookings" },
  ];

  // Dummy analytics data
  const analyticsData = {
    totalRevenue: 12500,
    totalBookings: 45,
    activeBookings: 12,
    averageRating: 4.2,
    popularScooter: "Gyro-X Pro",
    monthlyGrowth: 15,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Manage scooters, view analytics, and handle customer communications.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-blue-900">
                    Total Revenue
                  </h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${analyticsData.totalRevenue}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-900">
                    Total Bookings
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData.totalBookings}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-purple-900">
                    Active Bookings
                  </h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData.activeBookings}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-900">
                    Avg Rating
                  </h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analyticsData.averageRating}/5
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setShowAddScooterForm(true)}
                      className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add New Scooter
                    </button>
                    <button
                      onClick={() => setActiveTab("messages")}
                      className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      View Messages
                    </button>
                    <button
                      onClick={() => setActiveTab("analytics")}
                      className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Analytics
                    </button>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Key Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Popular Scooter:</span>
                      <span className="font-medium">
                        {analyticsData.popularScooter}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Growth:</span>
                      <span className="font-medium text-green-600">
                        +{analyticsData.monthlyGrowth}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Scooters:</span>
                      <span className="font-medium">
                        {dummyScooters.filter((s) => s.available).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scooters Management Tab */}
          {activeTab === "scooters" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Scooters
                </h3>
                <button
                  onClick={() => setShowAddScooterForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add New Scooter
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dummyScooters.map((scooter) => (
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
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            scooter.available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {scooter.available ? "Available" : "Unavailable"}
                        </span>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedScooter(scooter);
                            setNewScooter({
                              name: scooter.name,
                              type: scooter.type,
                              price: scooter.price,
                              features: scooter.features,
                              image: scooter.image,
                              available: scooter.available,
                            });
                            setShowEditScooterForm(true);
                          }}
                          className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded-md hover:bg-yellow-700 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteScooter(scooter.id)}
                          className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md hover:bg-red-700 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Analytics Dashboard
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Revenue Overview
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${analyticsData.totalRevenue}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monthly Growth</span>
                      <span className="text-lg font-medium text-green-600">
                        +{analyticsData.monthlyGrowth}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Booking Statistics
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Bookings</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {analyticsData.totalBookings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Bookings</span>
                      <span className="text-lg font-medium text-blue-600">
                        {analyticsData.activeBookings}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "27%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Customer Satisfaction
                </h4>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {analyticsData.averageRating}
                    </div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">5★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: "80%" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">80%</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm text-gray-600">4★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: "15%" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">15%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">3★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: "5%" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Customer Messages
              </h3>
              <div className="space-y-4">
                {dummyMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {message.subject}
                        </h4>
                        <p className="text-sm text-gray-600">
                          From: {message.from} • {message.date}
                        </p>
                        <p className="text-gray-700 mt-2">{message.content}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            message.read
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {message.read ? "Read" : "Unread"}
                        </span>
                        <div className="mt-2">
                          <button className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm">
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Bookings Tab */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                All Bookings
              </h3>
              <div className="space-y-4">
                {dummyBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {booking.scooterName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {booking.startDate} to {booking.endDate}
                        </p>
                        <p className="text-lg font-bold text-blue-600">
                          ${booking.totalPrice}
                        </p>
                        <p className="text-sm text-gray-600">
                          Ref: {booking.bookingReference}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            booking.status === "active"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Scooter Modal */}
      {showAddScooterForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add New Scooter
            </h3>
            <form onSubmit={handleAddScooter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newScooter.name}
                  onChange={(e) =>
                    setNewScooter({ ...newScooter, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newScooter.type}
                  onChange={(e) =>
                    setNewScooter({
                      ...newScooter,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Gyroscooter">Gyroscooter</option>
                  <option value="eBike">E-Bike</option>
                  <option value="Segway">Segway</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Day
                </label>
                <input
                  type="number"
                  value={newScooter.price}
                  onChange={(e) =>
                    setNewScooter({
                      ...newScooter,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={newScooter.image}
                  onChange={(e) =>
                    setNewScooter({ ...newScooter, image: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newScooter.available}
                  onChange={(e) =>
                    setNewScooter({
                      ...newScooter,
                      available: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Available
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddScooterForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Scooter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Scooter Modal */}
      {showEditScooterForm && selectedScooter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit Scooter
            </h3>
            <form onSubmit={handleEditScooter} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newScooter.name}
                  onChange={(e) =>
                    setNewScooter({ ...newScooter, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={newScooter.type}
                  onChange={(e) =>
                    setNewScooter({
                      ...newScooter,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Gyroscooter">Gyroscooter</option>
                  <option value="eBike">E-Bike</option>
                  <option value="Segway">Segway</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Day
                </label>
                <input
                  type="number"
                  value={newScooter.price}
                  onChange={(e) =>
                    setNewScooter({
                      ...newScooter,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={newScooter.image}
                  onChange={(e) =>
                    setNewScooter({ ...newScooter, image: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newScooter.available}
                  onChange={(e) =>
                    setNewScooter({
                      ...newScooter,
                      available: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Available
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditScooterForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Update Scooter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
