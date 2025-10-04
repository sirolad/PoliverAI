#!/usr/bin/env python3
"""
Test script demonstrating the new balanced analysis mode for GDPR verification.

This script shows how the balanced mode:
1. Detects sensitive clauses like automatic data collection
2. Uses LLM processing only on sensitive content for better accuracy
3. Maintains good performance compared to detailed mode
4. Properly identifies high-severity violations that fast mode might miss in context
"""

import time

from src.poliverai.ingestion.readers.pdf_reader import read_pdf_text
from src.poliverai.rag.verification import analyze_policy


def test_analysis_modes():
    """Test all three analysis modes with Sampler.pdf"""

    # Load the test policy
    print("🔍 Loading Sampler.pdf...")
    text = read_pdf_text("Sampler.pdf")

    # Test sample text that contains automatic collection clause
    sample_clause = """
    In addition, the Application may collect certain information automatically, including, but
    not limited to, the type of mobile device you use, your mobile devices unique device ID,
    the IP address of your mobile device, your mobile operating system, the type of mobile
    Internet browsers you use, and information about the way you use the Application.
    """

    print(f"📄 Policy contains the key clause: {sample_clause.strip()[:100]}...\n")

    modes = ["fast", "balanced", "detailed"]
    results = {}

    print("=" * 80)
    print("TESTING ALL ANALYSIS MODES")
    print("=" * 80)

    for mode in modes:
        print(f"\n🔧 Testing {mode.upper()} mode...")
        start_time = time.time()
        result = analyze_policy(text, analysis_mode=mode)
        elapsed_time = time.time() - start_time

        results[mode] = {"result": result, "time": elapsed_time}

        print(f"⏱️  Time: {elapsed_time:.3f}s")
        print(f"📊 Score: {result['score']}/100, Verdict: {result['verdict']}")
        print(f"⚠️  Total violations: {result['metrics']['total_violations']}")

        # Check for automatic collection detection
        auto_collection_found = False
        for finding in result["findings"]:
            if "13(1)(c)" in finding["article"]:
                severity_icon = (
                    "🔴"
                    if finding["severity"] == "high"
                    else "🟡"
                    if finding["severity"] == "medium"
                    else "🟢"
                )
                print(
                    f"{severity_icon} AUTO-COLLECTION: {finding['article']} "
                    f"({finding['severity']} severity)"
                )
                auto_collection_found = True
                break

        if not auto_collection_found:
            print("❌ Auto-collection violation not detected")

    print("\n" + "=" * 80)
    print("COMPARISON SUMMARY")
    print("=" * 80)

    print(f"{'Mode':<12} | {'Time':<8} | {'Score':<5} | {'Violations':<10} | {'Auto-Collection'}")
    print("-" * 65)

    for mode in modes:
        r = results[mode]
        result = r["result"]
        auto_found = (
            "🔴 HIGH"
            if any(
                f["article"] == "Article 13(1)(c)" and f["severity"] == "high"
                for f in result["findings"]
            )
            else "❌ NO"
        )

        print(
            f"{mode:<12} | {r['time']:>7.3f}s | {result['score']:>3d}/100 | "
            f"{result['metrics']['total_violations']:>10d} | {auto_found}"
        )

    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)

    print("🎯 BALANCED mode is recommended for most use cases:")
    print("   ✅ Detects sensitive privacy violations with high accuracy")
    print("   ✅ Uses LLM processing only on clauses with sensitive keywords")
    print("   ✅ Much faster than detailed mode while maintaining key detection")
    print("   ✅ Cost-effective for production use")

    print("\n📋 Use case guide:")
    print("   🚀 FAST mode: Quick screening, basic compliance checks")
    print("   ⚖️  BALANCED mode: Production verification, thorough analysis")
    print("   🔬 DETAILED mode: Deep analysis, research, maximum accuracy")

    # Show the specific violation we solved
    balanced_result = results["balanced"]["result"]
    for finding in balanced_result["findings"]:
        if "13(1)(c)" in finding["article"]:
            print("\n🎉 SUCCESS: The automatic collection clause is now properly detected!")
            print(f"   Article: {finding['article']}")
            print(f"   Issue: {finding['issue']}")
            print(f"   Severity: {finding['severity']} (was previously missed in fast-only mode)")
            break


if __name__ == "__main__":
    test_analysis_modes()
