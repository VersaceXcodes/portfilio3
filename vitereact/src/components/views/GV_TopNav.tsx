import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const GV_TopNav: React.FC = () => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const logoutUser = useAppStore(state => state.logout_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      logoutUser();
    } catch (error) {
      console.error('Logout Error', error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/portfolio/customize" className="text-2xl font-bold text-gray-900">
                Portfolio3
              </Link>
            </div>
            {isAuthenticated && (
              <div className="flex space-x-4 items-center">
                <Link to="/portfolio/customize" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Portfolio
                </Link>
                <Link to="/portfolio/blog" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Blog/Updates
                </Link>
                <Link to="/portfolio/analytics" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Analytics
                </Link>
                <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default GV_TopNav;