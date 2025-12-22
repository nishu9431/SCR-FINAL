"""Users Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.database import get_db
from models.models import User, Booking
from schemas.schemas import UserResponse, UserUpdate, BookingResponse
from api.routes.auth import get_current_user, pwd_context

router = APIRouter()


@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return current_user


@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user profile"""
    
    # Update fields if provided
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    
    if user_data.phone is not None:
        current_user.phone = user_data.phone
    
    if user_data.password is not None:
        current_user.hashed_password = pwd_context.hash(user_data.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/bookings", response_model=List[BookingResponse])
async def get_user_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bookings for current user"""
    from models.models import ParkingLot, ParkingSlot
    
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id
    ).order_by(Booking.created_at.desc()).all()
    
    # Enrich bookings with lot and slot details
    enriched_bookings = []
    for booking in bookings:
        booking_dict = {
            "id": booking.id,
            "user_id": booking.user_id,
            "lot_id": booking.lot_id,
            "slot_id": booking.slot_id,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "status": booking.status,
            "price": booking.price,
            "created_at": booking.created_at,
            "qr_token": booking.qr_token,
            "vehicle_plate": booking.vehicle_plate,
            "check_in_time": booking.check_in_time,
            "check_out_time": booking.check_out_time,
            "total_amount": booking.price  # price is the total amount
        }
        
        # Get parking lot info
        lot = db.query(ParkingLot).filter(ParkingLot.id == booking.lot_id).first()
        if lot:
            booking_dict["lot_name"] = lot.name
        
        # Get parking slot info
        if booking.slot_id:
            slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
            if slot:
                booking_dict["slot_number"] = slot.slot_number
                booking_dict["vehicle_type"] = slot.vehicle_type.value if hasattr(slot.vehicle_type, 'value') else str(slot.vehicle_type)
        
        enriched_bookings.append(booking_dict)
    
    return enriched_bookings
