-- ============================================================================
-- DEMO DATASET SEED SCRIPT FOR TAI READINESS PLATFORM
-- Demo Account: username 'demo' / guest_id 'demo'
-- Scores tuned: Non-Technical (20% - 50%), Technical (~59%)
-- ============================================================================

-- 1. Insert/Upsert Demo Organization
INSERT INTO public.organizations (
  id,
  name,
  guest_id,
  aggregate_score,
  default_seat_target,
  link_validity_days,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000000',
  'Acme Corp (Global AI Transformation Demo)',
  'demo',
  42.20,
  15,
  30,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  guest_id = EXCLUDED.guest_id,
  aggregate_score = EXCLUDED.aggregate_score,
  default_seat_target = EXCLUDED.default_seat_target,
  link_validity_days = EXCLUDED.link_validity_days,
  updated_at = NOW();

-- Also register in guest_sessions
INSERT INTO public.guest_sessions (
  guest_id,
  org_id,
  created_at,
  last_seen_at
) VALUES (
  'demo',
  '00000000-0000-4000-a000-000000000000',
  NOW(),
  NOW()
) ON CONFLICT (guest_id) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  last_seen_at = NOW();

-- 2. Clear previous demo data for clean idempotent execution
DELETE FROM public.assessment_responses WHERE team_id IN (
  SELECT id FROM public.teams WHERE organization_id = '00000000-0000-4000-a000-000000000000'
);
DELETE FROM public.assessment_invites WHERE team_id IN (
  SELECT id FROM public.teams WHERE organization_id = '00000000-0000-4000-a000-000000000000'
);
DELETE FROM public.teams WHERE organization_id = '00000000-0000-4000-a000-000000000000';

-- 3. Insert 7 Showcase Teams (Tech ~59%, Non-Tech 20%-50%)
INSERT INTO public.teams (id, organization_id, name, target_seats, aggregate_score, created_at) VALUES
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000000', 'Engineering', 20, 59.20, NOW() - INTERVAL '10 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000000', 'Data & Analytics', 15, 58.80, NOW() - INTERVAL '9 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000000', 'Product & Operations', 12, 48.50, NOW() - INTERVAL '8 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000000', 'Sales & Business Dev', 15, 42.00, NOW() - INTERVAL '7 days'),
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000000', 'Marketing', 10, 36.50, NOW() - INTERVAL '6 days'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000000', 'Customer Success', 12, 28.00, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000000', 'Human Resources & Legal', 8, 22.50, NOW() - INTERVAL '4 days');

-- 4. Insert Assessment Invites
INSERT INTO public.assessment_invites (id, team_id, token, title, status, created_at, expires_at) VALUES
('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'demo-token-eng', 'Engineering AI Engineering Baseline', 'completed', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days'),
('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002', 'demo-token-data', 'Data Science & Analytics Assessment', 'completed', NOW() - INTERVAL '9 days', NOW() + INTERVAL '21 days'),
('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000003', 'demo-token-prod', 'Product Ops Workflow Assessment', 'completed', NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days'),
('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000004', 'demo-token-sales', 'Enterprise Sales AI Adoption Audit', 'active', NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days'),
('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000005', 'demo-token-mktg', 'Growth & Marketing AI Tools Evaluation', 'active', NOW() - INTERVAL '6 days', NOW() + INTERVAL '24 days'),
('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000006', 'demo-token-cs', 'Customer Success Productivity Survey', 'active', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days'),
('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-a000-000000000007', 'demo-token-hr', 'HR & Legal Compliance AI Assessment', 'pending', NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days');

-- 5. Insert Assessment Responses for Technical Teams (Engineering & Data calibrated to ~59%)
-- Engineering (16 responses: individual tech total 17-18 out of 30 -> ~59%)
INSERT INTO public.assessment_responses (
  team_id, invite_id, respondent_name, respondent_role, respondent_department,
  tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score,
  tech_coding_score, tech_ml_concepts_score, tech_infrastructure_score, tech_observability_score, tech_applied_practice_score, tech_deployment_score, tech_total_score,
  individual_score, created_at
) VALUES
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Alex Vance', 'Staff AI Systems Engineer', 'Engineering', 2, 2, 2, 2, 2, 4, 3, 4, 3, 4, 3, 21, 59.0, NOW() - INTERVAL '9 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Sarah Chen', 'Senior Backend Architect', 'Engineering', 2, 2, 2, 2, 2, 3, 4, 3, 3, 4, 3, 20, 59.0, NOW() - INTERVAL '9 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'David Kim', 'Lead DevOps & MLOps Lead', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 4, 4, 3, 3, 20, 59.0, NOW() - INTERVAL '8 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Elena Rostova', 'Senior Fullstack Engineer', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 18, 59.0, NOW() - INTERVAL '8 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Marcus Brody', 'Frontend Engineer', 'Engineering', 2, 2, 2, 2, 2, 4, 3, 3, 3, 3, 2, 18, 59.0, NOW() - INTERVAL '7 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Jessica Taylor', 'Infrastructure Lead', 'Engineering', 2, 2, 2, 2, 2, 3, 4, 4, 3, 3, 3, 20, 59.0, NOW() - INTERVAL '7 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Liam O''Connor', 'Site Reliability Engineer', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 3, 4, 3, 2, 18, 59.0, NOW() - INTERVAL '6 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Maya Patel', 'QA Automation Engineer', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '6 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Devon Thorne', 'Software Engineer II', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Rachel Green', 'Backend Developer', 'Engineering', 2, 2, 2, 2, 2, 3, 4, 3, 3, 3, 2, 18, 59.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Carlos Mendez', 'Platform Engineer', 'Engineering', 2, 2, 2, 2, 2, 4, 3, 3, 3, 3, 2, 18, 59.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Hannah Abbott', 'Security Systems Developer', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Brian Sterling', 'Engineering Director', 'Engineering', 2, 2, 2, 2, 2, 4, 3, 3, 3, 3, 3, 19, 59.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Tina Fey', 'Mobile Lead Developer', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Victor Hugo', 'Systems Programmer', 'Engineering', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Zoe Kravitz', 'Junior AI Applications Dev', 'Engineering', 2, 2, 2, 2, 2, 4, 3, 3, 3, 3, 2, 18, 59.0, NOW() - INTERVAL '1 day');

-- Data & Analytics (11 responses: individual tech total ~17-18 out of 30 -> ~59%)
INSERT INTO public.assessment_responses (
  team_id, invite_id, respondent_name, respondent_role, respondent_department,
  tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score,
  tech_coding_score, tech_ml_concepts_score, tech_infrastructure_score, tech_observability_score, tech_applied_practice_score, tech_deployment_score, tech_total_score,
  individual_score, created_at
) VALUES
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Dr. Aris Thorne', 'Principal Data Scientist', 'Data & Analytics', 2, 2, 2, 2, 2, 4, 4, 3, 3, 4, 3, 21, 59.0, NOW() - INTERVAL '8 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Priya Sharma', 'Lead Machine Learning Engineer', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 4, 3, 3, 4, 3, 20, 59.0, NOW() - INTERVAL '8 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Kevin Zhang', 'Senior Analytics Engineer', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 18, 59.0, NOW() - INTERVAL '7 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Chloe Bennett', 'BI Developer & Analyst', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '7 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Gabriel Ruiz', 'Quantitative Data Engineer', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 4, 3, 3, 3, 2, 18, 59.0, NOW() - INTERVAL '6 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Nadia Ali', 'AI Research Specialist', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 4, 3, 3, 3, 2, 18, 59.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Samuel Jackson', 'Data Governance Specialist', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Grace Hopper', 'Data Infrastructure Architect', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 3, 4, 3, 3, 2, 18, 59.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Alan Turing', 'Senior Statistician', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Ada Lovelace', 'Mathematical Modeling Engineer', 'Data & Analytics', 2, 2, 2, 2, 2, 4, 4, 3, 3, 3, 2, 19, 59.0, NOW() - INTERVAL '1 day'),
('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-b000-000000000002', 'Oliver Queen', 'Junior Data Analyst', 'Data & Analytics', 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 17, 59.0, NOW() - INTERVAL '12 hours');

-- 6. Insert Assessment Responses for Non-Technical Showcase Teams (Calibrated 20% to 50%)
-- Product & Operations (9 responses -> ~48.5%)
INSERT INTO public.assessment_responses (
  team_id, invite_id, respondent_name, respondent_role, respondent_department,
  tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score,
  individual_score, created_at
) VALUES
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Claire Underwood', 'VP of Product Strategy', 'Product & Operations', 2, 2, 2, 2, 2, 50.0, NOW() - INTERVAL '7 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Marcus Aurelius', 'Director of Product Ops', 'Product & Operations', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '7 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Diana Prince', 'Senior Product Manager', 'Product & Operations', 2, 2, 2, 2, 2, 50.0, NOW() - INTERVAL '6 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Bruce Wayne', 'Operations Systems Lead', 'Product & Operations', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Barry Allen', 'Process Efficiency Manager', 'Product & Operations', 2, 2, 2, 2, 2, 50.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Arthur Curry', 'Technical Program Manager', 'Product & Operations', 2, 2, 2, 2, 2, 50.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Hal Jordan', 'Product Owner - Core Platform', 'Product & Operations', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Victor Stone', 'Workflow Operations Analyst', 'Product & Operations', 2, 2, 2, 2, 2, 50.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-b000-000000000003', 'Clark Kent', 'Product Operations Lead', 'Product & Operations', 2, 2, 2, 2, 2, 50.0, NOW() - INTERVAL '1 day');

-- Sales & Business Dev (11 responses -> ~42.0%)
INSERT INTO public.assessment_responses (
  team_id, invite_id, respondent_name, respondent_role, respondent_department,
  tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score,
  individual_score, created_at
) VALUES
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Jordan Belfort', 'Global VP of Sales', 'Sales', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '6 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Don Draper', 'Enterprise Account Executive', 'Sales', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '6 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Peggy Olson', 'Sales Enablement Manager', 'Sales', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Pete Campbell', 'Regional Sales Director', 'Sales', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Roger Sterling', 'Strategic Accounts Partner', 'Sales', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Joan Holloway', 'Sales Operations Manager', 'Sales', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Ken Cosgrove', 'Account Executive', 'Sales', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Harry Crane', 'Sales Development Manager', 'Sales', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Betty Francis', 'Sales Development Rep', 'Sales', 2, 1, 1, 1, 2, 35.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Bert Cooper', 'Senior Managing Director', 'Sales', 2, 2, 2, 1, 2, 45.0, NOW() - INTERVAL '1 day'),
('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-b000-000000000004', 'Stan Rizzo', 'Sales Solutions Engineer', 'Sales', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '12 hours');

-- Marketing (7 responses -> ~36.5%)
INSERT INTO public.assessment_responses (
  team_id, invite_id, respondent_name, respondent_role, respondent_department,
  tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score,
  individual_score, created_at
) VALUES
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000005', 'Emily Cooper', 'VP of Global Marketing', 'Marketing', 2, 1, 1, 1, 2, 35.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000005', 'Sylvie Grateau', 'Director of Brand Strategy', 'Marketing', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '5 days'),
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000005', 'Luc Lambert', 'Content Operations Lead', 'Marketing', 2, 1, 1, 1, 2, 35.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000005', 'Julien Dubois', 'Digital Growth Specialist', 'Marketing', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000005', 'Mindy Chen', 'Social Media Lead', 'Marketing', 1, 1, 1, 1, 2, 30.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000005', 'Gabriel St. Jean', 'Creative Copywriter', 'Marketing', 2, 1, 1, 1, 2, 35.0, NOW() - INTERVAL '1 day'),
('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-b000-000000000005', 'Camille Razat', 'Product Marketing Manager', 'Marketing', 2, 1, 2, 1, 2, 40.0, NOW() - INTERVAL '6 hours');

-- Customer Success (8 responses -> ~28.0%)
INSERT INTO public.assessment_responses (
  team_id, invite_id, respondent_name, respondent_role, respondent_department,
  tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score,
  individual_score, created_at
) VALUES
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Pam Beesly', 'Director of Customer Care', 'Customer Success', 1, 1, 1, 1, 2, 30.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Jim Halpert', 'Customer Success Lead', 'Customer Success', 1, 1, 1, 1, 2, 30.0, NOW() - INTERVAL '4 days'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Dwight Schrute', 'Assistant Regional CS Lead', 'Customer Success', 1, 1, 1, 1, 1, 25.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Phyllis Vance', 'Enterprise Support Specialist', 'Customer Success', 1, 1, 1, 1, 1, 25.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Stanley Hudson', 'Senior Client Account Manager', 'Customer Success', 1, 1, 1, 1, 1, 25.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Oscar Martinez', 'Support Operations Analyst', 'Customer Success', 1, 1, 2, 1, 2, 35.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Angela Martin', 'Support Compliance Manager', 'Customer Success', 1, 1, 1, 1, 1, 25.0, NOW() - INTERVAL '1 day'),
('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-b000-000000000006', 'Kevin Malone', 'Tier 1 Support Agent', 'Customer Success', 1, 1, 1, 1, 1, 25.0, NOW() - INTERVAL '4 hours');

-- Human Resources & Legal (5 responses -> ~22.5%)
INSERT INTO public.assessment_responses (
  team_id, invite_id, respondent_name, respondent_role, respondent_department,
  tool_usage_score, workflow_automation_score, data_literacy_score, output_evaluation_score, leadership_buyin_score,
  individual_score, created_at
) VALUES
('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000007', 'Toby Flenderson', 'VP of Human Resources', 'HR & Legal', 1, 1, 1, 1, 1, 20.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000007', 'Holly Flax', 'HR Business Partner', 'HR & Legal', 1, 1, 1, 1, 1, 25.0, NOW() - INTERVAL '3 days'),
('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000007', 'Harvey Specter', 'Senior Corporate Counsel', 'HR & Legal', 1, 1, 1, 1, 1, 25.0, NOW() - INTERVAL '2 days'),
('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000007', 'Mike Ross', 'Legal Compliance Specialist', 'HR & Legal', 1, 1, 1, 1, 1, 20.0, NOW() - INTERVAL '1 day'),
('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-b000-000000000007', 'Rachel Zane', 'Talent Acquisition Manager', 'HR & Legal', 1, 1, 1, 1, 1, 20.0, NOW() - INTERVAL '8 hours');

-- 7. Update Team & Organization Aggregate Scores
UPDATE public.teams SET aggregate_score = 59.20 WHERE id = '00000000-0000-4000-a000-000000000001';
UPDATE public.teams SET aggregate_score = 58.80 WHERE id = '00000000-0000-4000-a000-000000000002';
UPDATE public.teams SET aggregate_score = 48.50 WHERE id = '00000000-0000-4000-a000-000000000003';
UPDATE public.teams SET aggregate_score = 42.00 WHERE id = '00000000-0000-4000-a000-000000000004';
UPDATE public.teams SET aggregate_score = 36.50 WHERE id = '00000000-0000-4000-a000-000000000005';
UPDATE public.teams SET aggregate_score = 28.00 WHERE id = '00000000-0000-4000-a000-000000000006';
UPDATE public.teams SET aggregate_score = 22.50 WHERE id = '00000000-0000-4000-a000-000000000007';

UPDATE public.organizations SET aggregate_score = 42.20 WHERE id = '00000000-0000-4000-a000-000000000000';
