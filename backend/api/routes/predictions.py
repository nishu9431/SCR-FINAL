"""Predictions Routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os
import pickle
import pandas as pd

from core.database import get_db
from models.models import ParkingLot, OccupancyLog, PredictionLog
from schemas.schemas import DemandForecast

router = APIRouter()


@router.get("/demand", response_model=DemandForecast)
async def get_demand_forecast(
    lot_id: int = Query(..., description="Parking lot ID"),
    horizon_minutes: int = Query(60, description="Forecast horizon in minutes"),
    db: Session = Depends(get_db)
):
    """Get demand forecast for a parking lot"""
    
    # Validate lot exists
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found")
    
    # Try to load ML model
    model_path = f"models/prophet_lot_{lot_id}.pkl"
    
    try:
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            
            # Generate future timestamps
            now = datetime.utcnow()
            future_timestamps = [now + timedelta(minutes=i*15) for i in range(horizon_minutes // 15)]
            
            # Create future dataframe for Prophet
            future_df = pd.DataFrame({
                'ds': future_timestamps
            })
            
            # Make prediction
            forecast = model.predict(future_df)
            
            predictions = [
                {
                    "timestamp": ts.isoformat(),
                    "predicted_occupancy": max(0, min(lot.total_slots, int(pred))),
                    "confidence_lower": max(0, int(lower)),
                    "confidence_upper": min(lot.total_slots, int(upper))
                }
                for ts, pred, lower, upper in zip(
                    future_timestamps,
                    forecast['yhat'],
                    forecast['yhat_lower'],
                    forecast['yhat_upper']
                )
            ]
            
            # Log prediction
            pred_log = PredictionLog(
                lot_id=lot_id,
                prediction_time=now,
                horizon_minutes=horizon_minutes,
                model_version="prophet_v1",
                predictions=predictions
            )
            db.add(pred_log)
            db.commit()
            
            return DemandForecast(
                lot_id=lot_id,
                generated_at=now,
                horizon_minutes=horizon_minutes,
                predictions=predictions,
                model_version="prophet_v1"
            )
        
        else:
            # Fallback: simple historical average
            hour_ago = datetime.utcnow() - timedelta(hours=1)
            recent_logs = db.query(OccupancyLog).filter(
                OccupancyLog.lot_id == lot_id,
                OccupancyLog.timestamp >= hour_ago
            ).all()
            
            if recent_logs:
                avg_occupancy = sum(log.occupied_count for log in recent_logs) / len(recent_logs)
            else:
                avg_occupancy = lot.total_slots * 0.5  # Default to 50%
            
            # Generate simple forecast
            now = datetime.utcnow()
            predictions = [
                {
                    "timestamp": (now + timedelta(minutes=i*15)).isoformat(),
                    "predicted_occupancy": int(avg_occupancy),
                    "confidence_lower": max(0, int(avg_occupancy * 0.8)),
                    "confidence_upper": min(lot.total_slots, int(avg_occupancy * 1.2))
                }
                for i in range(horizon_minutes // 15)
            ]
            
            return DemandForecast(
                lot_id=lot_id,
                generated_at=now,
                horizon_minutes=horizon_minutes,
                predictions=predictions,
                model_version="simple_average"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
