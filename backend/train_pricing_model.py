"""
Dynamic Pricing ML Model for ParkPulse
Predicts optimal parking prices based on demand, occupancy, time, and other factors
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import json
from datetime import datetime, timedelta
import os

class DynamicPricingModel:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.base_prices = {
            '2wheeler': 40,
            '4wheeler': 60,
            'others': 50
        }
        
    def generate_training_data(self, n_samples=10000):
        """Generate synthetic training data based on parking patterns"""
        np.random.seed(42)
        
        data = []
        for _ in range(n_samples):
            # Time features
            hour = np.random.randint(0, 24)
            day_of_week = np.random.randint(0, 7)  # 0=Monday, 6=Sunday
            is_weekend = 1 if day_of_week >= 5 else 0
            is_peak_hour = 1 if (8 <= hour <= 10) or (17 <= hour <= 19) else 0
            
            # Location features
            location_type = np.random.choice(['mall', 'commercial', 'residential'])
            location_rating = np.random.uniform(3.5, 5.0)
            
            # Demand features
            occupancy_rate = np.random.uniform(0.2, 1.0)
            available_slots = np.random.randint(5, 100)
            total_slots = np.random.randint(available_slots + 10, 200)
            
            # Vehicle type
            vehicle_type = np.random.choice(['2wheeler', '4wheeler', 'others'])
            base_price = self.base_prices[vehicle_type]
            
            # Weather (simplified)
            is_rainy = np.random.choice([0, 1], p=[0.8, 0.2])
            
            # Event nearby (special occasions)
            event_nearby = np.random.choice([0, 1], p=[0.85, 0.15])
            
            # Calculate target price with realistic adjustments
            price_multiplier = 1.0
            
            # Peak hour premium
            if is_peak_hour:
                price_multiplier += 0.3
            
            # Weekend discount/premium (malls get premium, offices get discount)
            if is_weekend:
                if location_type == 'mall':
                    price_multiplier += 0.2
                else:
                    price_multiplier -= 0.15
            
            # Occupancy-based pricing
            if occupancy_rate > 0.9:
                price_multiplier += 0.4
            elif occupancy_rate > 0.7:
                price_multiplier += 0.2
            elif occupancy_rate < 0.3:
                price_multiplier -= 0.1
            
            # Weather premium
            if is_rainy:
                price_multiplier += 0.15
            
            # Event premium
            if event_nearby:
                price_multiplier += 0.25
            
            # Night discount
            if hour >= 22 or hour <= 6:
                price_multiplier -= 0.2
            
            # Calculate final price
            final_price = base_price * max(0.7, min(2.0, price_multiplier))
            
            data.append({
                'hour': hour,
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'is_peak_hour': is_peak_hour,
                'occupancy_rate': occupancy_rate,
                'available_slots': available_slots,
                'total_slots': total_slots,
                'location_type_mall': 1 if location_type == 'mall' else 0,
                'location_type_commercial': 1 if location_type == 'commercial' else 0,
                'location_rating': location_rating,
                'vehicle_type_2wheeler': 1 if vehicle_type == '2wheeler' else 0,
                'vehicle_type_4wheeler': 1 if vehicle_type == '4wheeler' else 0,
                'is_rainy': is_rainy,
                'event_nearby': event_nearby,
                'base_price': base_price,
                'price': final_price
            })
        
        return pd.DataFrame(data)
    
    def train(self, df):
        """Train the dynamic pricing model"""
        # Prepare features and target
        feature_columns = [
            'hour', 'day_of_week', 'is_weekend', 'is_peak_hour',
            'occupancy_rate', 'available_slots', 'total_slots',
            'location_type_mall', 'location_type_commercial',
            'location_rating', 'vehicle_type_2wheeler', 'vehicle_type_4wheeler',
            'is_rainy', 'event_nearby', 'base_price'
        ]
        
        X = df[feature_columns]
        y = df['price']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        print("Training dynamic pricing model...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        print(f"Training R² Score: {train_score:.4f}")
        print(f"Testing R² Score: {test_score:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nTop 5 Most Important Features:")
        print(feature_importance.head())
        
        return train_score, test_score
    
    def predict_price(self, features):
        """Predict dynamic price for given features"""
        features_scaled = self.scaler.transform([features])
        predicted_price = self.model.predict(features_scaled)[0]
        return round(predicted_price, 2)
    
    def save_model(self, path='backend/ml_models'):
        """Save the trained model and scaler"""
        os.makedirs(path, exist_ok=True)
        joblib.dump(self.model, f'{path}/pricing_model.pkl')
        joblib.dump(self.scaler, f'{path}/pricing_scaler.pkl')
        
        # Save base prices
        with open(f'{path}/base_prices.json', 'w') as f:
            json.dump(self.base_prices, f)
        
        print(f"\nModel saved to {path}/")
    
    @classmethod
    def load_model(cls, path='backend/ml_models'):
        """Load a trained model"""
        instance = cls()
        instance.model = joblib.load(f'{path}/pricing_model.pkl')
        instance.scaler = joblib.load(f'{path}/pricing_scaler.pkl')
        
        with open(f'{path}/base_prices.json', 'r') as f:
            instance.base_prices = json.load(f)
        
        return instance


def main():
    """Train and save the dynamic pricing model"""
    print("=" * 60)
    print("ParkPulse Dynamic Pricing Model Training")
    print("=" * 60)
    
    # Initialize model
    pricing_model = DynamicPricingModel()
    
    # Generate training data
    print("\nGenerating training data...")
    df = pricing_model.generate_training_data(n_samples=10000)
    print(f"Generated {len(df)} training samples")
    
    # Train model
    print("\n" + "=" * 60)
    pricing_model.train(df)
    
    # Save model
    print("\n" + "=" * 60)
    pricing_model.save_model()
    
    # Test predictions
    print("\n" + "=" * 60)
    print("Sample Predictions:")
    print("=" * 60)
    
    test_scenarios = [
        {
            'name': 'Peak Hour Mall - High Occupancy',
            'features': [18, 5, 1, 1, 0.95, 5, 50, 1, 0, 4.5, 0, 1, 0, 0, 60]
        },
        {
            'name': 'Night Time - Low Occupancy',
            'features': [23, 2, 0, 0, 0.25, 80, 100, 0, 1, 4.0, 1, 0, 0, 0, 40]
        },
        {
            'name': 'Rainy Day - Medium Occupancy',
            'features': [14, 1, 0, 0, 0.65, 30, 80, 0, 1, 4.2, 0, 1, 1, 0, 60]
        },
        {
            'name': 'Event Nearby - Weekend',
            'features': [15, 6, 1, 0, 0.80, 15, 60, 1, 0, 4.8, 0, 0, 0, 1, 50]
        }
    ]
    
    for scenario in test_scenarios:
        price = pricing_model.predict_price(scenario['features'])
        print(f"{scenario['name']}: ₹{price}/hour")
    
    print("\n" + "=" * 60)
    print("✅ Model training completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
