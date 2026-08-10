-- Create assessment_templates table
CREATE TABLE IF NOT EXISTS public.assessment_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    department_type VARCHAR(50) NOT NULL DEFAULT 'Engineering', -- 'Engineering' or 'General'
    schema_payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_org_dept_template UNIQUE (organization_id, department_type)
);

-- Index for fast lookup by organization and department
CREATE INDEX IF NOT EXISTS idx_assessment_templates_org_dept 
ON public.assessment_templates(organization_id, department_type);

-- Enable RLS
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to view and manage assessment templates
CREATE POLICY "Admins can manage assessment templates"
ON public.assessment_templates
FOR ALL
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
