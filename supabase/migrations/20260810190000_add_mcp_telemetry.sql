-- 1. MCP Integration Connections
CREATE TABLE IF NOT EXISTS mcp_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'slack', 'jira', 'github'
    status VARCHAR(20) DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'syncing', 'error')),
    config JSONB DEFAULT '{}'::jsonb, -- encrypted tokens/server URLs
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_org_provider UNIQUE (organization_id, provider)
);

-- 2. Observed Telemetry Snapshots
CREATE TABLE IF NOT EXISTS observed_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL, -- e.g., 'slack_ai_workflow_invocations', 'jira_ai_tag_ratio'
    observed_value NUMERIC(10,2) NOT NULL,
    normalized_score NUMERIC(5,2) NOT NULL, -- 0-100 scale
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add observed score column to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS observed_score NUMERIC(5,2) DEFAULT 0.00;

-- Enable Row Level Security
ALTER TABLE public.mcp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observed_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow read/write for service role & authenticated org operations
CREATE POLICY "Allow public read access to mcp_integrations"
  ON public.mcp_integrations FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to observed_telemetry"
  ON public.observed_telemetry FOR SELECT TO public USING (true);
