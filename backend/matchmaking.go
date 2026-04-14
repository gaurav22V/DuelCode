package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

var db *sql.DB

// 1. Initialize Database Connection
func initDB() {
	var err error
	// Update user/password/dbname to match your Ubuntu Postgres setup
	connStr := "user=postgres password=yourpassword dbname=duelcode sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB Connection Error:", err)
	}
	fmt.Println("✅ Connected to PostgreSQL")
}

// 2. The Docker Execution Engine
func runInDocker(subDir string, input string) (string, error) {
	// Limits: 128MB RAM, 0.5 CPU, 2s Timeout
	cmd := exec.Command("docker", "run", "--rm",
		"-v", subDir+":/app",
		"-w", "/app",
		"--memory", "128m",
		"--cpus", ".5",
		"judge",
		"sh", "-c", "g++ solution.cpp -o out && echo '"+input+"' | timeout 2s ./out")

	output, err := cmd.CombinedOutput()
	return strings.TrimSpace(string(output)), err
}

// 3. Handling the Submission
func submitHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Hardcoded for testing - In Phase 2, this will come from the Frontend
	userCode := "#include <iostream>\nint main() { int n; std::cin >> n; std::cout << n*n; return 0; }"
	problemID := 1

	// Create unique folder for this submission
	cwd, _ := os.Getwd()
	submissionID := uuid.New().String()
	subDir := filepath.Join(cwd, "submissions", submissionID)
	os.MkdirAll(subDir, 0755)
	defer os.RemoveAll(subDir) // Clean up after running

	filePath := filepath.Join(subDir, "solution.cpp")
	os.WriteFile(filePath, []byte(userCode), 0644)

	// Fetch Test Cases from DB
	rows, _ := db.Query("SELECT input_data, expected_output FROM test_cases WHERE problem_id = $1", problemID)
	defer rows.Close()

	overallVerdict := "Accepted"
	for rows.Next() {
		var input, expected string
		rows.Scan(&input, &expected)

		actual, err := runInDocker(subDir, input)
		if err != nil {
			overallVerdict = "Runtime/Compile Error"
			break
		}
		if actual != expected {
			overallVerdict = fmt.Sprintf("Wrong Answer (Expected %s, Got %s)", expected, actual)
			break
		}
	}

	// Save submission to DB
	db.Exec("INSERT INTO submissions (problem_id, code, verdict) VALUES ($1, $2, $3)", problemID, userCode, overallVerdict)

	fmt.Fprintf(w, "DuelCode Verdict: %s", overallVerdict)
}

func main() {
	initDB()
	http.HandleFunc("/submit", submitHandler)
	fmt.Println("🚀 DuelCode Engine live at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
