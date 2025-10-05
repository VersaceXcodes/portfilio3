import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Pool } from 'pg';
import morgan from 'morgan';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

interface UserPayload extends JwtPayload {
  user_id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        email: string;
        name: string | null;
        created_at: Date;
      };
    }
  }
}

// Import Zod schemas
import {
  userSchema,
  createUserInputSchema,
  updateUserInputSchema,
  userProfileSchema,
  createUserProfileInputSchema,
  updateUserProfileInputSchema,
  createUserSettingsInputSchema,
  projectSchema,
  createProjectInputSchema,
  skillSchema,
  createSkillInputSchema,
  experienceTimelineSchema,
  createExperienceTimelineInputSchema,
  testimonialSchema,
  createTestimonialInputSchema,
  blogPostSchema,
  createBlogPostInputSchema,
  commentSchema,
  createCommentInputSchema,
  createVisitorMessageInputSchema,
  analyticsSchema
} from './schema.ts';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

// Database configuration
const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432, JWT_SECRET = 'your-secret-key' } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { rejectUnauthorized: false } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { rejectUnauthorized: false },
      }
);

const app = express();
const port = process.env.PORT || 3000;

// Ensure storage directory exists
const storageDir = path.join(__dirname, 'storage');
const uploadsDir = path.join(storageDir, 'uploads');
const profilesDir = path.join(uploadsDir, 'profiles');
const projectsDir = path.join(uploadsDir, 'projects');

