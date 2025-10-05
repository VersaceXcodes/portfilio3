import React from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const GV_Footer: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);

  return (
    <>
      <footer className="bg-white shadow-lg shadow-gray-200/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Link to="https://example.com/terms" className="text-gray-600 hover:text-gray-900 transition">
                Terms of Use
              </Link>
              <Link to="https://example.com/privacy" className="text-gray-600 hover:text-gray-900 transition">
                Privacy Policy
              </Link>
            </div>
            {isAuthenticated && currentUser && (
              <div className="text-gray-600">
                <p>Contact: {currentUser.email}</p>
              </div>
            )}
          </div>
          {isAuthenticated && currentUser?.social_media_links && (
            <div className="flex space-x-4 justify-center">
              {Object.entries(currentUser.social_media_links).map(([platform, url]) => (
                <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition">
                  {platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;