"""Tests for scoring logic and verdict determination."""

import pytest

from poliverai.rag.score_calculator import (
    calculate_analysis_confidence,
    calculate_score_and_verdict,
    generate_findings_and_recommendations,
    get_compliance_summary,
)

# Test constants
MIN_COMPLIANT_SCORE = 75
BASE_SCORE = 85
CRITICAL_VIOLATION_PENALTY_THRESHOLD = 65
CRITICAL_VIOLATIONS_SCORE_CAP = 40
SEVERE_VIOLATIONS_SCORE_CAP = 25
MAX_SCORE = 100
MIN_CONFIDENCE = 0.5
NUM_EXPECTED_FINDINGS = 2


class TestScoreCalculation:
    """Test score calculation and verdict determination."""

    def test_perfect_compliance_score(self):
        """Test perfect compliance scenario."""
        violations = {}
        fulfills = {"Article 6(1)": 1, "Article 13": 1, "Article 17": 1}

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert score >= MIN_COMPLIANT_SCORE
        assert verdict == "compliant"

    def test_no_violations_no_fulfills(self):
        """Test empty policy scenario."""
        violations = {}
        fulfills = {}

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert score == BASE_SCORE  # Base score
        assert verdict == "compliant"

    def test_single_critical_violation(self):
        """Test single critical violation."""
        violations = {"Article 6(1)": 1}  # Critical article
        fulfills = {}

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert score <= CRITICAL_VIOLATION_PENALTY_THRESHOLD  # 85 - 20
        # Single critical violation results in partially_compliant based on current logic
        assert verdict == "partially_compliant"

    def test_multiple_critical_violations(self):
        """Test multiple critical violations trigger non-compliant."""
        violations = {"Article 6(1)": 2, "Article 13": 2}  # Critical articles
        fulfills = {}

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert score <= CRITICAL_VIOLATIONS_SCORE_CAP  # Should be capped
        assert verdict == "non_compliant"

    def test_many_violations_force_non_compliant(self):
        """Test that many violations force non-compliant regardless of score."""
        violations = {
            "Article 6(1)": 1,
            "Article 13": 1,
            "Article 17": 1,
            "Article 5(1)(e)": 1,
            "Article 14": 1,
            "Article 15": 1,
        }  # 6 violations, exceeds threshold
        fulfills = {"General Compliance": 10}  # Many fulfills

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert verdict == "non_compliant"
        assert score <= SEVERE_VIOLATIONS_SCORE_CAP  # Should be capped

    def test_moderate_compliance(self):
        """Test partially compliant scenario."""
        violations = {"Article 17": 1}  # Non-critical article
        fulfills = {"Article 6(1)": 1, "Article 13": 1}

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert verdict in ["partially_compliant", "compliant"]

    def test_score_bounds(self):
        """Test that scores are always within 0-100."""
        # Extreme violations
        violations = {f"Article {i}": 10 for i in range(1, 20)}
        fulfills = {}

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert 0 <= score <= MAX_SCORE
        assert verdict == "non_compliant"

    def test_high_fulfillment_score(self):
        """Test high fulfillment scenario."""
        violations = {}
        fulfills = {f"Article {i}": 3 for i in range(1, 15)}

        score, verdict = calculate_score_and_verdict(violations, fulfills)

        assert score == MAX_SCORE  # Should be capped at 100
        assert verdict == "compliant"


class TestComplianceSummary:
    """Test compliance summary generation."""

    def test_compliant_summary(self):
        """Test summary for compliant verdict."""
        summary = get_compliance_summary("compliant", 85, 0, 0)

        assert "meets GDPR requirements" in summary
        assert "85/100" in summary

    def test_non_compliant_summary(self):
        """Test summary for non-compliant verdict."""
        summary = get_compliance_summary("non_compliant", 25, 3, 5)

        assert "significant GDPR compliance gaps" in summary
        assert "25/100" in summary
        assert "immediate attention" in summary

    def test_partially_compliant_with_critical(self):
        """Test partially compliant summary with critical issues."""
        summary = get_compliance_summary("partially_compliant", 60, 2, 4)

        assert "most GDPR requirements" in summary
        assert "60/100" in summary
        assert "2 critical issue(s)" in summary

    def test_partially_compliant_without_critical(self):
        """Test partially compliant summary without critical issues."""
        summary = get_compliance_summary("partially_compliant", 65, 0, 3)

        assert "key GDPR requirements" in summary
        assert "65/100" in summary
        assert "3 minor issue(s)" in summary


