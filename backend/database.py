import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "host": "localhost",
    "database": "duelcode",
    "user": "postgres", 
    "password": "pw123",
    "port": "5432"
}

def get_db_conn():
    return psycopg2.connect(**DB_CONFIG)

def get_db_cursor(conn):
    return conn.cursor(cursor_factory=RealDictCursor)

def init_db():
    """Initializes the required tables if they don't exist."""
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255),
            image VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS problems (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            difficulty VARCHAR(50)
        );
        CREATE TABLE IF NOT EXISTS test_cases (
            id SERIAL PRIMARY KEY,
            problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
            input_data TEXT NOT NULL,
            expected_output TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS submissions (
            id SERIAL PRIMARY KEY,
            problem_id INTEGER REFERENCES problems(id),
            user_id VARCHAR(100),
            verdict VARCHAR(50),
            code TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    cur.close()
    conn.close()