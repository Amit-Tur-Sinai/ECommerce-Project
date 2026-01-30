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
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=True)
    insurance_company_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="users")


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
    risk_assessments = relationship("RiskAssessment", back_populates="business")
    recommendations = relationship("Recommendation", back_populates="business")
    compliance_checks = relationship("ComplianceCheck", back_populates="business")


class RawScan(Base):
    __tablename__ = "raw_scans"

    scan_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False)
    source_type = Column(String, nullable=False)
    raw_data = Column(JSON, nullable=False)
    collected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="raw_scans")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    assessment_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_factors = Column(JSON, nullable=False)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="risk_assessments")
    recommendations = relationship("Recommendation", back_populates="assessment")


class RecommendationOption(Base):
    __tablename__ = "recommendation_options"

    recommendation_option_id = Column(Integer, primary_key=True, index=True)
    hazard_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("risk_assessments.assessment_id"), nullable=False)
    recommendation_option_id = Column(Integer, ForeignKey("recommendation_options.recommendation_option_id"), nullable=True)
    text = Column(Text, nullable=False)
    priority = Column(Integer, nullable=False)
    status = Column(Enum(RecommendationStatus), default=RecommendationStatus.PENDING)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="recommendations")
    assessment = relationship("RiskAssessment", back_populates="recommendations")
    compliance_checks = relationship("ComplianceCheck", back_populates="recommendation")


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    check_id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendations.recommendation_id"), nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False)
    compliance_status = Column(String, nullable=False)
    checked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text)

    # Relationships
    recommendation = relationship("Recommendation", back_populates="compliance_checks")
    business = relationship("Business", back_populates="compliance_checks")


class InsuranceReport(Base):
    __tablename__ = "insurance_reports"

    report_id = Column(Integer, primary_key=True, index=True)
    insurance_company_id = Column(Integer, nullable=False)
    summary_data = Column(JSON, nullable=False)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SystemLog(Base):
    __tablename__ = "system_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False)
    level = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))