import uuid
import json
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

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


@router.get("/cases/{case_id}/evidence", response_model=List[schemas.EvidenceResponse])
def list_evidence(case_id: str, db: Session = Depends(get_db)):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return db.query(models.Evidence).filter(models.Evidence.case_id == case_id).all()


@router.post("/cases/{case_id}/evidence", response_model=schemas.EvidenceResponse, status_code=201)
def add_evidence(case_id: str, ev_in: schemas.EvidenceCreate, db: Session = Depends(get_db)):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if ev_in.requirement_id:
        req = db.query(models.Requirement).filter(
            models.Requirement.id == ev_in.requirement_id,
            models.Requirement.case_id == case_id,
        ).first()
        if not req:
            raise HTTPException(status_code=404, detail="Requirement not found")

    ev = models.Evidence(
        id=str(uuid.uuid4()),
        case_id=case_id,
        requirement_id=ev_in.requirement_id,
        evidence_type=ev_in.evidence_type,
        title=ev_in.title,
        description=ev_in.description,
        file_name=ev_in.file_name,
        status="pending",
        submitted_at=datetime.utcnow(),
        expires_at=ev_in.expires_at,
        notes=ev_in.notes,
    )
    db.add(ev)

    _audit(
        db, case_id, "EvidenceSubmitted", "claimant",
        f"Evidence '{ev_in.title}' submitted ({ev_in.evidence_type})",
        {"evidence_type": ev_in.evidence_type, "requirement_id": ev_in.requirement_id},
    )

    db.commit()
    db.refresh(ev)
    return ev


@router.patch("/cases/{case_id}/evidence/{evidence_id}", response_model=schemas.EvidenceResponse)
def update_evidence(
    case_id: str,
    evidence_id: str,
    ev_update: schemas.EvidenceUpdate,
    db: Session = Depends(get_db),
):
    ev = db.query(models.Evidence).filter(
        models.Evidence.id == evidence_id,
        models.Evidence.case_id == case_id,
    ).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    old_status = ev.status
    if ev_update.status is not None:
        ev.status = ev_update.status
    if ev_update.notes is not None:
        ev.notes = ev_update.notes

    if ev_update.status == "accepted" and ev.requirement_id:
        req = db.query(models.Requirement).filter(
            models.Requirement.id == ev.requirement_id
        ).first()
        if req and req.status == "pending":
            req.status = "fulfilled"
            _audit(
                db, case_id, "RequirementFulfilled", "adjuster",
                f"Requirement '{req.name}' marked as fulfilled",
                {"requirement_id": req.id},
            )

    if ev_update.status and ev_update.status != old_status:
        _audit(
            db, case_id, "EvidenceStatusChanged", "adjuster",
            f"Evidence '{ev.title}' status changed to {ev_update.status}",
            {"evidence_id": evidence_id, "from": old_status, "to": ev_update.status},
        )

    db.commit()
    db.refresh(ev)
    return ev
