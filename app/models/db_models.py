from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from app.database import Base


# Enums for status fields
class UserRole(str, enum.Enum):
    BUSINESS = "Business"
    INSURANCE = "Insurance"
    ADMIN = "Admin"


class RecommendationStatus(str, enum.Enum):
    PENDING = "Pending"
    IMPLEMENTED = "Implemented"
    IGNORED = "Ignored"


# Database Models
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    business_id = Column(Integer nullable=True)
    insurance_company_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Business(Base):
    __tablename__ = "businesses"

    business_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    industry = Column(String)
    size = Column(String)
    insurance_company_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="business")
    raw_scans = relationship("RawScan", back_populates="business")

class RawScan(Base):
    __tablename__ = "raw_scans"

    scan_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False)
    source_type = Column(String, nullable=False)
    raw_data = Column(JSON, nullable=False)
    collected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="raw_scans")

class SystemLog(Base):
    __tablename__ = "system_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False)
    level = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))