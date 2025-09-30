from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"
    reports_dir: str = "reports"

    # RAG settings
    chroma_persist_dir: str = "data/chroma"
    chroma_collection: str = "poliverai"

    # OpenAI configuration (do not log values)
    openai_api_key: str | None = None
    openai_base_url: str | None = None  # allow routing via proxy if set
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    # Chunking/retrieval
    chunk_size_tokens: int = 300
    chunk_overlap_tokens: int = 80
    top_k: int = 5

    # Hybrid retrieval weights
    retrieval_vector_weight: float = 1.0
    retrieval_lexical_weight: float = 0.3
    retrieval_article_boost: float = 0.15

    # Ignore unknown keys in .env to remain compatible with older configs
    model_config = SettingsConfigDict(env_file=".env", env_prefix="POLIVERAI_", extra="ignore")


def get_settings() -> Settings:
    return Settings()
