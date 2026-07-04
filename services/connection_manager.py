from fastapi import WebSocket


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
