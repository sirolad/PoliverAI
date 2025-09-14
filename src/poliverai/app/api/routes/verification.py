from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from typing import List


class ClauseMatch(BaseModel):
    article: str
    policy_excerpt: str
    score: float


class Finding(BaseModel):
    article: str
    issue: str
    severity: str
    confidence: float


class Recommendation(BaseModel):
    article: str
    suggestion: str


class ComplianceResult(BaseModel):
    verdict: str
    score: int
    confidence: float
    evidence: List[ClauseMatch]
    findings: List[Finding]
    recommendations: List[Recommendation]


router = APIRouter(tags=["verification"])


@router.post("/verify", response_model=ComplianceResult)
async def verify(file: UploadFile = File(...)) -> ComplianceResult:
    # Read raw bytes and best-effort decode to text for placeholder processing
    raw = await file.read()
    try:
        text = raw.decode("utf-8", errors="ignore")
    except Exception:
        text = ""

    # Very naive placeholder logic: if certain keywords exist, bump score
    keywords = ["data retention", "erasure", "lawful", "consent", "access"]
    hits = sum(1 for k in keywords if k in text.lower())
    score = min(100, 40 + hits * 12)
    verdict = "compliant" if score >= 70 else "non_compliant"

    evidence = [
        ClauseMatch(article="Article 5(1)(e)", policy_excerpt="...retention...", score=0.62),
        ClauseMatch(article="Article 17", policy_excerpt="...erasure...", score=0.58),
    ]
    findings = [
        Finding(
            article="Article 5(1)(e)",
            issue="Retention policy missing specific time limits.",
            severity="medium",
            confidence=0.74,
        )
    ]
    recommendations = [
        Recommendation(
            article="Article 17",
            suggestion="Add a section clarifying user rights to request deletion (Right to Erasure).",
        )
    ]

    return ComplianceResult(
        verdict=verdict,
        score=score,
        confidence=0.65,
        evidence=evidence,
        findings=findings,
        recommendations=recommendations,
    )