import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { userSchema } from '@/types/schema';
import { Link } from 'react-router-dom';

const UV_ResetPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/password-reset`, { email });
    },
    onSuccess: () => {
      setNotificationMessage('Password reset email sent successfully.');
      setEmail(''); // Clear the email field upon successful submission
    },
    onError: (error: any) => {
      setNotificationMessage(error.response?.data?.message || 'Failed to send password reset email.');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const emailValidation = userSchema.pick({ email: true }).parse({ email });
      resetPasswordMutation.mutate(emailValidation.email);
    } catch {
      setNotificationMessage('Please enter a valid email address.');
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or return to <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">login</Link>
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {notificationMessage && (
              <div className={`bg-${resetPasswordMutation.isError ? 'red' : 'green'}-50 border border-${resetPasswordMutation.isError ? 'red' : 'green'}-200 text-${resetPasswordMutation.isError ? 'red' : 'green'}-700 px-4 py-3 rounded-md`}>
                <p className="text-sm">{notificationMessage}</p>
              </div>
            )}
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setNotificationMessage(null);
                    setEmail(e.target.value);
                  }}
                  placeholder="Email address"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${resetPasswordMutation.isPending ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending email...
                  </span>
                ) : (
                  'Send reset email'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default UV_ResetPassword;