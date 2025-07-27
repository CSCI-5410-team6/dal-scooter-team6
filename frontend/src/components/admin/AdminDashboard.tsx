import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API_CONFIG from "../../config/apiConfig";

// Helper for base64url decoding (same as HomePage)
function base64UrlDecode(str: string) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return atob(str);
}

const ADMIN_TABS = [
  { key: "bikes", label: "Bike List" },
  { key: "bookings", label: "Booking Stats" },
  { key: "messages", label: "Messages" },
  { key: "analytics", label: "Analytics" },
];

const AdminDashboard: React.FC = () => {
  const [bikes, setBikes] = useState<any[]>([]);
  const [bikesLoading, setBikesLoading] = useState(false);
  const [bikesError, setBikesError] = useState("");
  const [showEditBikeModal, setShowEditBikeModal] = useState(false);
  const [editingBike, setEditingBike] = useState<any>(null);
  const [editBikeLoading, setEditBikeLoading] = useState(false);
  const [editBikeError, setEditBikeError] = useState("");
  const [editBikeImageKey, setEditBikeImageKey] = useState(0);
  const [showBikeDetailModal, setShowBikeDetailModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState<any>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading, false = not admin, true = admin
  const [userName, setUserName] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>({});
  const [debugTokens, setDebugTokens] = useState<any[]>([]);
  const [debugUserData, setDebugUserData] = useState<any>({});
  const [userType, setUserType] = useState<string | null>(null);
  const [showAddBikeModal, setShowAddBikeModal] = useState(false);
  const [newBike, setNewBike] = useState({
    bikeId: "",
    type: "gyroscooter",
    features: {
      batteryLife: "",
      heightAdjustable: false,
    },
    hourlyRate: 0,
    discountCode: "",
    imageBase64: "",
  });
  const [imageInputKey, setImageInputKey] = useState(0);
  const [addBikeLoading, setAddBikeLoading] = useState(false);
  const [addBikeError, setAddBikeError] = useState("");
  const [addBikeSuccess, setAddBikeSuccess] = useState("");
  const navigate = useNavigate();

  const fetchBikes = useCallback(async () => {
    setBikesLoading(true);
    setBikesError("");
    try {
      // Get the id token from localStorage
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.GET_ALL}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setBikes(data);
    } catch (err: any) {
      setBikesError(err.message || "Failed to fetch bikes.");
    } finally {
      setBikesLoading(false);
    }
  }, []);

  const fetchBikeById = useCallback(async (bikeId: string) => {
    setEditBikeLoading(true);
    setEditBikeError("");
    try {
      // Get the id token from localStorage
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.GET_BY_ID(bikeId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setEditingBike(data);
      setShowEditBikeModal(true);
    } catch (err: any) {
      setEditBikeError(err.message || "Failed to fetch bike details.");
    } finally {
      setEditBikeLoading(false);
    }
  }, []);

  useEffect(() => {
    // Use .userData key for admin check
    const userDataKey = Object.keys(localStorage).find((key) =>
      key.endsWith(".userData")
    );
    let debugObj: any = {
      userDataKey,
      userDataStr: null,
      parsed: null,
      userType: null,
      name: null,
    };
    if (userDataKey) {
      const userDataStr = localStorage.getItem(userDataKey);
      debugObj.userDataStr = userDataStr;
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          debugObj.parsed = userData;
          // UserAttributes is an array of { Name, Value }
          const attrs = userData.UserAttributes || [];
          const userTypeAttr = attrs.find(
            (a: any) => a.Name === "custom:userType"
          );
          const nameAttr = attrs.find((a: any) => a.Name === "name");
          debugObj.userType = userTypeAttr ? userTypeAttr.Value : null;
          debugObj.name = nameAttr ? nameAttr.Value : null;
          setUserType(debugObj.userType);
          setUserName(debugObj.name);
          if (userTypeAttr && userTypeAttr.Value === "admin") {
            setIsAdmin(true);
            setDebugUserData(debugObj);
            // Fetch bikes after admin check passes
            fetchBikes();
            return;
          }
        } catch (e) {
          debugObj.error = (e as any)?.message || String(e);
        }
      }
    }
    setIsAdmin(false);
    setDebugUserData(debugObj);
    // Do not redirect for now, just show debug info
  }, [fetchBikes]);

  if (isAdmin === null) return null; // loading, render nothing
  if (!isAdmin)
    return (
      <div className="p-8 text-yellow-400">
        <b>DEBUG: Admin userData Check</b>
        <div>
          <b>userDataKey:</b> {String(debugUserData.userDataKey)}
        </div>
        <div>
          <b>userDataStr:</b>{" "}
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {debugUserData.userDataStr}
          </pre>
        </div>
        <div>
          <b>parsed:</b>{" "}
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(debugUserData.parsed, null, 2)}
          </pre>
        </div>
        <div>
          <b>userType:</b> {String(debugUserData.userType)}
        </div>
        <div>
          <b>name:</b> {String(debugUserData.name)}
        </div>
        {debugUserData.error && (
          <div style={{ color: "red" }}>
            <b>error:</b> {debugUserData.error}
          </div>
        )}
        <div>
          Access denied or not admin. (This debug info will be removed after
          troubleshooting.)
        </div>
      </div>
    );

  const handleLogout = () => {
    localStorage.removeItem("idToken");
    // Remove all Cognito tokens
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("CognitoIdentityServiceProvider")) {
        localStorage.removeItem(key);
      }
    });
    setIsAdmin(false);
    setUserName(null);
    navigate("/login");
  };

  const handleAddBike = async () => {
    setAddBikeLoading(true);
    setAddBikeError("");
    setAddBikeSuccess("");
    try {
      // Prepare imageBase64 (strip data URL prefix)
      let imageBase64 = newBike.imageBase64;
      if (imageBase64.startsWith("data:")) {
        imageBase64 = imageBase64.substring(imageBase64.indexOf(",") + 1);
      }
      const payload = {
        bikeId: newBike.bikeId,
        type: newBike.type,
        features: {
          batteryLife: newBike.features.batteryLife,
          heightAdjustable: String(newBike.features.heightAdjustable),
        },
        hourlyRate: newBike.hourlyRate,
        discountCode: newBike.discountCode,
        imageBase64,
      };
      // Get the id token from localStorage
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.CREATE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setAddBikeSuccess(data.message || "Bike created successfully.");
      // Reset form and close modal
      setNewBike({
        bikeId: "",
        type: "gyroscooter",
        features: {
          batteryLife: "",
          heightAdjustable: false,
        },
        hourlyRate: 0,
        discountCode: "",
        imageBase64: "",
      });
      setShowAddBikeModal(false);
      // Refresh the bikes list
      fetchBikes();
    } catch (err: any) {
      setAddBikeError(err.message || "Failed to add bike.");
    } finally {
      setAddBikeLoading(false);
    }
  };

  const resetForm = () => {
    setNewBike({
      bikeId: "",
      type: "gyroscooter",
      features: {
        batteryLife: "",
        heightAdjustable: false,
      },
      hourlyRate: 0,
      discountCode: "",
      imageBase64: "",
    });
    setShowAddBikeModal(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setNewBike((prev) => ({
          ...prev,
          imageBase64: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewBike((prev) => ({
      ...prev,
      imageBase64: "",
    }));
    setImageInputKey((prev) => prev + 1); // Reset the file input
  };

  const handleBikeClick = (bike: any) => {
    setSelectedBike(bike);
    setShowBikeDetailModal(true);
  };

  const handleEditBike = (bikeId: string) => {
    fetchBikeById(bikeId);
  };

  const handleCloseEditModal = () => {
    setShowEditBikeModal(false);
    setEditingBike(null);
    setEditBikeError("");
  };

  const handleCloseBikeDetailModal = () => {
    setShowBikeDetailModal(false);
    setSelectedBike(null);
  };

  const handleDeleteBike = (bikeId: string) => {
    setBikeToDelete(bikeId);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteBike = async () => {
    if (!bikeToDelete) return;

    try {
      // Get the id token from localStorage
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.DELETE(bikeToDelete)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Close modals and refresh bikes list
      setShowDeleteConfirmModal(false);
      setBikeToDelete(null);
      handleCloseBikeDetailModal();
      handleCloseEditModal();
      fetchBikes();

      // Show success message
      alert(`Bike ${bikeToDelete} deleted successfully!`);
    } catch (err: any) {
      alert(`Failed to delete bike: ${err.message}`);
    }
  };

  const cancelDeleteBike = () => {
    setShowDeleteConfirmModal(false);
    setBikeToDelete(null);
  };

  const handleEditBikeImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditingBike((prev: any) => ({
          ...prev,
          imageBase64: result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditBikeImage = () => {
    setEditingBike((prev: any) => ({
      ...prev,
      imageBase64: "",
    }));
    setEditBikeImageKey((prev) => prev + 1);
  };

  const handleUpdateBike = async () => {
    setEditBikeLoading(true);
    setEditBikeError("");
    try {
      // Prepare imageBase64 (strip data URL prefix)
      let imageBase64 = editingBike.imageBase64;
      if (imageBase64 && imageBase64.startsWith("data:")) {
        imageBase64 = imageBase64.substring(imageBase64.indexOf(",") + 1);
      }

      const payload: any = {
        features: {
          batteryLife: editingBike.features.batteryLife,
          heightAdjustable: String(editingBike.features.heightAdjustable),
        },
        hourlyRate: Number(editingBike.hourlyRate),
        discountCode: editingBike.discountCode,
      };

      // Include image if a new one was uploaded
      if (imageBase64) {
        payload.imageBase64 = imageBase64;
      }

      // Get the id token from localStorage
      const idTokenKey = Object.keys(localStorage).find(
        (key) =>
          key.includes("CognitoIdentityServiceProvider") &&
          key.includes("idToken")
      );
      const idToken = idTokenKey ? localStorage.getItem(idTokenKey) : null;

      if (!idToken) {
        throw new Error("ID token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.BIKES.UPDATE(editingBike.bikeId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Close modal immediately and refresh bikes list
      handleCloseEditModal();
      fetchBikes();

      // Show success notification
      alert("Bike updated successfully!");
    } catch (err: any) {
      setEditBikeError(err.message || "Failed to update bike.");
    } finally {
      setEditBikeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-green-400">
                  E-Ride
                </span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <button
                    onClick={() => setActiveTab("home")}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                      activeTab === "home"
                        ? "text-green-400"
                        : "text-gray-300 hover:text-green-400"
                    }`}
                  >
                    Home
                  </button>
                  {ADMIN_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-2 text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                        activeTab === tab.key
                          ? "text-green-400"
                          : "text-gray-300 hover:text-green-400"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {userName && (
                <>
                  <span className="ml-4 font-semibold text-green-400">
                    Welcome, {userName}!
                  </span>
                  <button
                    onClick={handleLogout}
                    className="ml-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-all duration-200 transform hover:scale-105"
                  >
                    Log Out
                  </button>
                  <span className="ml-2 text-sm font-medium text-green-400">
                    Admin
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto pt-24 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-green-400">
            Franchise Admin Dashboard
          </h1>
        </div>

        {/* Add Bike Button - positioned above tabs */}
        <div className="flex justify-end mb-0.5">
          <button
            onClick={() => setShowAddBikeModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Add Bike</span>
          </button>
        </div>

        {/* Add Bike Modal */}
        {showAddBikeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-400">
                  Add New Bike
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Bike ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bike ID *
                  </label>
                  <input
                    type="text"
                    value={newBike.bikeId}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        bikeId: e.target.value,
                      }))
                    }
                    placeholder="e.g., GYRO-1001"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Bike Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bike Type *
                  </label>
                  <select
                    value={newBike.type}
                    onChange={(e) =>
                      setNewBike((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                  >
                    <option value="gyroscooter">Gyro Scooter</option>
                    <option value="ebike">E-Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>

                {/* Battery Life */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Battery Life *
                  </label>
                  <input
                    type="text"
                    value={newBike.features.batteryLife}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          batteryLife: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g., 12hr, 8hr, 24hr"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Height Adjustable */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newBike.features.heightAdjustable}
                      onChange={(e) =>
                        setNewBike((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            heightAdjustable: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-green-400 bg-gray-700 border-gray-600 rounded focus:ring-green-400"
                    />
                    <span className="text-sm font-medium text-gray-300">
                      Height Adjustable
                    </span>
                  </label>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hourly Rate (USD) *
                  </label>
                  <input
                    type="number"
                    value={newBike.hourlyRate}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        hourlyRate: Number(e.target.value),
                      }))
                    }
                    placeholder="e.g., 10"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Discount Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discount Code
                  </label>
                  <input
                    type="text"
                    value={newBike.discountCode}
                    onChange={(e) =>
                      setNewBike((prev) => ({
                        ...prev,
                        discountCode: e.target.value,
                      }))
                    }
                    placeholder="e.g., WINTER25, SUMMER10"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bike Image *
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="bike-image-upload"
                      key={imageInputKey}
                    />
                    <label
                      htmlFor="bike-image-upload"
                      className="cursor-pointer"
                    >
                      {newBike.imageBase64 ? (
                        <div className="space-y-2 relative">
                          <div className="relative inline-block">
                            <img
                              src={newBike.imageBase64}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveImage();
                              }}
                              className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-sm text-green-400">
                            Image uploaded successfully!
                          </p>
                          <p className="text-xs text-gray-400">
                            Click to change image
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <svg
                            className="w-12 h-12 text-gray-400 mx-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-sm text-gray-300">
                            Click to upload bike image
                          </p>
                          <p className="text-xs text-gray-400">
                            Supports: JPG, PNG, GIF (Max 5MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                {addBikeError && (
                  <div className="text-red-400 text-center mb-2">
                    {addBikeError}
                  </div>
                )}
                {addBikeSuccess && (
                  <div className="text-green-400 text-center mb-2">
                    {addBikeSuccess}
                  </div>
                )}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={handleAddBike}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                    disabled={addBikeLoading}
                  >
                    {addBikeLoading ? "Adding..." : "Add Bike"}
                  </button>
                  <button
                    onClick={() => setShowAddBikeModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bike Modal */}
        {showEditBikeModal && editingBike && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-400">
                  Edit Bike: {editingBike.bikeId}
                </h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {editBikeLoading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center space-y-4">
                    <svg
                      className="animate-spin h-8 w-8 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <div className="text-green-400 font-medium">
                      Loading bike details...
                    </div>
                  </div>
                </div>
              ) : editBikeError ? (
                <div className="text-center py-8">
                  <div className="text-red-400">Error: {editBikeError}</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Bike ID (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike ID
                    </label>
                    <input
                      type="text"
                      value={editingBike.bikeId}
                      disabled
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  {/* Bike Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike Type *
                    </label>
                    <select
                      value={editingBike.type}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="gyroscooter">Gyro Scooter</option>
                      <option value="ebike">E-Bike</option>
                      <option value="scooter">Scooter</option>
                      <option value="bicycle">Bicycle</option>
                    </select>
                  </div>

                  {/* Battery Life */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Battery Life *
                    </label>
                    <input
                      type="text"
                      value={editingBike.features.batteryLife}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            batteryLife: e.target.value,
                          },
                        }))
                      }
                      placeholder="e.g., 12hr, 8hr, 24hr"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Height Adjustable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Height Adjustable
                    </label>
                    <select
                      value={editingBike.features.heightAdjustable}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            heightAdjustable: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hourly Rate (USD) *
                    </label>
                    <input
                      type="text"
                      value={editingBike.hourlyRate}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only numbers and decimal point
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setEditingBike((prev: any) => ({
                            ...prev,
                            hourlyRate: value,
                          }));
                        }
                      }}
                      placeholder="e.g., 10"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Discount Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Code
                    </label>
                    <input
                      type="text"
                      value={editingBike.discountCode || ""}
                      onChange={(e) =>
                        setEditingBike((prev: any) => ({
                          ...prev,
                          discountCode: e.target.value,
                        }))
                      }
                      placeholder="e.g., WINTER25, SUMMER10"
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike Image
                    </label>
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditBikeImageUpload}
                        className="hidden"
                        id="edit-bike-image-upload"
                        key={editBikeImageKey}
                      />
                      <label
                        htmlFor="edit-bike-image-upload"
                        className="cursor-pointer"
                      >
                        {editingBike.imageBase64 ? (
                          <div className="space-y-2 relative">
                            <div className="relative inline-block">
                              <img
                                src={editingBike.imageBase64}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded-lg mx-auto"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleRemoveEditBikeImage();
                                }}
                                className="absolute -top-2 -right-2 bg-gray-600 hover:bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-sm text-green-400">
                              New image uploaded!
                            </p>
                            <p className="text-xs text-gray-400">
                              Click to change image
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <img
                              src={editingBike.imageUrl}
                              alt="Current"
                              className="w-32 h-32 object-cover rounded-lg mx-auto"
                            />
                            <p className="text-sm text-gray-300">
                              Click to upload new image
                            </p>
                            <p className="text-xs text-gray-400">
                              Supports: JPG, PNG, GIF (Max 5MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Error Message */}
                  {editBikeError && (
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-5 h-5 text-red-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-red-400 font-medium">
                          Error: {editBikeError}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <button
                      onClick={handleUpdateBike}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50 flex items-center justify-center space-x-2"
                      disabled={editBikeLoading}
                    >
                      {editBikeLoading ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>Updating Bike...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          <span>Update Bike</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCloseEditModal}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                      disabled={editBikeLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bike Detail Modal */}
        {showBikeDetailModal && selectedBike && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-400">
                  Bike Details: {selectedBike.bikeId}
                </h2>
                <button
                  onClick={handleCloseBikeDetailModal}
                  className="text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Big Image */}
                <div className="space-y-4">
                  <div className="border-2 border-gray-600 rounded-lg p-4">
                    <img
                      src={selectedBike.imageUrl}
                      alt={selectedBike.bikeId}
                      className="w-full h-96 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Bike ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike ID
                    </label>
                    <div className="text-xl font-semibold text-white">
                      {selectedBike.bikeId}
                    </div>
                  </div>

                  {/* Bike Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bike Type
                    </label>
                    <div className="text-lg text-white capitalize">
                      {selectedBike.type}
                    </div>
                  </div>

                  {/* Battery Life */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Battery Life
                    </label>
                    <div className="text-lg text-white">
                      {selectedBike.features.batteryLife}
                    </div>
                  </div>

                  {/* Height Adjustable */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Height Adjustable
                    </label>
                    <div className="text-lg text-white">
                      {selectedBike.features.heightAdjustable === "true"
                        ? "Yes"
                        : "No"}
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hourly Rate
                    </label>
                    <div className="text-2xl font-bold text-green-400">
                      ${selectedBike.hourlyRate}/hour
                    </div>
                  </div>

                  {/* Discount Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Discount Code
                    </label>
                    <div className="text-lg text-white">
                      {selectedBike.discountCode || "None"}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <span className="inline-block px-3 py-1 text-sm font-semibold bg-green-500 text-white rounded-full">
                      Active
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-6">
                    <button
                      onClick={() => {
                        handleCloseBikeDetailModal();
                        handleEditBike(selectedBike.bikeId);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      Edit Bike
                    </button>
                    <button
                      onClick={() => {
                        handleCloseBikeDetailModal();
                        handleDeleteBike(selectedBike.bikeId);
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      Delete Bike
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && bikeToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-red-400">Delete Bike</h2>
                <button
                  onClick={cancelDeleteBike}
                  className="text-gray-400 hover:text-white transition-all duration-200 transform hover:scale-110"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-lg font-semibold text-white">
                    Warning
                  </span>
                </div>
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete bike{" "}
                  <span className="font-semibold text-white">
                    {bikeToDelete}
                  </span>
                  ?
                </p>
                <p className="text-red-400 text-sm">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={confirmDeleteBike}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Delete Bike
                </button>
                <button
                  onClick={cancelDeleteBike}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-4 border-b border-gray-700 mb-8">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 font-semibold transition-all duration-200 transform hover:scale-105 rounded-t ${
                activeTab === tab.key
                  ? "bg-green-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-green-700 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="bg-gray-800 rounded-lg shadow p-6 min-h-[400px]">
          {activeTab === "home" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Franchise Admin Dashboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {bikesLoading ? (
                  <div className="col-span-full text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <svg
                        className="animate-spin h-8 w-8 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <div className="text-green-400 font-medium">
                        Loading bikes...
                      </div>
                    </div>
                  </div>
                ) : bikesError ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-red-400">Error: {bikesError}</div>
                  </div>
                ) : bikes.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-gray-400">No bikes found</div>
                  </div>
                ) : (
                  bikes.map((bike: any) => (
                    <div
                      key={bike.bikeId}
                      className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      onClick={() => handleBikeClick(bike)}
                    >
                      <img
                        src={bike.imageUrl}
                        alt={bike.bikeId}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold">
                            {bike.bikeId}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-500 text-white">
                            Active
                          </span>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-gray-300">
                              Battery: {bike.features.batteryLife}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-gray-300">
                              Height Adjustable:{" "}
                              {bike.features.heightAdjustable}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-gray-300">
                              Type: {bike.type}
                            </span>
                          </div>
                        </div>
                        <div className="text-gray-400 mb-2">
                          Hourly Rate:{" "}
                          <span className="text-green-400 font-bold">
                            ${bike.hourlyRate}/hour
                          </span>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBike(bike.bikeId);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-all duration-200 transform hover:scale-105"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBike(bike.bikeId);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-all duration-200 transform hover:scale-105"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === "bikes" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Bike List</h2>
              <div className="flex flex-col gap-6 max-h-[600px] overflow-y-auto pr-2">
                {bikesLoading ? (
                  <div className="text-center py-8">
                    <div className="flex flex-col items-center space-y-4">
                      <svg
                        className="animate-spin h-8 w-8 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <div className="text-green-400 font-medium">
                        Loading bikes...
                      </div>
                    </div>
                  </div>
                ) : bikesError ? (
                  <div className="text-center py-8">
                    <div className="text-red-400">Error: {bikesError}</div>
                  </div>
                ) : bikes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">No bikes found</div>
                  </div>
                ) : (
                  bikes.map((bike: any) => (
                    <div
                      key={bike.bikeId}
                      className="flex bg-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      onClick={() => handleBikeClick(bike)}
                    >
                      <img
                        src={bike.imageUrl}
                        alt={bike.bikeId}
                        className="w-48 h-48 object-cover flex-shrink-0"
                      />
                      <div className="p-6 flex flex-col justify-between flex-1">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-semibold">
                              {bike.bikeId}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-500 text-white">
                              Active
                            </span>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-gray-300">
                                Battery: {bike.features.batteryLife}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-gray-300">
                                Height Adjustable:{" "}
                                {bike.features.heightAdjustable}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-gray-300">
                                Type: {bike.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-gray-400 mb-2">
                            Hourly Rate:{" "}
                            <span className="text-green-400 font-bold">
                              ${bike.hourlyRate}/hour
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditBike(bike.bikeId);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-all duration-200 transform hover:scale-105"
                          >
                            Update
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBike(bike.bikeId);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-all duration-200 transform hover:scale-105"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === "bookings" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Booking Stats</h2>
              <p className="text-gray-400">
                Show current and past bookings, grouped by bike.
              </p>
            </div>
          )}
          {activeTab === "messages" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Messages</h2>
              <p className="text-gray-400">
                Chat-style threaded messages with customers.
              </p>
            </div>
          )}
          {activeTab === "analytics" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Analytics Summary</h2>
              <p className="text-gray-400">
                Show total bikes, active bikes, bookings this month, feedback
                sentiment.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold text-green-400">E-Ride</div>
              <p className="text-gray-300">
                Revolutionizing urban transportation with premium electric
                bikes.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 008.48 19h7.04a2 2 0 001.83-1.3L17 13M7 13l1.5-6h7l1.5 6"
                    />
                  </svg>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 12a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V8a4 4 0 00-8 0v4m8 0v4a4 4 0 01-8 0v-4"
                    />
                  </svg>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <div className="space-y-2 text-gray-300">
                <div>Hourly Rentals</div>
                <div>Daily Packages</div>
                <div>Corporate Plans</div>
                <div>Group Bookings</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-gray-300">
                <div>Help Center</div>
                <div>Contact Us</div>
                <div>Safety Guide</div>
                <div>Terms & Conditions</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-300">
                <div>About Us</div>
                <div>Careers</div>
                <div>Press</div>
                <div>Partnerships</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 E-Ride. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
