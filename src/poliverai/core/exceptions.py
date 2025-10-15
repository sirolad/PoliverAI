class PoliverAIError(Exception):
    """Base exception for PoliverAI."""

    pass


class IngestionError(PoliverAIError):
    pass


class VerificationError(PoliverAIError):
    pass
