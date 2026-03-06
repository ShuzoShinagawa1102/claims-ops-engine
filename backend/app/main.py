import uuid
import json
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app import models
from app.routers import cases, evidence, decisions, audit
from app.services.requirement_engine import get_requirements_for_product

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Claims Ops Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases.router, prefix="/api", tags=["cases"])
app.include_router(evidence.router, prefix="/api", tags=["evidence"])
app.include_router(decisions.router, prefix="/api", tags=["decisions"])
app.include_router(audit.router, prefix="/api", tags=["audit"])


@app.get("/api/health")
def health():
    return {"status": "ok"}


def _audit_event(db: Session, case_id: str, event_type: str, actor: str, description: str, metadata: dict = None):
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


SEED_CASES = [
    {
        "title": "Multi-Vehicle Highway Collision",
        "claimant_name": "James Whitfield",
        "claimant_email": "james.whitfield@email.com",
        "incident_date": "2025-03-15",
        "product_type": "auto",
        "channel": "web",
        "assigned_to": "Sarah Chen",
        "priority": "high",
        "estimated_amount": 18500.0,
        "description": "Three-car collision on I-95 northbound. Claimant's vehicle sustained significant rear and front damage.",
        "status": "InReview",
        "approved_amount": None,
        "evidence_items": [
            {"title": "Police Report #2025-03-15-447", "evidence_type": "document", "status": "accepted", "req_index": 0},
            {"title": "AutoRepair Pro Estimate", "evidence_type": "document", "status": "accepted", "req_index": 1},
            {"title": "Damage Photo Set (Front)", "evidence_type": "photo", "status": "accepted", "req_index": 2},
        ],
    },
    {
        "title": "Emergency Appendectomy Claim",
        "claimant_name": "Maria Santos",
        "claimant_email": "maria.santos@email.com",
        "incident_date": "2025-04-02",
        "product_type": "health",
        "channel": "portal",
        "assigned_to": "David Kim",
        "priority": "critical",
        "estimated_amount": 42000.0,
        "description": "Emergency appendectomy performed at City General Hospital. Patient was admitted for 3 days post-surgery.",
        "status": "Approved",
        "approved_amount": 38500.0,
        "evidence_items": [
            {"title": "Surgeon's Diagnosis Report", "evidence_type": "document", "status": "accepted", "req_index": 0},
            {"title": "Hospital Bill - City General", "evidence_type": "document", "status": "accepted", "req_index": 1},
            {"title": "Surgical Referral Letter", "evidence_type": "document", "status": "accepted", "req_index": 2},
            {"title": "Post-Op Treatment Records", "evidence_type": "document", "status": "accepted", "req_index": 3},
        ],
    },
    {
        "title": "European Vacation Flight Cancellation",
        "claimant_name": "Robert Thompson",
        "claimant_email": "r.thompson@email.com",
        "incident_date": "2025-02-20",
        "product_type": "travel",
        "channel": "phone",
        "assigned_to": "Lisa Park",
        "priority": "medium",
        "estimated_amount": 5200.0,
        "description": "Flight from JFK to Paris CDG cancelled due to airline strike. Claimant missed 2 nights hotel and tour reservations.",
        "status": "WaitingForEvidence",
        "approved_amount": None,
        "evidence_items": [
            {"title": "Original Booking Confirmation", "evidence_type": "document", "status": "accepted", "req_index": 0},
            {"title": "Airline Cancellation Email", "evidence_type": "document", "status": "accepted", "req_index": 1},
        ],
    },
    {
        "title": "Storm Damage to Residential Property",
        "claimant_name": "Carol Jenkins",
        "claimant_email": "carol.jenkins@homemail.com",
        "incident_date": "2025-01-08",
        "product_type": "property",
        "channel": "email",
        "assigned_to": "Michael Torres",
        "priority": "high",
        "estimated_amount": 31000.0,
        "description": "Severe hailstorm caused roof damage and broken windows at primary residence. Water intrusion noted in master bedroom.",
        "status": "Exception",
        "approved_amount": None,
        "evidence_items": [
            {"title": "Storm Damage Photos - Exterior", "evidence_type": "photo", "status": "accepted", "req_index": 0},
        ],
    },
    {
        "title": "Rear-End Collision - Parking Lot",
        "claimant_name": "Kevin Murphy",
        "claimant_email": "kmurphy@workmail.com",
        "incident_date": "2025-04-18",
        "product_type": "auto",
        "channel": "web",
        "assigned_to": "Sarah Chen",
        "priority": "low",
        "estimated_amount": 3200.0,
        "description": "Minor rear-end collision in shopping center parking lot. Bumper and trunk lid damaged.",
        "status": "Draft",
        "approved_amount": None,
        "evidence_items": [],
    },
    {
        "title": "Chronic Back Treatment Coverage",
        "claimant_name": "Patricia Williams",
        "claimant_email": "p.williams@email.com",
        "incident_date": "2025-03-01",
        "product_type": "health",
        "channel": "portal",
        "assigned_to": "David Kim",
        "priority": "medium",
        "estimated_amount": 8750.0,
        "description": "Ongoing physical therapy and chiropractic treatment for chronic lumbar disc herniation.",
        "status": "Rejected",
        "approved_amount": None,
        "evidence_items": [
            {"title": "Initial Diagnosis", "evidence_type": "document", "status": "accepted", "req_index": 0},
        ],
    },
    {
        "title": "Business Trip Luggage Loss",
        "claimant_name": "Alan Foster",
        "claimant_email": "alan.foster@corp.com",
        "incident_date": "2025-04-10",
        "product_type": "travel",
        "channel": "web",
        "assigned_to": "Lisa Park",
        "priority": "medium",
        "estimated_amount": 2800.0,
        "description": "Checked luggage permanently lost by connecting flight carrier during business travel to Chicago.",
        "status": "IntakeValidated",
        "approved_amount": None,
        "evidence_items": [
            {"title": "Flight Booking - Round Trip Chicago", "evidence_type": "document", "status": "accepted", "req_index": 0},
            {"title": "Airline Lost Luggage Report", "evidence_type": "document", "status": "accepted", "req_index": 1},
        ],
    },
]


