# Backend Code Explanation

This document explains all the backend code in an easy-to-understand way.

## 📁 Project Structure Overview

The backend is a **Node.js/Express REST API** that handles:
- User authentication (sign up, sign in, sign out)
- Image uploads and management
- User profile management
- Session management with refresh tokens

---

## 🚀 Entry Point: `server.js`

**Location:** `src/server.js`

This is where the application starts. Think of it as the "main door" of your backend.

### What it does:
1. **Creates the Express app** - Sets up the web server
2. **Configures middleware** - Adds security, CORS, cookie parsing, etc.
3. **Connects to database** - Links to MongoDB
4. **Sets up routes** - Defines API endpoints (`/api/auth`, `/api/users`, `/api/images`)
5. **Starts the server** - Listens on a port (default: 5001)

### Key Middleware:
- **CORS** - Allows frontend to communicate with backend
- **Cookie Parser** - Reads cookies (for refresh tokens)
- **Rate Limiting** - Prevents too many requests (security)
- **Error Handler** - Catches and handles all errors gracefully

### Production Features:
- Serves static frontend files when in production mode
- Trusts proxy for secure cookies

---

## 🗄️ Database Configuration: `db.js`

**Location:** `src/configs/db.js`

### What it does:
- Connects to MongoDB database using the connection string from environment variables
- Handles connection errors and disconnections
- Gracefully closes connection when server shuts down

### Key Points:
- Uses Mongoose (MongoDB library for Node.js)
- Logs connection status
- Automatically reconnects if connection drops

---

## 🔐 Environment Variables: `env.js`

**Location:** `src/libs/env.js`

### What it does:
- Loads and validates all environment variables (from `.env` file)
- Ensures required variables are present before app starts
- Exports a clean `env` object for use throughout the app

### Required Variables:
- `MONGODB_URI` - Database connection string
- `ACCESS_TOKEN_SECRET` - Secret key for JWT tokens
- `CLIENT_URL` - Frontend URL (for CORS)
- `CLOUDINARY_*` - Cloudinary credentials for image storage

### Optional Variables:
- `PORT` - Server port (defaults to 5001)
- `NODE_ENV` - Environment mode (development/production)

---

## ☁️ Cloudinary Setup: `cloudinary.js`

**Location:** `src/libs/cloudinary.js`

### What it does:
- Configures Cloudinary (cloud image storage service)
- Used to upload and store user images
- Exports configured Cloudinary instance

### Why Cloudinary?
Instead of storing images on the server, images are uploaded to Cloudinary's cloud storage, which is:
- Faster
- More scalable
- Provides image optimization automatically

---

## 📊 Database Models

Models define the structure of data stored in MongoDB.

### 1. User Model (`models/User.js`)

**What it stores:**
- `username` - Unique username (lowercase, indexed)
- `email` - Unique email address
- `hashedPassword` - Encrypted password (never stored as plain text!)
- `displayName` - User's full name
- `avatarUrl` - Profile picture URL
- `avatarId` - Cloudinary ID for avatar
- `bio` - User biography (max 500 chars)
- `phone` - Optional phone number
- `timestamps` - Automatically adds `createdAt` and `updatedAt`

**Security Note:** Passwords are hashed using bcrypt before storage.

---

### 2. Image Model (`models/Image.js`)

**What it stores:**
- `publicId` - Unique Cloudinary ID for the image
- `imageTitle` - Title of the image
- `imageUrl` - Full URL to the image on Cloudinary
- `imageCategory` - Category (e.g., "nature", "portrait")
- `uploadedBy` - Reference to User who uploaded it
- `location` - Where photo was taken (optional)
- `cameraModel` - Camera used (optional)
- `timestamps` - When created/updated

**Indexes:** Added for fast searching by user, category, and creation date.

---

### 3. Session Model (`models/Session.js`)

**What it stores:**
- `userId` - Reference to User
- `refreshToken` - Long-lived token for refreshing access tokens
- `expiresAt` - When the session expires

**Auto-cleanup:** MongoDB automatically deletes expired sessions using TTL (Time To Live) index.

---

## 🎮 Controllers

Controllers contain the business logic - they handle what happens when API endpoints are called.

### 1. Auth Controller (`controllers/authController.js`)

Handles user authentication.

#### `signUp` - Create New User
1. Checks if username/email already exists
2. Hashes password with bcrypt
3. Creates user in database
4. Returns success message

