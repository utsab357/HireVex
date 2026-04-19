# HIREVEX — PROJECT CONTEXT (MASTER REFERENCE)

> **Purpose of this file:** Feed this to any AI tool, new developer, or team member to give them full context about HireVex. No re-explaining needed.
>
> **Last Updated:** 2026-04-19

---

## 1. PRODUCT OVERVIEW

**HireVex** is an AI-powered hiring platform that helps recruiters analyze, rank, compare, and manage candidates with explainable insights and decision-focused UI.

### Problem
- HR manually scans resumes → massive time waste
- No clear reasoning behind candidate selection
- Good candidates get overlooked
- No structured hiring workflow

### Solution
- AI-based candidate ranking with explainable scoring
- Candidate comparison system (side-by-side)
- Visual hiring pipeline (Kanban board)
- Resume improvement suggestions + interview question generation
- Smart outreach system (email + WhatsApp)

### Target Users
| Role | Usage Level | Description |
|------|------------|-------------|
| HR / Recruiters | Primary | Full platform access — create jobs, upload resumes, rank, compare, hire |
| Candidates | Secondary (Light) | Upload resume, paste JD, get match score + suggestions |

---

## 2. TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React (Vite) | Fast, modern, component-based |
| Styling | Tailwind CSS v3 | Rapid UI development |
| State Management | Zustand or React Context | Lightweight, simple |
| Routing | React Router v6 | Standard routing |
| Backend | Django + Django REST Framework | Robust, batteries-included |
| Async Processing | Celery + Redis | Background AI tasks |
| Database | PostgreSQL | Relational, scalable |
| AI/NLP | OpenAI API (GPT-4) | Resume parsing, scoring, explanations |
| File Storage | Local (dev) / S3 (prod) | Resume file storage |
| Auth | JWT (djangorestframework-simplejwt) | Stateless auth |
| Email | SMTP (Django Email) | Outreach emails |

---

## 3. PROJECT STRUCTURE

```
HireVex/
├── PROJECT_CONTEXT.md          ← This file (master reference)
├── README.md                   ← Project readme
│
├── backend/                    ← Django project
│   ├── manage.py
│   ├── hirevex/                ← Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   ├── accounts/               ← User auth & profiles
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── jobs/                   ← Job management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── candidates/             ← Candidate management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── analysis/               ← AI analysis & scoring
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── tasks.py            ← Celery tasks
│   │   └── urls.py
│   ├── pipeline/               ← Hiring pipeline (Kanban)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── outreach/               ← Email & WhatsApp outreach
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── ai_engine/              ← Core AI logic (not a Django app)
│   │   ├── parser.py           ← Resume text extraction
│   │   ├── structurer.py       ← AI structuring of resume data
│   │   ├── scorer.py           ← Scoring engine
│   │   ├── explainer.py        ← Explanation generator
│   │   ├── question_gen.py     ← Interview question generator
│   │   ├── suggestion_gen.py   ← Resume improvement suggestions
│   │   └── confidence.py       ← Parsing confidence checker
│   └── requirements.txt
│
├── frontend/                   ← React (Vite) project
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── api/                ← API client & endpoints
│       │   └── client.js
│       ├── store/              ← State management
│       ├── hooks/              ← Custom hooks
│       ├── components/         ← Reusable components
│       │   ├── ui/             ← Buttons, inputs, cards, modals
│       │   ├── layout/         ← Sidebar, navbar, page layouts
│       │   └── shared/         ← Common components
│       ├── pages/              ← Page-level components
│       │   ├── Landing/        ← Public landing page
│       │   ├── Auth/           ← Login, signup
│       │   ├── Dashboard/      ← Command center
│       │   ├── Jobs/           ← Job listing & creation
│       │   ├── Candidates/     ← Candidate list & detail
│       │   ├── Pipeline/       ← Kanban board
│       │   ├── Comparison/     ← Side-by-side comparison
│       │   ├── Outreach/       ← Email & WhatsApp
│       │   ├── Analytics/      ← Basic stats
│       │   └── CandidatePortal/ ← Candidate-facing pages
│       ├── styles/             ← Global styles
│       └── utils/              ← Helper functions
│
└── docs/                       ← Additional documentation
    └── api-reference.md
```

