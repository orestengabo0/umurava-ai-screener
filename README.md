# Umurava AI Screener

An intelligent AI-powered resume screening platform that helps recruiters and hiring teams efficiently process and evaluate candidates. The system uses Google's Gemini AI to analyze resumes, match candidates to job requirements, and provide actionable insights.

## Overview

Umurava AI Screener automates the tedious parts of recruitment by:

- **AI-Powered Analysis**: Uses Google Gemini to extract structured data from resumes (skills, experience, education, projects)
- **Smart Matching**: Automatically calculates match scores between candidates and job requirements
- **Batch Processing**: Handle multiple resumes at once via PDF upload or CSV/XLSX files
- **Real-time Insights**: Get instant feedback on candidate strengths, gaps, and recommendations
- **Secure Storage**: Resumes are uploaded to Cloudinary with proper metadata tracking

## Architecture

The project follows a modern monorepo structure with separate frontend and backend applications:

```
umurava-ai-screener/
├── frontend/          # Next.js 16 application
├── backend/           # Express.js API server
└── README.md
```

### Frontend (Next.js 16)

Built with modern React patterns and shadcn/ui components:

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **File Parsing**: PapaParse (CSV), SheetJS (XLSX), PDF.js (PDF text extraction)
- **Icons**: Lucide React

### Backend (Express.js)

A RESTful API built with TypeScript:

- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Cloudinary for resume uploads
- **AI Integration**: Google Generative AI (Gemini)
- **API Documentation**: Swagger/OpenAPI
- **Concurrency Control**: p-limit for batch processing

## Data Models

### User
Represents authenticated users (recruiters/admins):

```typescript
{
  firstName: string
  lastName: string
  email: string (unique)
  password: string (hashed)
  resetPasswordToken?: string
  resetPasswordExpires?: Date
}
```

### Job
Represents job postings with requirements:

```typescript
{
  title: string
  department?: string
  description: string
  employmentType: "full-time" | "part-time" | "contract" | "internship"
  requirements: string[]
  requiredSkills: string[]
  niceToHaveSkills?: string[]
  experienceLevel: "junior" | "mid" | "senior" | "lead"
  minExperience: number
  educationLevel?: "any" | "bachelors" | "masters" | "phd"
  location?: string
  status: "open" | "closed"
  createdBy?: ObjectId (User)
}
```

### Applicant
Represents parsed candidate data from resumes:

```typescript
{
  firstName: string
  lastName: string
  email: string
  headline?: string
  bio?: string
  location?: string
  phone?: string
  skills: Array<{ name, level, yearsOfExperience }>
  languages?: Array<{ name, proficiency }>
  experience: Array<{ company, role, startDate, endDate, description, technologies, isCurrent }>
  education: Array<{ institution, degree, fieldOfStudy, startYear, endYear }>
  certifications?: Array<{ name, issuer, issueDate }>
  projects: Array<{ name, description, technologies, role, link, startDate, endDate }>
  availability: { status, type, startDate }
  socialLinks?: { linkedin, github, portfolio, twitter }
  jobId?: string (unique with email)
  uploadedBy?: string
  uploadedAt: Date
  fileType: "pdf" | "csv" | "xlsx"
  fileName: string
  matchScore?: number (0-100)
  recommendation?: "Highly Recommended" | "Recommended" | "Consider" | "Not Recommended"
  strengths?: string[]
  gaps?: string[]
  aiSummary?: string
}
```

### ResumeFile
Tracks uploaded resume files:

```typescript
{
  applicantId: ObjectId
  cloudinaryPublicId: string
  cloudinaryUrl: string
  extractedText: string
  uploadedAt: Date
  size: number
  mimeType: string
  originalName: string
  jobId?: string
}
```

### Settings
Stores user's Gemini API configuration:

```typescript
{
  userId: ObjectId
  geminiApiKey: string (masked in responses)
  geminiModel: string
  isActive: boolean
  lastTestedAt?: Date
  lastTestSuccess?: boolean
}
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- MongoDB instance (local or cloud)
- Google Gemini API key
- Cloudinary account (for file storage)

### Environment Variables

#### Backend (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/umurava
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/orestengabo0/umurava-ai-screener.git
cd umurava-ai-screener
```

