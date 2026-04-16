from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
from auth import create_user, authenticate_user
from judge import run_judge
from database import init_db, get_db_conn, get_db_cursor
import matchmaker

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()

# --- Models ---
class UserAuth(BaseModel):
    username: str; email: str = None; password: str

class Submission(BaseModel):
    problemId: int; code: str; roomId: str; playerId: str

# --- Throttling ---
submission_cooldowns = {}

@app.post("/auth/signup")
async def signup(user: UserAuth):
    res = create_user(user.username, user.email, user.password)
    if not res: raise HTTPException(status_code=400, detail="Username/Email already exists")
    return res

@app.post("/auth/login")
async def login(user: UserAuth):
    res = authenticate_user(user.username, user.password)
    if not res: raise HTTPException(status_code=401, detail="Invalid credentials")
    return res

@app.post("/submit")
async def submit(req: Submission):
    now = time.time()
    if now - submission_cooldowns.get(req.playerId, 0) < 5:
        raise HTTPException(status_code=429, detail="Cooldown: Wait 5s")
    
    submission_cooldowns[req.playerId] = now
    verdict = run_judge(req.code, req.problemId)
    
    # Save to history
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO submissions (problem_id, user_id, verdict, code) VALUES (%s, %s, %s, %s)",
        (req.problemId, req.playerId, verdict, req.code)
    )
    conn.commit()
    cur.close(); conn.close()

    # If AC, notify room via matchmaker logic (omitted for brevity)
    return {"verdict": verdict}

@app.get("/history/{user_id}")
async def history(user_id: str):
    conn = get_db_conn()
    cur = get_db_cursor(conn)
    cur.execute("""
        SELECT s.*, p.title FROM submissions s 
        JOIN problems p ON s.problem_id = p.id 
        WHERE s.user_id = %s ORDER BY s.created_at DESC
    """, (user_id,))
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows

@app.websocket("/ws/duel/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    await matchmaker.add_to_queue(client_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        matchmaker.remove_from_queue(client_id)

@app.get("/leaderboard")
async def get_leaderboard():
    conn = get_db_conn()
    cur = get_db_cursor(conn)
    # Ranks users by count of 'Accepted' verdicts
    cur.execute("""
        SELECT u.username, COUNT(s.id) as score 
        FROM users u 
        JOIN submissions s ON CAST(u.id AS VARCHAR) = s.user_id 
        WHERE s.verdict = 'Accepted' 
        GROUP BY u.username 
        ORDER BY score DESC LIMIT 10
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return rows