[storageDir, uploadsDir, profilesDir, projectsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.params.type || 'general';
    let destDir = uploadsDir;
    
    if (uploadType === 'profile') {
      destDir = profilesDir;
    } else if (uploadType === 'project') {
      destDir = projectsDir;
    }
    
    cb(null, destDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "5mb" }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

/*
Authentication middleware for protected routes
Validates JWT token and retrieves user information from database
*/
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    const result = await pool.query('SELECT user_id, email, name, created_at FROM users WHERE user_id = $1', [decoded.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token', null, 'AUTH_TOKEN_INVALID'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
User registration endpoint
Creates new user account with email and password
Returns user object and JWT token for immediate login
*/
app.post('/api/auth/register', async (req, res) => {
  try {
    const validatedData = createUserInputSchema.parse(req.body);
    const { email, password_hash: password, name } = validatedData;

    // Check if user exists
    const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json(createErrorResponse('User with this email already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create user with generated ID and current timestamp
    const user_id = uuidv4();
    const created_at = new Date().toISOString();
    
    const result = await pool.query(
      'INSERT INTO users (user_id, email, password_hash, name, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, name, created_at',
      [user_id, email.toLowerCase().trim(), password, name || null, created_at]
    );

    const user = result.rows[0];

    // Create empty profile for the user
    await pool.query(
      'INSERT INTO user_profiles (user_id) VALUES ($1)',
      [user_id]
    );

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json({
      user,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
User login endpoint
Authenticates user credentials and returns JWT token
No password hashing used for development simplicity
*/
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(createErrorResponse('Email and password are required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Find user with direct password comparison
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Direct password comparison for development
    if (password !== user.password_hash) {
      return res.status(400).json(createErrorResponse('Invalid email or password', null, 'INVALID_CREDENTIALS'));
    }

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Password reset endpoint
@@need:external-api : Email service to send password reset links to users
Currently returns mock response acknowledging reset request
*/
app.post('/api/auth/password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createErrorResponse('Email is required', null, 'MISSING_REQUIRED_FIELDS'));
    }

    // Check if user exists
    const result = await pool.query('SELECT user_id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      // For security, don't reveal if email exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Mock email sending - in real implementation, would send email with reset token
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get user profile endpoint
Retrieves complete user profile information including personal details and settings
*/
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Get user profile data
    const result = await pool.query(`
      SELECT 
        up.user_id,
        up.profile_picture_url,
        up.cover_image_url,
        up.bio,
        up.contact_email,
        up.phone_number,
        up.social_media_links,
        u.name,
        u.email,
        u.created_at
      FROM user_profiles up
      JOIN users u ON up.user_id = u.user_id
      WHERE up.user_id = $1
    `, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const profile = result.rows[0];
    
    res.json({
      user_id: profile.user_id,
      profile_picture_url: profile.profile_picture_url,
      cover_image_url: profile.cover_image_url,
      bio: profile.bio,
      contact_email: profile.contact_email,
      phone_number: profile.phone_number,
      social_media_links: profile.social_media_links
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update user profile endpoint
Updates user profile information with validation
Handles profile customization including images and contact details
*/
app.patch('/api/users/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Check if user is updating their own profile
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s profile', null, 'FORBIDDEN'));
    }

    const validatedData = updateUserProfileInputSchema.parse({
      user_id,
      ...req.body
    });

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (key !== 'user_id' && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json(createErrorResponse('No fields to update', null, 'NO_UPDATE_FIELDS'));
    }

    values.push(user_id);
    const query = `UPDATE user_profiles SET ${updateFields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User profile not found', null, 'PROFILE_NOT_FOUND'));
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update user settings endpoint
Manages user customization preferences including themes, colors, and fonts
*/
app.patch('/api/users/:user_id/settings', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s settings', null, 'FORBIDDEN'));
    }

    const validatedData = createUserSettingsInputSchema.parse({
      user_id,
      ...req.body
    });

    // Upsert user settings
    const result = await pool.query(`
      INSERT INTO user_settings (user_id, color_scheme, chosen_template, font_selection)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id)
      DO UPDATE SET
        color_scheme = EXCLUDED.color_scheme,
        chosen_template = EXCLUDED.chosen_template,
        font_selection = EXCLUDED.font_selection
      RETURNING *
    `, [
      validatedData.user_id,
      validatedData.color_scheme ? JSON.stringify(validatedData.color_scheme) : null,
      validatedData.chosen_template,
      validatedData.font_selection
    ]);

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update user settings error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get user projects endpoint
Retrieves all projects for a specific user
Returns array of project objects with complete project information
*/
app.get('/api/users/:user_id/projects', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(`
      SELECT 
        project_id,
        user_id,
        title,
        description,
        images,
        project_url
      FROM projects 
      WHERE user_id = $1 
      ORDER BY title
    `, [user_id]);

    const projects = result.rows.map(project => ({
      ...project,
      images: project.images ? JSON.parse(project.images).images || [] : []
    }));

    res.json(projects);
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Create project endpoint
Creates new project for authenticated user
Handles project details including title, description, images, and external links
*/
app.post('/api/users/:user_id/projects', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot create project for another user', null, 'FORBIDDEN'));
    }

    const validatedData = createProjectInputSchema.parse({
      user_id,
      ...req.body
    });

    const project_id = uuidv4();
    const imagesJson = validatedData.images ? JSON.stringify({ images: validatedData.images }) : null;

    const result = await pool.query(`
      INSERT INTO projects (project_id, user_id, title, description, images, project_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING project_id, user_id, title, description, images, project_url
    `, [
      project_id,
      validatedData.user_id,
      validatedData.title,
      validatedData.description,
      imagesJson,
      validatedData.project_url
    ]);

    const project = result.rows[0];
    project.images = project.images ? JSON.parse(project.images).images || [] : [];

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get specific project endpoint
Retrieves detailed information for a single project by ID
*/
app.get('/api/projects/:project_id', async (req, res) => {
  try {
    const { project_id } = req.params;

    const result = await pool.query(`
      SELECT 
        project_id,
        user_id,
        title,
        description,
        images,
        project_url
      FROM projects 
      WHERE project_id = $1
    `, [project_id]);

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }

    const project = result.rows[0];
    project.images = project.images ? JSON.parse(project.images).images || [] : [];

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update project endpoint
Updates existing project with new information
Requires user to be the project owner
*/
app.patch('/api/projects/:project_id', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    // Check if user owns this project
    const ownerCheck = await pool.query('SELECT user_id FROM projects WHERE project_id = $1', [project_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s project', null, 'FORBIDDEN'));
    }

    const validatedData = createProjectInputSchema.parse(req.body);

    const imagesJson = validatedData.images ? JSON.stringify({ images: validatedData.images }) : null;

    const result = await pool.query(`
      UPDATE projects 
      SET title = $1, description = $2, images = $3, project_url = $4
      WHERE project_id = $5
      RETURNING project_id, user_id, title, description, images, project_url
    `, [
      validatedData.title,
      validatedData.description,
      imagesJson,
      validatedData.project_url,
      project_id
    ]);

    const project = result.rows[0];
    project.images = project.images ? JSON.parse(project.images).images || [] : [];

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Delete project endpoint
Removes project from user's portfolio
Only project owner can delete their projects
*/
app.delete('/api/projects/:project_id', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.params;

    // Check if user owns this project
    const ownerCheck = await pool.query('SELECT user_id FROM projects WHERE project_id = $1', [project_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s project', null, 'FORBIDDEN'));
    }

    // Delete associated comments first
    await pool.query('DELETE FROM comments WHERE project_id = $1', [project_id]);
    
    // Delete the project
    await pool.query('DELETE FROM projects WHERE project_id = $1', [project_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get user skills endpoint
Retrieves all skills for a user with proficiency levels
*/
app.get('/api/users/:user_id/skills', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(`
      SELECT skill_id, user_id, skill_name, proficiency_level
      FROM skills 
      WHERE user_id = $1 
      ORDER BY skill_name
    `, [user_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Create skill endpoint
Adds new skill to user's portfolio with proficiency level
*/
app.post('/api/users/:user_id/skills', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot create skill for another user', null, 'FORBIDDEN'));
    }

    const validatedData = createSkillInputSchema.parse({
      user_id,
      ...req.body
    });

    const skill_id = uuidv4();

    const result = await pool.query(`
      INSERT INTO skills (skill_id, user_id, skill_name, proficiency_level)
      VALUES ($1, $2, $3, $4)
      RETURNING skill_id, user_id, skill_name, proficiency_level
    `, [
      skill_id,
      validatedData.user_id,
      validatedData.skill_name,
      validatedData.proficiency_level
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update skill endpoint
Modifies existing skill information including name and proficiency level
*/
app.patch('/api/skills/:skill_id', authenticateToken, async (req, res) => {
  try {
    const { skill_id } = req.params;

    // Check if user owns this skill
    const ownerCheck = await pool.query('SELECT user_id FROM skills WHERE skill_id = $1', [skill_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Skill not found', null, 'SKILL_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s skill', null, 'FORBIDDEN'));
    }

    const validatedData = createSkillInputSchema.parse(req.body);

    const result = await pool.query(`
      UPDATE skills 
      SET skill_name = $1, proficiency_level = $2
      WHERE skill_id = $3
      RETURNING skill_id, user_id, skill_name, proficiency_level
    `, [
      validatedData.skill_name,
      validatedData.proficiency_level,
      skill_id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Delete skill endpoint
Removes skill from user's portfolio
*/
app.delete('/api/skills/:skill_id', authenticateToken, async (req, res) => {
  try {
    const { skill_id } = req.params;

    // Check if user owns this skill
    const ownerCheck = await pool.query('SELECT user_id FROM skills WHERE skill_id = $1', [skill_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Skill not found', null, 'SKILL_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s skill', null, 'FORBIDDEN'));
    }

    await pool.query('DELETE FROM skills WHERE skill_id = $1', [skill_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get user experience endpoint
Retrieves employment and education timeline for user
*/
app.get('/api/users/:user_id/experience', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(`
      SELECT experience_id, user_id, title, description, start_date, end_date
      FROM experience_timeline 
      WHERE user_id = $1 
      ORDER BY start_date DESC
    `, [user_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get user experience error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Create experience endpoint
Adds new experience entry to user's timeline
*/
app.post('/api/users/:user_id/experience', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot create experience for another user', null, 'FORBIDDEN'));
    }

    const validatedData = createExperienceTimelineInputSchema.parse({
      user_id,
      ...req.body
    });

    const experience_id = uuidv4();

    const result = await pool.query(`
      INSERT INTO experience_timeline (experience_id, user_id, title, description, start_date, end_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING experience_id, user_id, title, description, start_date, end_date
    `, [
      experience_id,
      validatedData.user_id,
      validatedData.title,
      validatedData.description,
      validatedData.start_date.toISOString(),
      validatedData.end_date ? validatedData.end_date.toISOString() : null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create experience error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update experience endpoint
Modifies existing experience timeline entry
*/
app.patch('/api/experience/:experience_id', authenticateToken, async (req, res) => {
  try {
    const { experience_id } = req.params;

    // Check if user owns this experience
    const ownerCheck = await pool.query('SELECT user_id FROM experience_timeline WHERE experience_id = $1', [experience_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Experience not found', null, 'EXPERIENCE_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s experience', null, 'FORBIDDEN'));
    }

    const validatedData = createExperienceTimelineInputSchema.parse(req.body);

    const result = await pool.query(`
      UPDATE experience_timeline 
      SET title = $1, description = $2, start_date = $3, end_date = $4
      WHERE experience_id = $5
      RETURNING experience_id, user_id, title, description, start_date, end_date
    `, [
      validatedData.title,
      validatedData.description,
      validatedData.start_date.toISOString(),
      validatedData.end_date ? validatedData.end_date.toISOString() : null,
      experience_id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Delete experience endpoint
Removes experience entry from user's timeline
*/
app.delete('/api/experience/:experience_id', authenticateToken, async (req, res) => {
  try {
    const { experience_id } = req.params;

    // Check if user owns this experience
    const ownerCheck = await pool.query('SELECT user_id FROM experience_timeline WHERE experience_id = $1', [experience_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Experience not found', null, 'EXPERIENCE_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s experience', null, 'FORBIDDEN'));
    }

    await pool.query('DELETE FROM experience_timeline WHERE experience_id = $1', [experience_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get user testimonials endpoint
Retrieves all client testimonials and feedback for user
*/
app.get('/api/users/:user_id/testimonials', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(`
      SELECT testimonial_id, user_id, client_name, feedback
      FROM testimonials 
      WHERE user_id = $1 
      ORDER BY client_name
    `, [user_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get user testimonials error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Create testimonial endpoint
Adds new client testimonial to user's portfolio
*/
app.post('/api/users/:user_id/testimonials', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot create testimonial for another user', null, 'FORBIDDEN'));
    }

    const validatedData = createTestimonialInputSchema.parse({
      user_id,
      ...req.body
    });

    const testimonial_id = uuidv4();

    const result = await pool.query(`
      INSERT INTO testimonials (testimonial_id, user_id, client_name, feedback)
      VALUES ($1, $2, $3, $4)
      RETURNING testimonial_id, user_id, client_name, feedback
    `, [
      testimonial_id,
      validatedData.user_id,
      validatedData.client_name,
      validatedData.feedback
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update testimonial endpoint
Modifies existing client testimonial
*/
app.patch('/api/testimonials/:testimonial_id', authenticateToken, async (req, res) => {
  try {
    const { testimonial_id } = req.params;

    // Check if user owns this testimonial
    const ownerCheck = await pool.query('SELECT user_id FROM testimonials WHERE testimonial_id = $1', [testimonial_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Testimonial not found', null, 'TESTIMONIAL_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s testimonial', null, 'FORBIDDEN'));
    }

    const validatedData = createTestimonialInputSchema.parse(req.body);

    const result = await pool.query(`
      UPDATE testimonials 
      SET client_name = $1, feedback = $2
      WHERE testimonial_id = $3
      RETURNING testimonial_id, user_id, client_name, feedback
    `, [
      validatedData.client_name,
      validatedData.feedback,
      testimonial_id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Delete testimonial endpoint
Removes testimonial from user's portfolio
*/
app.delete('/api/testimonials/:testimonial_id', authenticateToken, async (req, res) => {
  try {
    const { testimonial_id } = req.params;

    // Check if user owns this testimonial
    const ownerCheck = await pool.query('SELECT user_id FROM testimonials WHERE testimonial_id = $1', [testimonial_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Testimonial not found', null, 'TESTIMONIAL_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s testimonial', null, 'FORBIDDEN'));
    }

    await pool.query('DELETE FROM testimonials WHERE testimonial_id = $1', [testimonial_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get user blog posts endpoint
Retrieves all blog posts and updates for user
*/
app.get('/api/users/:user_id/blog-posts', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(`
      SELECT post_id, user_id, title, content, created_at
      FROM blog_posts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [user_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get user blog posts error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Create blog post endpoint
Creates new blog post for user's portfolio
*/
app.post('/api/users/:user_id/blog-posts', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot create blog post for another user', null, 'FORBIDDEN'));
    }

    const validatedData = createBlogPostInputSchema.parse({
      user_id,
      ...req.body
    });

    const post_id = uuidv4();
    const created_at = new Date().toISOString();

    const result = await pool.query(`
      INSERT INTO blog_posts (post_id, user_id, title, content, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING post_id, user_id, title, content, created_at
    `, [
      post_id,
      validatedData.user_id,
      validatedData.title,
      validatedData.content,
      created_at
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Update blog post endpoint
Modifies existing blog post content
*/
app.patch('/api/blog-posts/:post_id', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;

    // Check if user owns this blog post
    const ownerCheck = await pool.query('SELECT user_id FROM blog_posts WHERE post_id = $1', [post_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Blog post not found', null, 'POST_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot update another user\'s blog post', null, 'FORBIDDEN'));
    }

    const validatedData = createBlogPostInputSchema.parse(req.body);

    const result = await pool.query(`
      UPDATE blog_posts 
      SET title = $1, content = $2
      WHERE post_id = $3
      RETURNING post_id, user_id, title, content, created_at
    `, [
      validatedData.title,
      validatedData.content,
      post_id
    ]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Delete blog post endpoint
Removes blog post from user's portfolio
*/
app.delete('/api/blog-posts/:post_id', authenticateToken, async (req, res) => {
  try {
    const { post_id } = req.params;

    // Check if user owns this blog post
    const ownerCheck = await pool.query('SELECT user_id FROM blog_posts WHERE post_id = $1', [post_id]);
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Blog post not found', null, 'POST_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].user_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('Cannot delete another user\'s blog post', null, 'FORBIDDEN'));
    }

    await pool.query('DELETE FROM blog_posts WHERE post_id = $1', [post_id]);

    res.status(204).send();
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get project comments endpoint
Retrieves all comments for a specific project
*/
app.get('/api/projects/:project_id/comments', async (req, res) => {
  try {
    const { project_id } = req.params;

    const result = await pool.query(`
      SELECT comment_id, project_id, user_name, content, created_at
      FROM comments 
      WHERE project_id = $1 
      ORDER BY created_at DESC
    `, [project_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get project comments error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Add comment endpoint
Allows visitors to leave comments on projects
No authentication required for visitor engagement
*/
app.post('/api/projects/:project_id/comments', async (req, res) => {
  try {
    const { project_id } = req.params;

    // Verify project exists
    const projectCheck = await pool.query('SELECT project_id FROM projects WHERE project_id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Project not found', null, 'PROJECT_NOT_FOUND'));
    }

    const validatedData = createCommentInputSchema.parse({
      project_id,
      ...req.body
    });

    const comment_id = uuidv4();
    const created_at = new Date().toISOString();

    const result = await pool.query(`
      INSERT INTO comments (comment_id, project_id, user_name, content, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING comment_id, project_id, user_name, content, created_at
    `, [
      comment_id,
      validatedData.project_id,
      validatedData.user_name,
      validatedData.content,
      created_at
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
Get analytics endpoint
Retrieves analytics data for user's portfolio performance
Tracks visits, popular projects, and interaction metrics
*/
app.get('/api/analytics/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (req.user.user_id !== user_id) {
      return res.status(403).json(createErrorResponse('Cannot view another user\'s analytics', null, 'FORBIDDEN'));
    }

    // Get or create analytics record
    let result = await pool.query(`
      SELECT analytics_id, user_id, visit_count, popular_projects, interaction_data
      FROM analytics 
      WHERE user_id = $1
    `, [user_id]);

    if (result.rows.length === 0) {
      // Create initial analytics record
      const analytics_id = uuidv4();
      const initialData = {
        visit_count: 0,
        popular_projects: { popular: [] },
        interaction_data: { views: 0, comments: 0, contacts: 0 }
      };

      await pool.query(`
        INSERT INTO analytics (analytics_id, user_id, visit_count, popular_projects, interaction_data)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        analytics_id,
        user_id,
        initialData.visit_count,
        JSON.stringify(initialData.popular_projects),
        JSON.stringify(initialData.interaction_data)
      ]);

      result = await pool.query(`
        SELECT analytics_id, user_id, visit_count, popular_projects, interaction_data
        FROM analytics 
        WHERE user_id = $1
      `, [user_id]);
    }

    const analytics = result.rows[0];
    analytics.popular_projects = analytics.popular_projects ? JSON.parse(analytics.popular_projects) : { popular: [] };
    analytics.interaction_data = analytics.interaction_data ? JSON.parse(analytics.interaction_data) : { views: 0, comments: 0, contacts: 0 };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

/*
File upload endpoint
Handles image uploads for profiles and projects
Stores files locally and returns accessible URLs
*/
app.post('/api/upload/:type', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(createErrorResponse('No file uploaded', null, 'NO_FILE_UPLOADED'));
    }

    const fileUrl = `/uploads/${req.params.type}/${req.file.filename}`;
    
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json(createErrorResponse('File upload failed', error, 'UPLOAD_FAILED'));
  }
});

/*
Contact form endpoint
Handles visitor messages sent through portfolio contact forms
Stores messages for portfolio owners to review
*/
app.post('/api/contact/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Verify user exists
    const userCheck = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const validatedData = createVisitorMessageInputSchema.parse({
      user_id,
      ...req.body
    });

    const message_id = uuidv4();
    const sent_at = new Date().toISOString();

    const result = await pool.query(`
      INSERT INTO visitor_messages (message_id, user_id, visitor_email, visitor_message, sent_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING message_id, user_id, visitor_email, visitor_message, sent_at
    `, [
      message_id,
      validatedData.user_id,
      validatedData.visitor_email,
      validatedData.visitor_message,
      sent_at
    ]);

    // Update analytics - increment contact interactions
    await pool.query(`
      UPDATE analytics 
      SET interaction_data = COALESCE(interaction_data::jsonb, '{}'::jsonb) || '{"contacts": ' || 
        (COALESCE((interaction_data::jsonb->>'contacts')::int, 0) + 1) || '}'
      WHERE user_id = $1
    `, [user_id]);

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json(createErrorResponse('Internal server error', error, 'INTERNAL_SERVER_ERROR'));
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA catch-all: serve index.html for non-API routes only
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export { app, pool };

// Start the server
app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port} and listening on 0.0.0.0`);
});