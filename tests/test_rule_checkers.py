"""Tests for rule-based GDPR compliance checkers."""

import pytest

from poliverai.rag.rule_checkers import (
    check_automatic_collection_violations,
    check_compliance_fulfillments,
    check_data_sharing_violations,
    check_erasure_violations,
    check_information_violations,
    check_lawful_basis_violations,
    check_storage_violations,
    heuristic_judge_clause,
    rule_based_compliance_check,
)

# Test constants
MAX_MINOR_VIOLATIONS = 2
HEURISTIC_CONFIDENCE = 0.5


class TestLawfulBasisViolations:
    """Test lawful basis violation checking."""

    def test_missing_lawful_basis_terms(self):
        """Test detection when lawful basis terms are missing."""
        text = "we collect your data for our business purposes"
        violations = check_lawful_basis_violations(text.lower())

        assert len(violations) == 1
        assert violations[0]["article"] == "Article 6(1)"
        assert "lawful basis" in violations[0]["reason"]
        assert violations[0]["severity"] == "high"

    def test_has_lawful_basis_terms(self):
        """Test no violation when lawful basis terms are present."""
        text = "we process data based on your consent and lawful basis"
        violations = check_lawful_basis_violations(text.lower())

        assert len(violations) == 0

    def test_contract_basis(self):
        """Test contract as lawful basis."""
        text = "we process data to fulfill our contract with you"
        violations = check_lawful_basis_violations(text.lower())

        assert len(violations) == 0

    def test_legal_obligation_basis(self):
        """Test legal obligation as lawful basis."""
        text = "we process data to comply with legal obligation"
        violations = check_lawful_basis_violations(text.lower())

        assert len(violations) == 0


class TestInformationViolations:
    """Test information provision violation checking."""

    def test_missing_all_required_info(self):
        """Test detection when all required information is missing."""
        text = "this is a privacy policy with minimal content"
        violations = check_information_violations(text.lower())

        assert len(violations) == 1
        assert violations[0]["article"] == "Article 13"
        assert "purpose, data controller, contact" in violations[0]["reason"]
        assert violations[0]["severity"] == "medium"

    def test_missing_some_required_info(self):
        """Test detection when some required information is missing."""
        text = "the purpose of processing is marketing but no controller info"
        violations = check_information_violations(text.lower())

        assert len(violations) == 1
        assert "data controller, contact" in violations[0]["reason"]

    def test_has_all_required_info(self):
        """Test no violation when all required information is present."""
        text = (
            "the purpose is marketing, data controller is BigCorp, contact us at info@bigcorp.com"
        )
        violations = check_information_violations(text.lower())

        assert len(violations) == 0


class TestErasureViolations:
    """Test erasure rights violation checking."""

    def test_missing_erasure_terms(self):
        """Test detection when erasure terms are missing."""
        text = "we store your data securely"
        violations = check_erasure_violations(text.lower())

        assert len(violations) == 1
        assert violations[0]["article"] == "Article 17"
        assert "data deletion" in violations[0]["reason"]
        assert violations[0]["severity"] == "medium"

    def test_has_delete_term(self):
        """Test no violation when delete term is present."""
        text = "you can request to delete your data"
        violations = check_erasure_violations(text.lower())

        assert len(violations) == 0

    def test_has_erasure_term(self):
        """Test no violation when erasure term is present."""
        text = "you have the right to erasure of your data"
        violations = check_erasure_violations(text.lower())

        assert len(violations) == 0

    def test_has_right_to_be_forgotten(self):
        """Test no violation when right to be forgotten is mentioned."""
        text = "we respect your right to be forgotten"
        violations = check_erasure_violations(text.lower())

        assert len(violations) == 0


