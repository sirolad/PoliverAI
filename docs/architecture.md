# Architecture Overview

PoliverAI follows a modular, layered design:

- app: API surface (FastAPI) and CLI
- services: orchestration pipelines for verify/query/compare flows
- ingestion + preprocessing: input document handling and text normalization
- knowledge: curated GDPR sources and mappings
- retrieval: embedding and vector index functions
- verification: rule checks, matching, scoring, explanations, recommendations
- comparison: version diffing and scoring
- reporting: export pipeline, templating, PDF adapter
- domain: core entities shared across layers
- core: config, logging, exceptions, shared types

Data flow (verify):
Upload → ingestion → preprocessing → retrieval (optional) → verification (rules/match/score) → reporting