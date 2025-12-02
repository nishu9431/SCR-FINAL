"""
Seed data for vehicle-type specific parking demo
"""
import sys
from sqlalchemy.orm import Session

sys.path.insert(0, '/app')

from core.database import SessionLocal, engine
from models.models import ParkingLot, ParkingSlot, User, UserRole
from api.routes.auth import pwd_context

def seed_demo_data():
    db = SessionLocal()
    
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == "admin@parkpulse.com").first()
        if not admin:
            admin = User(
                email="admin@parkpulse.com",
                hashed_password=pwd_context.hash("admin123"),
                name="Admin User",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("✓ Created admin user")
        
        # Sample locations with vehicle-specific pricing
        locations_data = [
            {
                "name": "MG Road Parking",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "address": "MG Road, Bangalore",
                "city": "Bangalore",
                "slots_2w": 20,
                "slots_4w": 15,
                "slots_others": 5,
                "price_2w": 40,
                "price_4w": 60,
                "price_others": 50
            },
            {
                "name": "Forum Mall Parking - Konankunte",
                "latitude": 12.8956,
                "longitude": 77.5750,
                "address": "Forum Mall, Konankunte",
                "city": "Bangalore",
                "slots_2w": 15,
                "slots_4w": 10,
                "slots_others": 3,
                "price_2w": 35,
                "price_4w": 50,
                "price_others": 45
            },
            {
                "name": "Nexus Mall - Koramangala",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "address": "Koramangala, Bangalore",
                "city": "Bangalore",
                "slots_2w": 25,
                "slots_4w": 20,
                "slots_others": 8,
                "price_2w": 45,
                "price_4w": 70,
                "price_others": 60
            },
            {
                "name": "Indranagar Parking Lot",
                "latitude": 12.9784,
                "longitude": 77.6408,
                "address": "Indranagar, Bangalore",
                "city": "Bangalore",
                "slots_2w": 18,
                "slots_4w": 12,
                "slots_others": 4,
                "price_2w": 38,
                "price_4w": 55,
                "price_others": 48
            },
            {
                "name": "Phoenix Mall of Asia - Yelahanka",
                "latitude": 13.1007,
                "longitude": 77.5963,
                "address": "Yelahanka, Bangalore",
                "city": "Bangalore",
                "slots_2w": 30,
                "slots_4w": 25,
                "slots_others": 10,
                "price_2w": 42,
                "price_4w": 65,
                "price_others": 55
            },
            {
                "name": "Garuda Mall - Jayanagar",
                "latitude": 12.9250,
                "longitude": 77.5948,
                "address": "Jayanagar, Bangalore",
                "city": "Bangalore",
                "slots_2w": 12,
                "slots_4w": 8,
                "slots_others": 2,
                "price_2w": 36,
                "price_4w": 52,
                "price_others": 46
            },
            {
                "name": "Royal Meenakshi Mall - Bannerghatta Road",
                "latitude": 12.8996,
                "longitude": 77.5977,
                "address": "Bannerghatta Road, Bangalore",
                "city": "Bangalore",
                "slots_2w": 22,
                "slots_4w": 18,
                "slots_others": 6,
                "price_2w": 40,
                "price_4w": 58,
                "price_others": 52
            },
            {
                "name": "VegaCity - Bannerghatta Road",
                "latitude": 12.8890,
                "longitude": 77.6034,
                "address": "Bannerghatta Road, Bangalore",
                "city": "Bangalore",
                "slots_2w": 10,
                "slots_4w": 6,
                "slots_others": 2,
                "price_2w": 38,
                "price_4w": 54,
                "price_others": 48
            }
        ]
        
        for loc_data in locations_data:
            # Check if location already exists
            existing = db.query(ParkingLot).filter(ParkingLot.name == loc_data["name"]).first()
            if existing:
                print(f"⊘ Skipping {loc_data['name']} (already exists)")
                continue
            
            total_slots = loc_data["slots_2w"] + loc_data["slots_4w"] + loc_data["slots_others"]
            
            # Create parking lot
            lot = ParkingLot(
                owner_id=admin.id,
                name=loc_data["name"],
                description=f"Multi-vehicle parking at {loc_data['name']}",
                latitude=loc_data["latitude"],
                longitude=loc_data["longitude"],
                address=loc_data["address"],
                city=loc_data["city"],
                total_slots=total_slots,
                available_slots=total_slots,
                base_price_per_hour=loc_data["price_4w"],
                hourly_rate=loc_data["price_4w"],
                vehicle_pricing={
                    "2wheeler": loc_data["price_2w"],
                    "4wheeler": loc_data["price_4w"],
                    "others": loc_data["price_others"]
                },
                is_active=True
            )
            db.add(lot)
            db.flush()  # Get the lot ID
            
            # Create slots for 2-wheelers
            for i in range(1, loc_data["slots_2w"] + 1):
                slot = ParkingSlot(
                    lot_id=lot.id,
                    slot_number=f"2W-{i:03d}",
                    vehicle_type="2wheeler",
                    zone="2W Zone",
                    is_active=True
                )
                db.add(slot)
            
            # Create slots for 4-wheelers
            for i in range(1, loc_data["slots_4w"] + 1):
                slot = ParkingSlot(
                    lot_id=lot.id,
                    slot_number=f"4W-{i:03d}",
                    vehicle_type="4wheeler",
                    zone="4W Zone",
                    is_active=True
                )
                db.add(slot)
            
            # Create slots for others
            for i in range(1, loc_data["slots_others"] + 1):
                slot = ParkingSlot(
                    lot_id=lot.id,
                    slot_number=f"OT-{i:03d}",
                    vehicle_type="others",
                    zone="Special Zone",
                    is_active=True
                )
                db.add(slot)
            
            print(f"✓ Created {loc_data['name']} with {total_slots} slots")
        
        db.commit()
        print("\n✅ Demo data seeded successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding data: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
