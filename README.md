# Image Resizer

## Live Demo

The application is deployed and available online:

**https://imageresizer-production.up.railway.app**

No local installation is required for evaluation. The application can be tested directly through the live deployment.

---

## Project Overview

Image Resizer is a full-stack web application that allows users to:

- Create an account
- Log in securely
- Upload an image or provide an image URL
- Resize images using two different resizing strategies
- Compare the results side by side
- Manage credits
- Delete their account

The project was built using Next.js, MongoDB Atlas, Mongoose, Railway, and Sharp.

---

## Features

### User Management

- User registration
- User login
- Session-based authentication using iron-session
- Persistent login sessions
- Account deletion

### Image Processing

- Upload local image files
- Resize images from image URLs
- Support for custom dimensions
- Support for aspect-ratio-based resizing
- Background color selection for letterboxing
- Side-by-side comparison of resize strategies

### Credit System

- Users start with credits
- Each resize operation consumes one credit
- Credits are updated atomically in MongoDB
- Low-credit warnings are displayed in the UI

### User Interface

- User avatar based on the first letter of the user's name
- Dropdown menu with user name, logout, and delete account
- Responsive and simple interface

---

## Technologies Used

### Frontend
- Next.js 14
- React
- TypeScript

### Backend
- Next.js API Routes
- Node.js

### Database
- MongoDB Atlas
- Mongoose

### Authentication
- iron-session

### Image Processing
- Sharp

### Deployment
- Railway

---

## Running Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd Image_Resizer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env.local` file

```env
MONGODB_URI=<your_mongodb_connection_string>
SESSION_SECRET=<your_session_secret>
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the application

```text
http://localhost:3000
```

---

## Resize Strategy Tradeoff

### Cover

The image is resized so that it completely fills the target dimensions.

**Advantages**
- No empty space is visible.
- Produces visually consistent thumbnails.
- Useful for profile pictures and previews.

**Disadvantages**
- Parts of the image may be cropped.
- Important content near the edges can be lost.

### Contain

The entire image remains visible while fitting inside the target dimensions.

**Advantages**
- No image content is lost.
- Preserves the complete image.

**Disadvantages**
- May add padding (letterboxing).
- Does not completely fill the target area.

### Why Both Strategies Are Useful

Different use cases require different behavior.

Social media thumbnails often benefit from **Cover**, while product images and documents usually benefit from **Contain** because preserving all content is more important than filling the available space.

---

## Screenshots

### Login Page

<img src="screenshots/login.png" width="600">

### Registration Page

<img src="screenshots/registration.png" width="600">

### Main Application

<img src="screenshots/main.png" width="600">

### Image Upload

<img src="screenshots/i_upload.png" width="600">

### Resize Results

<img src="screenshots/cover_resize.png" width="600">
<img src="screenshots/contain_resize.png" width="600">

### Avatar Dropdown Menu

<img src="screenshots/avatar.png" width="600">

---

## Testing

The following functionality was manually tested:

### Authentication

- Registration
- Login
- Logout
- Session persistence after browser restart
- Account deletion

### Image Processing

- Resize from image URL
- Resize from uploaded file
- Cover strategy
- Contain strategy
- Aspect ratio mode
- Explicit width/height mode

### Credit System

- Credit deduction
- Low-credit warning
- Zero-credit handling

### Deployment

- MongoDB Atlas connectivity
- Railway deployment
- Production authentication
- Production image resizing

---

## Future Improvements

Given more time, I would:

- Add automated tests for authentication and image processing flows.
- Improve validation and error handling.
- Improve UI polish and feedback.
- Support extracting product images directly from Amazon product page URLs.
- Add image history.
- Improve mobile responsiveness.

---

## Author

**Meital Basael**
