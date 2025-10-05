import React from 'react';
import { Link } from 'react-router-dom';

const UV_Welcome: React.FC = () => {
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl text-center space-y-8">
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Welcome to Portfolio3
          </h1>
          <p className="text-xl text-gray-600">
            Showcase your personal brand with ease and flexibility. Create, customize, and share your professional portfolio with just a few clicks.
          </p>
          <Link to="/signup">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-all duration-200 hover:bg-blue-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100">
              Sign Up Now
            </button>
          </Link>
          <div className="pt-4">
            <Link to="/login" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
              Already have an account? Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Welcome;