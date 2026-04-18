import psycopg2
import json
import os

DB_URL = "postgresql://neondb_owner:npg_LjtJg9rn7IVN@ep-rapid-haze-amyw2soc-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def setup_and_seed():
    try:
        print("🔗 Connecting to cloud database...")
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        cur.execute("""
            DROP TABLE IF EXISTS match_history CASCADE;
            DROP TABLE IF EXISTS test_cases CASCADE;
            DROP TABLE IF EXISTS problems CASCADE;
            DROP TABLE IF EXISTS users CASCADE;

            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                elo INTEGER DEFAULT 1200
            );

            CREATE TABLE problems (
                id SERIAL PRIMARY KEY,
                problem_slug TEXT UNIQUE,
                title TEXT NOT NULL,
                description TEXT,
                starter_code JSONB
            );

            CREATE TABLE test_cases (
                id SERIAL PRIMARY KEY,
                problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
                input_data JSONB,
                expected_output JSONB
            );

            CREATE TABLE match_history (
                id SERIAL PRIMARY KEY,
                username TEXT REFERENCES users(username) ON DELETE CASCADE,
                opponent TEXT,
                result TEXT,
                elo_change TEXT,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("👤 Seeding Dummy Leaderboard Users...")
        dummy_users = [
            ("boss@duelcode.com", "Faker", 2500),
            ("tourist@duelcode.com", "Tourist", 2450),
            ("gaurav@duelcode.com", "Gaurav_Pro", 1800),
            ("noob@duelcode.com", "CodeNoob", 1100)
        ]
        for email, name, elo in dummy_users:
            cur.execute("INSERT INTO users (email, username, elo) VALUES (%s, %s, %s)", (email, name, elo))

        print("🌱 Seeding Multi-Problem Set...")
        problems = [
            {
                "slug": "add-two-numbers",
                "title": "Add Two Numbers",
                "description": "Given two integers a and b, return their sum.",
                "starter": {"cpp": "class Solution {\npublic:\n    int solve(int a, int b) {\n        return 0;\n    }\n};"},
                "tests": [{"inp": {"a": 5, "b": 3}, "out": 8}, {"inp": {"a": -2, "b": 2}, "out": 0}]
            },
            {
                "slug": "find-max",
                "title": "Find the Maximum",
                "description": "Given two integers a and b, return the strictly greater value. If equal, return a.",
                "starter": {"cpp": "class Solution {\npublic:\n    int solve(int a, int b) {\n        return 0;\n    }\n};"},
                "tests": [{"inp": {"a": 10, "b": 20}, "out": 20}, {"inp": {"a": 5, "b": 5}, "out": 5}]
            },
            {
                "slug": "multiply-numbers",
                "title": "Product of Two",
                "description": "Given integers a and b, return their product.",
                "starter": {"cpp": "class Solution {\npublic:\n    int solve(int a, int b) {\n        return 0;\n    }\n};"},
                "tests": [{"inp": {"a": 5, "b": 5}, "out": 25}, {"inp": {"a": 10, "b": 0}, "out": 0}]
            }
        ]

        for p in problems:
            cur.execute(
                "INSERT INTO problems (problem_slug, title, description, starter_code) VALUES (%s, %s, %s, %s) RETURNING id",
                (p["slug"], p["title"], p["description"], json.dumps(p["starter"]))
            )
            p_id = cur.fetchone()[0]
            for t in p["tests"]:
                cur.execute(
                    "INSERT INTO test_cases (problem_id, input_data, expected_output) VALUES (%s, %s, %s)",
                    (p_id, json.dumps(t["inp"]), json.dumps(t["out"]))
                )

        conn.commit()
        print("✅ Cloud Database successfully seeded for deployment!")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    setup_and_seed()
