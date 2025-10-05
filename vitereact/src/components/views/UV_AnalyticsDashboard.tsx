import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';
import { Analytics } from '@/db/zodschemas';
import { z } from 'zod';
import { Link } from 'react-router-dom';

const UV_AnalyticsDashboard: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const fetchAnalyticsData = async () => {
    if (!currentUser || !authToken) return null;

    const response = await axios.get<Analytics>(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/analytics/${currentUser.id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    return response.data;
  };

  const { data, isLoading, error } = useQuery(
    ['analyticsData', currentUser?.id],
    fetchAnalyticsData,
    {
      enabled: Boolean(currentUser?.id && authToken),
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <nav className="bg-white shadow p-4 rounded-md flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <Link to="/portfolio/customize" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Customize Portfolio
            </Link>
          </nav>

          {isLoading ? (
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p className="text-sm">Failed to load analytics data. Please try again later.</p>
            </div>
          ) : (
            <div className="bg-white p-6 shadow-lg rounded-xl border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Visitor Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-lg font-semibold text-blue-800">
                    Total Visits: <span className="font-bold">{data?.visit_count}</span>
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-semibold text-green-800">Popular Projects</h3>
                  <ul className="mt-2">
                    {Object.entries(data?.popular_projects || {}).map(([project, views]) => (
                      <li key={project} className="text-sm">
                        {project}: {views.length} views
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800">Interaction Patterns</h3>
                <pre className="mt-2 bg-gray-50 p-4 rounded-md border border-gray-200">
                  {JSON.stringify(data?.interaction_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_AnalyticsDashboard;