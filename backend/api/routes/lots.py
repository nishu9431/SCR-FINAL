"""
Parking Lots Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import math

from core.database import get_db
from models.models import ParkingLot, User, UserRole
from schemas.schemas import (
    ParkingLotCreate,
    ParkingLotResponse,
    ParkingLotDetailed,
    LotSearchRequest
)
from api.routes.auth import get_current_user

router = APIRouter()


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


@router.get("/", response_model=dict)
async def search_lots(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius: float = Query(5.0, ge=0.1, le=50),
    from_time: Optional[datetime] = Query(None),
    to_time: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Search for parking lots"""
    
    query = db.query(ParkingLot).filter(ParkingLot.is_active == True)
    
    # Get all lots
    lots = query.all()
    
    # Calculate distances and filter by radius
    result_lots = []
    for lot in lots:
        if lat is not None and lng is not None:
            distance = calculate_distance(lat, lng, lot.latitude, lot.longitude)
            if distance <= radius:
                lot_dict = ParkingLotResponse.from_orm(lot).dict()
                lot_dict['distance'] = round(distance, 2)
                result_lots.append(lot_dict)
        else:
            result_lots.append(ParkingLotResponse.from_orm(lot).dict())
    
    # Sort by distance
    if lat is not None and lng is not None:
        result_lots.sort(key=lambda x: x.get('distance', float('inf')))
    
    return {
        "lots": result_lots,
        "total": len(result_lots)
    }


@router.post("/", response_model=ParkingLotResponse, status_code=status.HTTP_201_CREATED)
async def create_lot(
    lot_data: ParkingLotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new parking lot (Owner only)"""
    
    # Check if user is owner or admin
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create parking lots"
        )
    
    # Create new lot
    new_lot = ParkingLot(
        owner_id=current_user.id,
        name=lot_data.name,
        description=lot_data.description,
        latitude=lot_data.latitude,
        longitude=lot_data.longitude,
        address=lot_data.address,
        city=lot_data.city,
        total_slots=lot_data.total_slots,
        available_slots=lot_data.total_slots,  # Initially all available
        base_price_per_hour=lot_data.base_price_per_hour,
        current_price=lot_data.base_price_per_hour,
        lot_type=lot_data.lot_type,
        amenities=lot_data.amenities,
        dynamic_pricing_enabled=lot_data.dynamic_pricing_enabled
    )
    
    db.add(new_lot)
    db.commit()
    db.refresh(new_lot)
    
    return ParkingLotResponse.from_orm(new_lot)


@router.get("/{lot_id}", response_model=ParkingLotDetailed)
async def get_lot(lot_id: str, db: Session = Depends(get_db)):
    """Get parking lot details"""
    
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking lot not found"
        )
    
    return ParkingLotDetailed.from_orm(lot)


@router.get("/{lot_id}/availability")
async def get_availability(
    lot_id: str,
    from_time: datetime = Query(...),
    to_time: datetime = Query(...),
    db: Session = Depends(get_db)
):
    """Get real-time availability for a lot"""
    
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking lot not found"
        )
    
    # TODO: Implement actual availability calculation based on bookings
    # For now, return current availability
    
    return {
        "lot_id": lot_id,
        "available_slots": lot.available_slots,
        "total_slots": lot.total_slots,
        "dynamic_price": lot.current_price or lot.base_price_per_hour,
        "predicted_availability": [],  # TODO: Add predictions
        "slots": []  # TODO: Add individual slot details
    }


@router.put("/{lot_id}", response_model=ParkingLotResponse)
async def update_lot(
    lot_id: str,
    lot_data: ParkingLotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update parking lot (Owner only)"""
    
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking lot not found"
        )
    
    # Check ownership
    if lot.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this lot"
        )
    
    # Update fields
    for field, value in lot_data.dict(exclude_unset=True).items():
        setattr(lot, field, value)
    
    db.commit()
    db.refresh(lot)
    
    return ParkingLotResponse.from_orm(lot)


@router.delete("/{lot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lot(
    lot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete parking lot (Owner only)"""
    
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parking lot not found"
        )
    
    # Check ownership
    if lot.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this lot"
        )
    
    # Soft delete
    lot.is_active = False
    db.commit()
