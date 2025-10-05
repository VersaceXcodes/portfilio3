import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Project {
  project_id: string;
  title: string;
  description: string;
  images: Array<string>;
  project_url: string;
}

const fetchUserProjects = async (userId: string, authToken: string) => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${userId}/projects`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  return response.data as Project[];
};

const UV_PortfolioCustomization: React.FC = () => {
  // Global auth state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  // Local state
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Queries
  const { data: projects, refetch } = useQuery({
    queryKey: ['projects', currentUser?.id],
    queryFn: () => fetchUserProjects(currentUser!.id, authToken!),
    enabled: Boolean(currentUser && authToken),
  });

  // Mutation
  const projectMutation = useMutation({
    mutationFn: (project: Project) => axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser!.id}/projects`,
      project,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    ),
    onSuccess: () => {
      console.log("Project saved successfully!");
      refetch();
      setCurrentProject(null);
    },
    onError: (error) => console.error("Error saving project:", error)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;
    projectMutation.mutate(currentProject);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Portfolio Customization</h1>

          <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Manage Projects</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                type="text"
                value={currentProject?.title || ''}
                onChange={(e) => setCurrentProject({...currentProject!, title: e.target.value})}
                placeholder="Project Title"
              />
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={currentProject?.description || ''}
                onChange={(e) => setCurrentProject({...currentProject!, description: e.target.value})}
                placeholder="Project Description"
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                type="submit"
                disabled={projectMutation.isPending}
              >
                {projectMutation.isPending ? 'Saving...' : 'Save Project'}
              </button>
            </form>
            {projects?.map((project) => (
              <div key={project.project_id} className="border rounded-lg p-4">
                <h3 className="text-xl font-semibold">{project.title}</h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
            ))}
          </div>

          <Link to="/portfolio/blog" className="text-blue-600 hover:underline">Go to Blog Updates</Link>
          <Link to="/portfolio/analytics" className="text-blue-600 hover:underline">Go to Analytics Dashboard</Link>
        </div>
      </div>
    </>
  );
};

export default UV_PortfolioCustomization;