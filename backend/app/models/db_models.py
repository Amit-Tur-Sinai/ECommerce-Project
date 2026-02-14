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
    store_type = Column(String)  # butcher_shop, winery, etc.
    city = Column(String)  # City location
    insurance_company_id = Column(Integer, ForeignKey("insurance_companies.insurance_company_id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    users = relationship("User", back_populates="business")
    raw_scans = relationship("RawScan", back_populates="business")
    sensor_readings = relationship("SensorReading", back_populates="business")
    recommendation_tracking = relationship("RecommendationTracking", back_populates="business")
    ranking = relationship("BusinessRanking", back_populates="business", uselist=False)
    insurance_company = relationship("InsuranceCompany", back_populates="businesses")
    notes = relationship("BusinessNote", back_populates="business")
    claims = relationship("Claim", back_populates="business")
    policies = relationship("Policy", back_populates="business")
    risk_assessments = relationship("RiskAssessment", back_populates="business")

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


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    reading_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False)
    sensor_id = Column(String, nullable=False, index=True)
    sensor_type = Column(String, nullable=False)  # Temperature, Humidity, Power, etc.
    location = Column(String, nullable=False)
    reading_value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    status = Column(String, nullable=False)  # normal, warning, critical
    recommendation_compliance = Column(String, nullable=False, default="compliant")  # compliant, non_compliant, unknown
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    business = relationship("Business", back_populates="sensor_readings")


class RecommendationTracking(Base):
    __tablename__ = "recommendation_tracking"

    tracking_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False)
    climate_event = Column(String, nullable=False)
    recommendation_text = Column(Text, nullable=False)
    status = Column(Enum(RecommendationStatus), nullable=False, default=RecommendationStatus.PENDING)
    risk_level = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    sensor_verified = Column(String, nullable=True)  # sensor_id that verified compliance

    # Relationships
    business = relationship("Business", back_populates="recommendation_tracking")


class BusinessRanking(Base):
    __tablename__ = "business_rankings"

    ranking_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False, unique=True, index=True)
    overall_score = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False, index=True)
    rank_level = Column(String, nullable=False)  # Excellent, Good, Fair, Needs Improvement
    recommendations_followed = Column(Integer, nullable=False, default=0)
    recommendations_total = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="ranking")


class InsuranceCompany(Base):
    __tablename__ = "insurance_companies"

    insurance_company_id = Column(Integer, primary_key=True, index=True, autoincrement=False)  # Can be set manually
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    businesses = relationship("Business", back_populates="insurance_company")
    policies = relationship("Policy", back_populates="insurance_company")
    claims = relationship("Claim", back_populates="insurance_company")


class BusinessNote(Base):
    __tablename__ = "business_notes"

    note_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False, index=True)
    insurance_company_id = Column(Integer, ForeignKey("insurance_companies.insurance_company_id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="notes")
    insurance_company = relationship("InsuranceCompany")
    created_by = relationship("User")


class ClaimStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    DENIED = "Denied"
    UNDER_REVIEW = "Under Review"
    CLOSED = "Closed"


class Claim(Base):
    __tablename__ = "claims"

    claim_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False, index=True)
    insurance_company_id = Column(Integer, ForeignKey("insurance_companies.insurance_company_id"), nullable=False)
    claim_number = Column(String, unique=True, nullable=False, index=True)
    claim_amount = Column(Float, nullable=False)
    status = Column(Enum(ClaimStatus), nullable=False, default=ClaimStatus.PENDING)
    description = Column(Text, nullable=False)
    incident_date = Column(DateTime, nullable=False)
    filed_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    compliance_score_at_incident = Column(Float, nullable=True)  # Link to compliance score
    risk_assessment_id = Column(Integer, ForeignKey("risk_assessments.assessment_id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="claims")
    insurance_company = relationship("InsuranceCompany", back_populates="claims")
    risk_assessment = relationship("RiskAssessment", back_populates="claim")


class Policy(Base):
    __tablename__ = "policies"

    policy_id = Column(Integer, primary_key=True, index=True)
    insurance_company_id = Column(Integer, ForeignKey("insurance_companies.insurance_company_id"), nullable=False)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=True)  # Null = default policy
    store_type = Column(String, nullable=True)  # Null = applies to all types
    compliance_threshold = Column(Float, nullable=False, default=75.0)  # Minimum compliance score
    requirements = Column(JSON, nullable=True)  # Custom requirements per business type
    alert_enabled = Column(String, nullable=False, default="true")  # Enable automated alerts
    alert_threshold = Column(Float, nullable=False, default=60.0)  # Alert when score drops below this
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    insurance_company = relationship("InsuranceCompany", back_populates="policies")
    business = relationship("Business", back_populates="policies")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    assessment_id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.business_id"), nullable=False, index=True)
    insurance_company_id = Column(Integer, ForeignKey("insurance_companies.insurance_company_id"), nullable=False)
    assessment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    compliance_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # Low, Medium, High, Critical
    risk_factors = Column(JSON, nullable=True)  # List of risk factors identified
    recommendations = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    business = relationship("Business", back_populates="risk_assessments")
    insurance_company = relationship("InsuranceCompany")
    created_by = relationship("User")
    claim = relationship("Claim", back_populates="risk_assessment", uselist=False)


class City(Base):
    __tablename__ = "cities"

    city_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)