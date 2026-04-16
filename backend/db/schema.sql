-- Connect to postgres as superuser: sudo -u postgres psql
CREATE USER duel_admin WITH PASSWORD 'your_password';
CREATE DATABASE duelcode_db OWNER duel_admin;
GRANT ALL PRIVILEGES ON DATABASE duelcode_db TO duel_admin;

-- Connect to the new db: \c duelcode_db
CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT,
    category TEXT,
    starter_code JSONB, -- Stores the language map (C++, Java, etc.)
    test_cases JSONB,   -- Stores official-tests.json
    marker_code TEXT,   -- Stores the content of Marker.java
    metadata JSONB      -- Stores params, outputType, and functionName
);