class TestStorageViolations:
    """Test storage limitation violation checking."""

    def test_missing_retention_terms(self):
        """Test detection when retention terms are missing."""
        text = "we collect and use your personal data"
        violations = check_storage_violations(text.lower())

        assert len(violations) == 1
        assert violations[0]["article"] == "Article 5(1)(e)"
        assert "retention period" in violations[0]["reason"]
        assert violations[0]["severity"] == "medium"

    def test_has_retention_term(self):
        """Test no violation when retention term is present."""
        text = "we have a data retention policy of 5 years"
        violations = check_storage_violations(text.lower())

        assert len(violations) == 0

    def test_has_how_long_term(self):
        """Test no violation when 'how long' term is present."""
        text = "we explain how long we keep your data"
        violations = check_storage_violations(text.lower())

        assert len(violations) == 0

    def test_has_delete_after_term(self):
        """Test no violation when 'delete after' term is present."""
        text = "we delete after the retention period expires"
        violations = check_storage_violations(text.lower())

        assert len(violations) == 0


class TestAutomaticCollectionViolations:
    """Test automatic data collection violation checking."""

    def test_automatic_collection_without_disclosure(self):
        """Test violation when automatic collection lacks disclosure."""
        text = "we automatically collect information when you visit"
        violations = check_automatic_collection_violations(text.lower())

        assert len(violations) == 1
        assert violations[0]["article"] == "Article 13(1)(c)"
        assert "insufficient disclosure" in violations[0]["reason"]
        assert violations[0]["severity"] == "high"

    def test_automatic_collection_with_disclosure(self):
        """Test no violation when automatic collection has proper disclosure."""
        # Use the specific disclosure language the rule checker expects
        text = (
            "we automatically collect information. Automatically collected information "
            "includes IP address, browser type"
        )
        violations = check_automatic_collection_violations(text.lower())

        assert len(violations) == 0

    def test_no_automatic_collection_mentioned(self):
        """Test no violation when automatic collection is not mentioned."""
        text = "we only collect data you provide to us directly"
        violations = check_automatic_collection_violations(text.lower())

        assert len(violations) == 0


class TestDataSharingViolations:
    """Test data sharing violation checking."""

    def test_sharing_without_basis(self):
        """Test violation when sharing lacks lawful basis."""
        text = "we share your data with third parties for business purposes"
        violations = check_data_sharing_violations(text.lower())

        assert len(violations) == 1
        assert violations[0]["article"] == "Article 6(1)"
        assert "without clear lawful basis" in violations[0]["reason"]
        assert violations[0]["severity"] == "high"

    def test_sharing_with_consent_basis(self):
        """Test no violation when sharing has consent basis."""
        text = "we share data with third parties based on your consent"
        violations = check_data_sharing_violations(text.lower())

        assert len(violations) == 0

    def test_sharing_with_legitimate_interest(self):
        """Test no violation when sharing has legitimate interest basis."""
        text = "we disclose information based on legitimate interest"
        violations = check_data_sharing_violations(text.lower())

        assert len(violations) == 0

    def test_no_sharing_mentioned(self):
        """Test no violation when sharing is not mentioned."""
        text = "we keep your data private and secure"
        violations = check_data_sharing_violations(text.lower())

        assert len(violations) == 0


class TestComplianceFulfillments:
    """Test compliance fulfillment detection."""

    def test_gdpr_acknowledgment(self):
        """Test GDPR acknowledgment detection."""
        text = "this policy complies with GDPR requirements"
        fulfills = check_compliance_fulfillments(text.lower())

        general_compliance = [f for f in fulfills if f["article"] == "General Compliance"]
        assert len(general_compliance) == 1

    def test_lawful_basis_fulfillment(self):
        """Test lawful basis fulfillment detection."""
        text = "we process data based on consent and lawful basis"
        fulfills = check_compliance_fulfillments(text.lower())

        article_6_fulfills = [f for f in fulfills if f["article"] == "Article 6(1)"]
        assert len(article_6_fulfills) == 1
        assert "lawful basis" in article_6_fulfills[0]["reason"]

    def test_controller_identification(self):
        """Test data controller identification fulfillment."""
        text = "BigCorp Ltd is the data controller for this processing"
        fulfills = check_compliance_fulfillments(text.lower())

        article_13_fulfills = [f for f in fulfills if f["article"] == "Article 13"]
        assert len(article_13_fulfills) == 1
        assert "data controller" in article_13_fulfills[0]["reason"]

    def test_contact_information(self):
        """Test contact information fulfillment."""
        text = "contact us at privacy@company.com or call +1-555-0123"
        fulfills = check_compliance_fulfillments(text.lower())

        article_13_fulfills = [f for f in fulfills if f["article"] == "Article 13"]
        assert len(article_13_fulfills) >= 1

    def test_retention_policy(self):
        """Test retention policy fulfillment."""
        text = "we delete your data after 5 years retention period"
        fulfills = check_compliance_fulfillments(text.lower())

        article_5_fulfills = [f for f in fulfills if f["article"] == "Article 5(1)(e)"]
        assert len(article_5_fulfills) == 1

    def test_erasure_rights(self):
        """Test erasure rights fulfillment."""
        text = "you have the right to erasure and to be forgotten"
        fulfills = check_compliance_fulfillments(text.lower())

        article_17_fulfills = [f for f in fulfills if f["article"] == "Article 17"]
        assert len(article_17_fulfills) == 1


