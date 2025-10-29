import React, { useState } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_ProfileSetup: React.FC = () => {
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>('');
  const [contactEmail, setContactEmail] = useState<string | null>('');
  const [phoneNumber, setPhoneNumber] = useState<string | null>('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string> | null>({});
  const [error, setError] = useState<string | null>(null);

  const saveProfileSetup = useMutation(
    async () => {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser.id}`,
        {
          profile_picture_url: profilePicture,
          cover_image_url: coverImage,
          bio,
          contact_email: contactEmail,
          phone_number: phoneNumber,
          social_media_links: socialLinks,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    },
    {
      onSuccess: () => {
        setError(null);
        alert('Profile updated successfully!');
      },
      onError: (error: any) => {
        setError(error?.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    saveProfileSetup.mutate();
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<any>>) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null);
    setter(event.target.value);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Setup</h1>

        {error && (
          <div aria-live="polite" className="bg-red-100 text-red-700 border border-red-400 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <form className="w-full max-w-lg bg-white shadow-md rounded-lg px-8 pt-6 pb-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
              Profile Picture URL
            </label>
            <input
              id="profilePicture"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={profilePicture || ''}
              onChange={handleInputChange(setProfilePicture)}
            />
          </div>

          <div>
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">
              Cover Image URL
            </label>
            <input
              id="coverImage"
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={coverImage || ''}
              onChange={handleInputChange(setCoverImage)}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={bio || ''}
              onChange={handleInputChange(setBio)}
              rows={3}
            ></textarea>
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
              Contact Email
            </label>
            <input
              id="contactEmail"
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={contactEmail || ''}
              onChange={handleInputChange(setContactEmail)}
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={phoneNumber || ''}
              onChange={handleInputChange(setPhoneNumber)}
            />
          </div>

          <div>
            <label htmlFor="socialLinks" className="block text-sm font-medium text-gray-700">
              Social Media Links (JSON format)
            </label>
            <textarea
              id="socialLinks"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              value={JSON.stringify(socialLinks) || ''}
              onChange={(e) => {
                setError(null);
                try {
                  setSocialLinks(JSON.parse(e.target.value));
                } catch {
                  setError('Invalid JSON format for social media links');
                }
              }}
              rows={3}
            ></textarea>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              disabled={saveProfileSetup.isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {saveProfileSetup.isLoading ? 'Saving...' : 'Save Profile'}
            </button>
            <Link to="/portfolio/customize" className="text-blue-600 hover:text-blue-800 transition">
              Skip this step
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_ProfileSetup;