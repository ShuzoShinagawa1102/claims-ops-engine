from typing import List, Dict, Any

REQUIREMENTS_BY_PRODUCT: Dict[str, List[Dict[str, Any]]] = {
    "auto": [
        {
            "name": "Police/Accident Report",
            "description": "Official police report or accident report documenting the incident",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Repair Estimate",
            "description": "Certified repair estimate from an approved auto repair shop",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Damage Photos",
            "description": "Minimum 3 clear photos showing all vehicle damage from multiple angles",
            "required_evidence_type": "photo",
            "is_mandatory": True,
        },
        {
            "name": "Driver's License",
            "description": "Valid driver's license of the insured driver at the time of incident",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Vehicle Registration",
            "description": "Current vehicle registration document confirming ownership",
            "required_evidence_type": "document",
            "is_mandatory": False,
        },
    ],
    "health": [
        {
            "name": "Physician's Diagnosis Report",
            "description": "Official diagnosis report signed by a licensed physician",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Medical Bills/Receipts",
            "description": "Itemized medical bills and payment receipts for all treatments",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Doctor's Note/Referral",
            "description": "Doctor's referral note for specialist treatment or hospitalization",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Treatment Records",
            "description": "Complete treatment records including dates, procedures, and outcomes",
            "required_evidence_type": "document",
            "is_mandatory": False,
        },
    ],
    "travel": [
        {
            "name": "Flight/Hotel Booking Confirmation",
            "description": "Original booking confirmation for flights and/or accommodation",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Cancellation Notice",
            "description": "Official cancellation notice from airline, hotel, or travel operator",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Receipts for Expenses",
            "description": "All receipts for additional expenses incurred due to the travel disruption",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Insurance Policy Copy",
            "description": "Copy of the active travel insurance policy document",
            "required_evidence_type": "document",
            "is_mandatory": False,
        },
    ],
    "property": [
        {
            "name": "Property Damage Photos",
            "description": "Clear photographs documenting all property damage from multiple angles",
            "required_evidence_type": "photo",
            "is_mandatory": True,
        },
        {
            "name": "Damage Assessment Report",
            "description": "Professional damage assessment report from a certified inspector",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Property Ownership Documents",
            "description": "Title deed or lease agreement proving property ownership or tenancy",
            "required_evidence_type": "document",
            "is_mandatory": True,
        },
        {
            "name": "Repair/Replacement Estimates",
            "description": "Itemized repair or replacement estimates from licensed contractors",
            "required_evidence_type": "document",
            "is_mandatory": False,
        },
    ],
}


def get_requirements_for_product(product_type: str) -> List[Dict[str, Any]]:
    return REQUIREMENTS_BY_PRODUCT.get(product_type.lower(), [])
