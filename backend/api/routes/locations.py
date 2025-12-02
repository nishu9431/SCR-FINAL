"""
Locations API Routes - Vehicle-type specific booking support
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime
import math

from core.database import get_db
from models.models import ParkingLot, ParkingSlot, Booking, BookingStatus, SlotStatus

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


def get_slot_counts_by_vehicle_type(lot_id: int, db: Session, start_time: Optional[datetime] = None, end_time: Optional[datetime] = None):
    """Get available slot counts for each vehicle type at a location"""
    
    vehicle_types = ["2wheeler", "4wheeler", "others"]
    result = {}
    
    for vtype in vehicle_types:
        # Get total slots of this type
        total_query = db.query(func.count(ParkingSlot.id)).filter(
            and_(
                ParkingSlot.lot_id == lot_id,
                ParkingSlot.vehicle_type == vtype,
                ParkingSlot.is_active == True
            )
        )
        total_slots = total_query.scalar() or 0
        
        # Get booked slots during the requested time period
        if start_time and end_time:
            booked_query = db.query(func.count(Booking.id.distinct())).join(
                ParkingSlot, Booking.slot_id == ParkingSlot.id
            ).filter(
                and_(
                    ParkingSlot.lot_id == lot_id,
                    ParkingSlot.vehicle_type == vtype,
                    Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE]),
                    # Check for time overlap
                    Booking.start_time < end_time,
                    Booking.end_time > start_time
                )
            )
            booked_slots = booked_query.scalar() or 0
        else:
            # Just count currently non-available slots
            booked_slots = db.query(func.count(ParkingSlot.id)).filter(
                and_(
                    ParkingSlot.lot_id == lot_id,
                    ParkingSlot.vehicle_type == vtype,
                    ParkingSlot.status != SlotStatus.AVAILABLE,
                    ParkingSlot.is_active == True
                )
            ).scalar() or 0
        
        available_slots = max(0, total_slots - booked_slots)
        result[vtype] = {
            "total": total_slots,
            "available": available_slots,
            "booked": booked_slots
        }
    
    return result


@router.get("/")
async def get_locations(
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude"),
    radius: float = Query(10.0, ge=0.1, le=50, description="Search radius in km"),
    db: Session = Depends(get_db)
):
    """
    Get all parking locations with vehicle-type specific availability and pricing.
    Returns location details including:
    - Available slots per vehicle type (2wheeler, 4wheeler, others)
    - Price per hour for each vehicle type
    - Distance from user (if lat/lng provided)
    """
    
    # Get all active parking lots
    lots = db.query(ParkingLot).filter(ParkingLot.is_active == True).all()
    
    result_locations = []
    for lot in lots:
        # Calculate distance if user location provided
        distance_km = None
        if lat is not None and lng is not None:
            distance_km = calculate_distance(lat, lng, lot.latitude, lot.longitude)
            # Skip if outside radius
            if distance_km > radius:
                continue
        
        # Get slot availability by vehicle type
        vehicle_availability = get_slot_counts_by_vehicle_type(lot.id, db)
        
        # Get pricing for each vehicle type (fallback to base price if not set)
        vehicle_pricing = lot.vehicle_pricing or {}
        pricing_2w = vehicle_pricing.get("2wheeler", lot.hourly_rate * 0.7)  # Default: 70% of base
        pricing_4w = vehicle_pricing.get("4wheeler", lot.hourly_rate)
        pricing_others = vehicle_pricing.get("others", lot.hourly_rate * 0.85)  # Default: 85% of base
        
        location_data = {
            "id": lot.id,
            "name": lot.name,
            "address": lot.address,
            "distance_km": round(distance_km, 2) if distance_km else None,
            "distance": f"{round(distance_km, 1)} km away" if distance_km else "Distance unknown",
            "latitude": lot.latitude,
            "longitude": lot.longitude,
            "vehicle_types": {
                "2wheeler": {
                    "available_slots": vehicle_availability["2wheeler"]["available"],
                    "total_slots": vehicle_availability["2wheeler"]["total"],
                    "price_per_hour": pricing_2w
                },
                "4wheeler": {
                    "available_slots": vehicle_availability["4wheeler"]["available"],
                    "total_slots": vehicle_availability["4wheeler"]["total"],
                    "price_per_hour": pricing_4w
                },
                "others": {
                    "available_slots": vehicle_availability["others"]["available"],
                    "total_slots": vehicle_availability["others"]["total"],
                    "price_per_hour": pricing_others
                }
            },
            "total_available_slots": sum(v["available"] for v in vehicle_availability.values()),
            "amenities": lot.amenities,
            "rating": lot.rating
        }
        
        result_locations.append(location_data)
    
    # Sort by distance if available
    if lat is not None and lng is not None:
        result_locations.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else float('inf'))
    
    return {
        "locations": result_locations,
        "total": len(result_locations)
    }


@router.get("/{location_id}/slots")
async def get_location_slots(
    location_id: int,
    vehicle_type: str = Query(..., description="Vehicle type: 2wheeler, 4wheeler, or others"),
    start_time: datetime = Query(..., description="Booking start time"),
    end_time: datetime = Query(..., description="Booking end time"),
    db: Session = Depends(get_db)
):
    """
    Get available slots for a specific location, vehicle type, and time range.
    Returns a 2D grid representation of slots with availability status.
    """
    
    # Validate location
    lot = db.query(ParkingLot).filter(ParkingLot.id == location_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Validate vehicle type
    if vehicle_type not in ["2wheeler", "4wheeler", "others"]:
        raise HTTPException(status_code=400, detail="Invalid vehicle type. Must be: 2wheeler, 4wheeler, or others")
    
    # Validate time range
    if start_time >= end_time:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    
    # Get all slots of the requested vehicle type at this location
    slots = db.query(ParkingSlot).filter(
        and_(
            ParkingSlot.lot_id == location_id,
            ParkingSlot.vehicle_type == vehicle_type,
            ParkingSlot.is_active == True
        )
    ).all()
    
    # Check which slots are booked during the requested time
    slot_availability = []
    for slot in slots:
        # Check if slot has overlapping bookings
        overlapping_booking = db.query(Booking).filter(
            and_(
                Booking.slot_id == slot.id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.ACTIVE, BookingStatus.PENDING]),
                Booking.start_time < end_time,
                Booking.end_time > start_time
            )
        ).first()
        
        slot_data = {
            "id": slot.id,
            "slot_number": slot.slot_number,
            "floor": slot.floor,
            "zone": slot.zone,
            "features": slot.features,
            "status": "booked" if overlapping_booking else "available",
            "vehicle_type": slot.vehicle_type
        }
        slot_availability.append(slot_data)
    
    # Get pricing for this vehicle type
    vehicle_pricing = lot.vehicle_pricing or {}
    if vehicle_type == "2wheeler":
        price_per_hour = vehicle_pricing.get("2wheeler", lot.hourly_rate * 0.7)
    elif vehicle_type == "4wheeler":
        price_per_hour = vehicle_pricing.get("4wheeler", lot.hourly_rate)
    else:
        price_per_hour = vehicle_pricing.get("others", lot.hourly_rate * 0.85)
    
    # Calculate total price for the duration
    duration_hours = (end_time - start_time).total_seconds() / 3600
    total_price = price_per_hour * duration_hours
    
    return {
        "location_id": location_id,
        "location_name": lot.name,
        "vehicle_type": vehicle_type,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "duration_hours": round(duration_hours, 2),
        "price_per_hour": price_per_hour,
        "estimated_total_price": round(total_price, 2),
        "slots": slot_availability,
        "total_slots": len(slot_availability),
        "available_count": sum(1 for s in slot_availability if s["status"] == "available")
    }
