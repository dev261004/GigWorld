# GigWorld - Project Overview & Architecture

## 🎯 Project Description

**GigWorld** is a comprehensive job aggregation platform for freelancers. It scrapes job listings from multiple popular freelancing websites and presents them in a unified, user-friendly interface. The platform also enables companies to post their own job openings directly, creating a hybrid marketplace where freelancers can browse both scraped and directly-posted opportunities.

**Key Value Proposition:** One-stop destination for freelancers to discover gig opportunities from 8+ major freelancing platforms without visiting each site individually.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React.js 18.3.1
- **Build Tool:** Vite 5.3.1
- **Styling:** Tailwind CSS 3.4.4 with Forms plugin
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Boxicons
- **Auth:** JWT Token (jwt-decode)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 4.19.2
- **Database:** MongoDB with Mongoose 8.4.4 ORM
- **Authentication:** JWT + bcrypt password hashing
- **Real-time:** Socket.io 4.8.0
- **File Upload:** Multer
- **Email:** Nodemailer
- **OAuth:** Google OAuth 2.0

### Scraper
- **Language:** Python
- **HTTP Library:** requests
- **Web Scraping:** BeautifulSoup4 4.12.3
- **Database:** pymongo 4.7.0
- **Configuration:** python-dotenv

---

## 📊 Freelancing Websites Scraped

The platform aggregates job listings from the following 8 freelancing websites:

| Website | Scraper File | Status |
|---------|-------------|--------|
| **Freelancer.com** | `freelancer.py` | ✅ Active |
| **Upwork** | `twine.py` | ✅ Active |
| **Remote.ok** | `remoteok.py` | ✅ Active |
| **We Work Remotely** | `weworkremotely.py` | ✅ Active |
| **Remotive** | `remotive.py` | ✅ Active |
| **Toptal** | `truelancer.py` | ✅ Active |
| **PeoplePerHour/HubStaff** | `hubstaff.py` | ✅ Active |
| **DesignCrowd** | `designcrowd.py` | ✅ Active |

### Scraper Architecture
- **Scheduled Scraping:** Worker processes run via `scraper.worker.js` to periodically fetch new jobs
- **Deduplication:** MongoDB ensures duplicate jobs from multiple sources are deduplicated
- **Lifecycle Management:** Jobs track their lifecycle (new → active → expired → archived)
- **Data Validation:** `validate_sync_args()` and `upsert_jobs_with_lifecycle()` maintain data integrity

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ├─ Pages: Job Search, Applications, Profiles, Dashboard       │
│  ├─ Components: Navbar, Sidebar, Company Forms, Job Lists      │
│  └─ State: JWT Auth, User Preferences, Cached Data             │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                  BACKEND (Express.js)                           │
│  ├─ Routes: /api/v1/users, /jobs, /company, /portfolio         │
│  ├─ Controllers: Business logic layer                           │
│  ├─ Middleware: Auth (JWT), Error handling                      │
│  └─ Workers: Real-time updates via Socket.io                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ Database Connection
┌────────────────────────▼────────────────────────────────────────┐
│                    MONGODB (Database)                           │
│  ├─ Collections: jobs, users, companies, portfolios, projects   │
│  ├─ Indexes: Optimized for search and filtering                 │
│  └─ Job Lifecycle: Tracks job status over time                  │
└─────────────────────────────────────────────────────────────────┘
                         ▲
                         │ Periodic Updates
┌────────────────────────┴────────────────────────────────────────┐
│              PYTHON SCRAPERS (Background Jobs)                  │
│  ├─ Concurrent Scrapers: 8 website scrapers                    │
│  ├─ Data Pipeline: Parse → Validate → Upsert                   │
│  ├─ Lifecycle Management: Track job status changes              │
│  └─ Error Handling: Retry logic & logging                       │
└─────────────────────────────────────────────────────────────────┘
        ▲
        │ BeautifulSoup + Requests
┌───────┴──────────────────────────────────────────────────────────┐
│            EXTERNAL FREELANCING WEBSITES                        │
│  Freelancer.com | Upwork | Remote.ok | We Work Remotely        │
│  Remotive | Toptal | HubStaff | DesignCrowd                     │
└───────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Directory Structure

