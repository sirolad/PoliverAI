from fastapi import APIRouter
from pydantic import BaseModel


class QueryRequest(BaseModel):
    question: str


class QueryAnswer(BaseModel):
    answer: str
    sources: list[str]


router = APIRouter(tags=["query"])


@router.post("/query", response_model=QueryAnswer)
async def ask_gdpr(req: QueryRequest) -> QueryAnswer:
    # Placeholder: RAG pipeline would search GDPR knowledge base
    return QueryAnswer(
        answer=(
            "Based on Article 5(1)(e), data should not be kept longer than necessary. "
            "Ensure your retention schedule has explicit time limits."
        ),
        sources=[
            "GDPR Article 5(1)(e)",
            "GDPR Article 17",
        ],
    )