#### `signIn` - Login User
1. Finds user by username
2. Verifies password
3. Creates JWT access token (short-lived, 30 minutes)
4. Creates refresh token (long-lived, 14 days)
5. Stores session in database
6. Sets refresh token as HTTP-only cookie
7. Returns access token and user info

#### `signOut` - Logout User
1. Deletes session from database
2. Clears refresh token cookie
3. Returns success message

#### `refreshToken` - Get New Access Token
1. Reads refresh token from cookie
2. Validates token exists and hasn't expired
3. Generates new access token
4. Returns new access token

**Security Features:**
- Passwords are never sent back to client
- Refresh tokens stored in HTTP-only cookies (can't be accessed by JavaScript)
- Access tokens expire quickly (30 min)

---

### 2. User Controller (`controllers/userController.js`)

#### `authMe` - Get Current User Info
- Returns the currently authenticated user's information
- User is attached to request by `authMiddleware`

---

### 3. Image Controller (`controllers/imageController.js`)

#### `getAllImages` - Get All Images (with pagination)
1. Accepts query parameters: `page`, `limit`, `search`, `category`
2. Builds search query (searches title and location)
3. Fetches images with pagination
4. Populates user info (who uploaded each image)
5. Returns images and pagination metadata

#### `uploadImage` - Upload New Image
1. Validates file is an image
2. Validates required fields (title, category)
3. Uploads image to Cloudinary (with optimization)
4. Saves image metadata to database
5. Returns created image
6. **Rollback:** If database save fails, deletes image from Cloudinary

#### `getImagesByUserId` - Get User's Images
1. Fetches all images uploaded by a specific user
2. Includes pagination
3. Returns images sorted by newest first

---

## 🛣️ Routes

Routes define the API endpoints and connect them to controllers.

### 1. Auth Routes (`routes/authRoute.js`)

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `POST /api/auth/refresh` - Refresh access token

**Protection:** Auth endpoints have strict rate limiting (5 attempts per 15 minutes) to prevent brute force attacks.

---

### 2. User Routes (`routes/userRoute.js`)

- `GET /api/users/me` - Get current user info

**Protection:** Requires authentication (protected route).

---

### 3. Image Routes (`routes/imageRoute.js`)

- `GET /api/images` - Get all images (public, with filters)
- `POST /api/images/upload` - Upload image (protected)
- `GET /api/images/user/:userId` - Get user's images (protected)

**Protection:** Upload and user-specific routes require authentication.

---

## 🛡️ Middlewares

Middlewares are functions that run before requests reach controllers. They handle common tasks.

### 1. Auth Middleware (`middlewares/authMiddleware.js`)

**Purpose:** Protects routes that require authentication.

**How it works:**
1. Extracts JWT token from `Authorization` header
2. Verifies token is valid and not expired
3. Finds user in database
4. Attaches user to `req.user`
5. Calls `next()` to continue to controller

**If token is invalid:** Returns 401/403 error.

---

### 2. Async Handler (`middlewares/asyncHandler.js`)

**Purpose:** Catches errors from async functions automatically.

**Why needed:** Without this, you'd need try-catch in every controller. This wrapper catches errors and passes them to error handler.

---

### 3. Error Handler (`middlewares/errorHandler.js`)

**Purpose:** Centralized error handling.

**Handles:**
- Validation errors (400)
- Duplicate key errors (409)
- JWT errors (401)
- File upload errors (400)
- Generic errors (500)

**Logs:** All errors are logged with context (URL, method, user, etc.)

---

### 4. Multer Middleware (`middlewares/multerMiddleware.js`)

**Purpose:** Handles file uploads.

**Configuration:**
- Stores files in memory (not disk)
- Max file size: 10MB
- Only allows image files (JPEG, PNG, GIF, WebP)

**Exports:** `singleUpload` - middleware for single file upload

---

### 5. Rate Limiter (`middlewares/rateLimiter.js`)

**Purpose:** Prevents abuse by limiting request frequency.

**Three limiters:**
1. **`apiLimiter`** - General API: 100 requests per 15 minutes
2. **`authLimiter`** - Auth endpoints: 5 requests per 15 minutes (stricter)
3. **`uploadLimiter`** - Upload endpoint: 10 uploads per hour

**Why:** Prevents brute force attacks, spam, and server overload.

---

### 6. Validation Middleware (`middlewares/validationMiddleware.js`)

**Purpose:** Validates request data before it reaches controllers.

**Validators:**
- `validateSignUp` - Validates username, email, password, names
- `validateSignIn` - Validates username and password
- `validateImageUpload` - Validates image metadata
- `validateGetImages` - Validates pagination and filter parameters
- `validateUserId` - Validates MongoDB ObjectId format

**How it works:**
1. Uses `express-validator` to define rules
2. Checks all rules
3. If validation fails, returns 400 with error messages
4. If validation passes, continues to controller

---

## 🛠️ Utilities

Helper functions used throughout the app.

### 1. Constants (`utils/constants.js`)

**Purpose:** Centralized configuration values.

**Defines:**
- `PAGINATION` - Default page, limit, max limit
- `FILE_UPLOAD` - Max file size, allowed MIME types
- `TOKEN` - Access token TTL (30 min), refresh token TTL (14 days)

**Why:** Makes it easy to change values in one place.

---

### 2. Logger (`utils/logger.js`)

**Purpose:** Simple logging utility.

**Methods:**
- `logger.info()` - General information
- `logger.error()` - Errors
- `logger.warn()` - Warnings
- `logger.debug()` - Debug info (development only)

**Note:** In production, you'd want to use a proper logging service (Winston, Pino, etc.)

---

### 3. Session Cleanup (`utils/sessionCleanup.js`)

**Purpose:** Periodically cleans up expired sessions.

**How it works:**
1. Runs immediately on server start
2. Then runs every hour
3. Deletes all sessions where `expiresAt` is in the past

**Why:** Backup mechanism in case MongoDB TTL index doesn't run.

---

### 4. Validators (`utils/validators.js`)

**Purpose:** Reusable validation functions.

**Functions:**
- `validateEmail()` - Checks email format
- `validatePassword()` - Checks password strength
- `validateUsername()` - Checks username format
- `validateRequired()` - Checks if value exists

**Note:** These are utility functions. Main validation uses `express-validator` in middleware.

---

## 🔄 Request Flow Example

Here's how a request flows through the system:

### Example: Uploading an Image

1. **Client sends:** `POST /api/images/upload` with image file and metadata
2. **Rate Limiter** - Checks if user hasn't exceeded upload limit
3. **Auth Middleware** - Verifies JWT token, attaches user to request
4. **Multer Middleware** - Processes file upload, stores in memory
5. **Validation Middleware** - Validates title, category, etc.
6. **Image Controller** - Uploads to Cloudinary, saves to database
7. **Response** - Returns created image data

### Example: Getting All Images

1. **Client sends:** `GET /api/images?page=1&limit=20&search=nature`
2. **Rate Limiter** - Checks general API limit
3. **Validation Middleware** - Validates query parameters
4. **Image Controller** - Queries database with filters and pagination
5. **Response** - Returns images array and pagination info

---

## 🔒 Security Features

1. **Password Hashing** - Bcrypt with salt rounds
2. **JWT Tokens** - Secure token-based authentication
3. **HTTP-Only Cookies** - Refresh tokens can't be accessed by JavaScript
4. **Rate Limiting** - Prevents brute force and abuse
5. **Input Validation** - All inputs are validated
6. **CORS** - Only allows requests from configured frontend URL
7. **Error Handling** - Doesn't leak sensitive information in errors

---

## 📦 Dependencies

Key packages used:

- **express** - Web framework
- **mongoose** - MongoDB ODM (Object Document Mapper)
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT token creation/verification
- **cloudinary** - Image storage service
- **multer** - File upload handling
- **express-validator** - Input validation
- **express-rate-limit** - Rate limiting
- **cors** - Cross-Origin Resource Sharing
- **cookie-parser** - Cookie handling
- **dotenv** - Environment variable management

---

## 🎯 Summary

This backend is a **well-structured REST API** that:
- Handles user authentication securely
- Manages image uploads to cloud storage
- Provides pagination and search functionality
- Includes security measures (rate limiting, validation, error handling)
- Uses modern best practices (async/await, middleware pattern, separation of concerns)

The code is organized into clear layers:
- **Models** - Data structure
- **Controllers** - Business logic
- **Routes** - API endpoints
- **Middlewares** - Request processing
- **Utils** - Helper functions

This makes the code easy to maintain and extend!

