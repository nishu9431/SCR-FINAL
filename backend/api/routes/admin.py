"""Admin Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from core.database import get_db
from models.models import User, ParkingLot, Booking, Payment, UserRole, BookingStatus
from schemas.schemas import UserResponse, ParkingLotResponse
from api.routes.auth import get_current_user

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    """Verify user is an admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin role required")
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/stats")
async def get_platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get platform-wide statistics"""
    
    # Count users by role
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_drivers = db.query(func.count(User.id)).filter(User.role == UserRole.DRIVER).scalar() or 0
    total_owners = db.query(func.count(User.id)).filter(User.role == UserRole.OWNER).scalar() or 0
    
    # Count lots
    total_lots = db.query(func.count(ParkingLot.id)).scalar() or 0
    active_lots = db.query(func.count(ParkingLot.id)).filter(ParkingLot.is_active == True).scalar() or 0
    
    # Count bookings
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    active_bookings = db.query(func.count(Booking.id)).filter(
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED])
    ).scalar() or 0
    completed_bookings = db.query(func.count(Booking.id)).filter(
        Booking.status == BookingStatus.COMPLETED
    ).scalar() or 0
    
    # Total revenue
    total_revenue = db.query(func.sum(Booking.price)).filter(
        Booking.status == BookingStatus.COMPLETED
    ).scalar() or 0.0
    
    return {
        "users": {
            "total": total_users,
            "drivers": total_drivers,
            "owners": total_owners
        },
        "lots": {
            "total": total_lots,
            "active": active_lots
        },
        "bookings": {
            "total": total_bookings,
            "active": active_bookings,
            "completed": completed_bookings
        },
        "revenue": {
            "total": float(total_revenue)
        }
    }


@router.post("/lots/{lot_id}/approve", response_model=ParkingLotResponse)
async def approve_parking_lot(
    lot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Approve a parking lot (admin only)"""
    
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    lot.is_active = True
    db.commit()
    db.refresh(lot)
    
    return lot


@router.delete("/lots/{lot_id}")
async def delete_parking_lot(
    lot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a parking lot (admin only)"""
    
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    # Soft delete
    lot.is_active = False
    db.commit()
    
    return {"message": "Parking lot deleted successfully"}


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    role: UserRole,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user role (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    db.commit()
    db.refresh(user)
    
    return {"message": f"User role updated to {role}", "user_id": user_id}
