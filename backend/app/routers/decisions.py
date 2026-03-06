import uuid
import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.services.decision_support import generate_recommendation

router = APIRouter()


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


@router.get("/cases/{case_id}/decisions", response_model=List[schemas.DecisionResponse])
def list_decisions(case_id: str, db: Session = Depends(get_db)):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return (
        db.query(models.Decision)
        .filter(models.Decision.case_id == case_id)
        .order_by(models.Decision.created_at.desc())
        .all()
    )


@router.post("/cases/{case_id}/decisions/recommend", response_model=schemas.DecisionResponse, status_code=201)
def recommend_decision(case_id: str, db: Session = Depends(get_db)):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    result = generate_recommendation(case, db)

    decision = models.Decision(
        id=str(uuid.uuid4()),
        case_id=case_id,
        recommendation=result["recommendation"],
        confidence_score=result["confidence_score"],
        reason=result["reason"],
        evidence_completeness_score=result["evidence_completeness_score"],
        created_at=datetime.utcnow(),
    )
    db.add(decision)

    _audit(
        db, case_id, "DecisionRecommended", "system",
        f"Decision recommendation generated: {result['recommendation']} "
        f"(confidence: {result['confidence_score']:.0%})",
        {"recommendation": result["recommendation"], "confidence": result["confidence_score"]},
    )

    db.commit()
    db.refresh(decision)
    return decision


@router.post("/cases/{case_id}/decisions/{decision_id}/confirm", response_model=schemas.DecisionResponse)
def confirm_decision(
    case_id: str,
    decision_id: str,
    body: schemas.DecisionConfirm,
    db: Session = Depends(get_db),
):
    decision = db.query(models.Decision).filter(
        models.Decision.id == decision_id,
        models.Decision.case_id == case_id,
    ).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision.confirmed_by = body.confirmed_by
    decision.confirmed_at = datetime.utcnow()

    _audit(
        db, case_id, "DecisionConfirmed", body.confirmed_by,
        f"Decision '{decision.recommendation}' confirmed by {body.confirmed_by}",
        {"decision_id": decision_id, "recommendation": decision.recommendation},
    )

    db.commit()
    db.refresh(decision)
    return decision
