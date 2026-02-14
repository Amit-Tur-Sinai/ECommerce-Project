"""
Database initialization script.
Creates all tables defined in the models and seeds initial data.
Run this once to set up the database schema and demo data.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, Base, SessionLocal
from app.models import db_models  # Import models to register them
from app.models.db_models import InsuranceCompany, Business, Policy, User, UserRole, City
from app.utils.auth import get_password_hash
from sqlalchemy import text


def init_db():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


def seed_data():
    """Seed database with default insurance company, businesses, and policies."""
    db = SessionLocal()
    try:
        # 1. Ensure the default insurance company is "State Farm" (ID=1)
        existing_company = db.query(InsuranceCompany).filter(
            InsuranceCompany.insurance_company_id == 1
        ).first()

        if not existing_company:
            company = InsuranceCompany(
                insurance_company_id=1,
                name="State Farm",
            )
            db.add(company)
            db.flush()
            print("✅ Created default insurance company: State Farm (ID=1)")
        elif existing_company.name != "State Farm":
            existing_company.name = "State Farm"
            db.flush()
            print("✅ Updated insurance company name to: State Farm (ID=1)")
        else:
            print("ℹ️  Insurance company already exists: State Farm (ID=1)")

        # 2. Create diverse demo businesses linked to the insurance company
        # NOTE: All cities must exist in the cities table (sourced from weather_processed)
        demo_businesses = [
            {"name": "Amarillo Prime Cuts", "store_type": "butcher_shop", "city": "Amarillo", "industry": "Food & Beverage", "size": "small"},
            {"name": "Columbus Fine Wines", "store_type": "winery", "city": "Columbus", "industry": "Agriculture & Wine", "size": "large"},
            {"name": "Tacoma Meats & Deli", "store_type": "butcher_shop", "city": "Tacoma", "industry": "Food & Beverage", "size": "medium"},
            {"name": "Fairfield Estate Winery", "store_type": "winery", "city": "Fairfield", "industry": "Agriculture & Wine", "size": "medium"},
            {"name": "Georgetown Butcher Co.", "store_type": "butcher_shop", "city": "Georgetown", "industry": "Food & Beverage", "size": "small"},
            {"name": "Portland Valley Wines", "store_type": "winery", "city": "Portland", "industry": "Agriculture & Wine", "size": "large"},
        ]

        created_businesses = 0
        for biz_data in demo_businesses:
            existing = db.query(Business).filter(Business.name == biz_data["name"]).first()
            if not existing:
                business = Business(
                    name=biz_data["name"],
                    store_type=biz_data["store_type"],
                    city=biz_data["city"],
                    industry=biz_data["industry"],
                    size=biz_data["size"],
                    insurance_company_id=1,
                )
                db.add(business)
                created_businesses += 1
        
        if created_businesses > 0:
            db.flush()
            print(f"✅ Created {created_businesses} demo businesses linked to State Farm")
        else:
            print("ℹ️  Demo businesses already exist")

        # 3. Create default policies for each risk type
        risk_types = [
            {"store_type": None, "risk": "cold", "threshold": 75.0,
             "requirements": {"cold": ["Inspect refrigeration units", "Monitor temperature every 4 hours", "Test backup generators"]}},
            {"store_type": None, "risk": "storm", "threshold": 70.0,
             "requirements": {"storm": ["Secure outdoor equipment", "Test backup power", "Review emergency procedures"]}},
            {"store_type": None, "risk": "heat", "threshold": 70.0,
             "requirements": {"heat": ["Increase refrigeration monitoring", "Check cooling systems", "Adjust delivery schedules"]}},
        ]

        created_policies = 0
        for pol_data in risk_types:
            existing = db.query(Policy).filter(
                Policy.insurance_company_id == 1,
                Policy.business_id.is_(None),
                Policy.store_type == pol_data["store_type"],
                Policy.requirements.isnot(None),
            ).first()
            
            if not existing:
                policy = Policy(
                    insurance_company_id=1,
                    business_id=None,
                    store_type=pol_data["store_type"],
                    compliance_threshold=pol_data["threshold"],
                    requirements=pol_data["requirements"],
                )
                db.add(policy)
                created_policies += 1
        
        if created_policies > 0:
            print(f"✅ Created {created_policies} default policies for State Farm")
        else:
            print("ℹ️  Default policies already exist")

        # 4. Populate cities table from weather_processed data
        existing_city_count = db.query(City).count()
        if existing_city_count == 0:
            try:
                result = db.execute(text('SELECT DISTINCT "City" FROM weather_processed ORDER BY "City"'))
                weather_cities = [row[0] for row in result.fetchall()]
                for city_name in weather_cities:
                    if city_name:
                        db.add(City(name=city_name))
                db.flush()
                print(f"✅ Populated cities table with {len(weather_cities)} cities from weather data")
            except Exception as e:
                print(f"ℹ️  Could not populate cities from weather_processed: {e}")
        else:
            print(f"ℹ️  Cities table already populated ({existing_city_count} cities)")

        db.commit()
        print("✅ Seed data committed successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_data()
