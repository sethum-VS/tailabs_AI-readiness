# **Product Requirements Document (PRD)**

## **Project Title: TAI Readiness Baseline Tool**

* **Target Stack:** Next.js (App Router, TypeScript) + Tailwind CSS + shadcn/ui + Supabase (PostgreSQL) + Vercel
* **Design System Reference:** WSO2 Oxygen UI (Light Mode B2B Enterprise Palette)
* **Execution Engine:** Autonomous Agent Execution (Claude Code / Antigravity Agent)

---

## **1. Executive Summary & Strategic Context**

### **1.1 Business Purpose**

The **TAI Readiness Baseline Tool** serves as the primary "Day 0–15: Baseline Establishment" diagnostic for enterprise clients. It bridges the critical "license-to-adoption gap"—the operational disconnect where businesses buy AI subscriptions (Claude, ChatGPT, GitHub Copilot) but employees use them merely as superficial text polishers rather than automated workflow engines.

### **1.2 Key Personas**

* **The Business Admin (The Buyer):** Needs departmental visibility, quantitative readiness metrics, operational bottleneck identification, and actionable upskilling pathways to justify software and training investments.
* **The Team Member (The User):** Requires a fast, frictionless assessment experience with zero signup hurdles, clear progress tracking, and high-fidelity micro-interactions.

---

## **2. System Architecture & End-to-End User Flow**

```
+-------------------+      +-----------------------+      +-------------------------+
|   BUSINESS ADMIN  |      |   TEAM MEMBER (USER)  |      |  AUTOMATED DASHBOARD    |
+-------------------+      +-----------------------+      +-------------------------+
          |                            |                               |
1. Create Organization                 |                               |
   & Define Teams                      |                               |
          |                            |                               |
2. Generate Tokenized                  |                               |
   Magic Links ------------------------+                               |
                                       |                               |
                            3. Click Magic Link                        |
                               Validate Token                          |
                                       |                               |
                            4. Complete 5-Pillar                       |
                               Assessment Wizard                       |
                                       |                               |
                            5. Submit Payload                          |
                                       |                               |
                                       +---> 6. Database Trigger & ----+
                                                Scoring Engine Updates
                                                Team & Org Averages
                                                                       |
                                                               7. Render Real-Time
                                                                  Macro Score, Team
                                                                  Disparity, & Action
                                                                  Matrix

```

---

## **3. Database Architecture & Backend (Supabase / PostgreSQL)**

### **3.1 PostgreSQL Database Schema (DDL)**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ORGANIZATIONS TABLE
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    aggregate_score NUMERIC(5,2) DEFAULT 0.00
);

-- 2. TEAMS TABLE
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., Engineering, Sales, Ops, Marketing
    target_seats INT DEFAULT 10,
    aggregate_score NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_org_team UNIQUE(organization_id, name)
);

-- 3. ASSESSMENT INVITES TABLE
CREATE TABLE assessment_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) DEFAULT 'AI Readiness Assessment',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days')
);

-- 4. ASSESSMENT RESPONSES TABLE
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invite_id UUID REFERENCES assessment_invites(id) ON DELETE SET NULL,
    respondent_name VARCHAR(255) NOT NULL,
    respondent_role VARCHAR(255) NOT NULL,
    
    -- Likert Scale Scores (1 to 4)
    tool_usage_score INT NOT NULL CHECK (tool_usage_score BETWEEN 1 AND 4),
    workflow_automation_score INT NOT NULL CHECK (workflow_automation_score BETWEEN 1 AND 4),
    data_literacy_score INT NOT NULL CHECK (data_literacy_score BETWEEN 1 AND 4),
    output_evaluation_score INT NOT NULL CHECK (output_evaluation_score BETWEEN 1 AND 4),
    leadership_buyin_score INT NOT NULL CHECK (leadership_buyin_score BETWEEN 1 AND 4),
    
    -- Calculated Individual Total Percentage
    individual_score NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RECOMMENDATION MAPPING RULES TABLE
CREATE TABLE recommendation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pillar VARCHAR(50) NOT NULL, -- e.g., 'data_literacy', 'workflow_automation'
    threshold_max NUMERIC(5,2) NOT NULL, -- Trigger rule if pillar score % < threshold_max
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    action_label VARCHAR(100) DEFAULT 'Enroll Team',
    action_url VARCHAR(255)
);

