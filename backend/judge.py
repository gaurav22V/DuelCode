import subprocess
import os
import uuid
import json
import shutil
from database import get_db_conn

def run_judge(user_code: str, problem_id: int):
    sub_id = str(uuid.uuid4())
    sub_dir = os.path.join(os.getcwd(), "submissions", sub_id)
    os.makedirs(sub_dir, exist_ok=True)
    
    with open(os.path.join(sub_dir, "solution.cpp"), "w") as f:
        f.write(user_code)

    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute("SELECT input_data, expected_output FROM test_cases WHERE problem_id = %s", (problem_id,))
        test_cases = cur.fetchall()

        for idx, (inp_json, expected) in enumerate(test_cases):
            inp_dict = json.loads(inp_json)
            raw_input = "\n".join(str(v) for v in inp_dict.values())

            # Linux Docker command with TLE (timeout) and MLE (--memory) limits
            cmd = [
                "docker", "run", "--rm",
                "--memory", "256m",
                "-v", f"{sub_dir}:/app", "-w", "/app",
                "judge", "sh", "-c", 
                f"g++ solution.cpp -o out && echo '{raw_input}' | timeout 2s ./out"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 124: return "TLE"
            if "Killed" in result.stderr: return "MLE"
            if result.stderr and not result.stdout: return "Compile Error"
            if result.stdout.strip() != expected.strip(): return f"WA (Test {idx+1})"

        return "Accepted"
    finally:
        shutil.rmtree(sub_dir, ignore_errors=True)
        cur.close()
        conn.close()