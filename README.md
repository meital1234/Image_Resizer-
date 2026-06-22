# Image Resizer

## Project Overview

Image Resizer is a web application that allows users to register, log
in, upload images, resize them, and manage their account.

------------------------------------------------------------------------

## Features

### User Management

-   User registration
-   User login
-   Session-based authentication
-   User deletion

### Image Processing

-   Upload image
-   Resize image
-   Download resized image

------------------------------------------------------------------------

## Technologies Used

### Frontend

-   Next.js
-   React
-   CSS

### Backend

-   Next.js API Routes
-   Node.js

### Database

-   MongoDB Atlas
-   Mongoose

### Deployment

-   Railway

------------------------------------------------------------------------

## Project Structure

``` text
src/
├── app/
├── components/
├── models/
├── lib/
├── middleware/
└── api/
```

------------------------------------------------------------------------

## Environment Variables

Create a `.env.local` file:

``` env
MONGODB_URI=<your_mongodb_connection_string>
SESSION_SECRET=<your_session_secret>
```

------------------------------------------------------------------------

## Running Locally

Install dependencies:

``` bash
npm install
```

Run development server:

``` bash
npm run dev
```

Open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## Deployment

The application is deployed on Railway and connected to MongoDB Atlas.

### Deployment Steps

1.  Push project to GitHub.
2.  Create Railway project.
3.  Connect GitHub repository.
4.  Configure environment variables.
5.  Deploy application.
6.  Configure MongoDB Atlas access and database user.

------------------------------------------------------------------------

# Screenshots

## Login Page

\[Insert Screenshot Here\]

------------------------------------------------------------------------

## Registration Page

\[Insert Screenshot Here\]

------------------------------------------------------------------------

## Main Dashboard

\[Insert Screenshot Here\]

------------------------------------------------------------------------

## Upload Image

\[Insert Screenshot Here\]

------------------------------------------------------------------------

## Resize Result

\[Insert Screenshot Here\]

------------------------------------------------------------------------

## MongoDB Atlas

\[Insert Screenshot Here\]

------------------------------------------------------------------------

## Railway Deployment

\[Insert Screenshot Here\]

------------------------------------------------------------------------

# Testing

The following functionality was tested:

-   Registration
-   Login
-   Session persistence
-   Image upload
-   Image resizing
-   User deletion
-   Database persistence
-   Railway deployment

------------------------------------------------------------------------

# Author

Meital Basael
