"""Pydantic models package.

This package contains all Pydantic models organized by domain.
Models can be imported directly from this package for convenience.
"""

from __future__ import annotations

# API models
from .api import (
    ClauseMatch,
    ComplianceMetrics,
    ComplianceResult,
    Finding,
    IngestResponse,
    PolicyRevisionRequest,
    QueryAnswer,
    QueryRequest,
    Recommendation,
    ReportRequest,
    ReportResponse,
    VerificationReportRequest,
)

# Auth models
from .auth import (
    Token,
    TokenData,
    User,
    UserCreate,
    UserInDB,
    UserLogin,
    UserTier,
)

# Export all models for easy importing
__all__ = [
    # Auth models
    "Token",
    "TokenData",
    "User",
    "UserCreate",
    "UserInDB",
    "UserLogin",
    "UserTier",
    # API models
    "ClauseMatch",
    "ComplianceMetrics",
    "ComplianceResult",
    "Finding",
    "IngestResponse",
    "PolicyRevisionRequest",
    "QueryAnswer",
    "QueryRequest",
    "Recommendation",
    "ReportRequest",
    "ReportResponse",
    "VerificationReportRequest",
]
