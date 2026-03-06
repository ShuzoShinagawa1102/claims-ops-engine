import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ClaimCase(Base):
    __tablename__ = "claim_cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_number = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    claimant_name = Column(String, nullable=False)
    claimant_email = Column(String, nullable=False)
    incident_date = Column(String, nullable=False)
    product_type = Column(String, nullable=False)  # auto/health/travel/property
    status = Column(String, nullable=False, default="Draft")
    channel = Column(String, nullable=False, default="web")
    assigned_to = Column(String, nullable=True)
    priority = Column(String, nullable=False, default="medium")
    estimated_amount = Column(Float, nullable=True)
    approved_amount = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requirements = relationship("Requirement", back_populates="case", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="case", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="case", cascade="all, delete-orphan")


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("claim_cases.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    required_evidence_type = Column(String, nullable=False)
    is_mandatory = Column(Boolean, default=True)
    due_date = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending/fulfilled/waived/overdue

    case = relationship("ClaimCase", back_populates="requirements")
    evidence = relationship("Evidence", back_populates="requirement")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("claim_cases.id"), nullable=False)
    requirement_id = Column(String, ForeignKey("requirements.id"), nullable=True)
    evidence_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_name = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending")  # pending/accepted/rejected/expired
    submitted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    case = relationship("ClaimCase", back_populates="evidence")
    requirement = relationship("Requirement", back_populates="evidence")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("claim_cases.id"), nullable=False)
    recommendation = Column(String, nullable=False)  # approve/reject/request_more_info/escalate
    confidence_score = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    evidence_completeness_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_by = Column(String, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)

    case = relationship("ClaimCase", back_populates="decisions")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String, ForeignKey("claim_cases.id"), nullable=False)
    event_type = Column(String, nullable=False)
    actor = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    event_metadata = Column("metadata", Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    case = relationship("ClaimCase", back_populates="audit_events")
