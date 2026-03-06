from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app import models


def generate_recommendation(case: models.ClaimCase, db: Session) -> Dict[str, Any]:
    requirements: List[models.Requirement] = case.requirements
    mandatory = [r for r in requirements if r.is_mandatory]
    fulfilled_mandatory = [r for r in mandatory if r.status == "fulfilled"]

    total_mandatory = len(mandatory)
    if total_mandatory == 0:
        completeness = 1.0
    else:
        completeness = len(fulfilled_mandatory) / total_mandatory

    missing = [r.name for r in mandatory if r.status != "fulfilled"]

    if completeness >= 0.9:
        recommendation = "approve"
        confidence = 0.85
        if missing:
            reason = (
                f"Evidence completeness is {completeness:.0%}. "
                f"Nearly all mandatory requirements are fulfilled. "
                f"Outstanding items: {', '.join(missing)}. Recommend approval."
            )
        else:
            reason = (
                "All mandatory requirements have been fulfilled. "
                "Evidence completeness is 100%. Recommend approval."
            )
    elif completeness >= 0.6:
        recommendation = "request_more_info"
        confidence = 0.70
        reason = (
            f"Evidence completeness is {completeness:.0%}. "
            f"The following mandatory items are still outstanding: {', '.join(missing)}. "
            "Additional information is required before a final decision can be made."
        )
    elif completeness < 0.3 and case.status == "Exception":
        recommendation = "escalate"
        confidence = 0.80
        reason = (
            f"Evidence completeness is critically low at {completeness:.0%} and the case is in Exception status. "
            f"Missing mandatory items: {', '.join(missing)}. "
            "This case requires escalation to a senior adjuster."
        )
    elif completeness < 0.3:
        recommendation = "reject"
        confidence = 0.75
        reason = (
            f"Evidence completeness is very low at {completeness:.0%}. "
            f"The following mandatory requirements are missing: {', '.join(missing)}. "
            "Insufficient evidence to support this claim."
        )
    else:
        recommendation = "request_more_info"
        confidence = 0.65
        reason = (
            f"Evidence completeness is {completeness:.0%}. "
            f"Missing mandatory items: {', '.join(missing)}. "
            "More information is needed to proceed with evaluation."
        )

    return {
        "recommendation": recommendation,
        "confidence_score": confidence,
        "evidence_completeness_score": completeness,
        "reason": reason,
    }
