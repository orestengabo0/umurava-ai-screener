"# Umurava AI Screener

An intelligent AI-powered resume screening and applicant management system that leverages Google's Gemini AI to automate the candidate evaluation process. The system analyzes resumes, scores applicants based on job requirements, and provides intelligent hiring recommendations.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [AI Decision Flow](#ai-decision-flow)
- [Assumptions and Limitations](#assumptions-and-limitations)

---

## Project Overview

**Umurava AI Screener** is a full-stack web application designed to streamline the hiring process by automating resume screening. It combines a modern frontend with a robust backend API to deliver:

### Key Features

- **Intelligent Resume Parsing**: Automatically extracts candidate information from uploaded resumes (PDF, DOCX, etc.)
- **AI-Powered Screening**: Uses Google Gemini 2.5 Flash to analyze candidates against job requirements
- **Smart Scoring Algorithm**: Evaluates candidates on multiple dimensions:
  - Technical skills match (35% weight)
  - Experience relevance (30% weight)
  - Education level (15% weight)
  - Projects and achievements (20% weight)
- **Job Management**: Create and manage job postings with detailed requirements and specifications
- **Applicant Tracking**: Track all applicants, their screening results, and hiring recommendations
- **Real-time Dashboard**: View analytics and insights about your recruitment pipeline
- **Multi-user Support**: Support for multiple recruiters with personalized settings and API keys
- **Email Notifications**: Automated email communications for candidates and recruiters
- **File Management**: Cloudinary integration for secure resume storage and retrieval

### Use Cases

- Recruitment teams screening hundreds of applicants
- HR departments automating initial candidate filtering
- Hiring managers making data-driven decisions with AI-generated insights
- Enterprises seeking customizable AI-powered screening with their own Gemini API keys

---

## Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js)"]
        UI["Next.js Pages<br/>- Dashboard<br/>- Jobs<br/>- Applicants<br/>- Results"]
        AuthCtx["Auth Context<br/>JWT Management"]
        APIClient["API Client<br/>Axios"]
        UI --> AuthCtx
        UI --> APIClient
    end

    subgraph Backend["Backend (Express)"]
        API["API Routes<br/>- Auth<br/>- Jobs<br/>- Applicants<br/>- Screening<br/>- Dashboard"]
        AuthMW["Auth Middleware<br/>JWT Verification"]
        Controllers["Controllers<br/>Business Logic"]
        Services["Services<br/>- Gemini AI<br/>- Cloudinary<br/>- Email<br/>- Resume Parse"]
        API --> AuthMW
        API --> Controllers
        Controllers --> Services
    end

    subgraph External["External Services"]
        Gemini["Google Gemini API<br/>AI Screening"]
        Cloudinary["Cloudinary<br/>File Storage"]
        Email["Nodemailer<br/>Email Service"]
    end

    subgraph Database["Database"]
        MongoDB["MongoDB<br/>- Users<br/>- Jobs<br/>- Applicants<br/>- Results<br/>- Settings"]
    end

    APIClient -->|HTTP/REST| API
    Services --> Gemini
    Services --> Cloudinary
    Services --> Email
    Controllers --> MongoDB
    Services --> MongoDB
```

### Technology Stack

**Frontend:**

- **Framework**: Next.js 16.2.1 (React 19.2.4)
- **Styling**: TailwindCSS 4.0
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Redux Toolkit
- **API Client**: Axios
- **File Handling**: PapaParse (CSV), pdf.js (PDF)

**Backend:**

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: Google Generative AI (Gemini 2.5 Flash)
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **API Docs**: Swagger/OpenAPI

**Deployment:**

- **Backend Hosting**: Fly.io (see fly.toml)
- **Package Manager**: pnpm 10.24.0

---

## Setup Instructions

### Prerequisites

- **Node.js**: v18+ (for backend)
- **pnpm**: v10.24.0+ (package manager)
- **MongoDB**: Local or Atlas connection
- **Git**: For version control
- **APIs Required**:
  - Google Gemini API Key (free tier available at [ai.google.dev](https://ai.google.dev))
  - Cloudinary Account (for file storage)
  - SMTP credentials (for email notifications)

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/orestengabo0/umurava-ai-screener.git
cd umurava-ai-screener
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
pnpm install

# Copy and configure environment file
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# Start development server
pnpm run dev
# Backend will run on http://localhost:5000
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
pnpm install

# Copy and configure environment file
cp .env.local.example .env.local
# Edit .env.local with your backend URL

# Start development server
pnpm run dev
# Frontend will run on http://localhost:3000
```

### Development Workflow

**Backend:**

```bash
cd backend
pnpm run dev        # Start with hot-reload (nodemon)
pnpm run build      # Build TypeScript to JavaScript
pnpm run start      # Run production build
```

**Frontend:**

```bash
cd frontend
pnpm run dev        # Start development server
pnpm run build      # Build for production
pnpm run start      # Start production server
pnpm run lint       # Run ESLint
```

### Running Tests

```bash
# Backend tests (if configured)
cd backend
pnpm test

# Frontend tests (if configured)
cd frontend
pnpm test
```

---

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/umurava-ai-screener

# AI & LLM
GEMINI_API_KEY=your_google_gemini_api_key_here

# Authentication
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRE=7d

# File Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Service (Nodemailer)
EMAIL_SERVICE=gmail              # or your email service (e.g., SendGrid)
EMAIL_USER=your_email@gmail.com  # Your email address
EMAIL_PASSWORD=your_app_password # Gmail app password or service key
EMAIL_FROM=noreply@umurava.com   # From address for emails

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com

# Database Cache (optional)
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Umurava AI Screener

# Deployment
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### How to Get API Keys

1. **Google Gemini API Key**:
   - Visit [ai.google.dev](https://ai.google.dev)
   - Click "Get API Key"
   - Create a new API key in Google Cloud Console
   - Enable Generative AI API

2. **MongoDB URI**:
   - Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster and database user
   - Copy connection string

3. **Cloudinary**:
   - Sign up at [cloudinary.com](https://cloudinary.com)
   - Navigate to Dashboard to find credentials

4. **Gmail App Password** (for email):
   - Enable 2-factor authentication
   - Generate app password at [accounts.google.com/apppasswords](https://accounts.google.com/apppasswords)

---

## AI Decision Flow

### Screening Process Overview

```mermaid
sequenceDiagram
    participant User as User/Recruiter
    participant Frontend as Frontend
    participant Backend as Backend Server
    participant Gemini as Google Gemini API
    participant Database as MongoDB
    participant FileStore as Cloudinary

    User->>Frontend: 1. Upload resumes & job details
    Frontend->>Backend: POST /api/screen/applicants
    Backend->>FileStore: 2. Store resume files
    Backend->>Backend: 3. Parse resume text
    Backend->>Gemini: 4. Send screening prompt with:<br/>- Job requirements<br/>- Resume data<br/>- Scoring criteria
    Gemini->>Gemini: 5. Analyze & score candidates
    Gemini-->>Backend: 6. Return JSON results
    Backend->>Database: 7. Store screening results
    Backend-->>Frontend: 8. Return scored candidates
    Frontend->>User: 9. Display results & recommendations
```

### Scoring Algorithm

The AI scoring system evaluates each candidate on a scale of **0-100** using the following weighted criteria:

| Criterion                 | Weight | Details                                                         |
| ------------------------- | ------ | --------------------------------------------------------------- |
| **Skills Match**          | 35%    | Technical skills required for the role vs. candidate's skillset |
| **Experience Relevance**  | 30%    | Years and relevance of industry/role experience                 |
| **Education**             | 15%    | Formal education level and certifications                       |
| **Projects/Achievements** | 20%    | Notable projects, accomplishments, and contributions            |

### Recommendation Categories

Based on the AI score, candidates are automatically categorized:

| Score Range  | Recommendation        | Action                            |
| ------------ | --------------------- | --------------------------------- |
| **80 - 100** | ✅ Highly Recommended | Fast-track to interview           |
| **65 - 79**  | 👍 Recommended        | Schedule for screening interview  |
| **50 - 64**  | 🤔 Consider           | Review further, may interview     |
| **0 - 49**   | ❌ Not Recommended    | Archive, consider for other roles |

### AI Prompt Structure

The system sends structured prompts to Gemini with:

```
1. Job Context:
   - Title, description, required skills
   - Experience level, employment type
   - Education requirements

2. Candidate Data:
   - Parsed resume information
   - Work experience, education, skills
   - Projects and achievements

3. Scoring Instructions:
   - Explicit weighting for each criterion
   - Output format (JSON schema)
   - Recommendation mapping rules

4. Output Constraints:
   - Must return valid JSON array only
   - Specific fields required: name, score, strengths, gaps, recommendation
```

### Data Flow in Detail

1. **Upload Phase**: Recruiter uploads resumes and enters job requirements
2. **Parsing Phase**: Backend extracts text from resumes using pdfjs-dist
3. **Aggregation Phase**: All candidate data combined into a single context
4. **AI Analysis Phase**: Gemini analyzes complete candidate pool against job requirements
5. **Scoring Phase**: Each candidate receives individual score and category
6. **Storage Phase**: Results saved to MongoDB for historical tracking
7. **Presentation Phase**: Frontend displays ranked candidates with details

### Customization Options

Users can configure AI behavior through **Settings**:

- Use personal Gemini API key instead of default
- Select alternative Gemini models (if available)
- Customize scoring weights (via prompts)
- Configure email notification preferences

---

## Assumptions and Limitations

### Assumptions

1. **Resume Quality**: System assumes uploaded resumes are readable PDFs or documents with extractable text
2. **Clear Job Requirements**: Assumes job details are comprehensive enough for meaningful comparison
3. **Modern AI Model**: Relies on Google Gemini having been trained on current technologies and job market
4. **English Language**: Primarily optimized for English-language resumes and job descriptions
5. **User Authentication**: Assumes users are properly authenticated and authorized via JWT
6. **File Access**: Assumes users have permission to upload and share candidate information
7. **Consistent Data Format**: Assumes resumes follow general professional formatting conventions

### Limitations

#### Technical Limitations

- **File Size**: Multer configured with 2MB limit for file uploads (may need adjustment for large batches)
- **Concurrent API Calls**: Limited by Google Gemini API rate limits (varies by tier)
- **Processing Speed**: Large batches (100+ resumes) may take 30+ seconds to process
- **Text Extraction**: PDF parsing may fail on scanned documents without OCR
- **Language Support**: Primarily supports English; non-English resumes may have reduced accuracy

#### AI Model Limitations

- **No Video/Audio**: Cannot process video resumes or interview recordings
- **Subjective Assessment**: AI scores are statistical predictions, not definitive measures
- **Bias Risk**: AI may reflect biases in training data or job description phrasing
- **Context Limitation**: Cannot access external profiles (LinkedIn, GitHub) for additional context
- **Model Hallucination**: Gemini may occasionally generate inconsistent or fabricated details
- **Scoring Consistency**: Slight variations in scores for same data across different API calls possible

#### Business Logic Limitations

- **No Interview Integration**: System doesn't conduct or schedule interviews
- **No Background Check**: Cannot perform verification or background checks
- **No Salary Negotiation**: Doesn't handle offer or compensation discussions
- **Limited Diversity Metrics**: No built-in tracking for diversity and inclusion goals
- **Single Job Matching**: Each screening targets one job; limited cross-role analysis

#### Operational Limitations

- **API Costs**: Google Gemini API usage incurs costs (especially at scale)
- **Data Privacy**: Resumes stored in database and Cloudinary; users responsible for compliance (GDPR, etc.)
- **No Offline Mode**: Requires internet connection; no offline screening capability
- **Deployment Complexity**: Requires multiple external services (MongoDB, Cloudinary, Gemini)
- **Scalability**: Performance may degrade with very large job listings (100,000+ candidates)

#### Known Issues & Future Enhancements

- **Batch Processing**: Currently processes all candidates in single API call; should implement chunking for very large batches
- **Resume Formats**: Limited support for formats beyond PDF/DOCX (Word)
- **Feedback Loop**: No mechanism for collecting hiring team feedback to improve scoring
- **Bulk Operations**: No bulk actions for applicants (move, archive, email)
- **Advanced Filtering**: Limited search/filter capabilities in applicant listing

### Recommendations for Users

- ✅ Test with small batches first to understand AI accuracy for your use case
- ✅ Verify AI recommendations before making hiring decisions
- ✅ Maintain GDPR/privacy compliance when storing candidate data
- ✅ Monitor API costs and set spending alerts in Google Cloud Console
- ✅ Regularly review and refine job descriptions for better matching
- ✅ Keep candidate communications professional and transparent
- ✅ Use system as a screening tool, not sole hiring decision-maker

---

## API Documentation

The backend includes Swagger/OpenAPI documentation. After starting the backend:

```
http://localhost:5000/api-docs
```

### Main Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - List jobs
- `POST /api/applicants/upload` - Upload resumes
- `POST /api/screen/applicants` - Run AI screening
- `GET /api/dashboard` - Get dashboard analytics
- `PUT /api/settings` - Update user settings

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a pull request

---

## License

ISC License - See LICENSE file for details

---

## Support & Contact

For issues, questions, or feature requests, please open an issue on GitHub or contact the development team.

**Repository**: [GitHub - umurava-ai-screener](https://github.com/orestengabo0/umurava-ai-screener)

---

**Last Updated**: April 2026  
**Maintained By**: Umurava Team"