```

### **3.2 Database Triggers for Automated Real-Time Scoring**

```sql
-- Function to recalculate Team and Organization aggregate scores
CREATE OR REPLACE FUNCTION recalculate_readiness_scores()
RETURNS TRIGGER AS $$
DECLARE
    v_team_id UUID;
    v_org_id UUID;
    v_team_avg NUMERIC(5,2);
    v_org_avg NUMERIC(5,2);
BEGIN
    v_team_id := NEW.team_id;

    -- Calculate new average score for the team
    SELECT COALESCE(AVG(individual_score), 0)
    INTO v_team_avg
    FROM assessment_responses
    WHERE team_id = v_team_id;

    -- Update team record
    UPDATE teams 
    SET aggregate_score = ROUND(v_team_avg, 2)
    WHERE id = v_team_id
    RETURNING organization_id INTO v_org_id;

    -- Calculate weighted average for the organization across all teams
    SELECT COALESCE(AVG(aggregate_score), 0)
    INTO v_org_avg
    FROM teams
    WHERE organization_id = v_org_id;

    -- Update organization record
    UPDATE organizations
    SET aggregate_score = ROUND(v_org_avg, 2),
        updated_at = NOW()
    WHERE id = v_org_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger execution on new assessment response insertion
CREATE TRIGGER trigger_update_readiness_scores
AFTER INSERT ON assessment_responses
FOR EACH ROW
EXECUTE FUNCTION recalculate_readiness_scores();

```

---

## **4. Assessment Framework & Scoring Algorithm**

### **4.1 Assessment Questions & Focus Matrix**

| Pillar | Assessment Question | Focus Area |
| --- | --- | --- |
| **Tool Usage** | *"How frequently do you use AI to generate first drafts, write code, or summarize complex data?"* | Adoption frequency & core tooling integration |
| **Workflow Automation** | *"Do you currently use AI as a standalone chat tool, or is it embedded in your daily workflows (e.g., Zapier, CRM, IDE, terminal)?"* | Measuring the "license-to-adoption" gap |
| **Data Literacy** | *"How confident are you in writing structured prompts that include system context, precise formatting rules, and edge-case constraints?"* | Prompt engineering & context protocol maturity |
| **Output Evaluation** | *"When an AI model provides an answer, how strictly do you evaluate it for hallucinations, logical errors, and data privacy compliance before deployment?"* | Operational safety & evaluation rigor |
| **Leadership Buy-in** | *"Does your immediate manager actively encourage, incentivize, or mandate using AI to reduce operational drag?"* | Cultural readiness & organizational support |

### **4.2 Mathematical Formulas**

1. **Individual Score Percentage:**

$$\text{Individual Score (\%)} = \left( \frac{\sum_{i=1}^{5} P_i}{20} \right) \times 100$$



*(Where $P_i$ is the 1–4 integer response for each pillar).*
2. **Team Score Percentage:**

$$\text{Team Score (\%)} = \frac{\sum_{j=1}^{N} \text{Individual Score}_j}{N}$$



*(Where $N$ is the total count of responses submitted for that team).*
3. **Macro Organization Score Percentage:**

$$\text{Org Score (\%)} = \frac{\sum_{k=1}^{M} \text{Team Score}_k}{M}$$



*(Where $M$ is the total count of defined teams).*

### **4.3 Deterministic Recommendation Engine (Mapping Tree)**

Instead of ungrounded LLM completions, upskilling recommendations are evaluated via a deterministic matrix based on departmental pillar weaknesses (Pillar Score % < 50%):

* **Low Data Literacy (< 50%):**
* *Title:* Prompt Engineering & Context Protocol Fundamentals
* *Recommendation:* "Assign team to the Claude Context & Structured Prompting Certification."


* **Low Workflow Automation (< 50%):**
* *Title:* Agentic Workflow Integration
* *Recommendation:* "Enroll team in the Certified AI Growth Operator Track to transition from chat wrappers to API-driven automation pipelines."


* **Low Output Evaluation (< 50%):**
* *Title:* AI Evals & Quality Assurance Systems
* *Recommendation:* "Deploy the AI Evals for PMs & Ops Framework to set up automated safety rails against hallucinations."


* **Low Leadership Buy-in (< 50%):**
* *Title:* AI Enablement & Culture Alignment
* *Recommendation:* "Schedule a 12-Week Custom AI Transformation Workshop for departmental leads."



---

## **5. Frontend Component Architecture & UI Specifications**

```
src/
├── app/
│   ├── layout.tsx                     # Global App Shell + Oxygen UI Footer
│   ├── page.tsx                       # Landing / Redirect
│   ├── admin/
│   │   ├── page.tsx                   # Admin Dashboard (Macro View, Team Chart, Action Matrix)
│   │   ├── distribution/
│   │   │   └── page.tsx               # Invite & Team Assessment Link Generator
│   ├── eval/
│   │   └── invite/
│   │       └── page.tsx               # Token Validation & Assessment Entry Point
│   └── assessment/
│       └── [tokenId]/
│           └── page.tsx               # 5-Pillar Assessment Wizard
├── components/
│   ├── admin/
│   │   ├── MacroScorecard.tsx         # Circular SVG Radial Progress Gauge
│   │   ├── TeamDisparityChart.tsx     # Recharts Horizontal Bar Visualizer
│   │   ├── ActionMatrix.tsx           # Dynamic Upskilling Cards Grid
│   │   └── InviteManager.tsx          # Copyable Link Generator & Active Invites Table
│   ├── assessment/
│   │   ├── TokenValidator.tsx         # Invisible URL Token Authorization Guard
│   │   └── QuestionnaireWizard.tsx    # Stateful 1-Question-Per-Screen Wizard
│   ├── layout/
│   │   └── GlobalFooter.tsx           # WSO2 Light Mode Footer Component
│   └── ui/                            # shadcn/ui Base Components (Card, Button, Dialog, Progress)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser Supabase Client
│   │   └── server.ts                  # Server-Side Supabase Client
│   └── scoringEngine.ts               # Local Calculations & Recommendation Mappers