@app.post("/api/seed")
def seed_data(db: Session = Depends(get_db)):
    existing = db.query(models.ClaimCase).count()
    if existing >= len(SEED_CASES):
        return {"message": "Seed data already exists", "count": existing}

    created = 0
    year = datetime.utcnow().year

    for i, seed in enumerate(SEED_CASES):
        case_id = str(uuid.uuid4())
        case_number = f"CLM-{year}{(existing + i + 1):04d}"
        now = datetime.utcnow() - timedelta(days=len(SEED_CASES) - i)

        case = models.ClaimCase(
            id=case_id,
            case_number=case_number,
            title=seed["title"],
            description=seed.get("description"),
            claimant_name=seed["claimant_name"],
            claimant_email=seed["claimant_email"],
            incident_date=seed["incident_date"],
            product_type=seed["product_type"],
            status=seed["status"],
            channel=seed["channel"],
            assigned_to=seed.get("assigned_to"),
            priority=seed["priority"],
            estimated_amount=seed.get("estimated_amount"),
            approved_amount=seed.get("approved_amount"),
            created_at=now,
            updated_at=now,
        )
        db.add(case)
        db.flush()

        req_templates = get_requirements_for_product(seed["product_type"])
        reqs = []
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
            reqs.append(req)
        db.flush()

        for ev_data in seed.get("evidence_items", []):
            req_id = None
            if "req_index" in ev_data and ev_data["req_index"] < len(reqs):
                req_id = reqs[ev_data["req_index"]].id
                if ev_data["status"] == "accepted":
                    reqs[ev_data["req_index"]].status = "fulfilled"

            ev = models.Evidence(
                id=str(uuid.uuid4()),
                case_id=case_id,
                requirement_id=req_id,
                evidence_type=ev_data["evidence_type"],
                title=ev_data["title"],
                description=f"Submitted as part of {seed['title']}",
                status=ev_data["status"],
                submitted_at=now + timedelta(hours=2),
            )
            db.add(ev)

        _audit_event(db, case_id, "CaseCreated", seed.get("assigned_to") or "system",
                     f"Case {case_number} created for {seed['claimant_name']}")

        if seed["status"] not in ("Draft",):
            _audit_event(db, case_id, "StatusChanged", "system",
                         f"Status progressed to {seed['status']}")

        created += 1

    db.commit()
    return {"message": f"Seeded {created} cases successfully", "count": created}
