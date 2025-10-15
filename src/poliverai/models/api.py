"""API request and response Pydantic models.

This module contains Pydantic models for API requests and responses
across different endpoints and services.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


# Query models
class QueryRequest(BaseModel):
    """Model for query requests."""

    question: str


class QueryAnswer(BaseModel):
    """Model for query responses."""

    answer: str
    sources: list[str]


# Ingestion models
class IngestResponse(BaseModel):
    """Model for ingestion responses."""

    files: int
    chunks: int
    skipped: list[dict]


# Verification models
class ClauseMatch(BaseModel):
    """Model for compliance clause matches."""

    article: str
    policy_excerpt: str
    score: float


class Finding(BaseModel):
    """Model for compliance findings."""

    article: str
    issue: str
    severity: str
    confidence: float


class Recommendation(BaseModel):
    """Model for compliance recommendations."""

    article: str
    suggestion: str


class ComplianceMetrics(BaseModel):
    """Model for compliance analysis metrics."""

    total_violations: int
    total_fulfills: int
    critical_violations: int


class ComplianceResult(BaseModel):
    """Model for compliance analysis results."""

    verdict: str
    score: int
    confidence: float
    evidence: list[ClauseMatch]
    findings: list[Finding]
    recommendations: list[Recommendation]
    summary: str
    metrics: ComplianceMetrics


# Report models
class ReportRequest(BaseModel):
    """Model for report generation requests."""

    content: str
    format: str = "pdf"  # or "markdown"
    title: str | None = "Compliance Report"


class VerificationReportRequest(BaseModel):
    """Model for verification report generation requests."""

    verdict: str
    score: int
    confidence: float
    findings: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    metrics: dict[str, Any]
    analysis_mode: str = "balanced"
    document_name: str | None = "Policy Document"


class PolicyRevisionRequest(BaseModel):
    """Model for policy revision requests."""

    original_document: str
    findings: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    document_name: str | None = "Policy Document"
    revision_mode: str = "comprehensive"  # comprehensive, minimal, or targeted


class ReportResponse(BaseModel):
    """Model for report generation responses."""

    filename: str
    path: str
    download_url: str
