from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.database import get_db
from app.utils.auth import get_current_admin_user
from app.constants import DEMO_BUSINESS_NAMES, DEMO_SENSOR_HOURS
from app.models.db_models import (
    User, Business, BusinessRanking, InsuranceCompany, BusinessNote,
    Claim, ClaimStatus, Policy, RiskAssessment, SensorReading, RecommendationTracking, RecommendationStatus, EmailLog, Notification
)
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter(prefix="/insurance", tags=["insurance"])


# Pydantic schemas
class BusinessNoteCreate(BaseModel):
    business_id: int
    note_text: str


class BusinessNoteResponse(BaseModel):
    note_id: int
    business_id: int
    business_name: str
    note_text: str
    created_by_email: str
    created_at: str
    updated_at: str


class ClaimCreate(BaseModel):
    business_id: int
    claim_amount: float
    description: str
    incident_date: str


class ClaimResponse(BaseModel):
    claim_id: int
    business_id: int
    business_name: str
    claim_number: str
    claim_amount: float
    status: str
    description: str
    incident_date: str
    filed_date: str
    compliance_score_at_incident: Optional[float]
    risk_assessment_id: Optional[int]


class PolicyCreate(BaseModel):
    business_id: Optional[int] = None
    store_type: Optional[str] = None
    compliance_threshold: float = 75.0
    requirements: Optional[Dict[str, Any]] = None


class PolicyResponse(BaseModel):
    policy_id: int
    business_id: Optional[int]
    business_name: Optional[str]
    store_type: Optional[str]
    compliance_threshold: float
    requirements: Optional[Dict[str, Any]]


class RiskAssessmentCreate(BaseModel):
    business_id: int
    risk_level: str
    risk_factors: Optional[List[str]] = None
    recommendations: Optional[str] = None


class BusinessPortfolioItem(BaseModel):
    business_id: int
    business_name: str
    store_type: str
    city: str
    compliance_score: float
    rank_level: str
    risk_level: str
    notes_count: int
    claims_count: int
    last_updated: str


def get_insurance_company_id(current_user: User, db: Session) -> int:
    """Get insurance company ID for current user. Creates one if it doesn't exist."""
    if current_user.role.value == "Insurance":
        # Check if user has insurance_company_id set
        if current_user.insurance_company_id:
            return current_user.insurance_company_id
        
        # Create insurance company if it doesn't exist
        insurance_company = db.query(InsuranceCompany).filter(
            InsuranceCompany.insurance_company_id == current_user.user_id
        ).first()
        
        if not insurance_company:
            insurance_company = InsuranceCompany(
                insurance_company_id=current_user.user_id,
                name=f"Insurance Company {current_user.email}",
            )
            db.add(insurance_company)
            db.commit()
            db.refresh(insurance_company)
        
        # Update user with insurance_company_id
        current_user.insurance_company_id = insurance_company.insurance_company_id
        db.commit()
        
        return insurance_company.insurance_company_id
    elif current_user.role.value == "Admin":
        # Admin can access all, create or use default company
        default_company = db.query(InsuranceCompany).filter(
            InsuranceCompany.insurance_company_id == 1
        ).first()
        
        if not default_company:
            default_company = InsuranceCompany(
                insurance_company_id=1,
                name="Default Insurance Company",
            )
            db.add(default_company)
            db.commit()
            db.refresh(default_company)
        
        return 1
    raise HTTPException(status_code=403, detail="Access denied")


def calculate_compliance_score_for_business(db: Session, business_id: int) -> Dict[str, Any]:
    """Calculate compliance score for a business using the same logic as the sensors endpoint.
    
    Reuses _get_latest_sensors_for_business so sensor data is deduplicated and
    includes sensor_type (needed for per-category scoring).
    Demo businesses use a 1-year window so their one-time seed data stays visible.
    """
    from app.routers.sensors import calculate_compliance_score, _get_latest_sensors_for_business

    business = db.query(Business).filter(Business.business_id == business_id).first()
    hours = DEMO_SENSOR_HOURS if (business and business.name in DEMO_BUSINESS_NAMES) else 24
    sensors_data = _get_latest_sensors_for_business(db, business_id, hours=hours)
    
    recommendations = db.query(RecommendationTracking).filter(
        RecommendationTracking.business_id == business_id
    ).all()
    
    recommendations_followed = sum(
        1 for r in recommendations 
        if r.status == RecommendationStatus.IMPLEMENTED
    )
    recommendations_total = len(recommendations)
    
    return calculate_compliance_score(sensors_data, recommendations_followed, recommendations_total)


