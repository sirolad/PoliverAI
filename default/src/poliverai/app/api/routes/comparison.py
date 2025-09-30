from fastapi import APIRouter, UploadFile
from pydantic import BaseModel


class ComparisonResult(BaseModel):
    more_compliant: str
    summary: str


router = APIRouter(tags=["comparison"])


@router.post("/compare", response_model=ComparisonResult)
async def compare(
    draft: UploadFile,
    final: UploadFile,
) -> ComparisonResult:
    # Placeholder logic: prefer the file literally named "final"
    more = "final" if final.filename else "draft"
    return ComparisonResult(
        more_compliant=more,
        summary="This is a placeholder comparison. Implement diffing & scoring.",
    )
