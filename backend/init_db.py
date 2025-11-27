"""
Database Initialization Script
Creates all tables and optionally seeds initial data
"""

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import Base, engine
from core.config import settings
from models.models import (
    User, ParkingLot, ParkingSlot, Booking, Payment, 
    OccupancyLog, PredictionLog, EdgeGateway, PricingRule,
    UserRole, SlotStatus, LotType
)
from api.routes.auth import pwd_context
from datetime import datetime, timedelta
import random


def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully!")


def seed_data():
    """Seed initial data for testing"""
    print("\nSeeding initial data...")
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Create admin user
        admin = User(
            email="admin@parkpulse.com",
            hashed_password=pwd_context.hash("admin123"),
            name="Admin User",
            phone="+1234567890",
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin)
        print("✓ Created admin user (admin@parkpulse.com / admin123)")
        
        # Create test driver
        driver = User(
            email="driver@test.com",
            hashed_password=pwd_context.hash("driver123"),
            name="Test Driver",
            phone="+1234567891",
            role=UserRole.DRIVER,
            is_active=True,
            is_verified=True
        )
        db.add(driver)
        print("✓ Created test driver (driver@test.com / driver123)")
        
        # Create test owner
        owner = User(
            email="owner@test.com",
            hashed_password=pwd_context.hash("owner123"),
            name="Test Owner",
            phone="+1234567892",
            role=UserRole.OWNER,
            is_active=True,
            is_verified=True
        )
        db.add(owner)
        print("✓ Created test owner (owner@test.com / owner123)")
        
        db.flush()  # Get user IDs
        
        # Create sample parking lots
        lots_data = [
            {
                "name": "Downtown Parking Plaza",
                "description": "Convenient downtown parking near shopping district",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "address": "123 Market Street",
                "city": "San Francisco",
                "state": "CA",
                "zipcode": "94102",
                "total_slots": 100,
                "base_price_per_hour": 5.0,
                "lot_type": LotType.COMMERCIAL,
                "amenities": ["ev_charging", "covered", "security", "24/7"],
            },
            {
                "name": "Airport Long-term Parking",
                "description": "Secure long-term parking near airport",
                "latitude": 37.6213,
                "longitude": -122.3790,
                "address": "Airport Access Road",
                "city": "San Francisco",
                "state": "CA",
                "zipcode": "94128",
                "total_slots": 500,
                "base_price_per_hour": 3.0,
                "lot_type": LotType.PUBLIC,
                "amenities": ["shuttle", "security", "24/7"],
            },
            {
                "name": "Tech Campus Garage",
                "description": "Employee and visitor parking",
                "latitude": 37.3861,
                "longitude": -122.0839,
                "address": "1 Infinite Loop",
                "city": "Cupertino",
                "state": "CA",
                "zipcode": "95014",
                "total_slots": 200,
                "base_price_per_hour": 4.0,
                "lot_type": LotType.PRIVATE,
                "amenities": ["ev_charging", "covered", "reserved_spots"],
            },
            {
                "name": "Beach Parking Lot",
                "description": "Beachside parking for visitors",
                "latitude": 37.8097,
                "longitude": -122.4786,
                "address": "Ocean Beach",
                "city": "San Francisco",
                "state": "CA",
                "zipcode": "94121",
                "total_slots": 75,
                "base_price_per_hour": 6.0,
                "lot_type": LotType.PUBLIC,
                "amenities": ["outdoor", "beach_access"],
            },
            {
                "name": "Residential Complex Parking",
                "description": "Parking for residents and guests",
                "latitude": 37.7833,
                "longitude": -122.4167,
                "address": "456 Residential Drive",
                "city": "San Francisco",
                "state": "CA",
                "zipcode": "94103",
                "total_slots": 50,
                "base_price_per_hour": 2.0,
                "lot_type": LotType.RESIDENTIAL,
                "amenities": ["covered", "gated"],
            }
        ]
        
        created_lots = []
        for lot_data in lots_data:
            lot = ParkingLot(
                owner_id=owner.id,
                name=lot_data["name"],
                description=lot_data["description"],
                latitude=lot_data["latitude"],
                longitude=lot_data["longitude"],
                address=lot_data["address"],
                city=lot_data["city"],
                state=lot_data.get("state"),
                zipcode=lot_data.get("zipcode"),
                total_slots=lot_data["total_slots"],
                available_slots=lot_data["total_slots"],
                base_price_per_hour=lot_data["base_price_per_hour"],
                hourly_rate=lot_data["base_price_per_hour"],
                daily_rate=lot_data["base_price_per_hour"] * 8,
                weekly_rate=lot_data["base_price_per_hour"] * 40,
                monthly_rate=lot_data["base_price_per_hour"] * 160,
                current_price=lot_data["base_price_per_hour"],
                lot_type=lot_data["lot_type"],
                amenities=lot_data["amenities"],
                dynamic_pricing_enabled=True,
                is_active=True,
                rating=round(random.uniform(3.5, 5.0), 1),
            )
            db.add(lot)
            created_lots.append(lot)
            print(f"✓ Created parking lot: {lot.name}")
        
        db.flush()  # Get lot IDs
        
        # Create parking slots for each lot
        slot_count = 0
        for lot in created_lots:
            for i in range(1, lot.total_slots + 1):
                # Randomly assign some slots as occupied/reserved for realism
                status_rand = random.random()
                if status_rand < 0.7:
                    status = SlotStatus.AVAILABLE
                elif status_rand < 0.85:
                    status = SlotStatus.OCCUPIED
                else:
                    status = SlotStatus.RESERVED
                
                slot = ParkingSlot(
                    lot_id=lot.id,
                    slot_number=f"{chr(65 + (i-1)//10)}{(i-1)%10 + 1}",  # A1, A2... B1, B2...
                    status=status,
                    floor=f"Floor {((i-1)//25) + 1}" if lot.total_slots > 25 else None,
                    zone=f"Zone {chr(65 + (i-1)//25)}" if lot.total_slots > 50 else None,
                    features=random.choice([
                        ["standard"],
                        ["ev_charging"],
                        ["handicap"],
                        ["compact"],
                        ["standard", "covered"]
                    ]),
                    is_active=True
                )
                db.add(slot)
                slot_count += 1
        
        print(f"✓ Created {slot_count} parking slots")
        
        # Create sample bookings
        now = datetime.utcnow()
        booking1 = Booking(
            user_id=driver.id,
            lot_id=created_lots[0].id,
            slot_id=None,  # Will be assigned from available slots
            start_time=now + timedelta(hours=2),
            end_time=now + timedelta(hours=5),
            vehicle_plate="ABC123",
            price=15.0,
            status="pending",
            qr_token="sample_token_123"
        )
        db.add(booking1)
        print("✓ Created sample booking")
        
        # Create sample occupancy log
        for lot in created_lots:
            occupied = sum(1 for _ in range(lot.total_slots) if random.random() < 0.3)
            occupancy_log = OccupancyLog(
                lot_id=lot.id,
                timestamp=now,
                occupied_count=occupied,
                total_capacity=lot.total_slots,
                sensor_data={"source": "initial_seed"}
            )
            db.add(occupancy_log)
        
        print("✓ Created sample occupancy logs")
        
        db.commit()
        print("\n✅ Database seeded successfully!")
        
        print("\n" + "="*60)
        print("TEST ACCOUNTS:")
        print("="*60)
        print("Admin:  admin@parkpulse.com / admin123")
        print("Driver: driver@test.com / driver123")
        print("Owner:  owner@test.com / owner123")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def drop_all_tables():
    """Drop all tables (use with caution!)"""
    response = input("\n⚠️  WARNING: This will delete ALL data! Continue? (yes/no): ")
    if response.lower() == 'yes':
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("✓ All tables dropped!")
    else:
        print("Operation cancelled.")


def main():
    """Main initialization function"""
    print("="*60)
    print("ParkPulse Database Initialization")
    print("="*60)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "create":
            create_tables()
        elif command == "seed":
            seed_data()
        elif command == "reset":
            drop_all_tables()
            create_tables()
            seed_data()
        elif command == "drop":
            drop_all_tables()
        else:
            print(f"Unknown command: {command}")
            print("\nAvailable commands:")
            print("  create  - Create all tables")
            print("  seed    - Seed initial data")
            print("  reset   - Drop, create, and seed")
            print("  drop    - Drop all tables")
    else:
        # Interactive mode
        print("\nWhat would you like to do?")
        print("1. Create tables only")
        print("2. Seed data (tables must exist)")
        print("3. Full reset (drop, create, seed)")
        print("4. Drop all tables")
        print("5. Exit")
        
        choice = input("\nEnter choice (1-5): ")
        
        if choice == "1":
            create_tables()
        elif choice == "2":
            seed_data()
        elif choice == "3":
            drop_all_tables()
            create_tables()
            seed_data()
        elif choice == "4":
            drop_all_tables()
        elif choice == "5":
            print("Exiting...")
        else:
            print("Invalid choice!")


if __name__ == "__main__":
    main()
