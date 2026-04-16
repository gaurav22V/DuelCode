import os
import json
import psycopg2
from psycopg2.extras import Json

# DB Credentials
DB_CONFIG = {
    "dbname": "duelcode",
    "user": "postgres",
    "password": "pw123",
    "host": "127.0.0.1",
    "port": "5432"
}

# Path Logic: seed.py is in backend/db/. Project root is two levels up.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROBLEMS_DIR = os.path.join(BASE_DIR, "problems")

def populate_problems():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Iterate through all folders in /problems/
    for folder_name in os.listdir(PROBLEMS_DIR):
        folder_path = os.path.join(PROBLEMS_DIR, folder_name)
        if not os.path.isdir(folder_path): continue

        try:
            # 1. Read metadata.json (ID, Title, Starter Code)
            with open(os.path.join(folder_path, "metadata.json"), "r") as f:
                meta = json.load(f)

            # 2. Read statement.md (Problem Description)
            with open(os.path.join(folder_path, "statement.md"), "r") as f:
                description = f.read()

            # 3. Read official-tests.json (Judge Test Suite)
            with open(os.path.join(folder_path, "official-tests.json"), "r") as f:
                official_tests = json.load(f)

            # 4. Read Marker.java (Reference Solution)
            with open(os.path.join(folder_path, "Marker.java"), "r") as f:
                marker_code = f.read()

            # UPSERT: Insert or Update if ID exists
            cur.execute("""
                INSERT INTO problems (id, title, description, difficulty, category, starter_code, test_cases, marker_code, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    description = EXCLUDED.description,
                    starter_code = EXCLUDED.starter_code,
                    test_cases = EXCLUDED.test_cases,
                    marker_code = EXCLUDED.marker_code;
            """, (
                meta['id'],
                meta['title'],
                description,
                meta['difficulty'],
                meta['category'],
                Json(meta['starterCode']),
                Json(official_tests),
                marker_code,
                Json({
                    "functionName": meta['functionName'],
                    "params": meta['params'],
                    "outputType": meta['outputType']
                })
            ))
            print(f"✅ Seeded: {meta['title']}")

        except Exception as e:
            print(f"❌ Failed to seed {folder_name}: {e}")

    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    populate_problems()