class TestFindingsGeneration:
    """Test findings and recommendations generation."""

    def test_generate_findings_basic(self):
        """Test basic findings generation."""
        violations = {"Article 6(1)": 2, "Article 17": 1}

        findings, recommendations = generate_findings_and_recommendations(violations)

        assert len(findings) == NUM_EXPECTED_FINDINGS
        assert len(recommendations) == NUM_EXPECTED_FINDINGS

        # Check finding structure
        for finding in findings:
            assert "article" in finding
            assert "issue" in finding
            assert "severity" in finding
            assert "confidence" in finding

    def test_severity_mapping(self):
        """Test severity determination from violation counts."""
        violations = {"Article 6(1)": 3, "Article 17": 2, "Article 14": 1}

        findings, _ = generate_findings_and_recommendations(violations)

        # Should have different severities based on count
        severities = [f["severity"] for f in findings]
        assert "high" in severities  # 3 violations
        assert "medium" in severities  # 2 violations
        assert "low" in severities  # 1 violation

    def test_preserved_severity_mapping(self):
        """Test that preserved severity from rule-based analysis is used."""
        violations = {"Article 6(1)": 1}
        severity_map = {"Article 6(1)": "high"}  # Override normal severity

        findings, _ = generate_findings_and_recommendations(violations, severity_map)

        assert findings[0]["severity"] == "high"

    def test_recommendations_content(self):
        """Test that recommendations have appropriate content."""
        violations = {"Article 6(1)": 1, "Article 13": 1}

        _, recommendations = generate_findings_and_recommendations(violations)

        # Check recommendation structure
        for rec in recommendations:
            assert "article" in rec
            assert "title" in rec
            assert "description" in rec
            assert "priority" in rec

        # Check specific recommendations exist
        rec_titles = [r["title"] for r in recommendations]
        assert any("Lawful Basis" in title for title in rec_titles)
        assert any("Required Information" in title for title in rec_titles)


class TestAnalysisConfidence:
    """Test analysis confidence calculation."""

    def test_confidence_base(self):
        """Test base confidence calculation."""
        confidence = calculate_analysis_confidence("fast", False, [], [], True)

        assert 0.0 <= confidence <= 1.0
        assert confidence >= MIN_CONFIDENCE  # Base confidence

    def test_confidence_with_llm(self):
        """Test confidence boost with LLM analysis."""
        confidence_without_llm = calculate_analysis_confidence("balanced", False, [], [], True)
        confidence_with_llm = calculate_analysis_confidence("balanced", True, [], [], False)

        assert confidence_with_llm > confidence_without_llm

    def test_confidence_by_mode(self):
        """Test confidence varies by analysis mode."""
        fast_conf = calculate_analysis_confidence("fast", False, [], [], True)
        balanced_conf = calculate_analysis_confidence("balanced", False, [], [], True)
        detailed_conf = calculate_analysis_confidence("detailed", False, [], [], True)

        assert detailed_conf > balanced_conf > fast_conf

    def test_confidence_with_evidence(self):
        """Test confidence increases with more evidence."""
        evidence_small = [{"article": "test"}] * 3
        evidence_large = [{"article": "test"}] * 15

        conf_small = calculate_analysis_confidence("balanced", False, evidence_small, [], True)
        conf_large = calculate_analysis_confidence("balanced", False, evidence_large, [], True)

        assert conf_large > conf_small

    def test_confidence_with_document_length(self):
        """Test confidence increases with document length."""
        short_clauses = ["short clause"] * 3
        long_clauses = ["this is a much longer clause with substantial content"] * 10

        conf_short = calculate_analysis_confidence("balanced", False, [], short_clauses, True)
        conf_long = calculate_analysis_confidence("balanced", False, [], long_clauses, True)

        assert conf_long > conf_short

    def test_confidence_bounds(self):
        """Test confidence is always within bounds."""
        # Test extreme scenario
        massive_evidence = [{"article": "test"}] * 100
        massive_clauses = ["very long clause"] * 100

        confidence = calculate_analysis_confidence(
            "detailed", True, massive_evidence, massive_clauses, False
        )

        assert 0.0 <= confidence <= 1.0


if __name__ == "__main__":
    pytest.main([__file__])
