ALTER TABLE assessment_responses
ADD COLUMN respondent_department TEXT,
ADD COLUMN tech_coding_score INT CHECK (tech_coding_score BETWEEN 0 AND 6),
ADD COLUMN tech_ml_concepts_score INT CHECK (tech_ml_concepts_score BETWEEN 0 AND 6),
ADD COLUMN tech_infrastructure_score INT CHECK (tech_infrastructure_score BETWEEN 0 AND 6),
ADD COLUMN tech_observability_score INT CHECK (tech_observability_score BETWEEN 0 AND 6),
ADD COLUMN tech_applied_practice_score INT CHECK (tech_applied_practice_score BETWEEN 0 AND 6),
ADD COLUMN tech_deployment_score INT CHECK (tech_deployment_score BETWEEN 0 AND 6),
ADD COLUMN tech_total_score INT CHECK (tech_total_score BETWEEN 0 AND 30);
