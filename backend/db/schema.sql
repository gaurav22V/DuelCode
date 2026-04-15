-- Connect to the database first: \c duelcode

CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(50),
    time_limit FLOAT DEFAULT 2.0,
    memory_limit INTEGER DEFAULT 128
);

CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id),
    code TEXT NOT NULL,
    verdict VARCHAR(50), -- AC, TLE, WA, RE, CE
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
