import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorLocalMessage, setErrorLocalMessage] = useState<string | null>(null);

  const registerUser = useAppStore(state => state.register_user);
  const loading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const globalErrorMessage = useAppStore(state => state.authentication_state.error_message);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (password !== confirmPassword) {
      setErrorLocalMessage('Passwords do not match.');
      return;
    }

    try {
      await registerUser(email, password, '');
      navigate('/profile_setup');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const clearErrors = () => {
    setErrorLocalMessage(null);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign up for your account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {(errorLocalMessage || globalErrorMessage) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p className="text-sm">{errorLocalMessage || globalErrorMessage}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { clearErrors(); setEmail(e.target.value); }}
                  placeholder="Email address"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => { clearErrors(); setPassword(e.target.value); }}
                  placeholder="Password"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => { clearErrors(); setConfirmPassword(e.target.value); }}
                  placeholder="Confirm Password"
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing up...
                  </span>
                ) : (
                  'Sign up'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link to="/login" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_SignUp;