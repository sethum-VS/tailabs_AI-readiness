# Comprehensive Program Flow & Scoring Engine Specifications

This document outlines the step-by-step execution flows, sequence diagrams, and mathematical scoring specifications for the **TAI Labs Enterprise AI Readiness Platform**.

---

## 1. End-to-End Execution Flows & Sequence Diagrams

### Flow 1: Admin Authentication & Workspace Initialization

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin User
    participant Browser as Browser Client
    participant MW as Next.js Middleware
    participant AuthAPI as POST /api/auth/guest-login
    participant DB as Supabase DB

    Admin->>Browser: Navigates to /login
    Browser->>Browser: getOrCreateGuestId() (Fingerprint in localStorage)
    Admin->>Browser: Clicks "Sign In" or SSO button
    Browser->>AuthAPI: POST { guestId }
    AuthAPI->>DB: Select organization WHERE guest_id = guestId
    alt Existing Org Found
        DB-->>AuthAPI: Return existing orgId
    else New Org Required
        AuthAPI->>DB: INSERT INTO organizations (name, guest_id)
        DB-->>AuthAPI: Return new orgId
        AuthAPI->>DB: UPSERT INTO guest_sessions (guest_id, org_id)
    end
    AuthAPI->>DB: UPDATE guest_sessions SET last_seen_at = NOW()
    AuthAPI-->>Browser: 200 OK (Set-Cookie: tai_guest_id=orgId, HttpOnly, 24h)
    Browser->>MW: GET /admin
    MW->>MW: Check cookie tai_guest_id (Valid)
    MW-->>Browser: Forward request with header x-tai-org-id
    Browser-->>Admin: Render Admin Dashboard (/admin)
```

---

### Flow 2: Assessment Invite Link Generation & Token Validation

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin User
    actor Member as Team Member
    participant DistPage as Distribution UI (/admin/distribution)
    participant GenAPI as POST /api/invites/generate
    participant ValAPI as GET /api/invites/validate
    participant DB as Supabase DB

    Admin->>DistPage: Enter Team Name & Target Seats (e.g. "Engineering", 10)
    DistPage->>GenAPI: POST { team_name, target_seats } (Header: x-tai-org-id)
    GenAPI->>DB: Query team in orgId
    alt Team Exists
        DB-->>GenAPI: Return team_id
    else New Team
        GenAPI->>DB: INSERT INTO teams (organization_id, name, target_seats)
        DB-->>GenAPI: Return new team_id
    end
    GenAPI->>GenAPI: Generate 64-char token via nanoid(64)
    GenAPI->>DB: INSERT INTO assessment_invites (team_id, token, status='pending')
    GenAPI-->>DistPage: Return Invite URL (e.g. /eval/invite?token=XYZ)
    Admin->>Member: Share Invite Link

    Member->>ValAPI: GET /api/invites/validate?token=XYZ
    ValAPI->>DB: Select invite & join teams & organizations
    alt Token Invalid / Not Found
        ValAPI-->>Member: 404 { valid: false, error: 'Invalid token' }
    else Status = Completed / Expired
        ValAPI-->>Member: 410 { valid: false, expired: true }
    else Expired by Date (expires_at < NOW())
        ValAPI->>DB: UPDATE status = 'expired'
        ValAPI-->>Member: 410 { valid: false, expired: true }
    else Seat Limit Reached (responses >= target_seats)
        ValAPI->>DB: UPDATE status = 'completed'
        ValAPI-->>Member: 410 { valid: false, error: 'Maximum response limit reached' }
    else Valid Token
        ValAPI-->>Member: 200 { valid: true, team_name, organization_name, status }
    end
```

---

### Flow 3: Assessment Evaluation & Dual-Track Execution

The assessment wizard operates in two distinct tracks based on the respondent's department selection:

```mermaid
sequenceDiagram
    autonumber
    actor Respondent as Team Member
    participant Wiz as QuestionnaireWizard Component
    participant SubAPI as POST /api/assessment/submit
    participant DB as Supabase DB

    Respondent->>Wiz: Enter Name, Role & Department
    
    alt Non-Technical Department (Marketing, Sales, HR, Finance, Executive)
        Wiz->>Respondent: Step 1-5: Likert 1-4 Questions across 5 Pillars
        Respondent->>Wiz: Select Likert responses (Tool Usage, Automation, Data Literacy, Output Eval, Leadership)
        Wiz->>Wiz: Calculate Individual Score: (sum of 5 pillar scores / 20) * 100
        Wiz->>SubAPI: POST { token, team_id, respondent_name, respondent_role, respondent_department, 5 pillar scores }
    else Technical Department (Engineering, Data)
        Wiz->>Respondent: 4-Step Branching Technical Scenario ("Scaling the LangChain Prototype")
        Respondent->>Wiz: Step 1 (Infrastructure) -> Step 2 (ML Concepts) -> Step 3 (Observability) -> Step 4 (Applied Practice)
        Wiz->>Wiz: Accumulate Vector Scores (Coding, ML, Infra, Observability, Applied Practice, Deployment)
        Wiz->>Wiz: Calculate Tech Total Score (sum / 30) & Individual Score %: (tech_total / 30) * 100
        Wiz->>SubAPI: POST { token, team_id, respondent_name, respondent_role, respondent_department, 6 tech scores, tech_total_score }
    end

    SubAPI->>DB: Validate Token & Target Seat Limits
    SubAPI->>DB: INSERT INTO assessment_responses
    SubAPI->>DB: UPDATE assessment_invites SET status = ('completed' if responses >= seats else 'active')
    SubAPI-->>Wiz: 200 { success: true, individual_score }
    Wiz-->>Respondent: Render Success Screen with Score & Status Badge
```

