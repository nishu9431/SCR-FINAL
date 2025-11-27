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
    bookings = db.query(Booking).filter(
        Booking.user_id == current_user.id
    ).order_by(Booking.created_at.desc()).all()
    
    return bookings
