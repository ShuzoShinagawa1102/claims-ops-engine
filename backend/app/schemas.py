from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# ---------- Requirement ----------

class RequirementBase(BaseModel):
    name: str
    description: Optional[str] = None
    required_evidence_type: str
    is_mandatory: bool = True
    due_date: Optional[str] = None


class RequirementCreate(RequirementBase):
    pass


class RequirementResponse(RequirementBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    status: str


# ---------- Evidence ----------

class EvidenceBase(BaseModel):
    evidence_type: str
    title: str
    description: Optional[str] = None
    file_name: Optional[str] = None
    notes: Optional[str] = None


class EvidenceCreate(EvidenceBase):
    requirement_id: Optional[str] = None
    expires_at: Optional[datetime] = None


class EvidenceUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class EvidenceResponse(EvidenceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    requirement_id: Optional[str] = None
    status: str
    submitted_at: datetime
    expires_at: Optional[datetime] = None


# ---------- Decision ----------

class DecisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    recommendation: str
    confidence_score: float
    reason: str
    evidence_completeness_score: float
    created_at: datetime
    confirmed_by: Optional[str] = None
    confirmed_at: Optional[datetime] = None


class DecisionConfirm(BaseModel):
    confirmed_by: str


# ---------- AuditEvent ----------

class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    event_type: str
    actor: str
    description: str
    event_metadata: Optional[str] = None
    created_at: datetime


# ---------- ClaimCase ----------

class ClaimCaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    claimant_name: str
    claimant_email: str
    incident_date: str
    product_type: str
    channel: str = "web"
    assigned_to: Optional[str] = None
    priority: str = "medium"
    estimated_amount: Optional[float] = None


class ClaimCaseCreate(ClaimCaseBase):
    pass


class ClaimCaseStatusUpdate(BaseModel):
    status: str


class ClaimCaseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_number: str
    title: str
    claimant_name: str
    claimant_email: str
    incident_date: str
    product_type: str
    status: str
    channel: str
    assigned_to: Optional[str] = None
    priority: str
    estimated_amount: Optional[float] = None
    approved_amount: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class ClaimCaseDetail(ClaimCaseSummary):
    requirements: List[RequirementResponse] = []
    evidence: List[EvidenceResponse] = []
    decisions: List[DecisionResponse] = []
    audit_events: List[AuditEventResponse] = []
