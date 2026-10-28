import sqlite3
import sys

def create_students(count=20, contest_id=1000016):
    conn = sqlite3.connect('data/database.sqlite')
    cur = conn.cursor()

    print(f"Generating {count} student accounts...")
    created = []

    for i in range(1, count + 1):
        username = f"student{i:02d}"
        password = f"pass{i:02d}"
        full_name = f"O'quvchi {i}"
        
        # Check if exists
        cur.execute("SELECT id FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
        if not row:
            # Simple bcrypt or plain
            # Platform supports plain_password verification
            import bcrypt
            salt = bcrypt.gensalt()
            pwd_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            cur.execute("""
                INSERT INTO users (username, password_hash, full_name, role, plain_password)
                VALUES (?, ?, ?, 'user', ?)
            """, (username, pwd_hash, full_name, password))
            uid = cur.lastrowid
        else:
            uid = row[0]

        # Register to contest
        if contest_id:
            cur.execute("""
                INSERT OR IGNORE INTO contest_participants (contest_id, user_id, is_official)
                VALUES (?, ?, 1)
            """, (contest_id, uid))

        created.append((username, password, full_name))

    conn.commit()
    conn.close()

    print("\n" + "="*45)
    print("O'QUVCHILAR RO'YXATI (LOGIN VA PAROLLAR)")
    print("="*45)
    print(f"{'#':<4} {'Login':<15} {'Parol':<15} {'F.I.SH'}")
    print("-" * 45)
    for idx, (u, p, n) in enumerate(created, 1):
        print(f"{idx:<4} {u:<15} {p:<15} {n}")
    print("="*45)
    print(f"\nBarcha {len(created)} ta o'quvchi avtomatik tarzda musobaqaga biriktirildi!\n")

if __name__ == '__main__':
    cnt = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    create_students(cnt)
