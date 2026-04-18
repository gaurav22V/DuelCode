import asyncio
import tempfile
import os
import json
import asyncpg

# Use environment variable for production, fallback for local testing
DB_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_LjtJg9rn7IVN@ep-rapid-haze-amyw2soc-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

# --- 1. THE STANDARD TEST RUNNER (Against hidden DB cases) ---
async def evaluate_code(user_code: str, problem_slug: str, is_submit: bool) -> dict:
    if not user_code.strip():
        return {"status": "Compilation Error", "details": "Code cannot be empty."}

    try:
        conn = await asyncpg.connect(DB_URL)
        tests = await conn.fetch("SELECT input_data, expected_output FROM test_cases WHERE problem_id = (SELECT id FROM problems WHERE problem_slug = $1)", problem_slug)
        await conn.close()
    except Exception as e:
        return {"status": "Internal Error", "details": f"DB Error: {e}"}

    if not tests: 
        return {"status": "Internal Error", "details": "No tests found in DB for this problem."}

    # Standardized to sol.solve() to match our seeded problem data
    harness = f"""#include <iostream>\nusing namespace std;\n{user_code}\nint main() {{\n    Solution sol;\n"""
    for i, test in enumerate(tests):
        inp = test['input_data'] if isinstance(test['input_data'], dict) else json.loads(test['input_data'])
        harness += f"    cout << \"RES_\" << {i} << \":\" << sol.solve({inp['a']}, {inp['b']}) << endl;\n"
    harness += "return 0; }"

    return await _compile_and_run(harness, tests)


# --- 2. THE CUSTOM INPUT RUNNER (For debugging) ---
async def evaluate_custom(user_code: str, custom_input: str) -> dict:
    if not user_code.strip():
        return {"status": "Compilation Error", "details": "Code cannot be empty."}
    
    try:
        # Expecting JSON like: {"a": 10, "b": 5}
        inp = json.loads(custom_input)
        a, b = inp.get('a', 0), inp.get('b', 0)
    except json.JSONDecodeError:
        return {"status": "Error", "details": "Invalid JSON in custom input. Use format: {\"a\": 5, \"b\": 10}"}

    # FIXED: Changed sol.add to sol.solve to maintain consistency
    harness = f"""#include <iostream>\nusing namespace std;\n{user_code}\nint main() {{\n    Solution sol;\n    cout << sol.solve({a}, {b}) << endl;\n    return 0;\n}}"""

    with tempfile.TemporaryDirectory() as tmp:
        cpp_path = os.path.join(tmp, "sol.cpp")
        exe_path = os.path.join(tmp, "a.out")
        with open(cpp_path, "w") as f: f.write(harness)

        comp = await asyncio.create_subprocess_exec("g++", cpp_path, "-o", exe_path, stderr=asyncio.subprocess.PIPE)
        _, stderr = await comp.communicate()
        if comp.returncode != 0: 
            return {"status": "Compilation Error", "details": stderr.decode()[:500]}

        try:
            run = await asyncio.create_subprocess_exec(exe_path, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(run.communicate(), timeout=2.0)
            if run.returncode != 0: 
                return {"status": "Runtime Error", "details": stderr.decode()[:500]}
            return {"status": "Success", "details": f"Raw Output:\n{stdout.decode().strip()}"}
        except asyncio.TimeoutExpired:
            return {"status": "Time Limit Exceeded", "details": "Execution exceeded 2.0s sandbox limit."}

# --- 3. HELPER: COMPILE & RUN FOR DB TESTS ---
async def _compile_and_run(harness: str, tests: list) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        cpp_path, exe_path = os.path.join(tmp, "sol.cpp"), os.path.join(tmp, "a.out")
        with open(cpp_path, "w") as f: f.write(harness)

        # Build step
        comp = await asyncio.create_subprocess_exec("g++", cpp_path, "-o", exe_path, stderr=asyncio.subprocess.PIPE)
        _, stderr = await comp.communicate()
        if comp.returncode != 0: 
            return {"status": "Compilation Error", "details": stderr.decode()[:500]}

        # Run step with resource timeout
        try:
            run = await asyncio.create_subprocess_exec(exe_path, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            stdout, stderr = await asyncio.wait_for(run.communicate(), timeout=2.0)
            if run.returncode != 0: 
                return {"status": "Runtime Error", "details": stderr.decode()[:500]}

            outputs = stdout.decode().strip().split('\n')
            for i, line in enumerate(outputs):
                if ":" not in line: continue
                actual = line.split(":", 1)[1].strip()
                exp_raw = tests[i]['expected_output']
                # Handles both raw integers and JSON-stringified results
                expected = str(exp_raw if isinstance(exp_raw, int) else json.loads(exp_raw))
                if actual != expected:
                    return {
                        "status": "Wrong Answer", 
                        "details": f"Test {i+1} Failed.\nExpected: {expected}\nGot: {actual}"
                    }
            return {"status": "Accepted", "details": f"Passed all {len(tests)} test cases!"}
        except asyncio.TimeoutExpired:
            return {"status": "Time Limit Exceeded", "details": "Execution exceeded 2.0s sandbox limit."}
