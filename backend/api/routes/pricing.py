"""
Dynamic Pricing API Routes
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from services.pricing_service import pricing_service

router = APIRouter(tags=["Dynamic Pricing"])


class PricingRequest(BaseModel):
    vehicle_type: str = Field(..., description="Vehicle type: 2wheeler, 4wheeler, or others")
    location_id: int = Field(..., description="Parking location ID")
    booking_time: Optional[str] = Field(None, description="ISO format datetime, defaults to now")
    is_rainy: bool = Field(False, description="Current weather condition")
    event_nearby: bool = Field(False, description="Special event nearby")


class PricingResponse(BaseModel):
    vehicle_type: str
    predicted_price: float
    base_price: float
    price_change: float
    price_change_percent: float
    pricing_factors: List[str]
    is_dynamic: bool
    timestamp: str


@router.post("/predict", response_model=PricingResponse)
async def predict_parking_price(request: PricingRequest):
    """
    Predict dynamic parking price based on current conditions
    
    - **vehicle_type**: 2wheeler, 4wheeler, or others
    - **location_id**: ID of the parking location
    - **booking_time**: Optional ISO datetime (defaults to now)
    - **is_rainy**: Weather condition flag
    - **event_nearby**: Special event flag
    """
    try:
        from core.database import SessionLocal
        from models.models import ParkingLot, ParkingSlot
        
        # Get location details
        db = SessionLocal()
        try:
            location = db.query(ParkingLot).filter(ParkingLot.id == request.location_id).first()
            if not location:
                raise HTTPException(status_code=404, detail="Location not found")
            
            # Get slot statistics
            total_slots = db.query(ParkingSlot).filter(
                ParkingSlot.lot_id == request.location_id,
                ParkingSlot.vehicle_type == request.vehicle_type
            ).count()
            
            available_slots = db.query(ParkingSlot).filter(
                ParkingSlot.lot_id == request.location_id,
                ParkingSlot.vehicle_type == request.vehicle_type,
                ParkingSlot.status == 'AVAILABLE'
            ).count()
            
            if total_slots == 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"No {request.vehicle_type} slots at this location"
                )
            
            occupancy_rate = (total_slots - available_slots) / total_slots
            
            # Parse booking time
            booking_time = None
            if request.booking_time:
                try:
                    booking_time = datetime.fromisoformat(request.booking_time.replace('Z', '+00:00'))
                except:
                    raise HTTPException(status_code=400, detail="Invalid datetime format")
            
            # Determine location type (simple heuristic)
            location_type = 'commercial'
            if 'mall' in location.name.lower() or 'mall' in location.description.lower():
                location_type = 'mall'
            
            # Get dynamic price
            pricing_result = pricing_service.get_dynamic_price(
                vehicle_type=request.vehicle_type,
                occupancy_rate=occupancy_rate,
                available_slots=available_slots,
                total_slots=total_slots,
                location_type=location_type,
                location_rating=location.rating or 4.0,
                booking_time=booking_time,
                is_rainy=request.is_rainy,
                event_nearby=request.event_nearby
            )
            
            return PricingResponse(
                vehicle_type=request.vehicle_type,
                **pricing_result,
                timestamp=datetime.now().isoformat()
            )
        
        finally:
            db.close()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pricing calculation failed: {str(e)}")


@router.get("/location/{location_id}")
async def get_location_pricing(
    location_id: int,
    is_rainy: bool = Query(False, description="Current weather condition"),
    event_nearby: bool = Query(False, description="Special event nearby")
):
    """
    Get dynamic pricing for all vehicle types at a specific location
    """
    try:
        from core.database import SessionLocal
        from models.models import ParkingLot, ParkingSlot
        
        db = SessionLocal()
        try:
            location = db.query(ParkingLot).filter(ParkingLot.id == location_id).first()
            if not location:
                raise HTTPException(status_code=404, detail="Location not found")
            
            # Determine location type
            location_type = 'commercial'
            if 'mall' in location.name.lower():
                location_type = 'mall'
            
            results = {}
            
            for vehicle_type in ['2wheeler', '4wheeler', 'others']:
                # Get slot statistics
                total_slots = db.query(ParkingSlot).filter(
                    ParkingSlot.lot_id == location_id,
                    ParkingSlot.vehicle_type == vehicle_type
                ).count()
                
                if total_slots == 0:
                    continue
                
                available_slots = db.query(ParkingSlot).filter(
                    ParkingSlot.lot_id == location_id,
                    ParkingSlot.vehicle_type == vehicle_type,
                    ParkingSlot.status == 'AVAILABLE'
                ).count()
                
                occupancy_rate = (total_slots - available_slots) / total_slots
                
                pricing_result = pricing_service.get_dynamic_price(
                    vehicle_type=vehicle_type,
                    occupancy_rate=occupancy_rate,
                    available_slots=available_slots,
                    total_slots=total_slots,
                    location_type=location_type,
                    location_rating=location.rating or 4.0,
                    is_rainy=is_rainy,
                    event_nearby=event_nearby
                )
                
                results[vehicle_type] = pricing_result
            
            return {
                'location_id': location_id,
                'location_name': location.name,
                'pricing': results,
                'timestamp': datetime.now().isoformat()
            }
        
        finally:
            db.close()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pricing calculation failed: {str(e)}")
