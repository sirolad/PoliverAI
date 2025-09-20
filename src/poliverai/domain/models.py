from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Clause:
    text: str
    section: str | None = None
    start: int | None = None
    end: int | None = None


@dataclass
class ClauseMatch:
    clause: Clause
    article: str
    score: float
    explanation: str | None = None


@dataclass
class Finding:
    article: str
    description: str
    severity: str
    confidence: float


@dataclass
class Recommendation:
    article: str
    text: str


@dataclass
class ComplianceReport:
    score: int
    confidence: float
    matches: list[ClauseMatch] = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)
    recommendations: list[Recommendation] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.utcnow)
