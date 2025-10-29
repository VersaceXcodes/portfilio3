import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface VisitorMessage {
  visitor_message: string;
}

const UV_PortfolioViewer: React.FC = () => {
  const [contactFormMessage, setContactFormMessage] = useState('');
  const visitorFeedbackEnabled = true; // Based on the default state
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Fetch user portfolio details
  const { data: portfolioDetails, error: fetchError } = useQuery(['userPortfolio', currentUser?.id], async () => {
    if (!currentUser?.id) return null;
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser.id}`
    );
    return response.data;
  });

  // Send contact message mutation
  const sendContactMessage = useMutation(async (message: VisitorMessage) => {
    if (!currentUser?.id) throw new Error('User ID is missing');
    return axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${currentUser.id}/messages`, message);
  }, {
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
    onSuccess: () => {
      setContactFormMessage('');
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactFormMessage.trim()) return;
    
    sendContactMessage.mutate({ visitor_message: contactFormMessage });
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-8 space-y-6">
          <header className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Portfolio Overview</h1>
            {fetchError && <p className="text-red-600">Error loading portfolio.</p>}
          </header>

          {portfolioDetails && (
            <section className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold text-gray-800">Projects</h2>
                {/* Render projects */}
                {portfolioDetails.projects.map((project: any) => (
                  <div key={project.project_id} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="text-xl font-bold">{project.title}</h3>
                    <p className="text-gray-700">{project.description}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Skills</h2>
                {/* Render skills */}
                <ul className="flex flex-wrap space-x-2">
                  {portfolioDetails.skills.map((skill: any) => (
                    <li key={skill.skill_id} className="text-sm bg-gray-200 p-1 rounded">
                      {skill.skill_name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Testimonials</h2>
                {/* Render testimonials */}
                {portfolioDetails.testimonials.map((testimonial: any) => (
                  <blockquote key={testimonial.testimonial_id} className="border-l-4 border-blue-500 pl-4">
                    <p className="text-gray-700">{testimonial.feedback}</p>
                    <cite className="text-sm text-gray-500">- {testimonial.client_name}</cite>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          {visitorFeedbackEnabled && (
            <section id="feedback-section" className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">Visitor Feedback</h2>
              <p className="text-gray-700">We value your thoughts! Feel free to provide feedback below:</p>
            </section>
          )}

          <section id="contact-form" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Contact Form</h2>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <textarea
                value={contactFormMessage}
                onChange={(e) => setContactFormMessage(e.target.value)}
                placeholder="Your message..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg"
                required
              ></textarea>
              <button
                type="submit"
                disabled={sendContactMessage.isLoading}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              >
                {sendContactMessage.isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};

export default UV_PortfolioViewer;