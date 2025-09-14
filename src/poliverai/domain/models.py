from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class Clause:
    text: str
    section: Optional[str] = None
    start: Optional[int] = None
    end: Optional[int] = None


@dataclass
class ClauseMatch:
    clause: Clause
    article: str
    score: float
    explanation: Optional[str] = None


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
    matches: List[ClauseMatch] = field(default_factory=list)
    findings: List[Finding] = field(default_factory=list)
    recommendations: List[Recommendation] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.utcnow)