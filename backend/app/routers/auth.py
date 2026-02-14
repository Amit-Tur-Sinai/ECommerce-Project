from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import User, Business, UserRole, InsuranceCompany, City
from app.schemas.auth_schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.utils.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from app.config import GENERATE_DEMO_DATA_ON_REGISTER

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.get("/cities", response_model=List[str])
async def get_available_cities(db: Session = Depends(get_db)):
    """Return list of available cities from the cities table."""
    cities = db.query(City.name).order_by(City.name).all()
    return [c[0] for c in cities]


@router.get("/insurance-companies")
async def get_insurance_companies(db: Session = Depends(get_db)):
    """Return list of available insurance companies."""
    companies = db.query(InsuranceCompany).all()
    return [{"id": c.insurance_company_id, "name": c.name} for c in companies]


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new business or insurance user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    if request.role == "Insurance":
        # --- Insurance user registration ---
        if not request.insurance_company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insurance company is required for insurance users"
            )

        # Verify the insurance company exists
        company = db.query(InsuranceCompany).filter(
            InsuranceCompany.insurance_company_id == request.insurance_company_id
        ).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid insurance company"
            )

        # Create insurance user (no business linked)
        user = User(
            email=request.email,
            password_hash=get_password_hash(request.password),
            role=UserRole.INSURANCE,
            insurance_company_id=request.insurance_company_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        access_token = create_access_token(data={"sub": str(user.user_id)})

        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                user_id=user.user_id,
                email=user.email,
                role=user.role,
                business_id=None,
                business_name=None,
                store_type=None,
                city=None,
                insurance_company_id=user.insurance_company_id,
                insurance_company_name=company.name,
            )
        )
    else:
        # --- Business user registration ---
        if not request.business_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business name is required"
            )
        if not request.store_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Store type is required"
            )
        if not request.city:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="City is required"
            )

        # Create business
        business = Business(
            name=request.business_name,
            industry=request.industry,
            size=request.size,
            store_type=request.store_type,
            city=request.city,
            insurance_company_id=request.insurance_company_id,
        )
        db.add(business)
        db.flush()  # Get the business_id

        # Create user
        user = User(
            email=request.email,
            password_hash=get_password_hash(request.password),
            role=UserRole.BUSINESS,
            business_id=business.business_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.refresh(business)

        # Generate initial compliance demo data if feature flag is enabled
        if GENERATE_DEMO_DATA_ON_REGISTER:
            try:
                from app.daily_sensor_generation import generate_initial_compliance_data
                generate_initial_compliance_data(db, business)
                db.commit()
            except Exception as e:
                print(f"Warning: Could not generate demo compliance data: {e}")

        access_token = create_access_token(data={"sub": str(user.user_id)})

        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                user_id=user.user_id,
                email=user.email,
                role=user.role,
                business_id=user.business_id,
                business_name=business.name,
                store_type=business.store_type,
                city=business.city,
                insurance_company_id=business.insurance_company_id,
                insurance_company_name=None,
            )
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login and get access token."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get business info if available
    business = None
    business_name = None
    store_type = None
    city = None
    if user.business_id:
        business = db.query(Business).filter(Business.business_id == user.business_id).first()
        if business:
            business_name = business.name
            store_type = business.store_type
            city = business.city

    # Get insurance company name if available
    insurance_company_name = None
    if user.insurance_company_id:
        company = db.query(InsuranceCompany).filter(
            InsuranceCompany.insurance_company_id == user.insurance_company_id
        ).first()
        if company:
            insurance_company_name = company.name

    # Create access token
    access_token = create_access_token(data={"sub": str(user.user_id)})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            user_id=user.user_id,
            email=user.email,
            role=user.role,
            business_id=user.business_id,
            business_name=business_name,
            store_type=store_type,
            city=city,
            insurance_company_id=user.insurance_company_id,
            insurance_company_name=insurance_company_name,
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user information."""
    business = None
    business_name = None
    store_type = None
    city = None
    if current_user.business_id:
        business = db.query(Business).filter(Business.business_id == current_user.business_id).first()
        if business:
            business_name = business.name
            store_type = business.store_type
            city = business.city

    # Get insurance company name if available
    insurance_company_name = None
    if current_user.insurance_company_id:
        company = db.query(InsuranceCompany).filter(
            InsuranceCompany.insurance_company_id == current_user.insurance_company_id
        ).first()
        if company:
            insurance_company_name = company.name

    return UserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role,
        business_id=current_user.business_id,
        business_name=business_name,
        store_type=store_type,
        city=city,
        insurance_company_id=current_user.insurance_company_id,
        insurance_company_name=insurance_company_name,
    )
