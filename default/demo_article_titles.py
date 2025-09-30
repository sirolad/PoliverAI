#!/usr/bin/env python3
"""
Demo script showing enhanced GDPR article title display in sources.

This script demonstrates the improvement from showing just article numbers
like "Article 6(1)" to showing full titles like "Article 6(1) Lawfulness of processing"
throughout the PoliverAI system.
"""

from pathlib import Path

import requests

# Constants
MIN_ARTICLE_LENGTH = 15


def test_article_title_display():
    """Test enhanced article title display in both query and verification systems"""

    api_base = "http://127.0.0.1:8000/api/v1"

    print("🎯 PoliverAI Enhanced Article Title Display Demo")
    print("=" * 60)
    print()

    # Test 1: Query system with enhanced article titles in sources
    print("1️⃣ QUERY SYSTEM - Enhanced Article Sources")
    print("-" * 45)

    test_question = "What are the lawful bases for processing personal data?"
    print(f"❓ Question: {test_question}")

    try:
        response = requests.post(f"{api_base}/query", json={"question": test_question}, timeout=30)
        response.raise_for_status()
        result = response.json()

        print(f"💬 Answer: {result.get('answer', '')[:200]}...")
        print("📚 Sources with Enhanced Article Titles:")

        for i, source in enumerate(result.get("sources", [])[:3], 1):
            print(f"   {i}. {source}")

    except Exception as e:
        print(f"❌ Query test failed: {e}")

    print("\n" + "=" * 60)

    # Test 2: Verification system with enhanced article titles
    print("2️⃣ VERIFICATION SYSTEM - Enhanced Article Display")
    print("-" * 50)

    if not Path("Sampler.pdf").exists():
        print("❌ Sampler.pdf not found for verification test")
        return

    print("📤 Testing verification with Sampler.pdf (balanced mode)")

    try:
        with open("Sampler.pdf", "rb") as f:
            files = {"file": ("Sampler.pdf", f, "application/pdf")}
            data = {"analysis_mode": "balanced"}

            response = requests.post(f"{api_base}/verify", files=files, data=data, timeout=60)
            response.raise_for_status()
            result = response.json()

        print(f"📊 Verdict: {result.get('verdict', 'unknown').replace('_', ' ').title()}")
        print(f"📊 Score: {result.get('score', 0)}/100")
        print()

        print("🔍 Enhanced Findings Display:")
        findings = result.get("findings", [])[:3]

        for i, finding in enumerate(findings, 1):
            article = finding.get("article", "Unknown")
            severity = finding.get("severity", "unknown")

            # Show the enhancement - before vs after
            if "Article" in article and len(article) > MIN_ARTICLE_LENGTH:
                article_num = article.split(" ")[0] + (
                    " " + article.split(" ")[1]
                    if len(article.split(" ")) > 1 and article.split(" ")[1].startswith("(")
                    else ""
                )
                title_part = article[len(article_num) :].strip()

                print(f"   {i}. 🔴 {severity.upper()} severity")
                print(f"      📖 BEFORE: {article_num}")
                print(f"      ✨ AFTER:  {article}")
                print(f"      💡 Enhancement: Added '{title_part}'")
            else:
                print(f"   {i}. {severity.upper()}: {article}")
            print()

        print("🎯 Enhanced Evidence Display:")
        evidence = result.get("evidence", [])[:3]

        for i, ev in enumerate(evidence, 1):
            article = ev.get("article", "Unknown")
            verdict = ev.get("verdict", "unknown")

            print(f"   {i}. {verdict.upper()}: {article}")
            print(f"      📝 {ev.get('policy_excerpt', '')[:80]}...")
            print()

        print("💡 Enhanced Recommendations Display:")
        recommendations = result.get("recommendations", [])[:2]

        for i, rec in enumerate(recommendations, 1):
            article = rec.get("article", "Unknown")
            suggestion = rec.get("suggestion", "")

            print(f"   {i}. 📋 {article}")
            print(f"      💬 {suggestion[:100]}...")
            print()

    except Exception as e:
        print(f"❌ Verification test failed: {e}")

    print("=" * 60)
    print("🎉 ENHANCEMENT SUMMARY")
    print("=" * 60)
    print("✅ BEFORE: Articles showed as just numbers (e.g., 'Article 6(1)')")
    print(
        "✅ AFTER:  Articles show with full titles (e.g., 'Article 6(1) Lawfulness of processing')"
    )
    print()
    print("📈 BENEFITS:")
    print("   • Better user understanding of GDPR requirements")
    print("   • More informative source references")
    print("   • Professional legal document appearance")
    print("   • Clearer context for compliance findings")
    print()
    print("🎯 IMPLEMENTATION:")
    print("   • Added comprehensive GDPR article title database")
    print("   • Enhanced query sources to include full article titles")
    print("   • Updated verification findings, evidence, and recommendations")
    print("   • Smart truncation for very long titles in UI")
    print("   • Maintained backward compatibility for unknown articles")


if __name__ == "__main__":
    print("Starting article title enhancement demo...")
    print("Make sure the server is running on http://127.0.0.1:8000")
    print("You can also test the UI at: http://127.0.0.1:8000/ui")
    print()

    test_article_title_display()
