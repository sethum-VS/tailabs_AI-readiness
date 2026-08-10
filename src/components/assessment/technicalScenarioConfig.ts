export interface VectorScores {
  tech_coding_score?: number
  tech_ml_concepts_score?: number
  tech_infrastructure_score?: number
  tech_observability_score?: number
  tech_applied_practice_score?: number
  tech_deployment_score?: number
}

export interface ScenarioOption {
  id: string
  text: string
  vectors: VectorScores
  next_context: string
}

export interface ScenarioNode {
  step: number
  pillar_focus: string
  context?: string
  prompt: string
  options: ScenarioOption[]
}

export interface ScenarioConfig {
  scenario_id: string
  title: string
  nodes: ScenarioNode[]
}

export const TECHNICAL_SCENARIO: ScenarioConfig = {
  "scenario_id": "prototype_to_prod",
  "title": "Scaling the LangChain Prototype",
  "nodes": [
    {
      "step": 1,
      "pillar_focus": "infrastructure",
      "context": "Your LangChain prototype works perfectly on your local machine, but the client wants a live alpha version accessible to their QA team by Friday.",
      "prompt": "How do you architect the initial deployment?",
      "options": [
        {
          "id": "1a",
          "text": "Wrap the script in FastAPI, containerize it with Docker, and push it to a managed cloud runner.",
          "vectors": { "tech_infrastructure_score": 2, "tech_deployment_score": 2, "tech_coding_score": 1 },
          "next_context": "The Docker container is live and stable. However, as QA starts testing, response times spike to over 10 seconds per query."
        },
        {
          "id": "1b",
          "text": "Push the raw Python scripts to a serverless cloud function to save on persistent computing costs.",
          "vectors": { "tech_infrastructure_score": 1, "tech_deployment_score": 1, "tech_coding_score": 0 },
          "next_context": "The serverless functions are suffering from massive cold-start delays, pushing response times over 10 seconds."
        },
        {
          "id": "1c",
          "text": "Set up a quick Streamlit interface running on a dedicated virtual machine.",
          "vectors": { "tech_infrastructure_score": 0, "tech_deployment_score": 1, "tech_coding_score": 1 },
          "next_context": "The Streamlit UI is up, but it's single-threaded and locking up for concurrent QA users, causing 10-second delays."
        }
      ]
    },
    {
      "step": 2,
      "pillar_focus": "ml_concepts",
      "prompt": "To fix the extreme latency, what is your immediate technical intervention?",
      "options": [
        {
          "id": "2a",
          "text": "Implement semantic caching with Redis so duplicate QA queries return instantly without hitting the LLM API.",
          "vectors": { "tech_ml_concepts_score": 2, "tech_infrastructure_score": 1, "tech_observability_score": 0 },
          "next_context": "Latency drops significantly for repeated queries. But now, the client reports the AI is making up company policies."
        },
        {
          "id": "2b",
          "text": "Switch the model from Claude 3.5 Sonnet to Claude 3 Haiku to prioritize token generation speed.",
          "vectors": { "tech_ml_concepts_score": 1, "tech_applied_practice_score": 2, "tech_infrastructure_score": 0 },
          "next_context": "Speed improves, but the smaller model struggles with the complex context. It starts hallucinating company policies."
        },
        {
          "id": "2c",
          "text": "Rewrite the retrieval pipeline to process document chunks concurrently rather than sequentially.",
          "vectors": { "tech_coding_score": 2, "tech_ml_concepts_score": 1, "tech_infrastructure_score": 0 },
          "next_context": "The pipeline is highly optimized, but the LLM itself is still occasionally generating hallucinated company policies."
        }
      ]
    },
    {
      "step": 3,
      "pillar_focus": "observability",
      "prompt": "The hallucinations are a critical blocker. How do you implement a system to catch and measure these failures?",
      "options": [
        {
          "id": "3a",
          "text": "Integrate LangFuse or a similar tracing tool to capture full prompt-completion pairs and cost metrics for analysis.",
          "vectors": { "tech_observability_score": 2, "tech_applied_practice_score": 1, "tech_coding_score": 0 },
          "next_context": "You now have full visibility into the execution traces. You notice the vector store is retrieving outdated employee handbooks."
        },
        {
          "id": "3b",
          "text": "Write a secondary 'Evaluator LLM' prompt that checks the final output against the retrieved context before returning it to the user.",
          "vectors": { "tech_observability_score": 1, "tech_applied_practice_score": 2, "tech_ml_concepts_score": 1 },
          "next_context": "The evaluator catches the errors, doubling your API costs. You notice the root cause is the vector store retrieving outdated handbooks."
        },
        {
          "id": "3c",
          "text": "Log all inputs and outputs to a standard PostgreSQL table for manual review at the end of the day.",
          "vectors": { "tech_observability_score": 0, "tech_infrastructure_score": 1, "tech_coding_score": 1 },
          "next_context": "You have a basic log, but it's hard to parse. Still, you spot that the vector store is retrieving outdated employee handbooks."
        }
      ]
    },
    {
      "step": 4,
      "pillar_focus": "applied_practice",
      "prompt": "You need to fix the retrieval of outdated documents. How do you handle metadata and cache invalidation in your vector database?",
      "options": [
        {
          "id": "4a",
          "text": "Attach timestamp and department metadata to every vector payload, and filter by 'latest' during the similarity search.",
          "vectors": { "tech_applied_practice_score": 2, "tech_coding_score": 2, "tech_ml_concepts_score": 1 },
          "next_context": "The data is now strictly accurate. The client gives the green light to deploy this to the production environment."
        },
        {
          "id": "4b",
          "text": "Wipe the entire vector database and re-embed all current documents from scratch to guarantee freshness.",
          "vectors": { "tech_applied_practice_score": 0, "tech_infrastructure_score": 0, "tech_ml_concepts_score": 1 },
          "next_context": "It's expensive and slow, but the data is accurate. The client gives the green light to deploy to the production environment."
        }
      ]
    }
  ]
}
