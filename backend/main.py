"""
ParkPulse Backend - Main Application Entry Point
FastAPI application with marketplace, real-time, and prediction services
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import sys
from pathlib import Path

# Add the backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from api.routes import auth, users, lots, bookings, payments, occupancy, predictions, owners, admin
from core.config import settings
from core.database import engine, Base
from core.websocket_manager import manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting ParkPulse Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DATABASE_URL}")
    
    # Initialize database tables
    # Base.metadata.create_all(bind=engine)  # Use Alembic in production
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down ParkPulse Backend...")


# Initialize FastAPI app
app = FastAPI(
    title="ParkPulse API",
    description="Marketplace-driven Predictive Parking Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ParkPulse API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# WebSocket endpoint for real-time occupancy
@app.websocket("/ws/occupancy/{lot_id}")
async def websocket_occupancy(websocket: WebSocket, lot_id: str):
    """WebSocket endpoint for real-time occupancy updates"""
    await manager.connect(websocket, lot_id)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            logger.info(f"Received message from client for lot {lot_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, lot_id)
        logger.info(f"Client disconnected from lot {lot_id}")


# Global WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Global WebSocket endpoint for notifications"""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")


# Include API routers
app.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/v1/users", tags=["Users"])
app.include_router(lots.router, prefix="/v1/lots", tags=["Lots"])
app.include_router(bookings.router, prefix="/v1/bookings", tags=["Bookings"])
app.include_router(payments.router, prefix="/v1/payments", tags=["Payments"])
app.include_router(occupancy.router, prefix="/v1/occupancy", tags=["Occupancy"])
app.include_router(predictions.router, prefix="/v1/predictions", tags=["Predictions"])
app.include_router(owners.router, prefix="/v1/owners", tags=["Owners"])
app.include_router(admin.router, prefix="/v1/admin", tags=["Admin"])


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