```

### **5.1 Design Tokens (Oxygen UI Light Mode Specification)**

* **Primary Dark / Typography Base:** `#222228` (Deep Charcoal)
* **Primary Brand Accent:** `#FF7300` (Oxygen Orange — main CTAs, active states)
* **Background Surface:** `#F7F9FC` (App background)
* **Card / Container Surface:** `#FFFFFF` (White)
* **Borders / Dividers:** `#E0E0E0` (1px solid border)
* **Secondary Text / Metadata:** `#666666`
* **Semantic Status Colors:** Success (`#4CAF50`), Warning (`#FF9800`), Danger (`#F44336`)
* **Grid Unit:** Strict 8px base spacing grid (Padding: 8px, 16px, 24px, 32px).

---

## **6. Sprint-Based Execution Plan (For Autonomous Agents)**

---

### **Sprint 1: Database Setup, Schema Engine & Project Shell**

**Objective:** Initialize the Next.js app, configure Supabase connection, apply schema migrations, build deterministic scoring logic, and build the global layout with the Oxygen UI footer.

#### **Tasks:**

1. Initialize Next.js 14+ App Router project with TypeScript, Tailwind CSS, Lucide Icons, and shadcn/ui.
2. Setup Supabase client configurations (`lib/supabase/client.ts` and `lib/supabase/server.ts`).
3. Execute SQL migrations in Supabase to build `organizations`, `teams`, `assessment_invites`, `assessment_responses`, and `recommendation_rules` tables alongside the PostgreSQL calculation trigger.
4. Build `lib/scoringEngine.ts` containing functions for normalizing score data and evaluating recommendation rules.
5. Create `components/layout/GlobalFooter.tsx` matching the Oxygen UI specification:
* **Left:** `© 2026 | TAI Labs | tai-readiness-v1.0.0`
* **Right:** `Terms & Conditions | Privacy Policy`
* **Style:** Light mode background (`#FFFFFF`/`#F7F9FC`), `1px solid #E0E0E0` top border, `#666666` caption text (12px).



#### **Acceptance Criteria:**

* Supabase tables created with valid foreign keys and trigger functions.
* Next.js project builds with zero TypeScript or Tailwind compilation errors.
* Global footer renders cleanly across all viewport sizes.

---

### **Sprint 2: Distribution Management & Tokenized Invite System (Phase 0)**

