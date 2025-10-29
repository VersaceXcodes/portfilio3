import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { z } from 'zod';
import { blogPostSchema } from '@/DB:zodschemas:ts';
import { Link } from 'react-router-dom';

// Define TypeScript types for blog post
interface BlogPost {
  post_id: string;
  title: string;
  content: string;
}

// Endpoint URL construction
const API_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

const UV_BlogUpdates: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Zustand store access - individual selectors
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');

  // Fetch blog posts using react-query
  const { data: blogPosts, isLoading, isError } = useQuery<BlogPost[], Error>(
    ['blog-posts', currentUser?.id],
    async () => {
      const response = await axios.get(`${API_URL}/users/${currentUser?.id}/blog-posts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return z.array(blogPostSchema).parse(response.data);
    }
  );

  // Mutation to handle blog post creation/updating
  const mutation = useMutation(
    async (blogPost: BlogPost) => {
      const response = await axios.post(
        `${API_URL}/users/${currentUser?.id}/blog-posts`,
        blogPost,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      return z.object(blogPostSchema).parse(response.data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['blog-posts', currentUser?.id]);
        setNewBlogTitle('');
        setNewBlogContent('');
      },
    }
  );

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ post_id: '', title: newBlogTitle, content: newBlogContent });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Blog and Updates</h1>

        <form
          className="bg-white p-6 rounded-lg shadow-lg mb-8 space-y-4"
          onSubmit={handleCreateOrUpdate}
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Blog Title
            </label>
            <input
              id="title"
              type="text"
              value={newBlogTitle}
              onChange={(e) => setNewBlogTitle(e.target.value)}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              value={newBlogContent}
              onChange={(e) => setNewBlogContent(e.target.value)}
              rows={4}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {mutation.isLoading ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </form>

        {isLoading ? (
          <div>Loading...</div>
        ) : isError ? (
          <div>Error loading blog posts.</div>
        ) : (
          <div className="space-y-4">
            {blogPosts?.map((post) => (
              <div key={post.post_id} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold">{post.title}</h2>
                <p className="text-gray-700">{post.content}</p>
              </div>
            ))}
          </div>
        )}

        <Link to="/portfolio/customize" className="text-blue-600 hover:text-blue-800 block mt-6">
          Back to Portfolio Customization
        </Link>
      </div>
    </>
  );
};

export default UV_BlogUpdates;