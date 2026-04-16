import uuid
from database import get_db_conn, get_db_cursor

waiting_queue = [] # List of {"id": str, "socket": WebSocket}
active_rooms = {}  # Map of room_id -> room_data

async def add_to_queue(player_id, websocket):
    waiting_queue.append({"id": player_id, "socket": websocket})
    
    if len(waiting_queue) >= 2:
        p1 = waiting_queue.pop(0)
        p2 = waiting_queue.pop(0)
        room_id = str(uuid.uuid4())

        # Pick random problem
        conn = get_db_conn()
        cur = get_db_cursor(conn)
        cur.execute("SELECT * FROM problems ORDER BY RANDOM() LIMIT 1")
        problem = cur.fetchone()
        cur.close()
        conn.close()

        room_data = {
            "roomId": room_id,
            "problem": problem,
            "players": {p1["id"]: p1["socket"], p2["id"]: p2["socket"]}
        }
        active_rooms[room_id] = room_data

        # Notify both players
        match_msg = {"type": "MATCH_START", "roomId": room_id, "problem": problem}
        await p1["socket"].send_json({**match_msg, "opponentId": p2["id"]})
        await p2["socket"].send_json({**match_msg, "opponentId": p1["id"]})
        
        return room_id
    return None

def remove_from_queue(player_id):
    global waiting_queue
    waiting_queue = [p for p in waiting_queue if p["id"] != player_id]