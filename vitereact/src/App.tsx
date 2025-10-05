import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';


import GV_Footer from '@/components/views/GV_Footer.tsx';
import UV_Welcome from '@/components/views/UV_Welcome.tsx';
import UV_SignUp from '@/components/views/UV_SignUp.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_ResetPassword from '@/components/views/UV_ResetPassword.tsx';
import UV_ProfileSetup from '@/components/views/UV_ProfileSetup.tsx';
import UV_PortfolioCustomization from '@/components/views/UV_PortfolioCustomization.tsx';
import UV_ProjectDetail from '@/components/views/UV_ProjectDetail.tsx';
import UV_BlogUpdates from '@/components/views/UV_BlogUpdates.tsx';
import UV_AnalyticsDashboard from '@/components/views/UV_AnalyticsDashboard.tsx';
import UV_PortfolioViewer from '@/components/views/UV_PortfolioViewer.tsx';

const queryClient = new QueryClient();

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const initializeAuth = useAppStore(state => state.initialize_auth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App min-h-screen flex flex-col">
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UV_Welcome />} />
              <Route path="/signup" element={<UV_SignUp />} />
              <Route path="/login" element={<UV_Login />} />
              <Route path="/reset_password" element={<UV_ResetPassword />} />

              {/* Protected Routes */}
              <Route path="/profile_setup" element={
                <ProtectedRoute><UV_ProfileSetup /></ProtectedRoute>
              } />
              <Route path="/portfolio/customize" element={
                <ProtectedRoute><UV_PortfolioCustomization /></ProtectedRoute>
              } />
              <Route path="/portfolio/project/:project_id" element={
                <ProtectedRoute><UV_ProjectDetail /></ProtectedRoute>
              } />
              <Route path="/portfolio/blog" element={
                <ProtectedRoute><UV_BlogUpdates /></ProtectedRoute>
              } />
              <Route path="/portfolio/analytics" element={
                <ProtectedRoute><UV_AnalyticsDashboard /></ProtectedRoute>
              } />
              <Route path="/portfolio/view" element={
                <UV_PortfolioViewer />
              } />

              {/* Catch all - redirect based on auth status */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <GV_Footer />
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;