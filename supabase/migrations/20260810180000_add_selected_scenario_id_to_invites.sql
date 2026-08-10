-- Add selected_scenario_id column to assessment_invites table
ALTER TABLE public.assessment_invites 
ADD COLUMN IF NOT EXISTS selected_scenario_id TEXT DEFAULT 'all';
