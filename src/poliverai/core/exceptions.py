class PoliverAIError(Exception):
    """Base exception for PoliverAI."""


class IngestionError(PoliverAIError):
    pass


class VerificationError(PoliverAIError):
    pass