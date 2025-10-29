import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { projectSchema } from '@/db/zodschemas';
import { z } from 'zod';

interface ProjectDetails {
  project_id: string;
  title: string;
  description: string;
  images: Array<string>;
  project_url: string;
}

const UV_ProjectDetail: React.FC = () => {
  const { project_id } = useParams<{ project_id: string }>();
  const authToken = useAppStore((state) => state.authentication_state.auth_token);
  const queryClient = useQueryClient();

  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    project_id: '',
    title: '',
    description: '',
    images: [],
    project_url: '',
  });
  const [error, setError] = useState<string | null>(null);

  const fetchProjectDetails = async () => {
    if (!project_id) throw new Error('Project ID is required');
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/projects/${project_id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    const data = projectSchema.safeParse(response.data);
    if (!data.success) {
      throw new Error('Failed to fetch project details');
    }
    return data.data;
  };

  const { isLoading } = useQuery(['projectDetails', project_id], fetchProjectDetails, {
    enabled: !!project_id,
    onSuccess: (data) => setProjectDetails(data),
    onError: (error: any) => setError(error.message),
  });

  const { mutate: saveProjectUpdates } = useMutation(
    async (updatedDetails: ProjectDetails) => {
      if (!project_id) throw new Error('Project ID is required');
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/projects/${project_id}`,
        updatedDetails,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          }
        }
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projectDetails', project_id]);
      },
      onError: (error: any) => setError(error.message),
    }
  );

  const handleSave = () => {
    try {
      setError(null);
      saveProjectUpdates(projectDetails);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl">
        <h1 className="text-3xl font-bold text-gray-900">Project Details</h1>
        {error && <div aria-live="polite" className="text-red-600 mt-2">{error}</div>}
        {isLoading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        ) : (
          <div className="mt-8 space-y-4">
            <input
              type="text"
              value={projectDetails.title}
              onChange={(e) => setProjectDetails((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Project Title"
              className="block w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <textarea
              value={projectDetails.description}
              onChange={(e) => setProjectDetails((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Project Description"
              className="block w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            ></textarea>
            <input
              type="text"
              value={projectDetails.project_url}
              onChange={(e) => setProjectDetails((prev) => ({ ...prev, project_url: e.target.value }))}
              placeholder="Project URL"
              className="block w-full px-4 py-2 border-2 border-gray-200 rounded-lg text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        )}
        <Link to="/portfolio/customize" className="text-blue-600 hover:text-blue-700 mt-6 block">Back to Portfolio</Link>
      </div>
    </>
  );
};

export default UV_ProjectDetail;