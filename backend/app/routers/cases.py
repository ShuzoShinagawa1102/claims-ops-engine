import uuid
import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from app.services.requirement_engine import get_requirements_for_product

router = APIRouter()

VALID_TRANSITIONS = {
    "Draft": ["IntakeValidated"],
    "IntakeValidated": ["WaitingForEvidence"],
    "WaitingForEvidence": ["InReview"],
    "InReview": ["Exception", "Approved", "Rejected"],
    "Exception": ["InReview", "Closed"],
    "Approved": ["Closed"],
    "Rejected": ["Closed", "Reopened"],
    "Closed": ["Reopened"],
    "Reopened": ["IntakeValidated", "WaitingForEvidence", "InReview"],
}


def _next_case_number(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(func.count(models.ClaimCase.id)).scalar() + 1
    return f"CLM-{year}{count:04d}"


def _audit(db: Session, case_id: str, event_type: str, actor: str, description: str, metadata: dict = None):
    event = models.AuditEvent(
        id=str(uuid.uuid4()),
        case_id=case_id,
        event_type=event_type,
        actor=actor,
        description=description,
        event_metadata=json.dumps(metadata) if metadata else None,
        created_at=datetime.utcnow(),
    )
    db.add(event)


@router.get("/cases", response_model=List[schemas.ClaimCaseSummary])
def list_cases(
    status: Optional[str] = Query(None),
    product_type: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(models.ClaimCase)
    if status:
        query = query.filter(models.ClaimCase.status == status)
    if product_type:
        query = query.filter(models.ClaimCase.product_type == product_type)
    if priority:
        query = query.filter(models.ClaimCase.priority == priority)
    return query.order_by(models.ClaimCase.created_at.desc()).all()


@router.post("/cases", response_model=schemas.ClaimCaseDetail, status_code=201)
def create_case(case_in: schemas.ClaimCaseCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    case_id = str(uuid.uuid4())
    case = models.ClaimCase(
        id=case_id,
        case_number=_next_case_number(db),
        title=case_in.title,
        description=case_in.description,
        claimant_name=case_in.claimant_name,
        claimant_email=case_in.claimant_email,
        incident_date=case_in.incident_date,
        product_type=case_in.product_type,
        status="Draft",
        channel=case_in.channel,
        assigned_to=case_in.assigned_to,
        priority=case_in.priority,
        estimated_amount=case_in.estimated_amount,
        created_at=now,
        updated_at=now,
    )
    db.add(case)
    db.flush()

    req_templates = get_requirements_for_product(case_in.product_type)
    for tmpl in req_templates:
        req = models.Requirement(
            id=str(uuid.uuid4()),
            case_id=case_id,
            name=tmpl["name"],
            description=tmpl["description"],
            required_evidence_type=tmpl["required_evidence_type"],
            is_mandatory=tmpl["is_mandatory"],
            status="pending",
        )
        db.add(req)

    _audit(
        db, case_id, "CaseCreated", case_in.assigned_to or "system",
        f"Case {case.case_number} created for {case_in.claimant_name}",
        {"product_type": case_in.product_type, "channel": case_in.channel},
    )

    db.commit()
    db.refresh(case)
    return case


@router.get("/cases/{case_id}", response_model=schemas.ClaimCaseDetail)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/cases/{case_id}/status", response_model=schemas.ClaimCaseSummary)
def update_case_status(
    case_id: str,
    body: schemas.ClaimCaseStatusUpdate,
    db: Session = Depends(get_db),
):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    allowed = VALID_TRANSITIONS.get(case.status, [])
    if body.status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid transition: {case.status} → {body.status}. Allowed: {allowed}",
        )

    old_status = case.status
    case.status = body.status
    case.updated_at = datetime.utcnow()

    _audit(
        db, case_id, "StatusChanged", "system",
        f"Status changed from {old_status} to {body.status}",
        {"from": old_status, "to": body.status},
    )

    db.commit()
    db.refresh(case)
    return case


@router.delete("/cases/{case_id}", status_code=204)
def delete_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
