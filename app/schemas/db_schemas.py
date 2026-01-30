from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel

from app.models.db_models import UserRole, RecommendationStatus


# Shared / base schemas

class UserBase(BaseModel):
    email: str
    role: UserRole
    # business_id is required (non-null) in the API layer
    business_id: int
    insurance_company_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class BusinessBase(BaseModel):
    name: str
    industry: Optional[str] = None
    size: Optional[str] = None
    insurance_company_id: Optional[int] = None


class BusinessCreate(BusinessBase):
    pass


class BusinessRead(BusinessBase):
    business_id: int
    created_at: datetime

    class Config:
        orm_mode = True


class RawScanBase(BaseModel):
    business_id: int
    source_type: str
    raw_data: Dict[str, Any]


class RawScanCreate(RawScanBase):
    pass


class RawScanRead(RawScanBase):
    scan_id: int
    collected_at: datetime

    class Config:
        orm_mode = True


class SystemLogBase(BaseModel):
    service_name: str
    level: str
    message: str


class SystemLogCreate(SystemLogBase):
    pass


class SystemLogRead(SystemLogBase):
    log_id: int
    timestamp: datetime

    class Config:
        orm_mode = True

