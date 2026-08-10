-- Make non-tech pillar scores nullable for technical scenario assessment submissions
ALTER TABLE assessment_responses 
ALTER COLUMN tool_usage_score DROP NOT NULL,
ALTER COLUMN workflow_automation_score DROP NOT NULL,
ALTER COLUMN data_literacy_score DROP NOT NULL,
ALTER COLUMN output_evaluation_score DROP NOT NULL,
ALTER COLUMN leadership_buyin_score DROP NOT NULL;
