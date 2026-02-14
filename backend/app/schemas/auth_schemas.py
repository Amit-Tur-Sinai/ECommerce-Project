from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.db_models import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "Business"  # "Business" or "Insurance"
    # Business-specific fields (required when role=Business)
    business_name: Optional[str] = None
    store_type: Optional[str] = None  # butcher_shop, winery
    city: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    # Insurance company (required for Insurance role, optional for Business)
    insurance_company_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    user_id: int
    email: str
    role: UserRole
    business_id: Optional[int] = None
    business_name: Optional[str] = None
    store_type: Optional[str] = None
    city: Optional[str] = None
    insurance_company_id: Optional[int] = None
    insurance_company_name: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    store_type: Optional[str] = None
    city: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