---

## 4. DATABASE SCHEMA

### Users (accounts app)
```
User
├── id (PK, UUID)
├── email (unique)
├── password (hashed)
├── full_name
├── role (ENUM: 'hr', 'candidate')
├── company_name (nullable, for HR)
├── avatar (nullable)
├── created_at
└── updated_at
```

### Jobs (jobs app)
```
Job
├── id (PK, UUID)
├── hr_user (FK → User)
├── title
├── description (rich text — the JD)
├── department
├── location
├── employment_type (ENUM: full-time, part-time, contract, remote)
├── experience_min (int, years)
├── experience_max (int, years)
├── status (ENUM: open, closed, draft)
├── created_at
└── updated_at

JobRequirement
├── id (PK)
├── job (FK → Job)
├── skill_name
├── importance (ENUM: must-have, nice-to-have)
├── weight (float, 0-1, default=1.0)  ← HR configurable
└── category (ENUM: technical, soft_skill, certification, education)
```

### Candidates (candidates app)
```
Resume
├── id (PK, UUID)
├── file (FileField — uploaded PDF/DOCX)
├── raw_text (extracted text)
├── parsed_data (JSONField — structured AI output)
├── parsing_confidence (float, 0-100)
├── parsing_status (ENUM: pending, processing, completed, failed)
├── uploaded_by (FK → User, nullable)
├── created_at
└── updated_at

Candidate
├── id (PK, UUID)
├── job (FK → Job)
├── resume (FK → Resume)
├── name
├── email
├── phone (nullable)
├── score (float, 0-100)
├── stage (ENUM: applied, screening, interview, offer, hired, rejected)
├── stage_updated_at
├── notes (text, nullable)
├── created_at
└── updated_at
```

### Analysis (analysis app)
```
Analysis
├── id (PK, UUID)
├── candidate (FK → Candidate, OneToOne)
├── overall_score (float, 0-100)
├── skill_score (float, 0-100)
├── experience_score (float, 0-100)
├── semantic_score (float, 0-100)
├── strengths (JSONField — list of strings)
├── weaknesses (JSONField — list of strings)
├── explanation (text — AI-generated reasoning)
├── suggestions (JSONField — resume improvement tips)
├── interview_questions (JSONField — list of questions)
├── matched_skills (JSONField — skills found in resume matching JD)
├── missing_skills (JSONField — skills in JD but not in resume)
├── created_at
└── updated_at
```

### Pipeline (pipeline app)
```
PipelineStageLog
├── id (PK)
├── candidate (FK → Candidate)
├── from_stage
├── to_stage
├── moved_by (FK → User)
├── notes (nullable)
└── moved_at (timestamp)
```

### Outreach (outreach app)
```
Outreach
├── id (PK, UUID)
├── candidate (FK → Candidate)
├── sent_by (FK → User)
├── channel (ENUM: email, whatsapp)
├── subject (nullable, for email)
├── message (text)
├── status (ENUM: draft, sent, failed)
├── sent_at (nullable)
├── created_at
└── updated_at
```

---

## 5. API ENDPOINTS

### Auth (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Register new user (HR or candidate) |
| POST | `/login/` | Login → returns JWT tokens |
| POST | `/token/refresh/` | Refresh access token |
| GET | `/me/` | Get current user profile |
| PUT | `/me/` | Update profile |

### Jobs (`/api/jobs/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all jobs (HR sees own, paginated) |
| POST | `/` | Create new job |
| GET | `/{id}/` | Job detail |
| PUT | `/{id}/` | Update job |
| DELETE | `/{id}/` | Delete job |
| POST | `/{id}/requirements/` | Add job requirements + weights |
| GET | `/{id}/requirements/` | List job requirements |

### Candidates (`/api/candidates/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/{job_id}/upload/` | Bulk upload resumes for a job |
| GET | `/{job_id}/` | List candidates for a job (with scores) |
| GET | `/{job_id}/{candidate_id}/` | Candidate detail + analysis |
| PATCH | `/{candidate_id}/stage/` | Update candidate stage |
| DELETE | `/{candidate_id}/` | Remove candidate |

