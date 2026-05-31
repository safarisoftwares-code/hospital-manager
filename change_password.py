import sqlite3
import bcrypt
import sys

DB_PATH = 'hospital.db'

if len(sys.argv) < 3:
    print("Usage: python change_password.py <username> <new_password>")
    print("Example: python change_password.py admin MyNewPass123")
    sys.exit()

username = sys.argv[1]
new_password = sys.argv[2]

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

user = cursor.execute('SELECT * FROM users WHERE username=?', (username,)).fetchone()
if not user:
    print(f"User '{username}' not found!")
    conn.close()
    sys.exit()

hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
cursor.execute('UPDATE users SET password=?, login_attempts=0, locked_until=NULL WHERE username=?', (hashed, username))
conn.commit()
conn.close()

print(f"✅ Password changed for: {username}")
print(f"   New password: {new_password}")