class TestRuleBasedComplianceCheck:
    """Test comprehensive rule-based compliance checking."""

    def test_compliant_policy(self):
        """Test analysis of a compliant policy."""
        text = """
        This privacy policy complies with GDPR. We process data based on consent
        for the purpose of providing our services. BigCorp Ltd is the data controller.
        Contact us at privacy@bigcorp.com. We retain data for 5 years for this period
        then delete it. You have the right to erasure.
        """

        result = rule_based_compliance_check(text)

        assert "violations" in result
        assert "fulfills" in result
        # Still might have some violations due to strict rule checking
        assert len(result["violations"]) <= MAX_MINOR_VIOLATIONS  # Allow for some minor violations
        assert len(result["fulfills"]) > 0

    def test_non_compliant_policy(self):
        """Test analysis of a non-compliant policy."""
        text = """
        We collect your personal data for business purposes.
        We automatically collect information when you visit our site.
        We share data with third parties.
        """

        result = rule_based_compliance_check(text)

        assert len(result["violations"]) > 0
        assert len(result["fulfills"]) == 0

    def test_mixed_compliance_policy(self):
        """Test analysis of a partially compliant policy."""
        text = """
        This policy complies with GDPR. We process data based on consent.
        BigCorp Ltd is the data controller.
        We automatically collect information when you visit.
        We share your data with partners.
        """

        result = rule_based_compliance_check(text)

        assert len(result["violations"]) > 0
        assert len(result["fulfills"]) > 0

    def test_empty_policy(self):
        """Test analysis of empty policy."""
        text = ""

        result = rule_based_compliance_check(text)

        # Should have violations for missing required elements
        assert len(result["violations"]) > 0
        assert len(result["fulfills"]) == 0


class TestHeuristicJudgeClause:
    """Test heuristic clause judgment."""

    def test_heuristic_judgment_basic(self):
        """Test basic heuristic judgment."""
        clause = "We process personal data based on consent"
        context = []

        judgments = heuristic_judge_clause(clause, context)

        # Should return some judgments with articles (consent maps to Article 6)
        assert len(judgments) > 0
        for judgment in judgments:
            assert "article" in judgment
            assert "verdict" in judgment
            assert "confidence" in judgment
            assert judgment["verdict"] == "unclear"  # Heuristic returns unclear
            assert judgment["confidence"] == HEURISTIC_CONFIDENCE

    def test_heuristic_with_policy_excerpt(self):
        """Test heuristic judgment includes policy excerpt."""
        clause = "We collect data with your consent"
        context = []

        judgments = heuristic_judge_clause(clause, context)

        for judgment in judgments:
            assert "policy_excerpt" in judgment
            assert judgment["policy_excerpt"] == clause[:160]  # Truncated if needed

    def test_heuristic_rationale(self):
        """Test heuristic judgment includes rationale."""
        clause = "We process data"
        context = []

        judgments = heuristic_judge_clause(clause, context)

        for judgment in judgments:
            assert "rationale" in judgment
            assert "Heuristic mapping only" in judgment["rationale"]
            assert "OpenAI API key" in judgment["rationale"]


if __name__ == "__main__":
    pytest.main([__file__])