### Analysis (`/api/analysis/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/{job_id}/analyze/` | Trigger AI analysis for all candidates |
| GET | `/{candidate_id}/` | Get analysis results |
| GET | `/{job_id}/ranking/` | Get ranked candidate list |
| POST | `/{job_id}/compare/` | Compare selected candidates (body: candidate IDs) |

### Pipeline (`/api/pipeline/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{job_id}/board/` | Get pipeline board (all stages + candidates) |
| PATCH | `/{candidate_id}/move/` | Move candidate to new stage |
| GET | `/{candidate_id}/history/` | Stage movement history |

### Outreach (`/api/outreach/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/generate/` | AI-generate outreach message |
| POST | `/send-email/` | Send email to candidate |
| POST | `/whatsapp-link/` | Generate WhatsApp link |
| GET | `/{job_id}/` | List outreach history for a job |

### Candidate Portal (`/api/portal/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze/` | Upload resume + paste JD → get score |
| GET | `/result/{id}/` | Get analysis result |

---

## 6. AI ENGINE (How It Works)

### Flow
```
Resume Upload
    ↓
[1] Text Extraction (PyPDF2 / python-docx)
    ↓
[2] AI Structuring (GPT-4 prompt → JSON)
    Extracts: name, email, phone, skills, experience, education, projects, certifications
    ↓
[3] Confidence Check
    Validates: Are all fields populated? Is data reasonable?
    Assigns: confidence score (0-100)
    If confidence < 50 → fallback to raw text matching
    ↓
[4] Semantic Matching (GPT-4)
    Compares structured resume data vs job description
    ↓
[5] Scoring Engine
    skill_score     = matched_skills / required_skills × weight (default 40%)
    experience_score = experience alignment × weight (default 30%)
    semantic_score   = GPT semantic similarity × weight (default 30%)
    overall_score    = weighted sum
    ↓
[6] Explanation Engine (GPT-4)
    Generates human-readable explanation of why this score
    ↓
[7] Extras (GPT-4)
    → Interview questions (based on resume gaps + JD)
    → Resume improvement suggestions
```

### Scoring Weights (HR Configurable)
| Factor | Default Weight | Description |
|--------|---------------|-------------|
| Skills Match | 40% | How many required skills match |
| Experience | 30% | Years + relevance of experience |
| Semantic Match | 30% | Overall JD-resume semantic similarity |

---

## 7. UI PAGES & LAYOUT

### Public Pages
| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, features, product showcase, CTA |
| Login | `/login` | Email + password login |
| Signup | `/signup` | Register as HR or candidate |

### HR Dashboard (Protected)
| Page | Route | Description |
|------|-------|-------------|
| Command Center | `/dashboard` | Overview stats, recent activity |
| Jobs | `/jobs` | List/create/manage jobs |
| Job Detail | `/jobs/:id` | Job info + candidates for this job |
| Candidate Board | `/jobs/:id/candidates` | Ranked candidate list with filters |
| Candidate Insight | `/candidates/:id` | Full analysis, scores, explanations |
| Pipeline | `/jobs/:id/pipeline` | Kanban board (drag & drop stages) |
| Comparison | `/jobs/:id/compare` | Side-by-side candidate comparison |
| Outreach | `/outreach` | Send emails, generate WhatsApp links |
| Analytics | `/analytics` | Basic counts and charts |

### Candidate Portal (Protected)
| Page | Route | Description |
|------|-------|-------------|
| Portal Home | `/portal` | Upload resume + paste JD |
| Result | `/portal/result/:id` | Match score, suggestions, questions |

### UI Design Direction
- **Theme:** Dark mode primary, light mode toggle
- **Style:** Glassmorphism + gradients, premium feel
- **Colors:** Deep navy/dark bg, accent purple/blue gradient, green for success
- **Typography:** Inter or Outfit (Google Fonts)
- **Animations:** Smooth transitions, micro-interactions, hover effects
- **Kanban:** Drag-and-drop with visual stage cards

