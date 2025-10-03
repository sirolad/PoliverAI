#!/usr/bin/env python3
"""
Demo script showcasing the new UI features for GDPR verification analysis modes.

This script demonstrates:
1. The three analysis modes available to users
2. How users can choose between speed and accuracy
3. The enhanced UI feedback and progress indicators
4. Real-world performance differences
"""

import time
from pathlib import Path

import requests


def test_ui_modes():
    """Test all three analysis modes through the API as the UI would call them"""

    api_base = "http://127.0.0.1:8000/api/v1"
    test_file = "Sampler.pdf"

    print("🎯 PoliverAI UI Analysis Mode Demonstration")
    print("=" * 60)

    if not Path(test_file).exists():
        print(f"❌ Test file {test_file} not found!")
        return

    modes = [
        ("🚀 Fast", "fast", "Quick basic checks (< 1s)"),
        ("⚖️ Balanced", "balanced", "Smart analysis (recommended, ~30-60s)"),
        ("🔬 Detailed", "detailed", "Deep analysis (~30-60s)"),
    ]

    results = {}

    for mode_name, mode_value, description in modes:
        print(f"\n{mode_name} Mode - {description}")
        print("-" * 50)

        # Simulate what the UI does when user selects a mode
        print(f"📤 Uploading file with analysis_mode={mode_value}...")

        start_time = time.time()

        try:
            with open(test_file, "rb") as f:
                files = {"file": (test_file, f, "application/pdf")}
                data = {"analysis_mode": mode_value}

                response = requests.post(f"{api_base}/verify", files=files, data=data, timeout=120)
                response.raise_for_status()
                result = response.json()

        except Exception as e:
            print(f"❌ Error: {e}")
            continue

        elapsed_time = time.time() - start_time
        results[mode_value] = {"result": result, "time": elapsed_time}

        # Display results as the UI would show them
        verdict = result.get("verdict", "unknown")
        score = result.get("score", 0)

        verdict_emoji = {"compliant": "✅", "partially_compliant": "⚠️", "non_compliant": "❌"}

        emoji = verdict_emoji.get(verdict, "❓")

        print(f"⏱️  Processing time: {elapsed_time:.1f} seconds")
        print(f"{emoji} Result: {verdict.replace('_', ' ').title()}")
        print(f"📊 Score: {score}/100")
        print(f"⚠️  Total violations: {result.get('metrics', {}).get('total_violations', 0)}")
        high_severity_count = len(
            [f for f in result.get("findings", []) if f.get("severity") == "high"]
        )
        print(f"🔴 High severity: {high_severity_count}")

        # Show key findings (as UI summary would)
        high_findings = [f for f in result.get("findings", []) if f.get("severity") == "high"]
        if high_findings:
            print("🚨 Key Issues:")
            for finding in high_findings[:2]:  # Show top 2
                print(f"   • {finding.get('article')}: {finding.get('issue')}")

    print("\n" + "=" * 60)
    print("📊 COMPARISON SUMMARY (as shown in UI)")
    print("=" * 60)

    print(f"{'Mode':<12} | {'Time':<8} | {'Score':<7} | {'High Issues'} | Recommendation")
    print("-" * 70)

    for _mode_name, mode_value, _ in modes:
        if mode_value in results:
            r = results[mode_value]
            result = r["result"]
            high_count = len([f for f in result.get("findings", []) if f.get("severity") == "high"])

            # UI recommendation logic
            if mode_value == "fast":
                rec = "Quick screening"
            elif mode_value == "balanced":
                rec = "✅ Recommended"
            else:
                rec = "Research/Legal"

            score = result.get("score", 0)
            time_str = f"{r['time']:>6.1f}s"
            score_str = f"{score:>3d}/100"
            high_str = f"{high_count:>10d}"
            print(f"{mode_value:<12} | {time_str} | {score_str} | {high_str} | {rec}")

    print("\n" + "=" * 60)
    print("🎉 NEW UI FEATURES DEMONSTRATED:")
    print("=" * 60)
    print("✅ Analysis Mode Selector - Users can choose their preferred speed/accuracy balance")
    print("✅ Real-time Progress Feedback - Shows which mode is running and expected time")
    print("✅ Enhanced Results Display - Summary section highlights key violations")
    print("✅ Visual Status Indicators - Emoji-based feedback for quick understanding")
    print("✅ Mode-specific Guidance - Helps users understand when to use each mode")

    print("\n💡 UI WORKFLOW:")
    print("1. User uploads privacy policy document")
    print("2. User selects analysis mode based on needs:")
    print("   - Fast: Quick compliance screening")
    print("   - Balanced: Production verification (recommended)")
    print("   - Detailed: Comprehensive legal analysis")
    print("3. UI shows progress with time estimates")
    print("4. Results displayed with summary of key issues")
    print("5. Detailed findings and recommendations provided")

    # Show the specific success we achieved
    if "balanced" in results:
        balanced_result = results["balanced"]["result"]
        high_findings = [
            f for f in balanced_result.get("findings", []) if f.get("severity") == "high"
        ]
        auto_collection_found = any("13(1)(c)" in f.get("article", "") for f in high_findings)

        if auto_collection_found:
            print("\n🎯 SUCCESS HIGHLIGHT:")
            print("✅ Automatic data collection violation properly detected in Balanced mode!")
            print(
                "   This was the key issue we solved - nuanced privacy violations are now caught."
            )


if __name__ == "__main__":
    print("Starting UI demo...")
    print("Make sure the server is running on http://127.0.0.1:8000")
    print("You can also test the actual UI at: http://127.0.0.1:8000/ui")
    print()

    test_ui_modes()
