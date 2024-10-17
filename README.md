
# WorkHive - Freelancing Platform

WorkHive is a freelancing platform that aggregates job listings from various freelancing websites using web scraping. It allows companies to post job listings and freelancers to browse and apply for jobs.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Setup](#project-setup)
  - [Folder Structure](#folder-structure)
  - [Setting Up a Virtual Environment for Web Scraping](#setting-up-a-virtual-environment-for-web-scraping)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
    - [Register a New User](#register-a-new-user)
    - [Login User](#login-user)
  - [User Profile](#user-profile)
    - [Get User Profile](#get-user-profile)
  - [Jobs](#jobs)
    - [Get All Jobs](#get-all-jobs)
    - [Create a Job Post](#create-a-job-post)
- [Contributing](#contributing)
- [License](#license)

## Features

- Aggregates job listings from multiple freelancing websites.
- Companies can post job openings.
- Freelancers can browse and apply for jobs.
- User profiles for both freelancers and companies.
- Simple, user-friendly interface.

## Technologies Used

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose for ORM)
- **Web Scraping:** Selenium
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **Cloudinary:** For user avatar and other media uploads
- **Other Tools:** Socket.io for real-time communications

## Project Setup

### Folder Structure

```
workhive/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.js
│   └── package.json
│
└── README.md
```

### Setting Up a Virtual Environment for Web Scraping

To set up a Python virtual environment for web scraping with Selenium, follow these steps:

1. Install `virtualenv` if you haven't already:

   ```bash
   pip install virtualenv
   ```

2. Create a virtual environment:

   ```bash
   virtualenv venv
   ```

3. Activate the virtual environment:

   - **Windows**:

     ```bash
     .\venv\Scripts\activate
     ```

   - **MacOS/Linux**:

     ```bash
     source venv/bin/activate
     ```

4. Install required packages:

   ```bash
   pip install selenium
   ```

5. Once your virtual environment is active, you can run your web scraping scripts within it. To deactivate the environment when you're done:

   ```bash
   deactivate
   ```

## API Documentation

### Authentication

#### Register a New User

**Endpoint**: `POST /api/users/register`

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response**:

```json
{
  "_id": "60d0fe4f5311236168a109ca",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt_token"
}
```

#### Login User

**Endpoint**: `POST /api/users/login`

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response**:

```json
{
  "_id": "60d0fe4f5311236168a109ca",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt_token"
}
```

### User Profile

#### Get User Profile

**Endpoint**: `GET /api/users/profile/:id`

**Response**:

```json
{
  "_id": "60d0fe4f5311236168a109ca",
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Freelance developer specializing in MERN stack",
  "skills": ["JavaScript", "React", "Node.js"],
  "avatar": "http://example.com/avatar.jpg",
  "createdAt": "2023-09-13T12:00:00Z",
  "updatedAt": "2023-09-13T12:00:00Z"
}
```

### Jobs

#### Get All Jobs

**Endpoint**: `GET /api/jobs`

**Response**:

```json
[
  {
    "_id": "60d0fe4f5311236168a109ca",
    "title": "Full-Stack Developer",
    "company": "TechCorp",
    "location": "Remote",
    "description": "Looking for a full-stack developer with experience in MERN stack...",
    "salaryRange": "60,000-80,000",
    "applicationDeadline": "2023-10-01"
  },
  {
    "_id": "60d0fe4f5311236168a109cb",
    "title": "UI/UX Designer",
    "company": "DesignHub",
    "location": "New York, NY",
    "description": "We are looking for a creative UI/UX designer...",
    "salaryRange": "50,000-70,000",
    "applicationDeadline": "2023-09-30"
  }
]
```

#### Create a Job Post

**Endpoint**: `POST /api/jobs`

**Request Body**:

```json
{
  "title": "Backend Developer",
  "company": "DevHub",
  "location": "Remote",
  "description": "We need a backend developer with experience in Node.js...",
  "salaryRange": "70,000-90,000",
  "applicationDeadline": "2023-11-01"
}
```

**Response**:

```json
{
  "_id": "60d0fe4f5311236168a109cc",
  "title": "Backend Developer",
  "company": "DevHub",
  "location": "Remote",
  "description": "We need a backend developer with experience in Node.js...",
  "salaryRange": "70,000-90,000",
  "applicationDeadline": "2023-11-01",
  "createdAt": "2023-09-13T12:00:00Z"
}
```

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a pull request.

## License

Distributed under the MIT License. See `LICENSE` for more information.
