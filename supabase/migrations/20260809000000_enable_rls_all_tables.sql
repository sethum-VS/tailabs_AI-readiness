-- Enable Row Level Security on public tables currently missing RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_rules ENABLE ROW LEVEL SECURITY;

-- Allow public read access to recommendation_rules (read-only reference data)
CREATE POLICY "Allow public read access to recommendation_rules"
  ON public.recommendation_rules
  FOR SELECT
  TO public
  USING (true);
