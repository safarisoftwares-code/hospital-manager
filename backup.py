#!/usr/bin/env python3
"""
Backup System
Hospital Management System v5.0
Developer: Safari Softwares
Copyright (c) 2026 Safari Softwares
"""

import os
import sys
import subprocess
import zipfile
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

DB_NAME = os.getenv('DB_NAME', 'hospital_system')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'your_postgres_password')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
BACKUP_PATH = os.getenv('BACKUP_PATH', './backups')
RETENTION_DAYS = int(os.getenv('BACKUP_RETENTION_DAYS', 30))

def backup_database():
    print("=" * 50)
    print("  HOSPITAL SYSTEM - DATABASE BACKUP")
    print("=" * 50)
    print()

    os.makedirs(BACKUP_PATH, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    sql_file = os.path.join(BACKUP_PATH, f'hospital_backup_{timestamp}.sql')
    zip_file = os.path.join(BACKUP_PATH, f'hospital_backup_{timestamp}.zip')

    print(f"Starting backup: {timestamp}")
    print(f"Database: {DB_NAME}")

    env = os.environ.copy()
    env['PGPASSWORD'] = DB_PASSWORD

    try:
        cmd = ['pg_dump', '-h', DB_HOST, '-p', DB_PORT, '-U', DB_USER, '-F', 'p', '-f', sql_file, DB_NAME]
        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"ERROR: {result.stderr}")
            return None

        print("SQL dump created. Compressing...")

        with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(sql_file, os.path.basename(sql_file))

        os.remove(sql_file)
        
        size_mb = os.path.getsize(zip_file) / (1024 * 1024)
        print(f"Backup complete: {os.path.basename(zip_file)} ({size_mb:.2f} MB)")

        cleanup_old_backups()
        return zip_file

    except FileNotFoundError:
        print("ERROR: pg_dump not found. Is PostgreSQL installed?")
        return None
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def cleanup_old_backups():
    cutoff = datetime.now() - timedelta(days=RETENTION_DAYS)
    deleted = 0
    kept = 0

    for f in sorted(os.listdir(BACKUP_PATH)):
        if f.startswith('hospital_backup_') and f.endswith('.zip'):
            fpath = os.path.join(BACKUP_PATH, f)
            mtime = datetime.fromtimestamp(os.path.getmtime(fpath))
            if mtime < cutoff:
                os.remove(fpath)
                deleted += 1
            else:
                kept += 1

    print(f"Backups retained: {kept} (deleted: {deleted})")

if __name__ == '__main__':
    backup_database()