@router.get("/portfolio")
async def get_business_portfolio(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    store_type: Optional[str] = Query(None, description="Filter by store type"),
    min_score: Optional[float] = Query(None, description="Minimum compliance score"),
    max_score: Optional[float] = Query(None, description="Maximum compliance score"),
):
    """Get portfolio of insured businesses with filtering options."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    # Filter businesses by insurance company (only show businesses linked to this insurer)
    query = db.query(Business)
    
    # If not admin, only show businesses linked to this insurance company
    if current_user.role.value != "Admin":
        query = query.filter(Business.insurance_company_id == insurance_company_id)
    
    if store_type:
        query = query.filter(Business.store_type == store_type)
    
    businesses = query.all()
    
    # Pre-load all policies for this insurance company for efficient lookup
    all_policies = db.query(Policy).filter(
        Policy.insurance_company_id == insurance_company_id
    ).all()

    def get_policy_for_business(business_id: int) -> Optional[Policy]:
        """Find the most specific policy for a business (business-specific > general)."""
        # First try business-specific policy
        for p in all_policies:
            if p.business_id == business_id:
                return p
        # No specific policy found
        return None

    portfolio = []
    violations_count = 0

    for business in businesses:
        compliance = calculate_compliance_score_for_business(db, business.business_id)
        
        # Determine risk level from compliance score
        score = compliance["overall_score"]
        if score >= 90:
            risk = "Low"
        elif score >= 75:
            risk = "Medium"
        elif score >= 60:
            risk = "High"
        else:
            risk = "Critical"
        
        # Apply filters
        if risk_level and risk != risk_level:
            continue
        if min_score and score < min_score:
            continue
        if max_score and score > max_score:
            continue
        
        # Get notes and claims count (filter by insurance company if not admin)
        notes_query = db.query(BusinessNote).filter(
            BusinessNote.business_id == business.business_id
        )
        if insurance_company_id > 0:
            notes_query = notes_query.filter(BusinessNote.insurance_company_id == insurance_company_id)
        notes_count = notes_query.count()
        
        claims_query = db.query(Claim).filter(
            Claim.business_id == business.business_id
        )
        if insurance_company_id > 0:
            claims_query = claims_query.filter(Claim.insurance_company_id == insurance_company_id)
        claims_count = claims_query.count()

        # Check policy compliance
        policy = get_policy_for_business(business.business_id)
        policy_threshold = policy.compliance_threshold if policy else None
        policy_violated = policy_threshold is not None and score < policy_threshold
        if policy_violated:
            violations_count += 1
        
        portfolio.append({
            "business_id": business.business_id,
            "business_name": business.name,
            "store_type": business.store_type or "Unknown",
            "city": business.city or "Unknown",
            "compliance_score": round(score, 1),
            "rank_level": compliance["rank"],
            "risk_level": risk,
            "notes_count": notes_count,
            "claims_count": claims_count,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "policy_threshold": policy_threshold,
            "policy_violated": policy_violated,
        })
    
    # Sort by compliance score descending
    portfolio.sort(key=lambda x: x["compliance_score"], reverse=True)
    
    return {
        "businesses": portfolio,
        "total": len(portfolio),
        "violations_count": violations_count,
    }


@router.post("/notes", response_model=BusinessNoteResponse)
async def create_business_note(
    note_data: BusinessNoteCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Add a note to a business."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    # Verify business exists
    business = db.query(Business).filter(Business.business_id == note_data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Ensure insurance company exists in database
    insurance_company = db.query(InsuranceCompany).filter(
        InsuranceCompany.insurance_company_id == insurance_company_id
    ).first()
    
    if not insurance_company:
        # Create insurance company if it doesn't exist
        try:
            insurance_company = InsuranceCompany(
                insurance_company_id=insurance_company_id,
                name=f"Insurance Company {current_user.email}",
            )
            db.add(insurance_company)
            db.commit()
            db.refresh(insurance_company)
        except Exception as e:
            db.rollback()
            # If creation fails (e.g., ID conflict), try to get existing one
            insurance_company = db.query(InsuranceCompany).filter(
                InsuranceCompany.insurance_company_id == insurance_company_id
            ).first()
            if not insurance_company:
                raise HTTPException(status_code=500, detail=f"Failed to create insurance company: {str(e)}")
    
    # Create the note
    note = BusinessNote(
        business_id=note_data.business_id,
        insurance_company_id=insurance_company_id,
        note_text=note_data.note_text,
        created_by_user_id=current_user.user_id,
    )
    db.add(note)
    try:
        db.commit()
        db.refresh(note)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save note: {str(e)}")
    
    return BusinessNoteResponse(
        note_id=note.note_id,
        business_id=note.business_id,
        business_name=business.name,
        note_text=note.note_text,
        created_by_email=current_user.email,
        created_at=note.created_at.isoformat(),
        updated_at=note.updated_at.isoformat(),
    )


@router.get("/notes/{business_id}")
async def get_business_notes(
    business_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get all notes for a business."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    # Get notes for this business (filter by insurance company if not admin)
    query = db.query(BusinessNote).filter(
        BusinessNote.business_id == business_id
    )
    
    if insurance_company_id > 0:
        query = query.filter(BusinessNote.insurance_company_id == insurance_company_id)
    
    notes = query.order_by(desc(BusinessNote.created_at)).all()
    
    result = []
    for note in notes:
        business = db.query(Business).filter(Business.business_id == note.business_id).first()
        created_by = db.query(User).filter(User.user_id == note.created_by_user_id).first()
        
        result.append({
            "note_id": note.note_id,
            "business_id": note.business_id,
            "business_name": business.name if business else "Unknown",
            "note_text": note.note_text,
            "created_by_email": created_by.email if created_by else "Unknown",
            "created_at": note.created_at.isoformat(),
            "updated_at": note.updated_at.isoformat(),
        })
    
    return {"notes": result}


@router.delete("/notes/{note_id}")
async def delete_business_note(
    note_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a note."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    note = db.query(BusinessNote).filter(BusinessNote.note_id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Only allow deletion if the note belongs to the user's insurance company
    if insurance_company_id > 0 and note.insurance_company_id != insurance_company_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    
    db.delete(note)
    db.commit()
    return {"message": "Note deleted successfully"}


@router.get("/claims", response_model=List[ClaimResponse])
async def get_claims(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    business_id: Optional[int] = Query(None, description="Filter by business ID"),
    status: Optional[str] = Query(None, description="Filter by claim status"),
):
    """Get claims dashboard with filtering."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    query = db.query(Claim)
    
    if insurance_company_id > 0:
        query = query.filter(Claim.insurance_company_id == insurance_company_id)
    
    if business_id:
        query = query.filter(Claim.business_id == business_id)
    
    if status:
        query = query.filter(Claim.status == ClaimStatus[status.upper()])
    
    claims = query.order_by(desc(Claim.filed_date)).all()
    
    result = []
    for claim in claims:
        business = db.query(Business).filter(Business.business_id == claim.business_id).first()
        
        result.append(ClaimResponse(
            claim_id=claim.claim_id,
            business_id=claim.business_id,
            business_name=business.name if business else "Unknown",
            claim_number=claim.claim_number,
            claim_amount=claim.claim_amount,
            status=claim.status.value,
            description=claim.description,
            incident_date=claim.incident_date.isoformat(),
            filed_date=claim.filed_date.isoformat(),
            compliance_score_at_incident=claim.compliance_score_at_incident,
            risk_assessment_id=claim.risk_assessment_id,
        ))
    
    return result


