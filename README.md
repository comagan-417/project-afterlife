# Project Afterlife
### *"Don't let great student projects end with the hackathon."*

An AI-powered post-hackathon ecosystem that connects student innovations with mentors, investors, and industry professionals through evidence-based AI matching and transparent project assessment.

---

## Quick Start

### Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Java 11+** — Required for Firebase Emulators
- **Firebase CLI** — `npm install -g firebase-tools`

### 1. Install Dependencies

```bash
# Frontend
cd project-afterlife
npm install

# Functions
cd functions
npm install
cd ..
```

### 2. Start Firebase Emulators

```bash
firebase emulators:start
```

This starts:
- **Auth Emulator** — http://127.0.0.1:9099
- **Firestore Emulator** — http://127.0.0.1:8080
- **Storage Emulator** — http://127.0.0.1:9199
- **Functions Emulator** — http://127.0.0.1:5001
- **Emulator UI** — http://127.0.0.1:4000

### 3. Start the Frontend (separate terminal)

```bash
npm run dev
```

Open **http://localhost:3000**

### 4. Run Both Together

```bash
npm run dev:full
```

---

## Platform Routes

| Route | Description |
|---|---|
| `/` | Landing Page |
| `/login` | Login (shared for all roles) |
| `/register/student` | Student registration |
| `/register/mentor` | Mentor/Investor/Industrialist registration |
| `/student/*` | Student Portal (requires student role) |
| `/mentor/*` | Mentor Portal (requires mentor/investor/industrialist role) |

---

## Architecture

```
Project Afterlife
├── React 18 + Vite (Frontend)
│   ├── /              Landing Page
│   ├── /student       Student Portal
│   └── /mentor        Mentor Portal
│
├── Firebase Backend (Emulators locally)
│   ├── Authentication  Shared auth system
│   ├── Firestore       Shared database
│   ├── Cloud Storage   Project files
│   └── Cloud Functions AI analysis + scoring + matching
│
└── AI Layer (Mock locally, real API in production)
    ├── Project Extractor     Structured field extraction
    ├── Evidence Extractor    Evidence with source + level
    ├── Scoring Engine        Deterministic 12-criterion scoring
    └── Matching Engine       Weighted mentor-project matching
```

---

## AI Scoring System

The platform uses a **deterministic scoring engine** — the LLM extracts evidence and provides rubric scores (0–5), but the final weighted score is calculated by the engine:

```
criterion_score = (rubric_score / 5) × weight
final_score     = Σ all criterion scores
```

**12 Criteria (100 total points):**
| Criterion | Weight |
|---|---|
| Problem Relevance | 12 |
| Solution Quality | 10 |
| Innovation / Novelty | 10 |
| Technical Implementation | 15 |
| Prototype Completeness | 10 |
| Feasibility | 10 |
| Validation / Evidence | 10 |
| Scalability | 6 |
| Social / Real-World Impact | 6 |
| Industry / Market Potential | 5 |
| Documentation Quality | 3 |
| Deployment Readiness | 3 |

Every score includes: evidence source, confidence level, evidence coverage %, and improvement recommendations.

---

## Connecting a Real AI Provider

Currently running with a **mock AI** that generates realistic responses based on your project data.

To connect a real LLM, add to `.env`:

```env
# For Gemini
GEMINI_API_KEY=your-key-here
# And in functions/.env or Firebase config:
# firebase functions:config:set ai.gemini_key="your-key"
```

Then in `functions/src/ai/extractor.js`, the `USE_MOCK_AI` flag auto-detects whether `GEMINI_API_KEY` is set.

---

## Connecting a Real Firebase Project

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable: **Authentication** (Email/Password), **Firestore**, **Storage**, **Functions** (Blaze plan)
3. Copy project config to `.env`
4. Set `VITE_USE_EMULATORS=false`
5. Deploy: `firebase deploy`

---

## Security

- ✅ Firebase Authentication handles password hashing
- ✅ Role-based Firestore Security Rules
- ✅ Storage Rules with file type + size validation
- ✅ All AI calls server-side (Cloud Functions) — API keys never in frontend
- ✅ Student portal cannot access mentor identities
- ✅ Mentor portal cannot modify project scores
- ✅ Scoring engine is deterministic — LLM cannot override scores

---

## User Roles

| Role | Access |
|---|---|
| `student` | Upload projects, view AI analysis, view scores, see anonymized expertise |
| `mentor` | Discover projects, view full scores/evidence, offer support |
| `investor` | Same as mentor + funding-focused support options |
| `industrialist` | Same as mentor + industry validation options |
| `admin` | Full platform management |

---

## No Fake Data Policy

The platform is built to show **only real data**:
- Empty states shown when no data exists
- No hardcoded projects, mentors, scores, or recommendations
- All feeds query real Firestore records
- Platform stats on landing page come from Firestore — if zero, stats section is hidden

---

## Project Structure

```
project-afterlife/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx              Landing page
│   │   ├── auth/                    Login + Registration
│   │   ├── student/                 11 student portal pages
│   │   └── mentor/                  7 mentor portal pages
│   ├── components/
│   │   ├── ui/                      Shared UI components
│   │   ├── layout/                  StudentLayout + MentorLayout
│   │   ├── auth/                    ProtectedRoute
│   │   └── project/                 ScoreCard, Evidence, Lifecycle
│   ├── contexts/AuthContext.jsx     Firebase auth state
│   ├── services/                    Firestore/Storage/Functions APIs
│   ├── utils/
│   │   ├── scoringEngine.js         Deterministic scoring
│   │   ├── constants.js             All platform constants
│   │   └── helpers.js               UI helpers
│   └── firebase.js                  SDK + emulator setup
└── functions/
    ├── index.js                     Function exports
    └── src/
        ├── ai/extractor.js          AI project analysis
        ├── ai/scoringEngine.js      Server-side scoring engine
        ├── ai/matcher.js            Mentor-project matching
        ├── auth/roleManagement.js   Connection acceptance
        └── notifications/           Notification service
```