**Objective:** Enable the Business Admin to create organizations, define teams, generate JWT/magic assessment links, and monitor response status.

#### **Tasks:**

1. Build `app/admin/distribution/page.tsx` with an enterprise management header.
2. Implement `components/admin/InviteManager.tsx`:
* **Link Generator:** Select Team (Engineering, Sales, Ops, Marketing, + Custom), generate unique tokenized URLs (`[https://tailabs.ai/eval/invite?token=](https://tailabs.ai/eval/invite?token=)[token]`), and provide a one-click "Copy Magic Link" button.
* **Active Teams Data Table:** Columns for Team Name, Masked Link, Completion Status (`X/Y Responses Received`), Status Badge (`Active`/`Pending`/`Completed`), and Action Buttons (`Copy Link`, `Resend Reminders`).


3. Implement `Create Team Modal`: Drawer/Modal to dynamically instantiate new departmental teams with target seat counts.
4. Implement API Route `/api/invites/validate` to verify URL tokens when clicked by users.

#### **Acceptance Criteria:**

* Admin can generate unique, team-bound invite tokens saved directly to Supabase.
* Clicking "Copy Magic Link" copies the valid assessment URL to the clipboard with visual toast feedback.
* The Active Invites table accurately reflects real-time team response counts.

---

### **Sprint 3: Stateful Assessment Wizard (Phase 1)**

**Objective:** Deliver an intuitive, single-question-per-screen assessment flow for team members accessing via tokenized links.

#### **Tasks:**

1. Build `app/eval/invite/page.tsx` and `app/assessment/[tokenId]/page.tsx`.
2. Implement `components/assessment/TokenValidator.tsx` to guard assessment routes, look up the `team_id` via Supabase, and handle expired/invalid tokens gracefully.
3. Build `components/assessment/QuestionnaireWizard.tsx`:
* Entry screen capturing `Full Name` and `Role`.
* Animated top progress bar tracking completion across the 5 core pillars.
* Single-question wizard layout with clear typography (H2 question, helper text).
* Large, mobile-friendly 1–4 Likert scale selection cards (1 = Never/Novice, 4 = Daily/Expert).
* Smooth state transition controls ("Next" button auto-enables upon selection; keyboard navigation bindings `1`, `2`, `3`, `4`, `Enter`).


4. On final submission, execute POST request to `/api/assessment/submit`, storing the response in `assessment_responses` and triggering real-time PostgreSQL score updates.
5. Render a submission success state with a celebratory toast or subtle animation.

#### **Acceptance Criteria:**

* Unauthenticated users can access the assessment *only* with a valid invite token.
* Responsive, high-touch UI optimized for desktop and mobile.
* Submitting an assessment automatically updates database aggregate scores via the trigger.

---

### **Sprint 4: Admin Analytics Dashboard, Recommendation Engine & UI Craft Polish (Phase 2)**

**Objective:** Build the primary Admin Dashboard visualizing macro metrics, team performance disparities, dynamic upskilling recommendations, and explicit visual states.

#### **Tasks:**

1. Build `app/admin/page.tsx` with top navigation tabs ("Overview", "Departments", "Settings").
2. Build `components/admin/MacroScorecard.tsx`:
* High-impact radial circular progress gauge displaying overall `organization_score` (0–100).
* Dynamic semantic color assignment (Red for < 40, Warning Orange for 40–70, Green for > 70).


3. Build `components/admin/TeamDisparityChart.tsx`:
* Recharts horizontal bar chart contrasting performance across teams (e.g., Engineering: 82%, Sales: 38%).


4. Build `components/admin/ActionMatrix.tsx`:
* Dynamic grid displaying tailored upskilling cards generated from lower-performing pillars.
* Includes clear action buttons ("Enroll Team", "View Syllabus").


5. Implement Explicit Interface States:
* **Empty State:** Clean banner prompting the admin to generate their first assessment link when database contains zero records.
* **Loading State:** Polished skeleton layout matching exact card dimensions during data fetches.


6. Deploy application to Vercel and confirm end-to-end integration with Supabase.

#### **Acceptance Criteria:**

* Admin dashboard loads real-time scores directly from Supabase.
* Horizontal bar chart and macro circular gauge render accurately.
* Upskilling recommendations dynamically adjust based on team score deficits.
* Application passes Vercel build and is publicly accessible.

---

