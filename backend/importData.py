import os
import json
import psycopg2

# --- Configuration ---
DB_CONFIG = {
    "host": "localhost",
    "database": "duelcode",
    "user": "postgres",
    "password": "pw123", 
    "port": "5432"
}

# --- Logic from Marker.java ---
# This replicates the climbingStairs logic to generate expected outputs
def calculate_climbing_stairs(n):
    if n <= 2: return max(1, n)
    a, b = 1, 2
    for _ in range(3, n + 1):
        c = a + b
        a, b = b, c
    return b

def import_all_problems():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # FIX: Since the script is in /backend, we look one level up for /problems
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        problems_dir = os.path.join(backend_dir, "..", "problems")
        
        if not os.path.exists(problems_dir):
            print(f"❌ Error: Could not find problems folder at {problems_dir}")
            return

        for folder_name in os.listdir(problems_dir):
            folder_path = os.path.join(problems_dir, folder_name)
            
            if not os.path.isdir(folder_path):
                continue

            print(f"📂 Found problem folder: {folder_name}")

            # Define paths based on your provided structure
            metadata_path = os.path.join(folder_path, "metadata.json") #
            statement_path = os.path.join(folder_path, "statement.md") #
            tests_path = os.path.join(folder_path, "official-tests.json") #

            # 1. Read metadata.json for title and difficulty
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            # 2. Read statement.md for the description
            with open(statement_path, 'r', encoding='utf-8') as f:
                description = f.read()

            # 3. Insert Problem into DB
            cur.execute(
                """INSERT INTO problems (title, description, difficulty) 
                   VALUES (%s, %s, %s) RETURNING id""",
                (metadata['title'], description, metadata['difficulty']) #
            )
            problem_id = cur.fetchone()[0]

            # 4. Read official-tests.json and calculate outputs
            with open(tests_path, 'r') as f:
                tests = json.load(f)

            for test in tests:
                n_input = test['n'] #
                # Use the logic from Marker.java to get the correct answer
                expected_output = calculate_climbing_stairs(n_input)

                cur.execute(
                    "INSERT INTO test_cases (problem_id, input_data, expected_output) VALUES (%s, %s, %s)",
                    (problem_id, str(n_input), str(expected_output))
                )

        conn.commit()
        print("\n✅ Database hydration complete!")

    except Exception as e:
        print(f"❌ Error during import: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    import_all_problems()