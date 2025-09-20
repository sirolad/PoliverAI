# PoliverAI

Policy Verification Assistant focused on GDPR compliance. Upload policies, verify clause-level compliance, get explanations and recommendations, generate exportable reports, ask GDPR questions, and compare versions.

## RAG quickstart (ingest GDPR PDF)
1. Ensure your virtualenv is active and OpenAI key is set:
   ```bash
   source .venv/bin/activate
   export POLIVERAI_OPENAI_API_KEY={{OPENAI_API_KEY}}
   ```
2. Ingest the included GDPR PDF into the vector store:
   ```bash
   poliverai ingest gdpr.pdf
   ```
3. Run the server and open the UI:
   ```bash
   ./scripts/run_server.sh
   # open http://127.0.0.1:8000/ui
   ```
4. In the UI, upload your policy document on the Ingest tab (optional), then ask questions in the Ask tab.

## Features (MVP Scope)
- Upload & verify documents (Privacy Policy, ToS, DPA)
- Clause-level evidence & explanations
- Actionable recommendations
- Compliance score & confidence
- Exportable compliance reports (PDF/Doc)
- Query mode (Ask GDPR)
- Comparison mode
- Educational docs

## Quickstart (local)
1. Create a virtual environment and install deps:
   - With pip:
     - `python3 -m venv .venv && source .venv/bin/activate`
     - `python -m pip install --upgrade pip`
     - `pip install -e ".[dev]"`  # dev tools
     - `pip install -e ".[rag]" || true`  # optional RAG deps
   - Or run: `scripts/dev/bootstrap.sh`

2. Run the API server:
   - `./scripts/run_server.sh`
   - Then visit: http://127.0.0.1:8000/docs

3. Project layout (selected):
```
src/poliverai/
  app/              # FastAPI app and API routes
  core/             # Config, logging, exceptions, types
  domain/           # Core data models
  ingestion/        # Readers (pdf/docx/html), optional OCR
  preprocessing/    # Cleaning, segmentation, language detection
  knowledge/        # GDPR articles and mappings
  retrieval/        # Embeddings, vector index, search
  verification/     # Matcher, rules, scoring, explanations
  comparison/       # Diffing and scoring
  reporting/        # Report exporter and templates
  services/         # Orchestration pipelines
```

## Notes
- PDF generation uses ReportLab by default for portability. You can later switch to WeasyPrint if system deps are installed.
- Heavy RAG deps are optional (`.[rag]`).
- Set environment via `.env` or `configs/settings.example.yaml`.
