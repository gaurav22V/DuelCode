import os
import json
import asyncpg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from matchmaker import Matchmaker
from judge import evaluate_code, evaluate_custom


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("CRITICAL ERROR: DATABASE_URL is not set. Check your .env file!")
    
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mm = Matchmaker()

@app.post("/auth/signup")
async def signup(request: Request):
    data = await request.json()
    email = data.get('email', '').lower()
    username = data.get('username', '').strip()

    conn = await asyncpg.connect(DATABASE_URL)
    try:
        exists = await conn.fetchval("SELECT username FROM users WHERE email = $1 OR username = $2", email, username)
        if exists: return {"status": "error", "message": "Username or Email exists."}
        await conn.execute("INSERT INTO users (email, username, elo) VALUES ($1, $2, 1200)", email, username)
        return {"status": "success"}
    except Exception as e: return {"status": "error", "message": str(e)}
    finally: await conn.close()

@app.post("/auth/login")
async def login(request: Request):
    data = await request.json()
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        user = await conn.fetchrow("SELECT username, email, elo FROM users WHERE email = $1 AND username = $2", data.get('email', '').lower(), data.get('username', '').strip())
        if user: return {"status": "success", "user": dict(user)}
        return {"status": "error", "message": "Invalid credentials."}
    finally: await conn.close()

@app.get("/leaderboard")
async def get_leaderboard():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch("SELECT username, elo FROM users ORDER BY elo DESC LIMIT 10")
        return {"leaderboard": [dict(r) for r in rows]}
    finally: await conn.close()

@app.get("/profile/{username}")
async def get_profile(username: str):
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        user = await conn.fetchrow("SELECT username, elo, email FROM users WHERE username = $1", username)
        if not user: return {"status": "error"}
        history = await conn.fetch("SELECT opponent, result, elo_change, played_at FROM match_history WHERE username = $1 ORDER BY played_at DESC LIMIT 10", username)
        return {"status": "success", "user": dict(user), "history": [dict(h) for h in history]}
    finally: await conn.close()

@app.websocket("/ws/duel/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    conn = await asyncpg.connect(DATABASE_URL)
    user_elo = await conn.fetchval("SELECT elo FROM users WHERE username = $1", client_id) or 1200
    await conn.close()

    await mm.connect(client_id, websocket, user_elo)
    try:
        while True:
            data = await websocket.receive_json()
            m_id = data.get("match_id")

            if data['type'] == "RUN_CUSTOM":
                verdict = await evaluate_custom(data['code'], data['custom_input'])
                await websocket.send_json({"type": "VERDICT", **verdict})
            elif data['type'] in ["RUN_CODE", "SUBMIT_CODE"]:
                verdict = await evaluate_code(data['code'], data['problem_id'], True)
                await websocket.send_json({"type": "VERDICT", **verdict})
                if m_id:
                    await mm.handle_telemetry(m_id, client_id, data['type'], verdict['status'])
                    if data['type'] == "SUBMIT_CODE" and verdict['status'] == "Accepted":
                        await mm.handle_submission(m_id, client_id, verdict)
            elif data['type'] == "SURRENDER" and m_id:
                await mm.evaluate_winner(m_id, forfeit_loser=client_id)
    except WebSocketDisconnect:
        mm.disconnect(client_id)