---

### Flow 4: Real-time Scoring & Dashboard Analytics Aggregation

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin User
    participant AdminUI as Admin Dashboard (/admin)
    participant DashAPI as GET /api/dashboard
    participant ScoreEng as Scoring Engine
    participant DB as Supabase DB

    Admin->>AdminUI: View Dashboard
    AdminUI->>DashAPI: GET /api/dashboard (Header: x-tai-org-id)
    DashAPI->>DB: SELECT organization WHERE id = orgId
    DashAPI->>DB: SELECT teams WHERE organization_id = orgId
    DashAPI->>DB: SELECT responses WHERE team_id IN (teamIds)

    loop Per Team Calculations
        DashAPI->>DashAPI: Aggregate Non-Tech Pillar Means & Tech Competency Means
        DashAPI->>DashAPI: Convert pillar averages to % (score / 4 * 100 for Non-Tech, score / 6 * 100 for Tech)
    end

    DashAPI->>DashAPI: Calculate Org-level Pillar Averages across Non-Tech Teams
    DashAPI->>DB: SELECT recommendation_rules
    DashAPI->>ScoreEng: getRecommendations(orgPillarAverages, rules)
    ScoreEng-->>DashAPI: Filter rules WHERE pillarScore < threshold_max (Sorted worst first)

    opt If Tech Teams Exist
        DashAPI->>ScoreEng: getTechnicalRecommendation(avgTechScore30)
        ScoreEng-->>DashAPI: Return technical recommendation ("Beginner Builder", "Intermediate Builder", or "Applied AI-Ready")
    end

    DashAPI-->>AdminUI: 200 OK { org_score, teams, recommendations, total_responses, teams_assessed }
    AdminUI-->>Admin: Render MacroScorecard, TeamDisparityChart & ActionMatrix
```

---

### 2. Mathematical Scoring Engine Specifications

All score calculations reside in [`src/lib/scoringEngine.ts`](file:///Users/sethummethsanda/Documents/Dev/tailabs_AI-readiness/src/lib/scoringEngine.ts).

### 2.1 Individual Score Calculation (Non-Technical Persona)
For non-technical department respondents, the assessment measures 5 core pillars rated on a 1–4 Likert scale (1 = Novice, 2 = Developing, 3 = Proficient, 4 = Expert):
- Tool Usage ($P_1$)
- Workflow Automation ($P_2$)
- Data Literacy ($P_3$)
- Output Evaluation ($P_4$)
- Leadership Buy-in ($P_5$)

$$\text{Individual Score (\%)} = \left( \frac{\sum_{i=1}^{5} P_i}{20} \right) \times 100$$

### 2.2 Technical Score Calculation (Engineering / Data Persona)
For technical department respondents, scores are accumulated across 6 technical competency vectors (each rated 0–6) through decision choices in a 4-step branching scenario:
- Technical Coding ($T_1$)
- ML Concepts ($T_2$)
- Infrastructure ($T_3$)
- Observability ($T_4$)
- Applied Practice ($T_5$)
- Deployment ($T_6$)

$$\text{Technical Score (Out of 30)} = \sum_{i=1}^{6} T_i$$

$$\text{Individual Score (\%)} = \left( \frac{\text{Technical Score}}{30} \right) \times 100$$

### 2.3 Likert & Pillar Percentage Conversions
To normalize raw 1–4 Likert averages for team/org dashboard charts into standard 0–100% scale:

$$\text{Pillar Score (\%)} = \left( \frac{\text{Raw Score}}{4} \right) \times 100$$

For technical competency vectors (0–6):

$$\text{Tech Vector Score (\%)} = \left( \frac{\text{Raw Score}}{6} \right) \times 100$$

---

## 3. Status Color & Semantic Threshold Mapping

Scores map deterministically to semantic status categories across the dashboard:

| Score Range | Status Code | Label | Color Hex | Background Color |
| :--- | :--- | :--- | :--- | :--- |
| **< 40%** | `danger` | Low Readiness | `#F44336` | `rgba(244, 67, 54, 0.1)` |
| **40% – 70%** | `warning` | Developing | `#FF7300` | `rgba(255, 115, 0, 0.1)` |
| **> 70%** | `success` | High Readiness | `#4CAF50` | `rgba(76, 175, 80, 0.1)` |

---

## 4. Deterministic Recommendation Engine Rules

The recommendation engine filters database rules stored in `recommendation_rules` against the organization's aggregated pillar averages:

1. **Threshold Evaluation**: A recommendation rule is triggered if $\text{Pillar Average} < \text{threshold\_max}$.
2. **Prioritization Sorting**: Recommendations are sorted in ascending order of `pillarScore` so that the worst-performing pillar is presented at the top of the **Action Matrix**.
3. **Technical Personas**: If technical teams are present and average tech score is under 70%, a custom technical recommendation is injected:
   - Score ≤ 10/30 → **Beginner Builder**
   - Score 11–20/30 → **Intermediate Builder (7-Day Challenge)**
   - Score > 20/30 → **Applied AI-Ready**
