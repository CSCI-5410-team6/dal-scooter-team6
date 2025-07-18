import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { useAuthContext } from '../contextStore/AuthContext';

const Dashboard: React.FC = () => {
  const { cognitoUser } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Welcome, {cognitoUser?.attributes?.name || 'User'}
      </h2>
      <p className="text-gray-600 mb-4">
        User Type: {cognitoUser?.attributes?.['custom:userType'] || 'Guest'}
      </p>
      <button
        onClick={() => navigate('/booking')}
        className="w-full py-2 px-4 mb-4 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Create Booking
      </button>
      <button
        onClick={handleSignOut}
        className="w-full py-2 px-4 rounded-md font-semibold bg-gray-300 text-gray-700 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        Sign Out
      </button>
    </div>
  );
};

export default Dashboard;