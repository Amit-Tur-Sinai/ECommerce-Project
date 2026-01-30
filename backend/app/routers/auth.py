from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import User, Business, UserRole
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

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new business user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create business
    business = Business(
        name=request.business_name,
        industry=request.industry,
        size=request.size,
        store_type=request.store_type,
        city=request.city,
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

    # Create access token
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

    return UserResponse(
        user_id=current_user.user_id,
        email=current_user.email,
        role=current_user.role,
        business_id=current_user.business_id,
        business_name=business_name,
        store_type=store_type,
        city=city,
    )
