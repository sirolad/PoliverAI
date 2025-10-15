"""LLM request handling and response parsing for GDPR compliance verification.

This module handles all interactions with LLM APIs for policy analysis,
including request formatting, response parsing, and error handling.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from ..core.config import get_settings
from .service import _init

# Performance optimization constants
LLM_TIMEOUT_SECONDS = 20  # Timeout for LLM calls


def build_context_from_items(context_items: list[dict[str, Any]], top_k: int) -> str:
    """Build compact context with article labels if available."""
    parts: list[str] = []
    for item in context_items[:top_k]:
        meta = item.get("meta", {}) or {}
        article = meta.get("article", "")
        src = meta.get("source", "")
        snippet = (item.get("doc") or "")[:800]
        label = f"[{article or 'Unknown'} | {src}]"
        parts.append(f"{label}\n{snippet}")
    return "\n\n".join(parts) if parts else ""


def make_openai_request(messages: list[dict[str, Any]], init, s) -> str:
    """Make OpenAI API request with timeout."""
    try:
        resp = init.client.chat.completions.create(
            model=s.openai_chat_model,
            messages=messages,
            temperature=0.0,  # Make completely deterministic
            seed=42,  # Ensure consistent results
            timeout=LLM_TIMEOUT_SECONDS,  # Add timeout for performance
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception as e:
        logging.warning(f"OpenAI API call failed for LLM judgment: {e}")
        return ""


def parse_llm_response(content: str) -> list[dict[str, Any]]:
    """Parse LLM response and handle various JSON formats."""
    if not content:
        return []

    try:
        data = json.loads(content)
        return _normalize_judgments(data.get("judgments", []))
    except json.JSONDecodeError:
        return _extract_json_from_response(content)
    except Exception as e:
        logging.warning(f"Unexpected error processing LLM judgment response: {e}")
        return []


def _normalize_judgments(judg: Any) -> list[dict[str, Any]]:
    """Normalize judgment data into consistent format."""
    if not isinstance(judg, list):
        logging.warning(f"LLM response has invalid 'judgments' field type: {type(judg)}")
        return []

    out: list[dict[str, Any]] = []
    for j in judg:
        article = str(j.get("article", "")).strip()
        verdict = str(j.get("verdict", "unclear")).strip().lower()
        rationale = str(j.get("rationale", "")).strip()
        excerpt = str(j.get("policy_excerpt", "")).strip()
        try:
            conf = float(j.get("confidence", 0.5))
        except Exception:
            conf = 0.5
        if article:
            out.append(
                {
                    "article": article,
                    "verdict": verdict,
                    "rationale": rationale,
                    "policy_excerpt": excerpt,
                    "confidence": conf,
                }
            )
    return out


def _extract_json_from_response(content: str) -> list[dict[str, Any]]:
    """Extract JSON from various response formats including markdown code blocks."""
    extracted_json = _try_extract_from_markdown(content)
    if not extracted_json:
        extracted_json = _try_extract_from_code_blocks(content)
    if not extracted_json:
        extracted_json = _try_extract_multiline_json(content)

    if extracted_json:
        judg = extracted_json.get("judgments", [])
        if isinstance(judg, list):
            return _normalize_judgments(judg)
        else:
            logging.warning(f"Extracted JSON has invalid 'judgments' field type: {type(judg)}")

    logging.debug(f"Failed to extract JSON from response. Full content:\n{content}")
    return []


def _try_extract_from_markdown(content: str) -> dict[str, Any] | None:
    """Try to extract JSON from markdown code blocks."""
    if "```json" in content:
        try:
            start = content.find("```json") + 7  # Skip '```json'
            end = content.find("```", start)
            if end != -1:
                json_content = content[start:end].strip()
                extracted = json.loads(json_content)
                logging.info("Successfully extracted JSON from markdown code block")
                return extracted
        except (json.JSONDecodeError, ValueError):
            pass
    return None


def _try_extract_from_code_blocks(content: str) -> dict[str, Any] | None:
    """Try to extract JSON from generic code blocks."""
    if "```" in content:
        try:
            parts = content.split("```")
            for part in parts:
                stripped_part = part.strip()
                if stripped_part.startswith("{") and stripped_part.endswith("}"):
                    extracted = json.loads(stripped_part)
                    logging.info("Successfully extracted JSON from generic code block")
                    return extracted
        except (json.JSONDecodeError, ValueError):
            pass
    return None


def _try_extract_multiline_json(content: str) -> dict[str, Any] | None:
    """Try to extract JSON from multi-line content."""
    lines = content.split("\n")
    json_lines = []
    in_json = False

    for line in lines:
        stripped_line = line.strip()
        if stripped_line.startswith("{"):
            json_lines = [stripped_line]
            in_json = True
        elif in_json:
            json_lines.append(stripped_line)
            if stripped_line.endswith("}"):
                try:
                    json_content = "\n".join(json_lines)
                    extracted = json.loads(json_content)
                    logging.info("Successfully extracted JSON from multi-line content")
                    return extracted
                except json.JSONDecodeError:
                    pass
                json_lines = []
                in_json = False
    return None


def llm_judge_clause(clause: str, context_items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Use LLM to judge a clause against GDPR requirements."""
    s = get_settings()
    init = _init()

    # Build context from items
    context = build_context_from_items(context_items, s.top_k)

    prompt = (
        "You are PoliverAI, a GDPR compliance assistant.\n"
        "Given a policy clause and contextual excerpts from GDPR, determine which "
        "GDPR articles the clause addresses, and whether it fulfills or violates them.\n"
        "Respond strictly in JSON with this schema: {\n"
        '  "judgments": [ {\n'
        "    \"article\": string,                # e.g., 'Article 5(1)(e)'\n"
        '    "verdict": "fulfills|violates|unclear",\n'
        '    "rationale": string,\n'
        '    "policy_excerpt": string,        # short quote from clause if applicable\n'
        '    "confidence": number              # 0-1\n'
        "  } ]\n"
        "}\n"
        "Only reference articles that are supported by the provided context."
    )

    messages = [
        {"role": "system", "content": prompt},
        {
            "role": "user",
            "content": (
                f"Policy clause:\n{clause}\n\n"
                f"Context (GDPR excerpts):\n{context}\n\n"
                "Return JSON now."
            ),
        },
    ]

    # Make OpenAI request
    content = make_openai_request(messages, init, s)

    # Parse the response
    return parse_llm_response(content)
