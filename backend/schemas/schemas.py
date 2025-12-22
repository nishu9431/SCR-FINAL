"""
Pydantic Schemas for API Request/Response
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# Enums
class UserRole(str, Enum):
    DRIVER = "driver"
    OWNER = "owner"
    ADMIN = "admin"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class LotType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    COMMERCIAL = "commercial"
    RESIDENTIAL = "residential"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.DRIVER


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: int
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# Location Schema
class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None


# Parking Lot Schemas
class ParkingLotBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: Optional[str] = None
    total_slots: int = Field(..., gt=0)
    base_price_per_hour: float = Field(..., gt=0)
    lot_type: LotType = LotType.PUBLIC
    amenities: List[str] = []
    dynamic_pricing_enabled: bool = False


class ParkingLotCreate(ParkingLotBase):
    pass


class ParkingLotResponse(ParkingLotBase):
    id: int
    owner_id: int
    available_slots: int
    current_price: Optional[float] = None
    rating: float
    is_active: bool
    created_at: datetime
    distance: Optional[float] = None  # Distance from search origin
    
    class Config:
        from_attributes = True


class ParkingLotDetailed(ParkingLotResponse):
    features: Dict[str, Any] = {}
    images: List[str] = []
    operating_hours: Dict[str, str] = {}


# Parking Slot Schemas
class ParkingSlotResponse(BaseModel):
    id: int
    slot_number: str
    status: str
    features: List[str] = []
    floor: Optional[str] = None
    zone: Optional[str] = None
    
    class Config:
        from_attributes = True


# Booking Schemas
class BookingCreate(BaseModel):
    lot_id: int
    slot_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    vehicle_plate: Optional[str] = None
    vehicle_type: Optional[str] = None
    
    @validator('end_time')
    def validate_time_range(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v


class BookingResponse(BaseModel):
    id: int
    user_id: int
    lot_id: int
    slot_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    price: float
    created_at: datetime
    qr_token: Optional[str] = None
    vehicle_plate: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    # Additional display fields
    lot_name: Optional[str] = None
    slot_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    total_amount: Optional[float] = None
    
    class Config:
        from_attributes = True


class BookingDetailed(BookingResponse):
    lot: Optional[ParkingLotResponse] = None
    slot: Optional[ParkingSlotResponse] = None
    actual_entry_time: Optional[datetime] = None
    actual_exit_time: Optional[datetime] = None


class QRCodeResponse(BaseModel):
    qr_token: str
    qr_data_url: str
    expires_at: datetime


# Occupancy Schemas
class OccupancyData(BaseModel):
    lot_id: int
    timestamp: datetime
    occupied_count: int
    total_capacity: int
    occupancy_rate: float
    sensor_data: Optional[Dict[str, Any]] = None


# Prediction Schemas
class DemandPrediction(BaseModel):
    timestamp: datetime
    predicted_occupancy: float
    confidence_lower: float
    confidence_upper: float
    recommended_price: Optional[float] = None


class DemandForecast(BaseModel):
    lot_id: int
    generated_at: datetime
    horizon_minutes: int
    model_version: str
    predictions: List[Dict[str, Any]]


class PredictionRequest(BaseModel):
    lot_id: int
    from_time: datetime
    to_time: datetime
    horizon_minutes: int = Field(default=60, ge=15, le=180)


# Owner Schemas
class LotAnalytics(BaseModel):
    lot_id: int
    period_days: int
    total_bookings: int
    active_bookings: int
    total_revenue: float
    average_occupancy: float
    peak_hours: List[int]


class PricingRules(BaseModel):
    hourly_rate: Optional[float] = None
    daily_rate: Optional[float] = None
    weekly_rate: Optional[float] = None
    monthly_rate: Optional[float] = None


# Payment Schemas
class PaymentIntentRequest(BaseModel):
    booking_id: int
    amount: float


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_id: int


# Availability Schemas
class AvailabilityRequest(BaseModel):
    lot_id: int
    from_time: datetime
    to_time: datetime


class SlotAvailability(BaseModel):
    available_slots: int
    total_slots: int
    predicted_availability: List[Dict[str, Any]]
    dynamic_price: float
    slots: List[ParkingSlotResponse]


# Search Schemas
class LotSearchRequest(BaseModel):
    lat: float
    lng: float
    radius: float = Field(default=5.0, ge=0.1, le=50)  # km
    from_time: Optional[datetime] = None
    to_time: Optional[datetime] = None
    max_price: Optional[float] = None
    amenities: List[str] = []


# WebSocket Message Schemas
class WSMessage(BaseModel):
    type: str
    lot_id: Optional[int] = None
    data: Dict[str, Any]


class OccupancyUpdate(BaseModel):
    type: str = "occupancy_update"
    lot_id: int
    data: OccupancyData


class PricingUpdate(BaseModel):
    type: str = "pricing_update"
    lot_id: int
    data: Dict[str, float]


# Error Response
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None


# Additional Schemas for new endpoints
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class PaymentCreate(BaseModel):
    booking_id: int
    amount: Optional[float] = None


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: float
    currency: str
    gateway: str
    gateway_payment_id: Optional[str] = None
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class OccupancyCreate(BaseModel):
    lot_id: int
    occupied_count: int
    total_capacity: int
    timestamp: Optional[datetime] = None
    sensor_data: Optional[Dict[str, Any]] = None
