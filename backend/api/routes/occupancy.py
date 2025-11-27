"""Occupancy Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime, timedelta
from typing import List, Optional

from core.database import get_db
from models.models import OccupancyLog, ParkingLot, ParkingSlot, SlotStatus
from schemas.schemas import OccupancyData, OccupancyCreate

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def log_occupancy(
    occupancy_data: OccupancyCreate,
    db: Session = Depends(get_db)
):
    """Log occupancy data (called by edge gateway)"""
    
    # Validate lot exists
    lot = db.query(ParkingLot).filter(ParkingLot.id == occupancy_data.lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    # Create occupancy log
    log = OccupancyLog(
        lot_id=occupancy_data.lot_id,
        timestamp=occupancy_data.timestamp or datetime.utcnow(),
        occupied_count=occupancy_data.occupied_count,
        total_capacity=occupancy_data.total_capacity,
        sensor_data=occupancy_data.sensor_data or {}
    )
    
    db.add(log)
    db.commit()
    db.refresh(log)
    
    return {"message": "Occupancy logged", "id": log.id}


@router.get("/lot/{lot_id}/latest", response_model=OccupancyData)
async def get_latest_occupancy(
    lot_id: int,
    db: Session = Depends(get_db)
):
    """Get latest occupancy for a parking lot"""
    
    # Check lot exists
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    # Get latest log from database
    latest_log = db.query(OccupancyLog).filter(
        OccupancyLog.lot_id == lot_id
    ).order_by(desc(OccupancyLog.timestamp)).first()
    
    if latest_log:
        return OccupancyData(
            lot_id=latest_log.lot_id,
            timestamp=latest_log.timestamp,
            occupied_count=latest_log.occupied_count,
            total_capacity=latest_log.total_capacity,
            occupancy_rate=latest_log.occupied_count / latest_log.total_capacity if latest_log.total_capacity > 0 else 0,
            sensor_data=latest_log.sensor_data
        )
    
    # Fallback: calculate from slot status
    total_slots = db.query(ParkingSlot).filter(
        ParkingSlot.lot_id == lot_id,
        ParkingSlot.is_active == True
    ).count()
    
    occupied_slots = db.query(ParkingSlot).filter(
        and_(
            ParkingSlot.lot_id == lot_id,
            ParkingSlot.is_active == True,
            ParkingSlot.status.in_([SlotStatus.OCCUPIED, SlotStatus.RESERVED])
        )
    ).count()
    
    return OccupancyData(
        lot_id=lot_id,
        timestamp=datetime.utcnow(),
        occupied_count=occupied_slots,
        total_capacity=total_slots,
        occupancy_rate=occupied_slots / total_slots if total_slots > 0 else 0,
        sensor_data={}
    )


@router.get("/lot/{lot_id}", response_model=List[OccupancyData])
async def get_occupancy_history(
    lot_id: int,
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """Get occupancy history for a parking lot"""
    
    # Check lot exists
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    # Get logs from last N hours
    since = datetime.utcnow() - timedelta(hours=hours)
    logs = db.query(OccupancyLog).filter(
        and_(
            OccupancyLog.lot_id == lot_id,
            OccupancyLog.timestamp >= since
        )
    ).order_by(OccupancyLog.timestamp).all()
    
    return [
        OccupancyData(
            lot_id=log.lot_id,
            timestamp=log.timestamp,
            occupied_count=log.occupied_count,
            total_capacity=log.total_capacity,
            occupancy_rate=log.occupied_count / log.total_capacity if log.total_capacity > 0 else 0,
            sensor_data=log.sensor_data
        )
        for log in logs
    ]
