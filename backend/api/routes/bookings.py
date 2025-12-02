"""Bookings Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import List
import secrets
import qrcode
import io
import base64

from core.database import get_db
from core.config import settings
from models.models import Booking, ParkingLot, ParkingSlot, User, SlotStatus, BookingStatus
from schemas.schemas import BookingCreate, BookingResponse, QRCodeResponse
from api.routes.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new parking booking with vehicle type support"""
    
    # Validate parking lot exists
    lot = db.query(ParkingLot).filter(ParkingLot.id == booking_data.lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    if not lot.is_active:
        raise HTTPException(status_code=400, detail="Parking lot is not active")
    
    # Check time window validity
    if booking_data.start_time >= booking_data.end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    if booking_data.start_time < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot book in the past")
    
    # Get vehicle type from booking data (default to "4wheeler" if not provided)
    vehicle_type = getattr(booking_data, 'vehicle_type', '4wheeler')
    if vehicle_type not in ["2wheeler", "4wheeler", "others"]:
        vehicle_type = "4wheeler"
    
    # Find the specific slot if slot_id provided, otherwise find any available slot of the right type
    if hasattr(booking_data, 'slot_id') and booking_data.slot_id:
        # Check if the specified slot is available
        specified_slot = db.query(ParkingSlot).filter(
            and_(
                ParkingSlot.id == booking_data.slot_id,
                ParkingSlot.lot_id == booking_data.lot_id,
                ParkingSlot.vehicle_type == vehicle_type,
                ParkingSlot.is_active == True
            )
        ).first()
        
        if not specified_slot:
            raise HTTPException(status_code=400, detail="Specified slot not found or incompatible")
        
        # Check if slot is available during requested time
        overlapping_booking = db.query(Booking).filter(
            and_(
                Booking.slot_id == specified_slot.id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING]),
                Booking.start_time < booking_data.end_time,
                Booking.end_time > booking_data.start_time
            )
        ).first()
        
        if overlapping_booking:
            raise HTTPException(status_code=400, detail="Slot is already booked for this time period")
        
        available_slot = specified_slot
    else:
        # Find any available slot of the correct vehicle type
        # First get all slots of this type
        all_slots = db.query(ParkingSlot).filter(
            and_(
                ParkingSlot.lot_id == booking_data.lot_id,
                ParkingSlot.vehicle_type == vehicle_type,
                ParkingSlot.is_active == True
            )
        ).all()
        
        # Find one that doesn't have overlapping bookings
        available_slot = None
        for slot in all_slots:
            overlapping = db.query(Booking).filter(
                and_(
                    Booking.slot_id == slot.id,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING]),
                    Booking.start_time < booking_data.end_time,
                    Booking.end_time > booking_data.start_time
                )
            ).first()
            
            if not overlapping:
                available_slot = slot
                break
        
        if not available_slot:
            raise HTTPException(status_code=400, detail=f"No available {vehicle_type} slots for this time period")
    
    # Calculate duration and price based on vehicle type
    duration_hours = (booking_data.end_time - booking_data.start_time).total_seconds() / 3600
    
    # Get vehicle-specific pricing
    vehicle_pricing = lot.vehicle_pricing or {}
    if vehicle_type == "2wheeler":
        price_per_hour = vehicle_pricing.get("2wheeler", lot.hourly_rate * 0.7)
    elif vehicle_type == "4wheeler":
        price_per_hour = vehicle_pricing.get("4wheeler", lot.hourly_rate)
    else:
        price_per_hour = vehicle_pricing.get("others", lot.hourly_rate * 0.85)
    
    base_price = price_per_hour * duration_hours
    
    # Apply dynamic pricing (simple multiplier for now)
    current_occupancy = db.query(ParkingSlot).filter(
        and_(
            ParkingSlot.lot_id == booking_data.lot_id,
            ParkingSlot.vehicle_type == vehicle_type,
            ParkingSlot.status != SlotStatus.AVAILABLE
        )
    ).count()
    
    total_slots_of_type = db.query(ParkingSlot).filter(
        and_(
            ParkingSlot.lot_id == booking_data.lot_id,
            ParkingSlot.vehicle_type == vehicle_type
        )
    ).count()
    
    occupancy_rate = current_occupancy / total_slots_of_type if total_slots_of_type > 0 else 0
    
    # Surge pricing: 1.5x if >80% full, 1.2x if >60% full
    if occupancy_rate > 0.8:
        price_multiplier = 1.5
    elif occupancy_rate > 0.6:
        price_multiplier = 1.2
    else:
        price_multiplier = 1.0
    
    final_price = base_price * price_multiplier
    
    # Generate QR token
    qr_token = secrets.token_urlsafe(32)
    
    # Create booking
    new_booking = Booking(
        user_id=current_user.id,
        lot_id=booking_data.lot_id,
        slot_id=available_slot.id,
        start_time=booking_data.start_time,
        end_time=booking_data.end_time,
        vehicle_plate=booking_data.vehicle_plate,
        vehicle_type=vehicle_type,
        price=final_price,
        qr_token=qr_token,
        status=BookingStatus.CONFIRMED
    )
    
    db.add(new_booking)
    
    # Reserve the slot
    available_slot.status = SlotStatus.RESERVED
    
    db.commit()
    db.refresh(new_booking)
    
    return new_booking


