# TAI Labs Enterprise AI Readiness Platform

![Version](https://img.shields.io/badge/version-3.4.0-orange.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.1-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Supabase](https://img.shields.io/badge/Database-Supabase-emerald.svg)

<img src="https://github.com/sethum-VS/myGIF/blob/main/Tailabs.gif" width="auto" height="auto" alt="TAI Labs Enterprise AI Readiness Platform** is a data-driven benchmarking and workforce intelligence platform">
The TAI Labs Enterprise AI Readiness Platform is a data-driven benchmarking and workforce intelligence platform. It enables organizations to measure AI adoption maturity, identify multi-department capability gaps, and deliver tailored upskilling pathways across core operational and engineering competencies.

---

## 🌟 Core Features

- **Dual-Track Capability Evaluation**:
  - **Non-Technical Persona**: 5-pillar Likert evaluation assessing daily tool usage, workflow automation, prompt engineering data literacy, output validation, and leadership support.
  - **Technical Persona (Engineering & Data)**: 4-step branching scenario (*"Scaling the LangChain Prototype"*) evaluating real-world technical decision-making across coding, ML concepts, infrastructure, observability, applied practice, and cloud deployment.
- **Real-Time Admin Dashboard**:
  - **Macro Scorecard**: Aggregated organization readiness score and participation metrics.
  - **Team Disparity Radar**: Department-by-department score breakdown and comparison.
  - **Action Matrix**: Automated, deterministic upskilling recommendations prioritized by lowest pillar score.
- **Seat-Limited Distribution System**: Cryptographically secure 64-character token invite links with custom target seat limits and automatic completion tracking.
- **Privacy-First Guest Workspace Architecture**: Instant guest org provisioning using client fingerprinting and HttpOnly session cookies without mandatory password registration.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15.1 (App Router)](https://nextjs.org/)
- **Language**: TypeScript 5.0
- **Database & Auth**: [Supabase (PostgreSQL)](https://supabase.com/) with Row Level Security (RLS)
- **Styling**: Vanilla CSS Variables & Tailwind CSS
- **Iconography**: [Lucide React](https://lucide.dev/)
- **Notifications**: [Sonner](https://sonner.emilkowal.si/)
- **Tokens**: [NanoID](https://github.com/ai/nanoid)

---

## 📚 Deep-Dive Documentation

For detailed architectural specs, sequence flows, scoring formulas, and API documentation, explore the `docs/` directory:

| Document | Description |
| :--- | :--- |
| 🏗️ [**System Architecture**](file:///Users/sethummethsanda/Documents/Dev/tailabs_AI-readiness/docs/ARCHITECTURE.md) | Component hierarchy, middleware auth guard, guest session model, and Supabase ERD. |
| 🔄 [**Program Flow & Scoring Engine**](file:///Users/sethummethsanda/Documents/Dev/tailabs_AI-readiness/docs/PROGRAM_FLOW.md) | Step-by-step sequence diagrams, dual-track wizard logic, and mathematical scoring formulas. |
| 🔌 [**API Reference**](file:///Users/sethummethsanda/Documents/Dev/tailabs_AI-readiness/docs/API_REFERENCE.md) | Exhaustive REST API specifications, header injection rules, request/response payloads, and error codes. |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Instance**: Local Supabase CLI or cloud project

### 2. Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tailabs/tailabs_AI-readiness.git
   cd tailabs_AI-readiness
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Run Database Migrations**:
   Apply SQL schema and Row Level Security migrations located in `supabase/migrations/`:
   ```bash
   npx supabase db push
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Repository Directory Overview

```
src/
├── app/                     # App Router pages and API routes
│   ├── admin/               # Admin Dashboard & Distribution pages
│   ├── api/                 # Backend REST endpoints
│   ├── eval/                # Assessment Questionnaire Wizard
│   ├── login/               # Admin Guest Sign-In Page
│   └── middleware.ts        # Route Guard & Cookie Auth Middleware
├── components/              # React UI Components
│   ├── admin/               # Analytics charts, scorecards & action matrix
│   ├── assessment/          # Assessment wizard & scenario config
│   ├── common/              # Pillar icons & shared badges
│   └── ui/                  # UI primitives (Dialog, Tabs, Progress, Table)
└── lib/                     # Core Business Logic & Scoring Engine
    ├── scoringEngine.ts     # Formulae, status mappings & recommendations
    └── supabase/            # Supabase server & client connections
```

---

## 🛡️ Security & Privacy

- **No Raw Operational Data Exposure**: Individual responses are aggregated at the team/department level.
- **HttpOnly Cookies**: Guest sessions (`tai_guest_id`) are stored in HttpOnly cookies to prevent XSS session hijacking.
- **Service Role Isolation**: Database mutations utilize Supabase Admin Service Role clients scoped strictly by organization ID headers (`x-tai-org-id`).

---
