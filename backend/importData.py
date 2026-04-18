import os
import json
import psycopg2

# --- 1. Database Configuration ---
DB_CONFIG = {
    "host": "localhost",
    "database": "duelcode",
    "user": "postgres",
    "password": "pw123",  # Ensure this matches your local Postgres password
    "port": "5432"
}

def import_all_problems():
    conn = None
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # Determine paths
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        problems_dir = os.path.normpath(os.path.join(backend_dir, "..", "problems"))
        
        if not os.path.exists(problems_dir):
            print(f"❌ Error: Could not find problems folder at: {problems_dir}")
            return

        # 🧹 CLEANUP: Start fresh every time we seed
        print("🧹 Cleaning existing database entries...")
        cur.execute("TRUNCATE problems CASCADE;")

        # Iterate through problem folders
        for folder_name in os.listdir(problems_dir):
            folder_path = os.path.join(problems_dir, folder_name)
            if not os.path.isdir(folder_path):
                continue

            print(f"📂 Hydrating: {folder_name}...")

            # Define internal file paths
            metadata_path = os.path.join(folder_path, "metadata.json")
            statement_path = os.path.join(folder_path, "statement.md")
            tests_path = os.path.join(folder_path, "official-tests.json")

            # Check for mandatory files
            if not all(os.path.exists(p) for p in [metadata_path, statement_path]):
                print(f"⚠️  Missing metadata or statement in {folder_name}. Skipping...")
                continue

            # 📄 Read metadata.json
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            # 📄 Read statement.md
            with open(statement_path, 'r', encoding='utf-8') as f:
                description = f.read()

            # ⚖️ GLOBAL CONSTRAINTS (Forced to 2.0s / 2.0MB)
            time_limit = 2.0
            memory_limit = 2.0
            
            # Prepare JSONB fields
            examples = json.dumps(metadata.get('examples', []))
            starter_code = json.dumps(metadata.get('starter_code', {
                "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write code here\n    return 0;\n}"
            }))

            # --- 2. Insert Problem into DB ---
            cur.execute(
                """INSERT INTO problems 
                   (title, description, difficulty, time_limit, memory_limit, examples, starter_code) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (metadata['title'], description, metadata['difficulty'], time_limit, memory_limit, examples, starter_code)
            )
            problem_id = cur.fetchone()[0]

            # --- 3. Dynamic Test Case Logic ---
            if os.path.exists(tests_path):
                with open(tests_path, 'r') as f:
                    tests = json.load(f)

                for i, test in enumerate(tests):
                    # 🎯 DYNAMIC EXTRACTION
                    # Pop the answer key (checks for 'output' or 'expected_output')
                    expected_output = test.pop('output', test.pop('expected_output', None))
                    
                    if expected_output is None:
                        print(f"⚠️  Skipping test #{i} in {folder_name}: No output found.")
                        continue

                    # 📥 DYNAMIC INPUT WRAPPING
                    # Whatever keys are left in the 'test' dict are the input
                    if len(test) == 1:
                        # If it's just one key (like 'n'), store the raw value
                        input_data = str(list(test.values())[0])
                    else:
                        # If multiple keys (like 'nums' & 'target'), store as JSON string
                        input_data = json.dumps(test)

                    cur.execute(
                        "INSERT INTO test_cases (problem_id, input_data, expected_output) VALUES (%s, %s, %s)",
                        (problem_id, input_data, str(expected_output))
                    )

        # Finalize
        conn.commit()
        print(f"\n✅ DATABASE READY: Problems and Test Cases imported successfully.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ CRITICAL ERROR: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    import_all_problems()
