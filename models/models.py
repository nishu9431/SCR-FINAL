"""
Database Models for ParkPulse
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    DRIVER = "driver"
    OWNER = "owner"
    ADMIN = "admin"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SlotStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"


class LotType(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    COMMERCIAL = "commercial"
    RESIDENTIAL = "residential"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class User(Base):
    """User model for drivers, owners, and admins"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    role = Column(Enum(UserRole), default=UserRole.DRIVER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    bookings = relationship("Booking", back_populates="user")
    owned_lots = relationship("ParkingLot", back_populates="owner")


class ParkingLot(Base):
    """Parking lot model"""
    __tablename__ = "parking_lots"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    zipcode = Column(String)
    
    # Capacity
    total_slots = Column(Integer, nullable=False)
    available_slots = Column(Integer, nullable=False)
    
    # Pricing
    base_price_per_hour = Column(Float, nullable=False)
    hourly_rate = Column(Float, nullable=False)
    daily_rate = Column(Float)
    weekly_rate = Column(Float)
    monthly_rate = Column(Float)
    current_price = Column(Float)
    dynamic_pricing_enabled = Column(Boolean, default=False)
    
    # Vehicle-type specific pricing (JSON): {"2wheeler": 40, "4wheeler": 60, "others": 50}
    vehicle_pricing = Column(JSON, default={})
    
    # Metadata
    lot_type = Column(Enum(LotType), default=LotType.PUBLIC)
    amenities = Column(JSON, default=[])  # ["ev_charging", "covered", "security"]
    features = Column(JSON, default={})  # {"covered": true, "ev_charging": false}
    images = Column(JSON, default=[])
    rating = Column(Float, default=0.0)
    
    # Operating hours
    operating_hours = Column(JSON, default={"open": "00:00", "close": "23:59"})
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_lots")
    slots = relationship("ParkingSlot", back_populates="lot")
    bookings = relationship("Booking", back_populates="lot")
    occupancy_logs = relationship("OccupancyLog", back_populates="lot")


class ParkingSlot(Base):
    """Individual parking slot"""
    __tablename__ = "parking_slots"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    slot_number = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Status
    status = Column(Enum(SlotStatus), default=SlotStatus.AVAILABLE)
    
    # Vehicle type support: "2wheeler", "4wheeler", "others"
    vehicle_type = Column(String, default="4wheeler")
    
    # Features
    features = Column(JSON, default=[])  # ["ev_charging", "handicap", "covered"]
    floor = Column(String)
    zone = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    lot = relationship("ParkingLot", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot")


class Booking(Base):
    """Booking model"""
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    slot_id = Column(Integer, ForeignKey("parking_slots.id"))
    
    # Time
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    
    # Status
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    
    # Pricing
    price = Column(Float, nullable=False)
    actual_price = Column(Float)  # Final price after completion
    
    # Vehicle details
    vehicle_plate = Column(String)
    vehicle_type = Column(String)
    
    # Verification tokens
    qr_token = Column(String, unique=True)
    hashed_plate_token = Column(String)
    
    # Actual usage
    check_in_time = Column(DateTime(timezone=True))
    check_out_time = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    lot = relationship("ParkingLot", back_populates="bookings")
    slot = relationship("ParkingSlot", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)


class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Payment details
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Gateway details
    gateway = Column(String)  # "stripe", "razorpay"
    payment_gateway = Column(String)  # "stripe", "razorpay"
    gateway_payment_id = Column(String)
    gateway_response = Column(JSON)
    
    # Timestamps
    paid_at = Column(DateTime(timezone=True))
    refunded_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    booking = relationship("Booking", back_populates="payment")


class OccupancyLog(Base):
    """Time-series occupancy data"""
    __tablename__ = "occupancy_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    
    # Occupancy data
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    occupied_count = Column(Integer, nullable=False)
    total_capacity = Column(Integer, nullable=False)
    
    # Source data
    sensor_data = Column(JSON)  # {"gate_events": 5, "sensor_count": 12}
    
    # Relationships
    lot = relationship("ParkingLot", back_populates="occupancy_logs")


class PredictionLog(Base):
    """ML prediction logs for monitoring"""
    __tablename__ = "prediction_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    lot_id = Column(Integer, nullable=False)
    
    # Prediction metadata
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    model_version = Column(String)
    horizon_minutes = Column(Integer)
    
    # Predictions (JSON array of time-series predictions)
    predictions = Column(JSON, nullable=False)
    
    # Actual values (filled in after the fact for evaluation)
    actuals = Column(JSON)
    
    # Metrics
    mae = Column(Float)
    rmse = Column(Float)


class EdgeGateway(Base):
    """Edge gateway registration"""
    __tablename__ = "edge_gateways"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    
    # Gateway info
    name = Column(String, nullable=False)
    hardware_id = Column(String, unique=True)
    ip_address = Column(String)
    
    # Configuration
    config = Column(JSON, default={})
    
    # Status
    is_active = Column(Boolean, default=True)
    last_heartbeat = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PricingRule(Base):
    """Dynamic pricing rules for lots"""
    __tablename__ = "pricing_rules"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    lot_id = Column(Integer, ForeignKey("parking_lots.id"), nullable=False)
    
    # Rule
    rule_name = Column(String, nullable=False)
    condition = Column(String)  # e.g., "occupancy_rate > 0.8"
    multiplier = Column(Float, default=1.0)
    
    # Time-based rules
    day_of_week = Column(JSON)  # [0, 1, 2] for Mon, Tue, Wed
    time_start = Column(String)
    time_end = Column(String)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