### Backend (`/backend/`)
```
backend/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── auth.js                   # OAuth & JWT setup
│   ├── constant.js               # Global constants
│   ├── index.js                  # Server entry point
│   │
│   ├── controllers/              # Business logic
│   │   ├── jobs.controller.js
│   │   ├── user.controllers.js
│   │   ├── company.controller.js
│   │   ├── jobApplication.controller.js
│   │   ├── portfolio.controller.js
│   │   ├── project.controller.js
│   │   └── ... (other controllers)
│   │
│   ├── models/                   # Database schemas
│   │   ├── jobs.model.js
│   │   ├── user.model.js
│   │   ├── company.model.js
│   │   ├── jobApplication.model.js
│   │   ├── JobApplicationStatus.model.js
│   │   ├── portfolio.model.js
│   │   ├── project.model.js
│   │   └── contact.model.js
│   │
│   ├── routes/                   # API endpoints
│   │   ├── jobs.routes.js
│   │   ├── user.routes.js
│   │   ├── company.routes.js
│   │   ├── jobApplication.routes.js
│   │   ├── portfolio.routes.js
│   │   ├── project.routes.js
│   │   └── ... (other routes)
│   │
│   ├── middlewares/              # Express middleware
│   │   └── auth.js               # JWT authentication
│   │
│   ├── utils/                    # Helper utilities
│   │   ├── ApiError.js           # Custom error class
│   │   ├── ApiResponse.js        # Standard response format
│   │   ├── asyncHandler.js       # Async error wrapper
│   │   └── sendNotification.js
│   │
│   ├── db/
│   │   └── db.js                 # MongoDB connection
│   │
│   ├── workers/
│   │   └── scraper.worker.js     # Orchestrates Python scraping
│   │
│   ├── scripts/
│   │   └── backfillJobLifecycle.js # Data migration script
│   │
│   └── uploads/
│       └── resumes/              # User resume uploads
│
├── package.json
└── .env                          # Environment variables
```

### Frontend (`/frontend/`)
```
frontend/
├── src/
│   ├── App.jsx                   # Root component
│   ├── main.jsx                  # Entry point
│   ├── index.css                 # Global styles
│   │
│   ├── components/               # Reusable components
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   ├── Footer/
│   │   ├── Company/              # Company form & list
│   │   ├── Contact/              # Contact form
│   │   ├── Contributors/
│   │   ├── Hero/
│   │   ├── Pricing/
│   │   ├── SourceSites/          # Display scraped sources
│   │   └── Stat/
│   │
│   ├── pages/                    # Page components
│   │   ├── Homepage/
│   │   ├── WorkSearchPage/       # Browse jobs
│   │   ├── ApplyJobPage/         # Job application
│   │   ├── DashboardPage/
│   │   ├── UserProfilePage/
│   │   ├── PortfolioPage/
│   │   ├── ProjectPage/
│   │   ├── SigninPage/
│   │   ├── SignupPage/
│   │   ├── ForgotPasswordPage/
│   │   ├── ResetPasswordPage/
│   │   ├── ContactPage/
│   │   ├── PricingPage/
│   │   ├── UpdateAccountDetailPage/
│   │   └── JobApplicationStatusPage/
│   │
│   └── assets/                   # Images, icons
│
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

### Scraper (`/scraper/`)
```
scraper/
├── freelancer.py                 # Freelancer.com scraper
├── twine.py                      # Upwork scraper
├── remoteok.py                   # Remote.ok scraper
├── weworkremotely.py            # We Work Remotely scraper
├── remotive.py                   # Remotive scraper
├── truelancer.py                 # Toptal scraper
├── hubstaff.py                   # HubStaff scraper
├── designcrowd.py                # DesignCrowd scraper
├── lifecycle.py                  # Job lifecycle management
├── requirements.txt              # Python dependencies
└── README.md
```

---

## 🗄 Database Schema Overview

### Jobs Collection
```javascript
{
  job_title: String,              // e.g., "React Developer Needed"
  company_name: String,
  rating: String,                 // Client/Company rating
  experience: String,             // Required experience level
  location: String,               // Job location
  min_requirements: String,       // Minimum qualifications
  tech_stack: [String],          // Required technologies
  source: String,                // "scraped" or "company"
  source_website: String,        // e.g., "freelancer.com"
  source_url: String,            // Original job listing URL
  external_id: String,           // ID from source website
  project_status: String,        // "open", "in-progress", etc.
  is_active: Boolean,            // Current availability
  first_seen_at: Date,           // When job was discovered
  last_seen_at: Date,            // Last update time
  salary_range: String,          // Optional salary info
  description: String,           // Full job description
  createdAt: Date,
  updatedAt: Date
}
```

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String,                  // "freelancer", "company", "admin"
  avatar: String,                // Cloudinary URL
  bio: String,
  skills: [String],
  hourlyRate: Number,
  phone: String,
  address: String,
  city: String,
  country: String,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Job Applications Collection
```javascript
{
  jobId: ObjectId,               // Reference to job
  userId: ObjectId,              // Reference to freelancer
  coverLetter: String,
  proposedRate: Number,
  status: String,                // "pending", "accepted", "rejected"
  appliedAt: Date,
  updatedAt: Date
}
```

---

## 🔌 Core API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `POST /api/v1/users/forgot-password` - Initiate password reset

### Jobs
- `GET /api/v1/jobs` - Get all jobs (with filtering)
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs` - Create job (company only)
- `PUT /api/v1/jobs/:id` - Update job
- `DELETE /api/v1/jobs/:id` - Delete job

### Job Applications
- `GET /api/v1/jobs/:jobId/applications` - Get job applications
- `POST /api/v1/jobs/:jobId/apply` - Apply for job
- `GET /api/v1/applications/user` - Get user's applications
- `PUT /api/v1/applications/:id/status` - Update application status

### User Profile
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `POST /api/v1/users/upload-resume` - Upload resume

