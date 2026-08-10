# REST API Reference & Endpoint Specifications

This document provides exhaustive API documentation for all REST endpoints exposed by the **TAI Labs Enterprise AI Readiness Platform**.

---

## Global Headers & Authentication

### Protected Endpoints
Protected endpoints require session authentication managed via the HttpOnly cookie `tai_guest_id` or the injected header `x-tai-org-id`.

| Header Name | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | Must be `application/json` for POST requests | Yes (POST) |
| `x-tai-org-id` | `string` | Injected automatically by middleware from `tai_guest_id` cookie | Yes (Protected routes) |

---

## 1. Authentication Endpoints

### 1.1 `POST /api/auth/guest-login`
Initializes or fetches a guest admin organization and sets a session cookie.

- **Authentication**: Public
- **Method**: `POST`

#### Request Body
```json
{
  "guestId": "guest_a1b2c3d4_l1k2j3h4"
}
```

#### Responses
- **`200 OK`**: Successfully authenticated or initialized guest session.
  ```json
  {
    "success": true,
    "orgId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
  ```
  *Response sets HttpOnly Cookie: `tai_guest_id=<orgId>; Path=/; Max-Age=86400; SameSite=Lax`*

- **`400 Bad Request`**: Missing or invalid guest ID.
  ```json
  {
    "error": "Invalid guest ID"
  }
  ```

- **`500 Internal Server Error`**: Database error creating guest org.

---

### 1.2 `POST /api/auth/logout`
Clears the `tai_guest_id` session cookie.

- **Authentication**: Public
- **Method**: `POST`

#### Responses
- **`200 OK`**: Successfully logged out.
  ```json
  {
    "success": true
  }
  ```

---

## 2. Invite Management Endpoints

### 2.1 `POST /api/invites/generate`
Generates a new 64-character token invite link for a specified team.

- **Authentication**: Protected (Requires `x-tai-org-id`)
- **Method**: `POST`

#### Request Body
```json
{
  "team_name": "Engineering",
  "target_seats": 10
}
```

#### Responses
- **`200 OK`**: Invite successfully generated.
  ```json
  {
    "success": true,
    "invite_id": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
    "token": "a1b2c3d4e5f6...",
    "url": "http://localhost:3000/eval/invite?token=a1b2c3d4e5f6..."
  }
  ```

- **`400 Bad Request`**: `team_name` missing.

- **`401 Unauthorized`**: `x-tai-org-id` missing.

- **`404 Not Found`**: Organization not found.

---

### 2.2 `GET /api/invites/list`
Lists all generated assessment invites and team seat completion metrics for the current organization.

- **Authentication**: Protected (Requires `x-tai-org-id`)
- **Method**: `GET`

#### Responses
- **`200 OK`**: List of active and completed invites.
  ```json
  {
    "invites": [
      {
        "id": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
        "title": "AI Readiness Assessment",
        "token": "a1b2c3d4e5f6...",
        "status": "active",
        "created_at": "2026-08-10T00:00:00Z",
        "expires_at": "2026-09-09T00:00:00Z",
        "url": "http://localhost:3000/eval/invite?token=a1b2c3d4e5f6...",
        "team": {
          "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
          "name": "Engineering",
          "target_seats": 10,
          "response_count": 3
        }
      }
    ]
  }
  ```

---

### 2.3 `GET /api/invites/validate`
Validates an assessment token before displaying the questionnaire wizard to a team member.

- **Authentication**: Public
- **Method**: `GET`
- **Query Parameters**: `token` (Required)

#### Responses
- **`200 OK`**: Valid active token.
  ```json
  {
    "valid": true,
    "invite_id": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
    "team_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    "team_name": "Engineering",
    "organization_name": "Acme Corp",
    "status": "active",
    "title": "AI Readiness Assessment"
  }
  ```

- **`400 Bad Request`**: Token parameter missing.

- **`404 Not Found`**: Invalid token.

- **`410 Gone (Expired / Completed)`**: Link has expired or max response limit reached.
  ```json
  {
    "valid": false,
    "error": "This assessment link has reached its maximum response limit (10/10) and is now complete.",
    "expired": true
  }
  ```

---

## 3. Assessment & Dashboard Endpoints

### 3.1 `POST /api/assessment/submit`
Submits completed survey responses for both non-technical (Likert) and technical (branching scenario) personas.

- **Authentication**: Public (Validated via `token`)
- **Method**: `POST`

#### Request Body (Non-Technical Persona Example)
```json
{
  "token": "a1b2c3d4e5f6...",
  "invite_id": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
  "team_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "respondent_name": "Alice Smith",
  "respondent_role": "Product Manager",
  "respondent_department": "Product",
  "tool_usage_score": 3,
  "workflow_automation_score": 2,
  "data_literacy_score": 4,
  "output_evaluation_score": 3,
  "leadership_buyin_score": 3
}
```

#### Request Body (Technical Persona Example)
```json
{
  "token": "a1b2c3d4e5f6...",
  "invite_id": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
  "team_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "respondent_name": "Bob Johnson",
  "respondent_role": "Senior Engineer",
  "respondent_department": "Engineering",
  "tech_coding_score": 5,
  "tech_ml_concepts_score": 4,
  "tech_infrastructure_score": 4,
  "tech_observability_score": 3,
  "tech_applied_practice_score": 5,
  "tech_deployment_score": 4
}
```

#### Responses
- **`200 OK`**: Response saved successfully.
  ```json
  {
    "success": true,
    "response_id": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c",
    "individual_score": 75,
    "message": "Assessment submitted successfully. Team scores have been updated."
  }
  ```

- **`400 Bad Request`**: Missing required identity fields or pillar score out of bounds (1–4).

- **`410 Gone`**: Assessment token expired or target seat limit reached.

---

### 3.2 `GET /api/dashboard`
Fetches aggregated readiness scorecards, team breakdown metrics, and personalized upskilling recommendations.

- **Authentication**: Protected (Requires `x-tai-org-id`)
- **Method**: `GET`

#### Responses
- **`200 OK`**: Aggregated analytics payload.
  ```json
  {
    "has_data": true,
    "org_score": 72.5,
    "org_name": "Acme Corp",
    "org_pillar_averages": {
      "tool_usage": 75,
      "workflow_automation": 65,
      "data_literacy": 80,
      "output_evaluation": 70,
      "leadership_buyin": 72.5
    },
    "teams": [
      {
        "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "name": "Marketing",
        "aggregate_score": 70,
        "target_seats": 10,
        "response_count": 5,
        "is_tech": false,
        "pillar_averages": {
          "tool_usage": 75,
          "workflow_automation": 60,
          "data_literacy": 75,
          "output_evaluation": 70,
          "leadership_buyin": 70
        }
      }
    ],
    "recommendations": [
      {
        "id": "rec_workflow_01",
        "pillar": "workflow_automation",
        "title": "Automate Standard Operating Procedures",
        "description": "Implement Zapier or Make.com integrations to embed AI into routine team workflows.",
        "action_label": "Explore Integration Playbook",
        "action_url": null,
        "pillarScore": 65
      }
    ],
    "total_responses": 5,
    "teams_assessed": 1,
    "total_teams": 1
  }
  ```
