from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import os
import json
from matchmaker import Matchmaker
from judge import evaluate_code, evaluate_custom

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:pw123@localhost:5432/duelcode")
mm = Matchmaker() # Global instance of your game engine

# --- AUTH & API ROUTES ---
@app.post("/auth/signup")
async def signup(request: Request):
    data = await request.json()
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        await conn.execute("INSERT INTO users (email, username, elo) VALUES ($1, $2, 1200)", data['email'], data['username'])
        return {"status": "success"}
    except: return {"status": "error", "message": "User exists"}
    finally: await conn.close()

@app.get("/leaderboard")
async def get_leaderboard():
    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch("SELECT username, elo FROM users ORDER BY elo DESC LIMIT 10")
    await conn.close()
    return {"leaderboard": [dict(r) for r in rows]}

@app.get("/profile/{username}")
async def get_profile(username: str):
    conn = await asyncpg.connect(DATABASE_URL)
    user = await conn.fetchrow("SELECT username, elo, email FROM users WHERE username = $1", username)
    if not user: return {"status": "error"}
    history = await conn.fetch("SELECT opponent, result, elo_change, played_at FROM match_history WHERE username = $1 ORDER BY played_at DESC LIMIT 10", username)
    await conn.close()
    return {"status": "success", "user": dict(user), "history": [dict(h) for h in history]}

# --- THE WEBSOCKET GATEWAY ---
@app.websocket("/ws/duel/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    # 1. Get user's current Elo from DB for matchmaking
    conn = await asyncpg.connect(DATABASE_URL)
    user_elo = await conn.fetchval("SELECT elo FROM users WHERE username = $1", client_id) or 1200
    await conn.close()

    # 2. Join the queue
    await mm.connect(client_id, websocket, user_elo)

    try:
        while True:
            data = await websocket.receive_json()
            m_id = data.get("match_id")

            # Route 1: Custom Run (Doesn't affect match)
            if data['type'] == "RUN_CUSTOM":
                verdict = await evaluate_custom(data['code'], data['custom_input'])
                await websocket.send_json({"type": "VERDICT", **verdict})

            # Route 2: Match Actions (Run/Submit)
            elif data['type'] in ["RUN_CODE", "SUBMIT_CODE"]:
                verdict = await evaluate_code(data['code'], data['problem_id'], True)
                await websocket.send_json({"type": "VERDICT", **verdict})
                
                # Update match state and telemetry
                if m_id:
                    await mm.handle_telemetry(m_id, client_id, data['type'], verdict['status'])
                    if data['type'] == "SUBMIT_CODE" and verdict['status'] == "Accepted":
                        await mm.handle_submission(m_id, client_id, verdict)
            
            # Route 3: Surrender
            elif data['type'] == "SURRENDER" and m_id:
                await mm.evaluate_winner(m_id, forfeit_loser=client_id)

    except WebSocketDisconnect:
        mm.disconnect(client_id)
