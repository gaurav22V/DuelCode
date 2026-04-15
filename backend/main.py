import os
import uuid
import subprocess
import psycopg2
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI()

# --- CORS: Allows React (port 3000) to talk to FastAPI (port 8080) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DB CONFIG (Update with your Windows Postgres password) ---
DB_CONFIG = {
    "host": "localhost",
    "database": "duelcode",
    "user": "postgres",
    "password": "your_password_here", 
    "port": "5432"
}

# --- Game State Management ---
waiting_queue: List[Dict] = []  # Players waiting for a match
active_rooms: Dict[str, Dict] = {} # Active 1v1 matches

class SubmissionRequest(BaseModel):
    problemId: int
    code: str
    roomId: str
    playerId: str

def get_db_conn():
    return psycopg2.connect(**DB_CONFIG)

# --- The Judge (Docker Execution) ---
def run_judge(user_code: str, problem_id: int):
    sub_id = str(uuid.uuid4())
    sub_dir = os.path.join(os.getcwd(), "submissions", sub_id)
    os.makedirs(sub_dir, exist_ok=True)
    
    with open(os.path.join(sub_dir, "solution.cpp"), "w") as f:
        f.write(user_code)

    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT input_data, expected_output FROM test_cases WHERE problem_id = %s", (problem_id,))
        test_cases = cur.fetchall()
        cur.close()
        conn.close()

        for idx, (inp, out) in enumerate(test_cases):
            # Windows Fix: Docker volumes require forward slashes
            docker_sub_dir = sub_dir.replace("\\", "/")
            
            cmd = [
                "docker", "run", "--rm",
                "--memory", "256m", "--cpus", "0.5",
                "-v", f"{docker_sub_dir}:/app", "-w", "/app",
                "judge", "sh", "-c", 
                f"g++ solution.cpp -o out && echo '{inp}' | timeout 2s ./out"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            actual = result.stdout.strip()
            
            if actual != out.strip():
                if result.stderr: return "Compile Error"
                return f"Wrong Answer on Test {idx + 1}"

        return "Accepted"
    finally:
        import shutil
        shutil.rmtree(sub_dir, ignore_errors=True)

# --- Endpoints ---
@app.post("/submit")
async def submit_code(req: SubmissionRequest):
    verdict = run_judge(req.code, req.problemId)
    
    # If someone wins, notify both players in the room immediately
    if verdict == "Accepted" and req.roomId in active_rooms:
        room = active_rooms[req.roomId]
        for pid, sock in room["players"].items():
            await sock.send_json({
                "type": "GAME_OVER",
                "winner": req.playerId
            })
    return {"verdict": verdict}

@app.websocket("/ws/duel/{client_id}")
async def duel_socket(websocket: WebSocket, client_id: str):
    await websocket.accept()
    waiting_queue.append({"id": client_id, "socket": websocket})

    if len(waiting_queue) >= 2:
        p1, p2 = waiting_queue.pop(0), waiting_queue.pop(0)
        room_id = str(uuid.uuid4())
        
        # Pick random problem from DB
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, title, description FROM problems ORDER BY RANDOM() LIMIT 1")
        prob = cur.fetchone()
        cur.close()
        conn.close()

        active_rooms[room_id] = {
            "players": {p1["id"]: p1["socket"], p2["id"]: p2["socket"]},
            "problem": {"id": prob[0], "title": prob[1], "description": prob[2]}
        }

        match_msg = {"type": "MATCH_START", "roomId": room_id, "problem": active_rooms[room_id]["problem"]}
        await p1["socket"].send_json({**match_msg, "opponentId": p2["id"]})
        await p2["socket"].send_json({**match_msg, "opponentId": p1["id"]})

    try:
        while True: await websocket.receive_text()
    except WebSocketDisconnect:
        # Cleanup waiting queue if player leaves
        for i, c in enumerate(waiting_queue):
            if c["id"] == client_id: waiting_queue.pop(i); break