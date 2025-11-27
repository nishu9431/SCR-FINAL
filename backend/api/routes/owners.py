"""Owners Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from datetime import datetime, timedelta
from typing import List

from core.database import get_db
from models.models import User, ParkingLot, Booking, ParkingSlot, OccupancyLog, UserRole, BookingStatus
from schemas.schemas import ParkingLotResponse, BookingResponse, LotAnalytics, PricingRules
from api.routes.auth import get_current_user

router = APIRouter()


def require_owner(current_user: User = Depends(get_current_user)):
    """Verify user is an owner or admin"""
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Owner role required")
    return current_user


@router.get("/lots", response_model=List[ParkingLotResponse])
async def get_owner_lots(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Get all lots owned by current user"""
    lots = db.query(ParkingLot).filter(
        ParkingLot.owner_id == current_user.id
    ).all()
    
    return lots


@router.get("/lots/{lot_id}/bookings", response_model=List[BookingResponse])
async def get_lot_bookings(
    lot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Get all bookings for a lot"""
    
    # Verify ownership
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    if lot.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get bookings
    bookings = db.query(Booking).filter(
        Booking.lot_id == lot_id
    ).order_by(desc(Booking.created_at)).all()
    
    return bookings


@router.get("/lots/{lot_id}/analytics", response_model=LotAnalytics)
async def get_lot_analytics(
    lot_id: int,
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Get analytics for a parking lot"""
    
    # Verify ownership
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    if lot.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Total bookings
    total_bookings = db.query(func.count(Booking.id)).filter(
        and_(
            Booking.lot_id == lot_id,
            Booking.created_at >= start_date
        )
    ).scalar() or 0
    
    # Active bookings
    active_bookings = db.query(func.count(Booking.id)).filter(
        and_(
            Booking.lot_id == lot_id,
            Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
        )
    ).scalar() or 0
    
    # Total revenue
    total_revenue = db.query(func.sum(Booking.price)).filter(
        and_(
            Booking.lot_id == lot_id,
            Booking.status == BookingStatus.COMPLETED,
            Booking.created_at >= start_date
        )
    ).scalar() or 0.0
    
    # Average occupancy
    avg_occupancy_query = db.query(
        func.avg(OccupancyLog.occupied_count)
    ).filter(
        and_(
            OccupancyLog.lot_id == lot_id,
            OccupancyLog.timestamp >= start_date
        )
    ).scalar()
    
    average_occupancy = float(avg_occupancy_query) if avg_occupancy_query else 0.0
    
    # Peak hours (simplified)
    peak_hours = list(range(8, 18))  # 8 AM to 6 PM
    
    return LotAnalytics(
        lot_id=lot_id,
        period_days=days,
        total_bookings=total_bookings,
        active_bookings=active_bookings,
        total_revenue=total_revenue,
        average_occupancy=average_occupancy,
        peak_hours=peak_hours
    )


@router.put("/lots/{lot_id}/pricing", response_model=ParkingLotResponse)
async def update_lot_pricing(
    lot_id: int,
    pricing_data: PricingRules,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    """Update pricing for a parking lot"""
    
    # Verify ownership
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    if lot.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update pricing
    if pricing_data.hourly_rate is not None:
        lot.hourly_rate = pricing_data.hourly_rate
    
    if pricing_data.daily_rate is not None:
        lot.daily_rate = pricing_data.daily_rate
    
    if pricing_data.weekly_rate is not None:
        lot.weekly_rate = pricing_data.weekly_rate
    
    if pricing_data.monthly_rate is not None:
        lot.monthly_rate = pricing_data.monthly_rate
    
    db.commit()
    db.refresh(lot)
    
    return lot
