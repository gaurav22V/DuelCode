from passlib.context import CryptContext
from database import get_db_conn, get_db_cursor

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_user(username, email, password):
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        hashed = hash_password(password)
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
            (username, email, hashed)
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        return {"id": user_id, "username": username, "email": email}
    except Exception as e:
        conn.rollback()
        return None
    finally:
        cur.close()
        conn.close()

def authenticate_user(username, password):
    conn = get_db_conn()
    cur = get_db_cursor(conn)
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if user and verify_password(password, user['password_hash']):
        return user
    return None