---

## 8. EDGE CASES & ERROR HANDLING

| Scenario | Handling |
|----------|----------|
| Corrupted resume file | Show error, skip file, continue batch |
| AI API failure | Retry 3x with backoff, then mark as "analysis_failed" |
| Missing resume data | Use raw text fallback, lower confidence score |
| Large file upload (>10MB) | Reject with clear error message |
| Bulk upload (50+ files) | Queue via Celery, show progress |
| Concurrent stage updates | Optimistic locking / last-write-wins with log |
| Empty JD | Require minimum description length |

---

## 9. SECURITY

| Area | Implementation |
|------|---------------|
| Authentication | JWT (access + refresh tokens) |
| Authorization | Role-based (HR vs Candidate) |
| Data Isolation | HR users only see their own jobs/candidates |
| File Upload | Validate file types (PDF, DOCX only), size limits |
| API Rate Limiting | Throttle AI-heavy endpoints |
| CORS | Whitelist frontend domain only |
| Environment Vars | All secrets in .env (never committed) |

---

## 10. BUILD PHASES

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Django + React + Vite)
- [ ] Database models & migrations
- [ ] Auth system (JWT, register, login)
- [ ] Basic UI shell (layout, routing, auth pages)
- [ ] Landing page

### Phase 2: Core Features (Week 3-4)
- [ ] Job CRUD (backend + frontend)
- [ ] Resume upload (single + bulk)
- [ ] AI engine — parsing + structuring
- [ ] Confidence scoring system
- [ ] Candidate listing with scores

### Phase 3: Intelligence (Week 5-6)
- [ ] Scoring engine (weighted)
- [ ] Explanation engine
- [ ] Candidate insight panel (full UI)
- [ ] Interview question generator
- [ ] Resume improvement suggestions

### Phase 4: Decision Tools (Week 7-8)
- [ ] Pipeline / Kanban board (drag & drop)
- [ ] Candidate comparison (side-by-side)
- [ ] Candidate ranking with filters
- [ ] Dashboard (command center with stats)

### Phase 5: Communication & Polish (Week 9-10)
- [ ] Outreach system (email + WhatsApp)
- [ ] Candidate portal
- [ ] Analytics page
- [ ] UI polish, animations, responsive design
- [ ] Error handling & edge cases

### Phase 6: Deployment (Week 11)
- [ ] Frontend → Vercel
- [ ] Backend → Render / Railway
- [ ] PostgreSQL → Managed instance
- [ ] Environment setup & testing
- [ ] Demo flow validation

---

## 11. ENVIRONMENT VARIABLES (.env)

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:pass@localhost:5432/hirevex

# JWT
ACCESS_TOKEN_LIFETIME=30  # minutes
REFRESH_TOKEN_LIFETIME=7  # days

# AI
OPENAI_API_KEY=your-openai-key
AI_MODEL=gpt-4

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# File Storage
MEDIA_ROOT=/media/
MAX_UPLOAD_SIZE_MB=10

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 12. KEY COMMANDS

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Celery (separate terminal)
celery -A hirevex worker --loglevel=info

# Frontend
cd frontend
npm install
npm run dev

# Redis (Docker)
docker run -d -p 6379:6379 redis:alpine
```

---

## 13. DEMO FLOW (FOR PRESENTATIONS)

1. **Create a Job** — Add title, description, requirements with weights
2. **Upload Resumes** — Bulk upload 5-10 PDFs
3. **Watch AI Process** — See parsing status update in real-time
4. **View Rankings** — Candidates sorted by AI score
5. **Open Candidate** — See full insight panel (scores, explanation, skills)
6. **Move in Pipeline** — Drag candidate from "Applied" → "Interview"
7. **Compare Candidates** — Select 2-3, see side-by-side comparison
8. **Send Outreach** — Generate AI message, send email or WhatsApp

---

> **HOW TO USE THIS FILE:** Copy and paste this entire document when starting a conversation with any AI tool. It contains everything needed to understand and build HireVex.