2. Install dependencies:
```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

3. Set up environment variables (see above)

4. Start the development servers:
```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Jobs

- `GET /api/jobs` - Get all jobs (protected)
- `POST /api/jobs` - Create a new job (protected)
- `GET /api/jobs/:id` - Get job details (protected)
- `PUT /api/jobs/:id` - Update job (protected)
- `DELETE /api/jobs/:id` - Delete job (protected)

### Applicants

- `GET /api/applicants` - Get all applicants (protected)
- `GET /api/applicants/:id` - Get applicant details (protected)
- `DELETE /api/applicants/:id` - Delete applicant (protected)

### Resume Processing

- `POST /api/jobs/:jobId/resumes/process` - Process PDF resumes (protected)
- `POST /api/jobs/:jobId/resumes/process-csv` - Process CSV/XLSX candidate data (protected)

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics (protected)

### Settings

- `GET /api/settings` - Get user settings (protected)
- `PUT /api/settings` - Update settings (protected)
- `POST /api/settings/test` - Test API key (protected)
- `POST /api/settings/test-stored` - Test stored API key (protected)
- `DELETE /api/settings` - Delete settings (protected)

### Screening

- `POST /api/screen` - Screen applicants against a job (protected)

## CSV/XLSX Processing

The system supports batch processing of candidates via CSV or XLSX files. Required columns:

- `firstname` (required)
- `lastname` (required)
- `email` (required)
- `resumeLink` (required) - URL to download the candidate's resume
- `phone` (optional)

### Processing Flow

1. User uploads CSV/XLSX file
2. Frontend parses and validates candidate data
3. Backend downloads resumes from provided links (handles Google Docs URLs)
4. Extracts text from PDFs using PDF.js
5. Sends text to Gemini AI for structured extraction
6. Validates AI output with Zod schemas
7. Creates applicant records in MongoDB
8. Uploads PDFs to Cloudinary
9. Returns detailed results (successes, download failures, processing failures)

### Google Docs Handling

The system automatically converts Google Docs URLs to export format:
- Input: `https://docs.google.com/document/d/DOC_ID/edit`
- Converted: `https://docs.google.com/document/d/DOC_ID/export?format=pdf`

## AI Integration

### Gemini API Configuration

Users must configure their Gemini API key in Settings. Supported models:

- `gemini-2.5-flash-lite` (default, free tier)
- `gemini-2.5-flash`
- `gemini-2.5-pro`
- `gemini-1.5-flash`
- `gemini-1.5-pro`

### Quota Handling

The system detects quota exceeded errors (HTTP 429) and displays a user-friendly dialog prompting users to:
- Update their API key
- Switch to a different model
- Check their usage at [ai.dev/rate-limit](https://ai.dev/rate-limit)

### AI Output Schema

The AI is prompted to return structured JSON with:

- Personal information (name, email, phone, location)
- Skills with proficiency levels
- Work experience with dates and technologies
- Education history
- Certifications
- Projects
- Availability status
- Social links

Output is validated using Zod schemas to ensure data integrity.

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- CORS configured for allowed origins
- API keys masked in responses
- Rate limiting on AI API calls
- Input validation with Zod schemas
- Protected routes require valid JWT

## Testing

Run builds to verify code:

```bash
# Backend
cd backend
pnpm build

# Frontend
cd frontend
pnpm build
```

## Deployment

### Backend

The backend includes Docker and Fly.io configuration:

- `Dockerfile` - Container image
- `fly.toml` - Fly.io deployment config
- `.dockerignore` - Files to exclude from image

### Frontend

The frontend is designed for Vercel deployment:

- Next.js 16 with App Router
- Static generation where possible
- API routes for server-side logic

## Development Scripts

### Backend

```bash
pnpm dev      # Start development server with nodemon
pnpm build    # Compile TypeScript
pnpm start    # Start production server
```

### Frontend

```bash
pnpm dev      # Start Next.js dev server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## API Documentation

Swagger documentation is available at `/api-docs` when the backend is running.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run builds to verify
5. Submit a pull request

## License

ISC

## Team

Built for modern recruitment teams who want to leverage AI for smarter hiring decisions.