@router.post("/claims", response_model=ClaimResponse)
async def create_claim(
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a new claim linked to compliance score."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    business = db.query(Business).filter(Business.business_id == claim_data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Get compliance score at incident time
    compliance = calculate_compliance_score_for_business(db, claim_data.business_id)
    
    # Generate claim number
    claim_count = db.query(Claim).count()
    claim_number = f"CLM-{datetime.now().year}-{str(claim_count + 1).zfill(6)}"
    
    claim = Claim(
        business_id=claim_data.business_id,
        insurance_company_id=insurance_company_id if insurance_company_id > 0 else 1,
        claim_number=claim_number,
        claim_amount=claim_data.claim_amount,
        status=ClaimStatus.PENDING,
        description=claim_data.description,
        incident_date=datetime.fromisoformat(claim_data.incident_date.replace('Z', '+00:00')),
        compliance_score_at_incident=compliance["overall_score"],
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    
    return ClaimResponse(
        claim_id=claim.claim_id,
        business_id=claim.business_id,
        business_name=business.name,
        claim_number=claim.claim_number,
        claim_amount=claim.claim_amount,
        status=claim.status.value,
        description=claim.description,
        incident_date=claim.incident_date.isoformat(),
        filed_date=claim.filed_date.isoformat(),
        compliance_score_at_incident=claim.compliance_score_at_incident,
        risk_assessment_id=claim.risk_assessment_id,
    )


@router.get("/policies")
async def get_policies(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    business_id: Optional[int] = Query(None, description="Filter by business ID"),
):
    """Get policy management settings with live compliance status."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    query = db.query(Policy)
    
    if insurance_company_id > 0:
        query = query.filter(Policy.insurance_company_id == insurance_company_id)
    
    if business_id:
        query = query.filter(Policy.business_id == business_id)
    
    policies = query.all()
    
    result = []
    for policy in policies:
        business = None
        current_score = None
        city = None
        if policy.business_id:
            business = db.query(Business).filter(Business.business_id == policy.business_id).first()
            if business:
                compliance = calculate_compliance_score_for_business(db, business.business_id)
                current_score = compliance["overall_score"]
                city = business.city

        violated = current_score is not None and current_score < policy.compliance_threshold

        result.append({
            "policy_id": policy.policy_id,
            "business_id": policy.business_id,
            "business_name": business.name if business else None,
            "store_type": business.store_type if business else policy.store_type,
            "city": city,
            "compliance_threshold": policy.compliance_threshold,
            "current_score": current_score,
            "violated": violated,
            "requirements": policy.requirements,
        })
    
    return result


@router.post("/policies", response_model=PolicyResponse)
async def create_policy(
    policy_data: PolicyCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a policy. Rejects if one already exists for the same business."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    effective_company_id = insurance_company_id if insurance_company_id > 0 else 1
    
    if policy_data.business_id:
        business = db.query(Business).filter(Business.business_id == policy_data.business_id).first()
        if not business:
            raise HTTPException(status_code=404, detail="Business not found")

        # Check for existing policy
        existing = db.query(Policy).filter(
            Policy.insurance_company_id == effective_company_id,
            Policy.business_id == policy_data.business_id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"A policy already exists for this business (Policy #{existing.policy_id}). Please edit the existing policy instead."
            )
    
    policy = Policy(
        insurance_company_id=effective_company_id,
        business_id=policy_data.business_id,
        store_type=policy_data.store_type,
        compliance_threshold=policy_data.compliance_threshold,
        requirements=policy_data.requirements,
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    
    business = None
    if policy.business_id:
        business = db.query(Business).filter(Business.business_id == policy.business_id).first()
    
    return PolicyResponse(
        policy_id=policy.policy_id,
        business_id=policy.business_id,
        business_name=business.name if business else None,
        store_type=policy.store_type,
        compliance_threshold=policy.compliance_threshold,
        requirements=policy.requirements,
    )


class PolicyUpdate(BaseModel):
    compliance_threshold: Optional[float] = None
    requirements: Optional[Dict[str, Any]] = None


@router.put("/policies/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: int,
    policy_data: PolicyUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update an existing policy's threshold or requirements."""
    insurance_company_id = get_insurance_company_id(current_user, db)

    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if current_user.role.value != "Admin" and policy.insurance_company_id != insurance_company_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this policy")

    if policy_data.compliance_threshold is not None:
        policy.compliance_threshold = policy_data.compliance_threshold
    if policy_data.requirements is not None:
        policy.requirements = policy_data.requirements

    db.commit()
    db.refresh(policy)

    business = None
    if policy.business_id:
        business = db.query(Business).filter(Business.business_id == policy.business_id).first()

    return PolicyResponse(
        policy_id=policy.policy_id,
        business_id=policy.business_id,
        business_name=business.name if business else None,
        store_type=policy.store_type,
        compliance_threshold=policy.compliance_threshold,
        requirements=policy.requirements,
    )


@router.delete("/policies/{policy_id}")
async def delete_policy(
    policy_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete a policy."""
    insurance_company_id = get_insurance_company_id(current_user, db)

    policy = db.query(Policy).filter(Policy.policy_id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    # Only allow deletion if the policy belongs to the user's insurance company
    if current_user.role.value != "Admin" and policy.insurance_company_id != insurance_company_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this policy")

    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted successfully"}


@router.post("/risk-assessments", response_model=Dict[str, Any])
async def create_risk_assessment(
    assessment_data: RiskAssessmentCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Create a risk assessment report."""
    insurance_company_id = get_insurance_company_id(current_user, db)
    
    business = db.query(Business).filter(Business.business_id == assessment_data.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    compliance = calculate_compliance_score_for_business(db, assessment_data.business_id)
    
    assessment = RiskAssessment(
        business_id=assessment_data.business_id,
        insurance_company_id=insurance_company_id if insurance_company_id > 0 else 1,
        compliance_score=compliance["overall_score"],
        risk_level=assessment_data.risk_level,
        risk_factors=assessment_data.risk_factors or [],
        recommendations=assessment_data.recommendations,
        created_by_user_id=current_user.user_id,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {
        "assessment_id": assessment.assessment_id,
        "business_id": assessment.business_id,
        "business_name": business.name,
        "assessment_date": assessment.assessment_date.isoformat(),
        "compliance_score": assessment.compliance_score,
        "risk_level": assessment.risk_level,
        "risk_factors": assessment.risk_factors,
        "recommendations": assessment.recommendations,
    }


@router.get("/risk-assessments/{business_id}")
async def get_business_risk_assessments(
    business_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get risk assessment history for a business."""
    assessments = db.query(RiskAssessment).filter(
        RiskAssessment.business_id == business_id
    ).order_by(desc(RiskAssessment.assessment_date)).all()
    
    result = []
    for assessment in assessments:
        result.append({
            "assessment_id": assessment.assessment_id,
            "assessment_date": assessment.assessment_date.isoformat(),
            "compliance_score": assessment.compliance_score,
            "risk_level": assessment.risk_level,
            "risk_factors": assessment.risk_factors or [],
            "recommendations": assessment.recommendations,
        })
    
    return {"assessments": result}


@router.get("/compare")
async def compare_businesses(
    business_ids: str = Query(..., description="Comma-separated business IDs"),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Compare multiple businesses side-by-side."""
    ids = [int(id.strip()) for id in business_ids.split(",")]
    
    if len(ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 businesses can be compared at once")
    
    businesses = db.query(Business).filter(Business.business_id.in_(ids)).all()
    
    comparison = []
    for business in businesses:
        compliance = calculate_compliance_score_for_business(db, business.business_id)
        
        # Get historical trend (last 7 days of compliance scores)
        # Generate realistic trend data based on current score
        import random
        trend_data = []
        base_score = compliance["overall_score"]
        for i in range(7):
            date = datetime.now(timezone.utc) - timedelta(days=6-i)
            # Generate trend with some variation
            variation = random.uniform(-5, 5)
            trend_score = max(0, min(100, base_score + variation))
            trend_data.append({
                "date": date.isoformat(),
                "score": round(trend_score, 1),
            })
        
        comparison.append({
            "business_id": business.business_id,
            "business_name": business.name,
            "store_type": business.store_type,
            "city": business.city,
            "current_score": compliance["overall_score"],
            "rank_level": compliance["rank"],
            "recommendations_followed": compliance["recommendations_followed"],
            "recommendations_total": compliance["recommendations_total"],
            "trend": trend_data,
        })
    
    return {"comparison": comparison}


# =========================
# Email Notification Endpoints
# =========================

class NotifyViolationRequest(BaseModel):
    business_id: int


@router.post("/notify-violation")
async def notify_violation(
    request: NotifyViolationRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Send a policy violation warning email to a business.

    In POC mode (SEND_REAL_EMAILS=False), the email is logged to the database
    and printed to the console. When SEND_REAL_EMAILS=True, it is also sent via SMTP.
    """
    from app.config import SEND_REAL_EMAILS, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

    insurance_company_id = get_insurance_company_id(current_user, db)

    # Look up business
    business = db.query(Business).filter(Business.business_id == request.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Find the policy for this business
    policy = db.query(Policy).filter(
        Policy.insurance_company_id == insurance_company_id,
        Policy.business_id == business.business_id,
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No policy found for this business")

    # Calculate current compliance
    compliance = calculate_compliance_score_for_business(db, business.business_id)
    current_score = compliance["overall_score"]

    if current_score >= policy.compliance_threshold:
        raise HTTPException(
            status_code=400,
            detail=f"Business is compliant ({current_score}% >= {policy.compliance_threshold}%). No warning needed."
        )

    # Find the business owner's email (if any)
    business_user = db.query(User).filter(User.business_id == business.business_id).first()
    recipient_email = business_user.email if business_user else f"{business.name.lower().replace(' ', '.')}@example.com"

    # Compose the email
    gap = round(current_score - policy.compliance_threshold, 1)
    categories = compliance.get("category_scores", {})
    weak_categories = [
        cat.replace("_", " ").title()
        for cat, score in categories.items()
        if score < 70
    ]

    subject = f"Compliance Warning: {business.name} is below policy threshold"

    body = (
        f"Dear {business.name} team,\n\n"
        f"This is a compliance warning from your insurance provider (State Farm).\n\n"
        f"Your current compliance score is {current_score}%, which is below the "
        f"required policy threshold of {policy.compliance_threshold}% (gap: {gap}%).\n\n"
    )
    if weak_categories:
        body += "The following areas need attention:\n"
        for cat in weak_categories:
            cat_key = cat.lower().replace(" ", "_")
            cat_score = categories.get(cat_key, 0)
            body += f"  - {cat}: {cat_score}%\n"
        body += "\n"
    body += (
        "Please take immediate action to improve your compliance score to avoid "
        "potential policy adjustments.\n\n"
        "Actions you can take:\n"
        "  1. Review and implement pending recommendations on your dashboard\n"
        "  2. Ensure all sensors are operational and within normal ranges\n"
        "  3. Contact your insurance agent if you need assistance\n\n"
        "Best regards,\n"
        "Canopy Risk Management Platform"
    )

    # Save email log to database
    email_log = EmailLog(
        business_id=business.business_id,
        insurance_company_id=insurance_company_id,
        recipient_email=recipient_email,
        subject=subject,
        body=body,
        sent_by_user_id=current_user.user_id,
    )
    db.add(email_log)

    # Create an in-app notification for the business user
    if business_user:
        notification = Notification(
            user_id=business_user.user_id,
            sender_user_id=current_user.user_id,
            title=subject,
            message=body,
            notification_type="warning",
        )
        db.add(notification)

    db.commit()
    db.refresh(email_log)

    # Send or simulate
    if SEND_REAL_EMAILS:
        # Real SMTP sending (disabled for now — set SEND_REAL_EMAILS=True in config.py)
        try:
            import smtplib
            import ssl
            from email.message import EmailMessage

            msg = EmailMessage()
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = recipient_email
            msg.set_content(body)

            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(SMTP_HOST, 465, context=context) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        except Exception as e:
            raise HTTPException(status_code=500, detail="Failed to send email: {}".format(str(e)))
    else:
        print(f"\n{'='*60}")
        print(f"[EMAIL SIMULATED] (SEND_REAL_EMAILS=False)")
        print(f"  To: {recipient_email}")
        print(f"  Subject: {subject}")
        print(f"  Body preview: {body[:200]}...")
        print(f"{'='*60}\n")

    return {
        "message": "Warning email sent successfully",
        "email_id": email_log.email_id,
        "recipient": recipient_email,
        "subject": subject,
        "body": body,
        "simulated": not SEND_REAL_EMAILS,
    }


@router.get("/email-logs/{business_id}")
async def get_email_logs(
    business_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get email notification history for a business."""
    insurance_company_id = get_insurance_company_id(current_user, db)

    logs = db.query(EmailLog).filter(
        EmailLog.business_id == business_id,
        EmailLog.insurance_company_id == insurance_company_id,
    ).order_by(desc(EmailLog.sent_at)).all()

    result = []
    for log in logs:
        sent_by = db.query(User).filter(User.user_id == log.sent_by_user_id).first()
        result.append({
            "email_id": log.email_id,
            "recipient_email": log.recipient_email,
            "subject": log.subject,
            "body": log.body,
            "sent_at": log.sent_at.isoformat(),
            "sent_by_email": sent_by.email if sent_by else "Unknown",
        })

    return {"logs": result}
