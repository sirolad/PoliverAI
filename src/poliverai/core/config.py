from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"
    reports_dir: str = "reports"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="POLIVERAI_")


def get_settings() -> Settings:
    return Settings()