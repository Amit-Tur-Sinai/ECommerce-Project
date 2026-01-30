from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models.db_models import (
    User, Business, BusinessNote, Claim, Policy, RiskAssessment,
    SensorReading, RecommendationTracking, BusinessRanking, RawScan
)
from app.schemas.auth_schemas import ProfileUpdateRequest, UserResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile information."""
    business = None
    if current_user.business_id:
        business = db.query(Business).filter(Business.business_id == current_user.business_id).first()
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )

        # Update business fields
        if request.business_name is not None:
            business.name = request.business_name
        if request.store_type is not None:
            business.store_type = request.store_type
        if request.city is not None:
            business.city = request.city
        if request.industry is not None:
            business.industry = request.industry
        if request.size is not None:
            business.size = request.size

        db.commit()
        db.refresh(business)

    return UserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role,
        business_id=current_user.business_id,
        business_name=business.name if business else None,
        store_type=business.store_type if business else None,
        city=business.city if business else None,
    )


@router.delete("/account", status_code=status.HTTP_200_OK)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account and associated data."""
    user_id = current_user.user_id
    business_id = current_user.business_id
    
    try:
        # If user has a business, delete all related data first
        if business_id:
            business = db.query(Business).filter(Business.business_id == business_id).first()
            if business:
                # Delete all related records for this business
                # Note: Some of these might cascade automatically depending on DB constraints
                db.query(RawScan).filter(RawScan.business_id == business_id).delete()
                db.query(SensorReading).filter(SensorReading.business_id == business_id).delete()
                db.query(RecommendationTracking).filter(RecommendationTracking.business_id == business_id).delete()
                db.query(BusinessRanking).filter(BusinessRanking.business_id == business_id).delete()
                db.query(BusinessNote).filter(BusinessNote.business_id == business_id).delete()
                db.query(RiskAssessment).filter(RiskAssessment.business_id == business_id).delete()
                db.query(Policy).filter(Policy.business_id == business_id).delete()
                db.query(Claim).filter(Claim.business_id == business_id).delete()
                
                # Delete the business itself
                db.delete(business)
        
        # Delete notes created by this user (if any)
        db.query(BusinessNote).filter(BusinessNote.created_by_user_id == user_id).delete()
        
        # Delete risk assessments created by this user (if any)
        db.query(RiskAssessment).filter(RiskAssessment.created_by_user_id == user_id).delete()
        
        # Delete the user
        db.delete(current_user)
        db.commit()
        
        return {"message": "Account deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )
