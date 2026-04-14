package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	_ "github.com/lib/pq"
)

var (
	db       *sql.DB
	upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}
	manager  = MatchManager{Queue: make([]*Client, 0)}
)

type Client struct {
	ID   string
	Conn *websocket.Conn
}

type MatchManager struct {
	Queue      []*Client
	QueueMutex sync.Mutex
}

type SubmissionRequest struct {
	ProblemID int    `json:"problemId"`
	Code      string `json:"code"`
}

func initDB() {
	var err error
	// Double check these credentials match Step 3 from the previous message
	connStr := "host=localhost port=5432 user=postgres password=pw123 dbname=duelcode sslmode=disable"
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("❌ Could not open DB: %v", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatalf("❌ Could not ping DB: %v", err)
	}
	fmt.Println("✅ DB Connected Successfully")
}

func runJudge(userCode string, problemID int) string {
	cwd, _ := os.Getwd()
	subID := uuid.New().String()
	subDir := filepath.Join(cwd, "submissions", subID)
	
	err := os.MkdirAll(subDir, 0755)
	if err != nil {
		return fmt.Sprintf("Error creating folder: %v", err)
	}
	defer os.RemoveAll(subDir)

	os.WriteFile(filepath.Join(subDir, "solution.cpp"), []byte(userCode), 0644)

	// SAFETY CHECK: Don't panic if query fails
	rows, err := db.Query("SELECT input_data, expected_output FROM test_cases WHERE problem_id = $1", problemID)
	if err != nil {
		return fmt.Sprintf("DB Query Error: %v", err)
	}
	defer rows.Close()

	testCount := 0
	for rows.Next() {
		testCount++
		var in, out string
		if err := rows.Scan(&in, &out); err != nil {
			return "Error reading test cases"
		}

		cmd := exec.Command("docker", "run", "--rm", "-v", subDir+":/app", "-w", "/app", "--memory", "128m", "--cpus", ".5", "judge", "sh", "-c", "g++ solution.cpp -o out && echo '"+in+"' | timeout 2s ./out")
		res, _ := cmd.CombinedOutput()
		
		if strings.TrimSpace(string(res)) != out {
			return fmt.Sprintf("Wrong Answer on Test %d", testCount)
		}
	}

	if testCount == 0 {
		return "Error: No test cases found for this problem ID"
	}

	return "Accepted"
}

func submitHandler(w http.ResponseWriter, r *http.Request) {
	// CORS Headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if r.Method == "OPTIONS" { return }

	var req SubmissionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Println("❌ Error decoding JSON:", err)
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fmt.Printf("🚀 Running Judge for Problem %d...\n", req.ProblemID)
	verdict := runJudge(req.Code, req.ProblemID)
	
	fmt.Printf("🏁 Verdict: %s\n", verdict)
	
	_, err := db.Exec("INSERT INTO submissions (problem_id, code, verdict) VALUES ($1, $2, $3)", req.ProblemID, req.Code, verdict)
	if err != nil {
		fmt.Println("⚠️ Could not save submission to DB:", err)
	}

	fmt.Fprintf(w, verdict)
}

func handleMatchmake(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil { return }
	client := &Client{ID: uuid.New().String(), Conn: conn}
	defer func() {
		manager.RemoveFromQueue(client.ID)
		conn.Close()
	}()
	manager.AddToQueue(client)
	for { if _, _, err := conn.ReadMessage(); err != nil { break } }
}

func (m *MatchManager) AddToQueue(c *Client) {
	m.QueueMutex.Lock()
	m.Queue = append(m.Queue, c)
	m.QueueMutex.Unlock()
	m.TryMatch()
}

func (m *MatchManager) RemoveFromQueue(id string) {
	m.QueueMutex.Lock()
	defer m.QueueMutex.Unlock()
	for i, c := range m.Queue {
		if c.ID == id {
			m.Queue = append(m.Queue[:i], m.Queue[i+1:]...)
			break
		}
	}
}

func (m *MatchManager) TryMatch() {
	m.QueueMutex.Lock()
	defer m.QueueMutex.Unlock()
	if len(m.Queue) >= 2 {
		p1, p2 := m.Queue[0], m.Queue[1]
		m.Queue = m.Queue[2:]
		msg := map[string]string{"type": "MATCH_FOUND", "problemId": "1"}
		p1.Conn.WriteJSON(msg)
		p2.Conn.WriteJSON(msg)
	}
}

func main() {
	initDB()
	http.HandleFunc("/submit", submitHandler)
	http.HandleFunc("/ws/matchmake", handleMatchmake)
	fmt.Println("🔥 DuelCode Backend listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
