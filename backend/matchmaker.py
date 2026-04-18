import asyncio
import time
import json
import asyncpg
import os
import math

# ==========================================
# 🔌 DATABASE CONFIGURATION
# ==========================================
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_LjtJg9rn7IVN@ep-rapid-haze-amyw2soc-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

async def get_random_problem_from_db():
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        row = await conn.fetchrow("SELECT * FROM problems ORDER BY RANDOM() LIMIT 1;")
        await conn.close()

        if row:
            problem = dict(row)
            # 🛡️ Ensure JSONB fields are handled correctly regardless of DB driver behavior
            for key in ['starter_code', 'examples']:
                if isinstance(problem.get(key), str):
                    problem[key] = json.loads(problem[key])
            return problem
    except Exception as e:
        print(f"❌ DB Fetch Error: {e}")
    
    # Fallback to keep the app from crashing during dev
    return {
        "problem_slug": "add-two-numbers",
        "title": "Add Two Numbers",
        "description": "Given integers a and b, return their sum.",
        "starter_code": {"cpp": "class Solution {\npublic:\n    int solve(int a, int b) {\n        return 0;\n    }\n};"}
    }

# ==========================================
# ⚔️ THE MATCHMAKER ENGINE
# ==========================================

class Matchmaker:
    def __init__(self):
        # Queue: { client_id: {"ws": websocket, "elo": int, "join_time": float} }
        self.queue = {}
        # Active Matches: { match_id: {"p1": dict, "p2": dict, "state": str, ...} }
        self.active_matches = {}

    # --- 1. ELO MATHEMATICS (The Brain) ---
    def _calculate_new_elos(self, w_elo, l_elo):
        """Implements standard Elo rating algorithm (K-factor = 32)."""
        K = 32
        expected_win = 1 / (1 + math.pow(10, (l_elo - w_elo) / 400))
        expected_loss = 1 / (1 + math.pow(10, (w_elo - l_elo) / 400))
        
        new_w = round(w_elo + K * (1 - expected_win))
        new_l = round(l_elo + K * (0 - expected_loss))
        return new_w, new_l

    # --- 2. QUEUE & CONNECTION MANAGEMENT ---
    async def connect(self, client_id: str, websocket, elo: int = 1200):
        await websocket.accept()
        self.queue[client_id] = {
            "ws": websocket,
            "elo": elo,
            "join_time": time.time()
        }
        # Fire and forget the matchmaking processor
        asyncio.create_task(self._process_queue())

    def disconnect(self, client_id: str):
        if client_id in self.queue:
            del self.queue[client_id]

    # --- 3. LIVE MATCH LOGIC ---
    async def _process_queue(self):
        """Pairs players using expanding Elo tolerance (50 + 10/sec)."""
        if len(self.queue) < 2: return

        players = list(self.queue.items())
        for i in range(len(players)):
            for j in range(i + 1, len(players)):
                p1_id, p1_data = players[i]
                p2_id, p2_data = players[j]

                wait_time = max(time.time() - p1_data["join_time"], time.time() - p2_data["join_time"])
                tolerance = 50 + (wait_time * 10)
                
                if abs(p1_data["elo"] - p2_data["elo"]) <= tolerance:
                    await self._start_match(p1_id, p1_data, p2_id, p2_data)
                    return

    async def _start_match(self, p1_id, p1_data, p2_id, p2_data):
        del self.queue[p1_id]
        del self.queue[p2_id]

        match_id = f"match_{int(time.time())}_{p1_id}"
        problem = await get_random_problem_from_db()

        self.active_matches[match_id] = {
            "p1": {"id": p1_id, "ws": p1_data["ws"], "elo": p1_data["elo"], "penalties": 0},
            "p2": {"id": p2_id, "ws": p2_data["ws"], "elo": p2_data["elo"], "penalties": 0},
            "problem": problem,
            "state": "ongoing",
            "results": {},
            "start_time": time.time()
        }

        # Broadcast to both
        for p_id, opp_id, ws in [(p1_id, p2_id, p1_data["ws"]), (p2_id, p1_id, p2_data["ws"])]:
            await ws.send_json({
                "type": "MATCH_START",
                "match_id": match_id,
                "opponent": opp_id,
                "problem": problem
            })

    async def handle_telemetry(self, match_id: str, client_id: str, action: str, verdict: str):
        """Sends 'Opponent is running/submitting' updates to the other player."""
        match = self.active_matches.get(match_id)
        if not match: return

        is_p1 = (client_id == match["p1"]["id"])
        opp_ws = match["p2"]["ws"] if is_p1 else match["p1"]["ws"]
        
        # Track penalties for failures
        if action == "SUBMIT_CODE" and verdict != "Accepted":
            if is_p1: match["p1"]["penalties"] += 1
            else: match["p2"]["penalties"] += 1

        penalties = match["p1"]["penalties"] if is_p1 else match["p2"]["penalties"]

        try:
            await opp_ws.send_json({
                "type": "OPPONENT_TELEMETRY",
                "action": action,
                "verdict": verdict,
                "penalties": penalties
            })
        except: pass

    async def handle_submission(self, match_id: str, client_id: str, verdict: dict):
        """Triggered on an 'Accepted' verdict."""
        match = self.active_matches.get(match_id)
        if not match or match["state"] == "finished": return

        match["results"][client_id] = verdict

        if match["state"] == "ongoing":
            match["state"] = "grace_period"
            
            # Identify roles
            p1_win = (match["p1"]["id"] == client_id)
            winner_ws = match["p1"]["ws"] if p1_win else match["p2"]["ws"]
            loser_ws = match["p2"]["ws"] if p1_win else match["p1"]["ws"]

            await winner_ws.send_json({"type": "WAITING_FOR_OPPONENT"})
            await loser_ws.send_json({"type": "GRACE_PERIOD_START", "seconds": 30})
            
            # Auto-end after 30 seconds
            asyncio.create_task(self._grace_period_timer(match_id))

        elif match["state"] == "grace_period":
            # Both finished! End now.
            await self.evaluate_winner(match_id)

    async def _grace_period_timer(self, match_id: str):
        await asyncio.sleep(30)
        await self.evaluate_winner(match_id)

    # --- 4. THE FINISHER (Database Persistence) ---
    async def evaluate_winner(self, match_id: str, forfeit_loser=None):
        match = self.active_matches.get(match_id)
        if not match or match["state"] == "finished": return
        match["state"] = "finished"

        p1, p2 = match["p1"], match["p2"]
        res1, res2 = match["results"].get(p1["id"]), match["results"].get(p2["id"])

        # Determine winner
        winner_id = None
        if forfeit_loser:
            winner_id = p1["id"] if forfeit_loser == p2["id"] else p2["id"]
        elif res1 and res2:
            # Faster execution time wins
            winner_id = p1["id"] if res1["time_ms"] < res2["time_ms"] else p2["id"]
        elif res1: winner_id = p1["id"]
        elif res2: winner_id = p2["id"]

        # Calculate Elo if we have a clear winner
        w_elo_final, l_elo_final = p1["elo"], p2["elo"]
        w_change, l_change = "0", "0"

        if winner_id:
            is_p1_winner = (winner_id == p1["id"])
            w_curr = p1["elo"] if is_p1_winner else p2["elo"]
            l_curr = p2["elo"] if is_p1_winner else p1["elo"]
            
            new_w, new_l = self._calculate_new_elos(w_curr, l_curr)
            w_change, l_change = f"+{new_w - w_curr}", str(new_l - l_curr)
            
            # Update Database
            try:
                conn = await asyncpg.connect(DATABASE_URL)
                # 1. Update User Ratings
                await conn.execute("UPDATE users SET elo = $1 WHERE username = $2", new_w, winner_id)
                await conn.execute("UPDATE users SET elo = $1 WHERE username = $2", new_l, p2["id"] if is_p1_winner else p1["id"])
                
                # 2. Log to History
                await conn.execute(
                    "INSERT INTO match_history (username, opponent, result, elo_change) VALUES ($1, $2, $3, $4)",
                    winner_id, (p2["id"] if is_p1_winner else p1["id"]), "Win", w_change
                )
                await conn.execute(
                    "INSERT INTO match_history (username, opponent, result, elo_change) VALUES ($1, $2, $3, $4)",
                    (p2["id"] if is_p1_winner else p1["id"]), winner_id, "Loss", l_change
                )
                await conn.close()
                w_elo_final = new_w if is_p1_winner else new_l 
            except Exception as e:
                print(f"❌ DB Update Error: {e}")

        # Send final results
        for p in [p1, p2]:
            is_winner = (p["id"] == winner_id)
            try:
                await p["ws"].send_json({
                    "type": "MATCH_OVER",
                    "winner": winner_id or "Draw",
                    "my_new_elo": new_w if is_winner else new_l if winner_id else p["elo"],
                    "elo_change": w_change if is_winner else l_change if winner_id else "0",
                    "reason": "Forfeit" if forfeit_loser else "Completed"
                })
            except: pass

        del self.active_matches[match_id]
