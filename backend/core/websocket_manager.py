"""
WebSocket Connection Manager for Real-time Updates
"""

from fastapi import WebSocket
from typing import Dict, List, Set, Optional
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        # lot_id -> list of active connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Global connections (not specific to a lot)
        self.global_connections: Set[WebSocket] = set()
    
    async def connect(self, websocket: WebSocket, lot_id: Optional[str] = None):
        """Accept and store a new WebSocket connection"""
        await websocket.accept()
        
        if lot_id:
            if lot_id not in self.active_connections:
                self.active_connections[lot_id] = []
            self.active_connections[lot_id].append(websocket)
            logger.info(f"Client connected to lot {lot_id}. Total connections: {len(self.active_connections[lot_id])}")
        else:
            self.global_connections.add(websocket)
            logger.info(f"Client connected globally. Total connections: {len(self.global_connections)}")
    
    def disconnect(self, websocket: WebSocket, lot_id: Optional[str] = None):
        """Remove a WebSocket connection"""
        if lot_id and lot_id in self.active_connections:
            if websocket in self.active_connections[lot_id]:
                self.active_connections[lot_id].remove(websocket)
                logger.info(f"Client disconnected from lot {lot_id}")
                
                # Clean up empty lot entries
                if not self.active_connections[lot_id]:
                    del self.active_connections[lot_id]
        else:
            if websocket in self.global_connections:
                self.global_connections.remove(websocket)
                logger.info("Client disconnected globally")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast_to_lot(self, lot_id: str, message: dict):
        """Broadcast a message to all connections for a specific lot"""
        if lot_id not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[lot_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to lot {lot_id}: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection, lot_id)
    
    async def broadcast_global(self, message: dict):
        """Broadcast a message to all global connections"""
        disconnected = []
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error in global broadcast: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def send_occupancy_update(self, lot_id: str, occupancy_data: dict):
        """Send occupancy update to all clients watching a specific lot"""
        message = {
            "type": "occupancy_update",
            "lot_id": lot_id,
            "data": occupancy_data
        }
        await self.broadcast_to_lot(lot_id, message)
    
    async def send_booking_notification(self, user_id: str, booking_data: dict):
        """Send booking notification to a specific user (if connected)"""
        message = {
            "type": "booking_notification",
            "data": booking_data
        }
        # In a real implementation, you'd maintain user_id -> websocket mapping
        await self.broadcast_global(message)
    
    async def send_pricing_update(self, lot_id: str, pricing_data: dict):
        """Send dynamic pricing update"""
        message = {
            "type": "pricing_update",
            "lot_id": lot_id,
            "data": pricing_data
        }
        await self.broadcast_to_lot(lot_id, message)


# Global manager instance
manager = ConnectionManager()
