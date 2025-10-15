# PoliverAI

**Policy Verification Assistant** focused on GDPR compliance. Upload policies, verify clause-level compliance, get explanations and recommendations, generate exportable reports, ask GDPR questions, and compare versions.

## 🚀 Quick Start

### Backend Setup
1. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -e ".[dev]"     # Core + dev tools
   pip install -e ".[rag]"     # Optional RAG dependencies
   ```
   Or use the bootstrap script: `./scripts/dev/bootstrap.sh`

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key:
   export POLIVERAI_OPENAI_API_KEY="your-api-key-here"
   ```

4. Ingest GDPR knowledge base (optional but recommended):
   ```bash
   poliverai ingest gdpr.pdf
   ```

5. Start the API server:
   ```bash
   ./scripts/run_server.sh
   ```
   The API will be available at: http://127.0.0.1:8000/docs

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at: http://localhost:5173

## ✨ Features

### Core Functionality
- **📄 Document Upload & Verification** - Support for Privacy Policies, Terms of Service, and Data Processing Agreements
- **🔍 Clause-Level Analysis** - Detailed evidence extraction and compliance explanations
- **💡 Smart Recommendations** - Actionable suggestions for improving compliance
- **📊 Compliance Scoring** - Automated scoring with confidence indicators
- **📋 Report Generation** - Export compliance reports in PDF and DOC formats
- **❓ GDPR Q&A Mode** - Interactive querying of GDPR requirements
- **📚 Educational Resources** - Built-in GDPR guidance and documentation

### Technical Features
- **🤖 RAG-Powered** - Retrieval-Augmented Generation for accurate compliance checking
- **🎯 Vector Search** - Semantic search through GDPR articles and regulations
- **⚡ FastAPI Backend** - High-performance Python API with automatic documentation
- **⚛️ React Frontend** - Modern TypeScript React application with Vite
- **🎨 Responsive UI** - Clean, accessible interface built with Tailwind CSS and Radix UI

## 📦 Tech Stack

### Backend
- **Python 3.10+** - Core runtime
- **FastAPI** - Modern web framework with automatic API documentation
- **Pydantic** - Data validation and settings management
- **Sentence Transformers** - Text embeddings for semantic search
- **FAISS** - Vector similarity search
- **ReportLab** - PDF report generation
- **PDFPlumber & python-docx** - Document parsing
- **BeautifulSoup** - HTML parsing

### Frontend
- **React 19** - Component-based UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Hook Form + Zod** - Form handling and validation
- **Axios** - HTTP client
- **React Router** - Client-side routing

### Development
- **Ruff** - Python linting and formatting
- **MyPy** - Static type checking
- **Pytest** - Testing framework
- **Pre-commit** - Git hooks for code quality
- **ESLint** - JavaScript/TypeScript linting

## 📁 Project Structure

```
PoliverAI/
├── src/poliverai/           # Python backend
│   ├── app/              # FastAPI app and API routes
│   ├── core/             # Config, logging, exceptions, types
│   ├── domain/           # Core data models
│   ├── ingestion/        # Document readers (PDF/DOCX/HTML)
│   ├── preprocessing/    # Text cleaning and segmentation
│   ├── knowledge/        # GDPR articles and compliance mappings
│   ├── retrieval/        # Vector embeddings and search
│   ├── verification/     # Compliance matching and scoring
│   ├── reporting/        # Report templates and export
│   └── services/         # Business logic orchestration
├── frontend/               # React TypeScript frontend
│   ├── src/
│   └── public/
├── tests/                 # Backend tests
├── scripts/               # Development and deployment scripts
├── configs/               # Configuration templates
├── data/                  # Vector store and knowledge base
└── reports/               # Generated compliance reports
```

## 🛠️ Development

### Backend Development
```bash
# Run tests
pytest

# Lint and format
ruff check src/ tests/
ruff format src/ tests/

# Type checking
mypy src/

# Run pre-commit hooks
pre-commit run --all-files
```

### Frontend Development
```bash
cd frontend/

# Run in development mode
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

### Available Scripts
- `./scripts/run_server.sh` - Start the FastAPI development server
- `./scripts/dev/bootstrap.sh` - Set up development environment
- `poliverai ingest <file>` - Ingest documents into vector store

## 📝 Environment Configuration

Configuration can be set via:
1. **Environment variables** - Direct export or `.env` file
2. **YAML config** - Copy `configs/settings.example.yaml` and customize
3. **CLI arguments** - Override specific settings

### Required Environment Variables
```bash
POLIVERAI_OPENAI_API_KEY="your-openai-api-key"
```

### Optional Configuration
```bash
POLIVERAI_LOG_LEVEL="INFO"
POLIVERAI_VECTOR_STORE_PATH="./data/vector_store"
POLIVERAI_REPORTS_OUTPUT_DIR="./reports"
```

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src/poliverai

# Run specific test modules
pytest tests/test_verification.py
pytest tests/test_ingestion.py
```

### Frontend Tests
```bash
cd frontend/
# Frontend testing setup is included but tests need to be implemented
npm test  # When tests are added
```

## 📦 Installation Notes

- **PDF Generation**: Uses ReportLab by default for portability. Can be switched to WeasyPrint if system dependencies are available
- **RAG Dependencies**: Heavy ML dependencies are optional (`pip install -e ".[rag]"`)
- **Vector Store**: FAISS-based vector store for semantic search capabilities
- **Document Processing**: Supports PDF, DOCX, and HTML document formats

## 🚀 Deployment

### Production Setup
1. Set up proper environment variables
2. Install production dependencies: `pip install -e "."`
3. Build frontend: `cd frontend && npm run build`
4. Configure reverse proxy (nginx/Apache)
5. Set up process manager (systemd/supervisor)

### Docker Support
Docker configuration can be added for containerized deployment.

## 📜 Documentation

- **API Documentation**: Available at `http://127.0.0.1:8000/docs` when running the server
- **Interactive API**: Swagger UI with request/response examples
- **Configuration**: See `configs/settings.example.yaml` for all options

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run pre-commit hooks: `pre-commit run --all-files`
5. Submit a pull request

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.
