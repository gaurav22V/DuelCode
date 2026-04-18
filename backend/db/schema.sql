DROP TABLE IF EXISTS test_cases CASCADE;
DROP TABLE IF EXISTS problems CASCADE;

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

COMMIT;
