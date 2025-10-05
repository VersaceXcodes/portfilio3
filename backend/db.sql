-- Creating the users table
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT NOT NULL
);

-- Seeding users table with example data
INSERT INTO users (user_id, email, password_hash, name, created_at) VALUES
('user1', 'john.doe@example.com', 'password123', 'John Doe', '2023-10-05'),
('user2', 'jane.smith@example.com', 'admin123', 'Jane Smith', '2023-10-05');

-- Creating the user_profiles table
CREATE TABLE user_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(user_id),
    profile_picture_url TEXT,
    cover_image_url TEXT,
    bio TEXT,
    contact_email TEXT,
    phone_number TEXT,
    social_media_links JSON
);

-- Seeding user_profiles table with example data
INSERT INTO user_profiles (user_id, profile_picture_url, cover_image_url, bio, contact_email, phone_number, social_media_links) VALUES
('user1', 'https://picsum.photos/seed/user1/200', 'https://picsum.photos/seed/user1cover/800/300', 'This is John Doe\'s bio.', 'john.contact@example.com', '1234567890', '{"twitter": "https://twitter.com/johndoe"}'),
('user2', 'https://picsum.photos/seed/user2/200', 'https://picsum.photos/seed/user2cover/800/300', 'This is Jane Smith\'s bio.', 'jane.contact@example.com', '0987654321', '{"twitter": "https://twitter.com/janesmith"}');

-- Creating the project_templates table
CREATE TABLE project_templates (
    template_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    layout TEXT NOT NULL
);

-- Seeding project_templates table with example data
INSERT INTO project_templates (template_id, name, layout) VALUES
('template1', 'Portfolio Template', '<layout_data>'),
('template2', 'Blog Template', '<layout_data>');

-- Creating the user_settings table
CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY REFERENCES users(user_id),
    color_scheme JSON,
    chosen_template TEXT REFERENCES project_templates(template_id),
    font_selection TEXT
);

-- Seeding user_settings table with example data
INSERT INTO user_settings (user_id, color_scheme, chosen_template, font_selection) VALUES
('user1', '{"background": "dark"}', 'template1', 'Arial'),
('user2', '{"background": "light"}', 'template2', 'Helvetica');

-- Creating the projects table
CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    title TEXT NOT NULL,
    description TEXT,
    images JSON,
    project_url TEXT
);

-- Seeding projects table with example data
INSERT INTO projects (project_id, user_id, title, description, images, project_url) VALUES
('project1', 'user1', 'Amazing Project', 'This is a description of an amazing project.', '{"images": ["https://picsum.photos/seed/project1/200"]}', 'https://example.com/amazing-project'),
('project2', 'user2', 'Fantastic Creation', 'This is a description of a fantastic creation.', '{"images": ["https://picsum.photos/seed/project2/200"]}', 'https://example.com/fantastic-creation');

-- Creating the skills table
CREATE TABLE skills (
    skill_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    skill_name TEXT NOT NULL,
    proficiency_level INTEGER
);

-- Seeding skills table with example data
INSERT INTO skills (skill_id, user_id, skill_name, proficiency_level) VALUES
('skill1', 'user1', 'Python', 8),
('skill2', 'user1', 'JavaScript', 7);

-- Creating the experience_timeline table
CREATE TABLE experience_timeline (
    experience_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT
);

-- Seeding experience_timeline table with example data
INSERT INTO experience_timeline (experience_id, user_id, title, description, start_date, end_date) VALUES
('exp1', 'user1', 'Software Engineer', 'Worked on developing software solutions.', '2020-01-01', '2022-12-31'),
('exp2', 'user2', 'Web Developer', 'Created and maintained websites.', '2019-05-01', '2021-08-31');

-- Creating the testimonials table
CREATE TABLE testimonials (
    testimonial_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    client_name TEXT NOT NULL,
    feedback TEXT
);

-- Seeding testimonials table with example data
INSERT INTO testimonials (testimonial_id, user_id, client_name, feedback) VALUES
('test1', 'user1', 'Acme Corp', 'John did a fantastic job on our project!'),
('test2', 'user2', 'Coding Inc', 'Jane is a great developer and very professional.');

-- Creating the blog_posts table
CREATE TABLE blog_posts (
    post_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT NOT NULL
);

-- Seeding blog_posts table with example data
INSERT INTO blog_posts (post_id, user_id, title, content, created_at) VALUES
('post1', 'user1', 'How to Code', 'This blog post explains the basics of coding.', '2023-10-05'),
('post2', 'user2', 'A Guide to Web Development', 'This post covers essential tips for web development.', '2023-10-05');

-- Creating the comments table
CREATE TABLE comments (
    comment_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Seeding comments table with example data
INSERT INTO comments (comment_id, project_id, user_name, content, created_at) VALUES
('comment1', 'project1', 'Alice', 'Great project!', '2023-10-05'),
('comment2', 'project2', 'Bob', 'Really impressive work.', '2023-10-05');

-- Creating the visitor_messages table
CREATE TABLE visitor_messages (
    message_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    visitor_email TEXT,
    visitor_message TEXT NOT NULL,
    sent_at TEXT NOT NULL
);

-- Seeding visitor_messages table with example data
INSERT INTO visitor_messages (message_id, user_id, visitor_email, visitor_message, sent_at) VALUES
('message1', 'user1', 'alice@example.com', 'Inquiring about your services.', '2023-10-05'),
('message2', 'user2', 'bob@example.com', 'Interested in collaborating with you.', '2023-10-05');

-- Creating the analytics table
CREATE TABLE analytics (
    analytics_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    visit_count INTEGER NOT NULL,
    popular_projects JSON,
    interaction_data JSON
);

-- Seeding analytics table with example data
INSERT INTO analytics (analytics_id, user_id, visit_count, popular_projects, interaction_data) VALUES
('analytics1', 'user1', 100, '{"popular": ["project1"]}', '{"clicks": 50, "likes": 30}'),
('analytics2', 'user2', 200, '{"popular": ["project2"]}', '{"clicks": 70, "shares": 20}');