@router.get("/", response_model=List[BookingResponse])
async def list_user_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all bookings for current user"""
    bookings = db.query(Booking).filter(Booking.user_id == current_user.id).order_by(Booking.created_at.desc()).all()
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get booking details"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check ownership (allow owner and lot owner to view)
    if booking.user_id != current_user.id:
        lot = db.query(ParkingLot).filter(ParkingLot.id == booking.lot_id).first()
        if not lot or lot.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this booking")
    
    return booking


@router.get("/{booking_id}/qr", response_model=QRCodeResponse)
async def get_booking_qr(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get QR code for booking verification"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking is cancelled")
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr_data = f"PARKPULSE:{booking.id}:{booking.qr_token}"
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return QRCodeResponse(
        booking_id=booking.id,
        qr_code=f"data:image/png;base64,{img_str}",
        token=booking.qr_token
    )


@router.put("/{booking_id}/verify")
async def verify_booking(
    booking_id: int,
    qr_token: str,
    db: Session = Depends(get_db)
):
    """Verify booking at gate (called by edge gateway)"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.qr_token != qr_token:
        raise HTTPException(status_code=403, detail="Invalid QR token")
    
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking is cancelled")
    
    # Check if booking time is valid
    now = datetime.utcnow()
    grace_period = timedelta(minutes=15)
    
    if now < booking.start_time - grace_period:
        raise HTTPException(status_code=400, detail="Too early for check-in")
    
    if now > booking.end_time + grace_period:
        raise HTTPException(status_code=400, detail="Booking has expired")
    
    # Update booking status
    if booking.status == BookingStatus.PENDING:
        booking.status = BookingStatus.CONFIRMED
        booking.check_in_time = now
        
        # Update slot status
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
        if slot:
            slot.status = SlotStatus.OCCUPIED
    
    elif booking.status == BookingStatus.CONFIRMED:
        # Check-out
        booking.check_out_time = now
        booking.status = BookingStatus.COMPLETED
        
        # Free the slot
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
        if slot:
            slot.status = SlotStatus.AVAILABLE
    
    db.commit()
    db.refresh(booking)
    
    return {
        "message": "Booking verified successfully",
        "status": booking.status,
        "check_in_time": booking.check_in_time,
        "check_out_time": booking.check_out_time
    }


@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel {booking.status} booking")
    
    # Check cancellation policy (no refund if within 1 hour of start time)
    if datetime.utcnow() > booking.start_time - timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Too late to cancel (within 1 hour of start time)")
    
    booking.status = BookingStatus.CANCELLED
    
    # Free the slot
    slot = db.query(ParkingSlot).filter(ParkingSlot.id == booking.slot_id).first()
    if slot:
        slot.status = SlotStatus.AVAILABLE
    
    db.commit()
    
    return {"message": "Booking cancelled successfully"}
