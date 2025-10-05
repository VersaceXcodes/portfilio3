import { z } from 'zod';

// Users entity schema
export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string().nullable(),
  created_at: z.coerce.date()
});

// Input schema for creating a user
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string().nullable().optional(),
  // Don't include user_id, created_at (auto-generated)
});

// Input schema for updating a user
export const updateUserInputSchema = z.object({
  user_id: z.string(),
  email: z.string().email().optional(),
  password_hash: z.string().optional(),
  name: z.string().nullable().optional(),
});

// Query/search schema for users
export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['email', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// User Profiles entity schema
export const userProfileSchema = z.object({
  user_id: z.string(),
  profile_picture_url: z.string().nullable(),
  cover_image_url: z.string().nullable(),
  bio: z.string().nullable(),
  contact_email: z.string().email().nullable(),
  phone_number: z.string().nullable(),
  social_media_links: z.record(z.string(), z.string()).nullable(),
});

// Input schema for creating user profiles
export const createUserProfileInputSchema = z.object({
  user_id: z.string(),
  profile_picture_url: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  social_media_links: z.record(z.string(), z.string()).nullable().optional(),
});

// Input schema for updating user profiles
export const updateUserProfileInputSchema = z.object({
  user_id: z.string(),
  profile_picture_url: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  social_media_links: z.record(z.string(), z.string()).nullable().optional(),
});

// Project Templates entity schema
export const projectTemplateSchema = z.object({
  template_id: z.string(),
  name: z.string(),
  layout: z.string(),
});

// Input schema for creating project templates
export const createProjectTemplateInputSchema = z.object({
  name: z.string(),
  layout: z.string(),
  // Don't include template_id (auto-generated)
});

// Input schema for updating project templates
export const updateProjectTemplateInputSchema = z.object({
  template_id: z.string(),
  name: z.string().optional(),
  layout: z.string().optional(),
});

// User Settings entity schema
export const userSettingsSchema = z.object({
  user_id: z.string(),
  color_scheme: z.record(z.string(), z.string()).nullable(),
  chosen_template: z.string().nullable(),
  font_selection: z.string().nullable(),
});

// Input schema for creating user settings
export const createUserSettingsInputSchema = z.object({
  user_id: z.string(),
  color_scheme: z.record(z.string(), z.string()).nullable().optional(),
  chosen_template: z.string().nullable().optional(),
  font_selection: z.string().nullable().optional(),
});

// Projects entity schema
export const projectSchema = z.object({
  project_id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  project_url: z.string().url().nullable(),
});

// Input schema for creating projects
export const createProjectInputSchema = z.object({
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  project_url: z.string().url().nullable().optional(),
});

// Skills entity schema
export const skillSchema = z.object({
  skill_id: z.string(),
  user_id: z.string(),
  skill_name: z.string(),
  proficiency_level: z.number().int().nullable(),
});

// Input schema for creating skills
export const createSkillInputSchema = z.object({
  user_id: z.string(),
  skill_name: z.string(),
  proficiency_level: z.number().int().optional(),
});

// Experience Timeline entity schema
export const experienceTimelineSchema = z.object({
  experience_id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
});

// Input schema for creating experience timeline
export const createExperienceTimelineInputSchema = z.object({
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
});

// Testimonials entity schema
export const testimonialSchema = z.object({
  testimonial_id: z.string(),
  user_id: z.string(),
  client_name: z.string(),
  feedback: z.string().nullable(),
});

// Input schema for creating testimonials
export const createTestimonialInputSchema = z.object({
  user_id: z.string(),
  client_name: z.string(),
  feedback: z.string().nullable().optional(),
});

// Blog Posts entity schema
export const blogPostSchema = z.object({
  post_id: z.string(),
  user_id: z.string(),
  title: z.string(),
  content: z.string().nullable(),
  created_at: z.coerce.date(),
});

// Input schema for creating blog posts
export const createBlogPostInputSchema = z.object({
  user_id: z.string(),
  title: z.string(),
  content: z.string().nullable().optional(),
});

// Comments entity schema
export const commentSchema = z.object({
  comment_id: z.string(),
  project_id: z.string(),
  user_name: z.string().nullable(),
  content: z.string(),
  created_at: z.coerce.date(),
});

// Input schema for creating comments
export const createCommentInputSchema = z.object({
  project_id: z.string(),
  user_name: z.string().nullable().optional(),
  content: z.string(),
});

// Visitor Messages entity schema
export const visitorMessageSchema = z.object({
  message_id: z.string(),
  user_id: z.string(),
  visitor_email: z.string().email().nullable(),
  visitor_message: z.string(),
  sent_at: z.coerce.date(),
});

// Input schema for creating visitor messages
export const createVisitorMessageInputSchema = z.object({
  user_id: z.string(),
  visitor_email: z.string().email().nullable().optional(),
  visitor_message: z.string(),
});

// Analytics entity schema
export const analyticsSchema = z.object({
  analytics_id: z.string(),
  user_id: z.string(),
  visit_count: z.number().int(),
  popular_projects: z.record(z.string(), z.array(z.string()).nullable()),
  interaction_data: z.record(z.string(), z.any()).nullable(),
});

// Input schema for creating analytics
export const createAnalyticsInputSchema = z.object({
  user_id: z.string(),
  visit_count: z.number().int(),
  popular_projects: z.record(z.string(), z.array(z.string()).nullable()).optional(),
  interaction_data: z.record(z.string(), z.any()).nullable().optional(),
});

// Inferred types
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

export type UserProfile = z.infer<typeof userProfileSchema>;
export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

export type ProjectTemplate = z.infer<typeof projectTemplateSchema>;
export type CreateProjectTemplateInput = z.infer<typeof createProjectTemplateInputSchema>;
export type UpdateProjectTemplateInput = z.infer<typeof updateProjectTemplateInputSchema>;

export type UserSettings = z.infer<typeof userSettingsSchema>;
export type CreateUserSettingsInput = z.infer<typeof createUserSettingsInputSchema>;

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;

export type Skill = z.infer<typeof skillSchema>;
export type CreateSkillInput = z.infer<typeof createSkillInputSchema>;

export type ExperienceTimeline = z.infer<typeof experienceTimelineSchema>;
export type CreateExperienceTimelineInput = z.infer<typeof createExperienceTimelineInputSchema>;

export type Testimonial = z.infer<typeof testimonialSchema>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialInputSchema>;

export type BlogPost = z.infer<typeof blogPostSchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

export type Comment = z.infer<typeof commentSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;

export type VisitorMessage = z.infer<typeof visitorMessageSchema>;
export type CreateVisitorMessageInput = z.infer<typeof createVisitorMessageInputSchema>;

export type Analytics = z.infer<typeof analyticsSchema>;
export type CreateAnalyticsInput = z.infer<typeof createAnalyticsInputSchema>;