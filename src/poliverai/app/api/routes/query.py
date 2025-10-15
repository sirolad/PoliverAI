from collections import defaultdict

from fastapi import APIRouter

from ....knowledge.gdpr_articles import get_article_with_title
from ....models.api import QueryAnswer, QueryRequest
from ....rag.service import answer_question

router = APIRouter(tags=["query"])


@router.post("/query", response_model=QueryAnswer)
async def ask_gdpr(req: QueryRequest) -> QueryAnswer:
    result = answer_question(req.question)

    # Group sources by filename and include hit counts, titles, and article labels
    grouped = defaultdict(list)
    for s in result.get("sources", []) or []:
        grouped[s.get("source", "").strip()].append(s)

    labels: list[str] = []
    for src, items in grouped.items():
        if not src:
            continue

        # Get document title (same for all chunks from same document)
        title = None
        for item in items:
            if item.get("title"):
                title = item["title"]
                break

        # Get unique articles mentioned with full titles
        article_refs = sorted({(i.get("article") or "").strip() for i in items if i.get("article")})
        # Format articles with titles
        formatted_articles = [get_article_with_title(art) for art in article_refs if art]
        article_str = f" — articles: {', '.join(formatted_articles)}" if formatted_articles else ""

        # Format with title if available, otherwise use filename
        if title:
            labels.append(f"{title} ({len(items)} hits){article_str}")
        else:
            labels.append(f"{src} ({len(items)} hits){article_str}")

    return QueryAnswer(answer=result.get("answer", ""), sources=labels or ["No sources found"])
