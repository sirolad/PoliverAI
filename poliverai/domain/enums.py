from enum import Enum


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Verdict(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
