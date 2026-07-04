from fastapi import WebSocket
from typing import Any


class ConnectionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, room_id: int, user_id: int, username: str, websocket: WebSocket):
        await websocket.accept()
        is_first_connection = False

        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}

        if user_id not in self.active_connections[room_id]:
            is_first_connection = True

            self.active_connections[room_id][user_id] = {
                "username": username,
                "connections": []
            }
        
        self.active_connections[room_id][user_id]["connections"].append(websocket)
        return is_first_connection


    async def disconnect(self, room_id: int, user_id: int, websocket: WebSocket):
        if room_id not in self.active_connections:
            return

        is_last_connection = False
        connections = self.active_connections[room_id][user_id]["connections"]

        connections.remove(websocket)

        if(len(connections) == 0):
            is_last_connection = True

            del self.active_connections[room_id][user_id]

            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        return is_last_connection
    

    async def broadcast(self, room_id: int, message: dict[str, Any]):
        if room_id not in self.active_connections:
            return

        for user in self.active_connections[room_id].values():
            for connection in user["connections"]:
                await connection.send_json(message)