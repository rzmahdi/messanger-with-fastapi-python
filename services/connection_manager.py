from fastapi import WebSocket
from typing import Any
from fastapi.encoders import jsonable_encoder


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
        
        if user_id not in self.active_connections[room_id]:
            return


        is_last_connection = False
        connections = self.active_connections[room_id][user_id]["connections"]
        
        if websocket in connections:
            connections.remove(websocket)

        if(len(connections) == 0):
            is_last_connection = True

            del self.active_connections[room_id][user_id]

            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

        return is_last_connection
    

    async def disconnect_all(self, room_id: int):
        if room_id not in self.active_connections:
            return

        for user_data in list(self.active_connections[room_id].values()):
            for connection in list(user_data["connections"]):
                try:
                    await connection.close()
                except Exception:
                    pass

        if room_id in self.active_connections:
            del self.active_connections[room_id]


    async def broadcast(self, room_id: int, message: dict[str, Any]):
        if room_id not in self.active_connections:
            return

        dead_connections = []

        for user_id, user_data in self.active_connections[room_id].items():
            for connection in user_data["connections"]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append((user_id, connection))

        for user_id, connection in dead_connections:
            if room_id in self.active_connections and user_id in self.active_connections[room_id]:
                connections = self.active_connections[room_id][user_id]["connections"]
                if connection in connections:
                    connections.remove(connection)
                if not connections:
                    del self.active_connections[room_id][user_id]

        if room_id in self.active_connections and not self.active_connections[room_id]:
            del self.active_connections[room_id]
    

    async def send_to_user(self, room_id: int, user_id: int, message: dict[str, Any]):
        if room_id not in self.active_connections:
            return
        
        if user_id not in self.active_connections[room_id]:
            return
        
        connections = self.active_connections[room_id][user_id]["connections"]
        for connection in connections:
            await connection.send_json(message)