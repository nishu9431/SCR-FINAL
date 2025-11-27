"""
Core Configuration Settings
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API
    API_V1_PREFIX: str = "/v1"
    PROJECT_NAME: str = "ParkPulse"
    
    # Database
    DATABASE_URL: str = "postgresql://parkpulse:parkpulse123@localhost:5432/parkpulse"
    DATABASE_TEST_URL: str = "postgresql://parkpulse:parkpulse123@localhost:5432/parkpulse_test"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # MQTT (Edge Gateway)
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
    ]
    
    # Payments (Stripe)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    
    # Razorpay (alternative)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    
    # ML Models
    ML_MODEL_PATH: str = "./models"
    PREDICTION_HORIZON_MINUTES: int = 60
    
    # Edge Privacy
    PLATE_HASH_SECRET: str = "your-plate-hash-secret-change-in-production"
    
    # Business Logic
    BOOKING_CANCELLATION_HOURS: int = 2
    REFUND_PERCENTAGE: float = 100.0
    DYNAMIC_PRICING_ENABLED: bool = True
    MAX_SURGE_MULTIPLIER: float = 2.5
    MIN_SURGE_MULTIPLIER: float = 0.7
    
    # Monitoring
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
