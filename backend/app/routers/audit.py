from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()


@router.get("/cases/{case_id}/audit", response_model=List[schemas.AuditEventResponse])
def get_audit_trail(case_id: str, db: Session = Depends(get_db)):
    case = db.query(models.ClaimCase).filter(models.ClaimCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return (
        db.query(models.AuditEvent)
        .filter(models.AuditEvent.case_id == case_id)
        .order_by(models.AuditEvent.created_at.asc())
        .all()
    )