### Companies
- `GET /api/v1/company` - Get all companies
- `GET /api/v1/company/:id` - Get company details
- `POST /api/v1/company` - Register company

### Portfolio & Projects
- `GET /api/v1/portfolio` - Get user portfolio
- `POST /api/v1/portfolio` - Add portfolio item
- `GET /api/v1/projects` - Get user projects
- `POST /api/v1/projects` - Create project

---

## 🔄 Data Flow: Scraping to Frontend

```
1. SCHEDULED TRIGGER
   └─ scraper.worker.js runs on schedule (cron job)

2. PYTHON SCRAPER EXECUTION
   ├─ freelancer.py, remoteok.py, etc. start
   ├─ Fetch jobs from each website
   ├─ Parse HTML/JSON responses with BeautifulSoup
   └─ Validate job data

3. DATA PIPELINE
   ├─ Check for duplicates (external_id + source_website)
   ├─ Create ScrapedJob objects
   └─ Upsert into MongoDB via lifecycle.py

4. JOB LIFECYCLE MANAGEMENT
   ├─ New jobs: first_seen_at = now, is_active = true
   ├─ Existing jobs: Update last_seen_at
   ├─ Missing jobs: Mark as expired, is_active = false
   └─ Archive old expired jobs

5. DATABASE STORAGE
   └─ Jobs stored in MongoDB with metadata

6. FRONTEND RETRIEVAL
   ├─ User visits /WorkSearchPage
   ├─ Frontend calls GET /api/v1/jobs
   ├─ Backend queries MongoDB
   ├─ Returns filtered/paginated results
   └─ Frontend renders job listings

7. USER INTERACTION
   ├─ User clicks on job
   ├─ Views full details (from source_url)
   ├─ Clicks "Apply" button
   ├─ Frontend creates job application
   └─ Application stored in DB
```

---

## ⚙ Configuration & Environment

### Backend Environment Variables (`.env`)
```
MONGODB_URI=mongodb://...
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=7d
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NODEMAILER_USER=...
NODEMAILER_PASS=...
CLOUDINARY_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables (`.env`)
```
VITE_API_URL=http://localhost:5000/api/v1
```

### Scraper Environment Variables (`.env`)
```
MONGODB_URI=mongodb://...
PYTHON_ENV=production
```

---

## 🚀 Running the Project

### Start Backend
```bash
cd backend
npm install
npm run dev              # Start development server
npm run scrape:once     # Run scraper once
npm run scrape:worker   # Start scraper worker
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev             # Start Vite dev server (http://localhost:5173)
```

### Run Scraper Directly
```bash
cd scraper
pip install -r requirements.txt
python freelancer.py    # Run specific scraper
python lifecycle.py     # Manage job lifecycle
```

---

## 🔐 Security Features

- **JWT Authentication:** Secure token-based auth
- **Password Hashing:** bcrypt for secure password storage
- **OAuth 2.0:** Google login integration
- **CORS Configuration:** Restricted to frontend origin
- **Input Validation:** Request data validation
- **File Upload Security:** Multer config with size limits
- **Environment Secrets:** Sensitive data in .env files

---

## 📈 Scalability Considerations

1. **Database Indexing:** Jobs indexed on `is_active`, `source_website`, `createdAt`
2. **Pagination:** Frontend implements pagination for large job lists
3. **Caching:** Redis can be added for frequently accessed jobs
4. **Job Queue:** Bull/RabbitMQ for background task management
5. **Clustering:** Node.js clustering for multi-core utilization
6. **CDN:** Cloudinary for image/resume storage
7. **Database Sharding:** MongoDB sharding for horizontal scaling

---

## 📝 Key Features

✅ **Multi-source Job Aggregation** - Scrapes 8+ freelancing platforms
✅ **User Authentication** - Secure login with JWT & Google OAuth
✅ **Job Application System** - Track applications and status
✅ **User Profiles** - Freelancer portfolios and company profiles
✅ **Real-time Notifications** - Socket.io integration for live updates
✅ **Resume Upload** - Support for freelancer resumes (Multer)
✅ **Responsive UI** - Tailwind CSS with mobile support
✅ **Email Notifications** - Nodemailer integration
✅ **Job Lifecycle Tracking** - Automatic expiration of outdated jobs
✅ **Company Portal** - Post jobs directly
✅ **Portfolio System** - Showcase freelancer work
✅ **Project Tracking** - Track ongoing projects

---

## 🛠 Development Workflow

1. **Backend Changes:** Modify controllers/models → Test API
2. **Frontend Changes:** Update React components → Vite hot reload
3. **Scraper Changes:** Update scraper logic → Test with `python script.py`
4. **Database:** Check MongoDB collections → Verify schema
5. **Debugging:** Use browser DevTools, Node debugger, PyCharm

---

## 📚 Additional Resources

- [GitHub Repository](https://github.com/dev261004/GigWorld)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [BeautifulSoup Guide](https://www.crummy.com/software/BeautifulSoup/)

---

## 👨‍💼 Project Maintainer

**Author:** Dev Agrawal

---

**Last Updated:** May 2026
