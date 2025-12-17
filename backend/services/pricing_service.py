"""
Dynamic Pricing Service
Provides real-time price predictions for parking slots
"""

from datetime import datetime
import joblib
import os
import json
import pandas as pd
from typing import Dict, Optional

class PricingService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PricingService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.model = None
        self.scaler = None
        self.base_prices = {
            '2wheeler': 40,
            '4wheeler': 60,
            'others': 50
        }
        self._initialized = True
        self.load_model()
    
    def load_model(self):
        """Load the trained pricing model"""
        model_path = 'backend/ml_models'
        
        try:
            if os.path.exists(f'{model_path}/pricing_model.pkl'):
                self.model = joblib.load(f'{model_path}/pricing_model.pkl')
                self.scaler = joblib.load(f'{model_path}/pricing_scaler.pkl')
                
                with open(f'{model_path}/base_prices.json', 'r') as f:
                    self.base_prices = json.load(f)
                
                print("✅ Dynamic pricing model loaded successfully")
            else:
                print("⚠️ Pricing model not found, using base prices")
        except Exception as e:
            print(f"⚠️ Error loading pricing model: {e}")
            self.model = None
    
    def get_dynamic_price(
        self,
        vehicle_type: str,
        occupancy_rate: float,
        available_slots: int,
        total_slots: int,
        location_type: str = 'commercial',
        location_rating: float = 4.0,
        booking_time: Optional[datetime] = None,
        is_rainy: bool = False,
        event_nearby: bool = False
    ) -> Dict:
        """
        Calculate dynamic price based on current conditions
        
        Args:
            vehicle_type: '2wheeler', '4wheeler', or 'others'
            occupancy_rate: Current occupancy (0.0 to 1.0)
            available_slots: Number of available slots
            total_slots: Total number of slots
            location_type: 'mall', 'commercial', or 'residential'
            location_rating: Rating of the location (0-5)
            booking_time: Time of booking (defaults to now)
            is_rainy: Weather condition
            event_nearby: Special event flag
        
        Returns:
            Dict with predicted_price, base_price, and pricing_factors
        """
        if booking_time is None:
            booking_time = datetime.now()
        
        base_price = self.base_prices.get(vehicle_type, 50)
        
        # If model not loaded, return base price with simple adjustments
        if self.model is None:
            return self._fallback_pricing(
                base_price, occupancy_rate, booking_time, is_rainy, event_nearby
            )
        
        # Extract features
        hour = booking_time.hour
        day_of_week = booking_time.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        is_peak_hour = 1 if (8 <= hour <= 10) or (17 <= hour <= 19) else 0
        
        # Location encoding
        location_type_mall = 1 if location_type == 'mall' else 0
        location_type_commercial = 1 if location_type == 'commercial' else 0
        
        # Vehicle type encoding
        vehicle_type_2wheeler = 1 if vehicle_type == '2wheeler' else 0
        vehicle_type_4wheeler = 1 if vehicle_type == '4wheeler' else 0
        
        # Prepare features for model with proper feature names
        feature_names = [
            'hour',
            'day_of_week',
            'is_weekend',
            'is_peak_hour',
            'occupancy_rate',
            'available_slots',
            'total_slots',
            'location_type_mall',
            'location_type_commercial',
            'location_rating',
            'vehicle_type_2wheeler',
            'vehicle_type_4wheeler',
            'is_rainy',
            'event_nearby',
            'base_price'
        ]
        
        feature_values = [
            hour,
            day_of_week,
            is_weekend,
            is_peak_hour,
            occupancy_rate,
            available_slots,
            total_slots,
            location_type_mall,
            location_type_commercial,
            location_rating,
            vehicle_type_2wheeler,
            vehicle_type_4wheeler,
            1 if is_rainy else 0,
            1 if event_nearby else 0,
            base_price
        ]
        
        # Create DataFrame with feature names to match training format
        features_df = pd.DataFrame([feature_values], columns=feature_names)
        
        # Predict price
        features_scaled = self.scaler.transform(features_df)
        predicted_price = self.model.predict(features_scaled)[0]
        
        # Round to nearest 5
        predicted_price = round(predicted_price / 5) * 5
        
        # Calculate pricing factors
        price_change = predicted_price - base_price
        price_change_percent = (price_change / base_price) * 100
        
        factors = []
        if is_peak_hour:
            factors.append("Peak hours")
        if occupancy_rate > 0.8:
            factors.append("High demand")
        if is_weekend and location_type == 'mall':
            factors.append("Weekend premium")
        if is_rainy:
            factors.append("Weather conditions")
        if event_nearby:
            factors.append("Special event nearby")
        if hour >= 22 or hour <= 6:
            factors.append("Off-peak discount")
        
        return {
            'predicted_price': round(predicted_price, 2),
            'base_price': base_price,
            'price_change': round(price_change, 2),
            'price_change_percent': round(price_change_percent, 1),
            'pricing_factors': factors,
            'is_dynamic': True
        }
    
    def _fallback_pricing(
        self,
        base_price: float,
        occupancy_rate: float,
        booking_time: datetime,
        is_rainy: bool,
        event_nearby: bool
    ) -> Dict:
        """Simple rule-based pricing when ML model is not available"""
        multiplier = 1.0
        factors = []
        
        hour = booking_time.hour
        is_peak = (8 <= hour <= 10) or (17 <= hour <= 19)
        
        if is_peak:
            multiplier += 0.3
            factors.append("Peak hours")
        
        if occupancy_rate > 0.9:
            multiplier += 0.4
            factors.append("Very high demand")
        elif occupancy_rate > 0.7:
            multiplier += 0.2
            factors.append("High demand")
        elif occupancy_rate < 0.3:
            multiplier -= 0.1
            factors.append("Low demand discount")
        
        if is_rainy:
            multiplier += 0.15
            factors.append("Weather conditions")
        
        if event_nearby:
            multiplier += 0.25
            factors.append("Special event nearby")
        
        if hour >= 22 or hour <= 6:
            multiplier -= 0.2
            factors.append("Night discount")
        
        predicted_price = base_price * max(0.7, min(2.0, multiplier))
        predicted_price = round(predicted_price / 5) * 5
        
        price_change = predicted_price - base_price
        
        return {
            'predicted_price': round(predicted_price, 2),
            'base_price': base_price,
            'price_change': round(price_change, 2),
            'price_change_percent': round((price_change / base_price) * 100, 1),
            'pricing_factors': factors if factors else ["Standard pricing"],
            'is_dynamic': False
        }


# Singleton instance
pricing_service = PricingService()
