#!/usr/bin/env python3
"""
Hospital Management System v5.1 - Complete Backend
Real Hospital Workflow Edition
Developer: Safari Softwares
Copyright (c) 2026 Safari Softwares
All Rights Reserved

Features:
- Patient "Home Base" concept (primary location preserved)
- Ward referrals to Lab/Radiology with orders
- Consolidated patient view with ALL department data
- Cashier sees ALL bills with payment methods (Cash/SHA/Insurance)
- No fixed charges - all amounts entered by departments
- Complete audit trail
- 22 Modules fully supported
- Appointment Scheduling
- Triage Acuity Scoring (NEWS2/MEWS)
- Ward Rounds & Vitals Charting
- Digital Prescriptions
- Pharmacy Inventory & Expiry Tracking
- Lab Requisition Forms
- Real-Time Bed Board
- Maternity, Dental, Eye Modules
"""

import os
import ssl
import json
import random
import string
import sqlite3
import csv
import io
import shutil
import tempfile
from datetime import datetime, timedelta
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
import bcrypt

# ============================================================================
# CONFIGURATION
# ============================================================================

load_dotenv()

app = Flask(__name__, static_folder='public', static_url_path='')
app.secret_key = os.getenv('SESSION_SECRET', 'change-this-secret-key-to-something-random')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=int(os.getenv('SESSION_MAX_HOURS', 12)))

CORS(app, supports_credentials=True)

DB_PATH = os.path.join(os.path.dirname(__file__), 'hospital.db')


# ============================================================================
# DATABASE HELPERS
# ============================================================================

def get_db():
    """Create and return a new database connection with WAL mode."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def query(sql, params=None, fetchone=False, fetchall=False):
    """Execute a SQL query with parameters and return results."""
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        if fetchone:
            result = cursor.fetchone()
        elif fetchall:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = None
        cursor.close()
        return result
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()


def dict_from_row(row):
    """Convert sqlite3.Row to plain dictionary."""
    if row is None:
        return None
    return dict(row)


def parse_date(date_str):
    """Parse DD/MM/YYYY or YYYY-MM-DD to standard format."""
    if not date_str:
        return None
    date_str = str(date_str).strip()
    if '/' in date_str:
        parts = date_str.split('/')
        if len(parts) == 3:
            try:
                day = int(parts[0])
                month = int(parts[1])
                year = int(parts[2])
                return f"{year:04d}-{month:02d}-{day:02d}"
            except (ValueError, TypeError):
                pass
    if '-' in date_str and len(date_str) >= 10:
        return date_str[:10]
    return date_str


def require_auth(f):
    """Decorator that requires user authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'error': 'Authentication required. Please login first.'}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Decorator that requires specific role(s). Admin always has access."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user' not in session:
                return jsonify({'error': 'Authentication required.'}), 401
            user_role = session['user']['role']
            if user_role not in roles and user_role != 'admin':
                return jsonify({'error': 'Insufficient permissions.'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# ============================================================================
# DATABASE MIGRATIONS
# ============================================================================

def ensure_payment_method_column():
    """Add payment_method column to billing_items if it doesn't exist."""
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(billing_items)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'payment_method' not in columns:
            cursor.execute("ALTER TABLE billing_items ADD COLUMN payment_method TEXT DEFAULT 'Cash'")
            conn.commit()
            print("      Added payment_method column to billing_items table.")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"      Migration note: {e}")


def ensure_new_tables():
    """Create new tables for v5.1 modules if they don't exist."""
    tables = {
        'appointments': '''CREATE TABLE IF NOT EXISTS appointments (
            appointment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER REFERENCES patients(patient_id),
            doctor_id INTEGER REFERENCES users(user_id),
            appointment_date TEXT NOT NULL,
            appointment_time TEXT,
            reason TEXT,
            status TEXT DEFAULT "scheduled",
            notes TEXT,
            created_by INTEGER REFERENCES users(user_id),
            created_at TEXT,
            updated_at TEXT
        )''',
        'expenses': '''CREATE TABLE IF NOT EXISTS expenses (
            expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            amount REAL NOT NULL,
            recorded_by INTEGER REFERENCES users(user_id),
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )''',
        'ward_rounds': '''CREATE TABLE IF NOT EXISTS ward_rounds (
            round_id INTEGER PRIMARY KEY AUTOINCREMENT,
            visit_id INTEGER REFERENCES visits(visit_id),
            patient_id INTEGER REFERENCES patients(patient_id),
            recorded_by INTEGER REFERENCES users(user_id),
            temperature REAL,
            blood_pressure TEXT,
            heart_rate INTEGER,
            spo2 REAL,
            respiratory_rate INTEGER,
            blood_sugar REAL,
            pain_score INTEGER,
            medication_given TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )''',
        'prescriptions': '''CREATE TABLE IF NOT EXISTS prescriptions (
            prescription_id INTEGER PRIMARY KEY AUTOINCREMENT,
            visit_id INTEGER REFERENCES visits(visit_id),
            patient_id INTEGER REFERENCES patients(patient_id),
            doctor_id INTEGER REFERENCES users(user_id),
            drug_name TEXT NOT NULL,
            dosage TEXT,
            frequency TEXT,
            duration TEXT,
            route TEXT,
            instructions TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )''',
        'lab_panels': '''CREATE TABLE IF NOT EXISTS lab_panels (
            panel_id INTEGER PRIMARY KEY AUTOINCREMENT,
            panel_name TEXT NOT NULL,
            tests_included TEXT,
            department TEXT DEFAULT 'laboratory',
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )''',
        'maternity_records': '''CREATE TABLE IF NOT EXISTS maternity_records (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER REFERENCES patients(patient_id),
            visit_id INTEGER REFERENCES visits(visit_id),
            record_type TEXT,
            gravida INTEGER,
            para INTEGER,
            lmp TEXT,
            edd TEXT,
            delivery_date TEXT,
            delivery_type TEXT,
            birth_weight REAL,
            apgar_score TEXT,
            complications TEXT,
            notes TEXT,
            created_by INTEGER REFERENCES users(user_id),
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )''',
        'dental_records': '''CREATE TABLE IF NOT EXISTS dental_records (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER REFERENCES patients(patient_id),
            visit_id INTEGER REFERENCES visits(visit_id),
            tooth_number TEXT,
            procedure_type TEXT,
            findings TEXT,
            treatment_done TEXT,
            notes TEXT,
            created_by INTEGER REFERENCES users(user_id),
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )''',
        'eye_records': '''CREATE TABLE IF NOT EXISTS eye_records (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER REFERENCES patients(patient_id),
            visit_id INTEGER REFERENCES visits(visit_id),
            right_eye_vision TEXT,
            left_eye_vision TEXT,
            right_eye_pressure REAL,
            left_eye_pressure REAL,
            refraction_right TEXT,
            refraction_left TEXT,
            diagnosis TEXT,
            treatment TEXT,
            notes TEXT,
            created_by INTEGER REFERENCES users(user_id),
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )'''
    }
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        for table_name, create_sql in tables.items():
            cursor.execute(create_sql)
        conn.commit()
        cursor.close()
        conn.close()
        print("      All v5.1 tables verified/created.")
    except Exception as e:
        print(f"      Migration note: {e}")


# Run migrations on startup
ensure_payment_method_column()
ensure_new_tables()


# ============================================================================
# AUTHENTICATION ROUTES
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate a user with username and password. ACCOUNT LOCKOUT DISABLED."""
    try:
        data = request.get_json()
        username = data.get('username', '').strip().lower()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'success': False, 'message': 'Username and password are required.'})
        if len(username) > 50 or len(password) > 100:
            return jsonify({'success': False, 'message': 'Invalid input length.'})

        user = query('SELECT * FROM users WHERE username = ? AND is_active = 1', (username,), fetchone=True)
        if not user:
            return jsonify({'success': False, 'message': 'Invalid username or password.'})

        locked = user['locked_until']
        if locked is not None and locked != '':
            if locked > datetime.now().strftime('%Y-%m-%d %H:%M:%S'):
                return jsonify({'success': False, 'message': 'Account temporarily locked.'})

        if not bcrypt.checkpw(password.encode(), user['password'].encode()):
            attempts = (user['login_attempts'] or 0) + 1
            query('UPDATE users SET login_attempts = ? WHERE user_id = ?', (attempts, user['user_id']))
            return jsonify({'success': False, 'message': 'Invalid username or password.'})

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query('UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = ? WHERE user_id = ?',
              (current_time, user['user_id']))

        session['user'] = {
            'user_id': user['user_id'], 'username': user['username'],
            'full_name': user['full_name'], 'role': user['role'],
            'department_name': user['department_name'] or ''
        }
        return jsonify({'success': True, 'user': session['user']})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully.'})


@app.route('/api/auth/me')
def me():
    if 'user' in session:
        return jsonify({'authenticated': True, 'user': session['user']})
    return jsonify({'authenticated': False})


@app.route('/api/change-password', methods=['POST'])
@require_auth
def change_password():
    try:
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        if not current_password or not new_password:
            return jsonify({'success': False, 'message': 'Both passwords required.'})
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'Min 6 characters.'})
        user = query('SELECT * FROM users WHERE user_id = ?', (session['user']['user_id'],), fetchone=True)
        if not bcrypt.checkpw(current_password.encode(), user['password'].encode()):
            return jsonify({'success': False, 'message': 'Current password incorrect.'})
        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
        query('UPDATE users SET password = ? WHERE user_id = ?', (hashed, session['user']['user_id']))
        return jsonify({'success': True, 'message': 'Password changed!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# PATIENT ROUTES
# ============================================================================

@app.route('/api/patients', methods=['POST'])
@require_role('registration')
def create_patient():
    try:
        data = request.get_json()
        first_name = str(data.get('first_name', '')).strip()[:100]
        last_name = str(data.get('last_name', '')).strip()[:100]
        if not first_name or not last_name:
            return jsonify({'success': False, 'error': 'Name required.'})
        date_of_birth = parse_date(data.get('date_of_birth', ''))
        national_id = str(data.get('national_id', '')).strip()[:50]
        if not national_id:
            return jsonify({'success': False, 'error': 'National ID required.'})
        existing = query('SELECT * FROM patients WHERE national_id = ?', (national_id,), fetchone=True)
        if existing:
            ex = dict_from_row(existing)
            return jsonify({'success': True, 'patient_id': ex['patient_id'], 'patient': ex, 'existing': True,
                          'message': 'Patient already registered.'})
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query('''INSERT INTO patients (first_name, last_name, date_of_birth, gender, phone, address,
               national_id, emergency_contact, emergency_phone, blood_group, allergies, chronic_conditions,
               created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
              (first_name, last_name, date_of_birth, data.get('gender'), str(data.get('phone',''))[:30],
               str(data.get('address',''))[:200], national_id, str(data.get('emergency_contact',''))[:100],
               str(data.get('emergency_phone',''))[:30], data.get('blood_group'),
               str(data.get('allergies',''))[:200], str(data.get('chronic_conditions',''))[:200],
               current_time, current_time))
        new_id = query('SELECT last_insert_rowid() as id', fetchone=True)['id']
        patient = dict_from_row(query('SELECT * FROM patients WHERE patient_id = ?', (new_id,), fetchone=True))
        return jsonify({'success': True, 'patient_id': new_id, 'patient': patient, 'existing': False})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/patients/search')
@require_auth
def search_patients():
    try:
        search_query = str(request.args.get('q', '')).strip()[:50]
        if len(search_query) < 2:
            return jsonify([])
        like_pattern = f'%{search_query}%'
        results = query('''SELECT * FROM patients WHERE first_name LIKE ? OR last_name LIKE ?
                        OR national_id LIKE ? OR phone LIKE ? ORDER BY created_at DESC LIMIT 30''',
                       (like_pattern, like_pattern, like_pattern, like_pattern), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients/<int:pid>')
@require_auth
def get_patient(pid):
    try:
        result = query('SELECT * FROM patients WHERE patient_id = ?', (pid,), fetchone=True)
        if not result:
            return jsonify({'error': 'Patient not found.'}), 404
        return jsonify(dict_from_row(result))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/patients/<int:pid>', methods=['PUT'])
@require_auth
def update_patient(pid):
    try:
        data = request.get_json()
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query('''UPDATE patients SET first_name=?, last_name=?, phone=?, address=?,
               emergency_contact=?, emergency_phone=?, blood_group=?, allergies=?,
               chronic_conditions=?, updated_at=? WHERE patient_id=?''',
              (str(data.get('first_name',''))[:100], str(data.get('last_name',''))[:100],
               str(data.get('phone',''))[:30], str(data.get('address',''))[:200],
               str(data.get('emergency_contact',''))[:100], str(data.get('emergency_phone',''))[:30],
               data.get('blood_group'), str(data.get('allergies',''))[:200],
               str(data.get('chronic_conditions',''))[:200], current_time, pid))
        updated = dict_from_row(query('SELECT * FROM patients WHERE patient_id = ?', (pid,), fetchone=True))
        return jsonify({'success': True, 'patient': updated, 'message': 'Patient updated.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
    # ============================================================================
# VISIT ROUTES - WITH HOME BASE CONCEPT
# ============================================================================

@app.route('/api/register-and-visit', methods=['POST'])
@require_role('registration')
def register_and_visit():
    """ONE-STEP registration: Creates patient (or finds existing) AND creates visit."""
    try:
        data = request.get_json()
        first = str(data.get('first_name', '')).strip()[:100]
        last = str(data.get('last_name', '')).strip()[:100]
        nid = str(data.get('national_id', '')).strip()[:50]

        if not first or not last:
            return jsonify({'success': False, 'error': 'First and last name required.'})
        if not nid:
            return jsonify({'success': False, 'error': 'National ID / Birth Certificate required.'})

        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT * FROM patients WHERE national_id = ?', (nid,))
        patient = cur.fetchone()

        if patient:
            pid = patient['patient_id']
            existing = True
        else:
            dob = parse_date(data.get('date_of_birth', ''))
            now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            cur.execute('''INSERT INTO patients (first_name,last_name,date_of_birth,gender,phone,address,
                         national_id,emergency_contact,emergency_phone,blood_group,allergies,chronic_conditions,
                         created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                      (first, last, dob, data.get('gender'), str(data.get('phone',''))[:30],
                       str(data.get('address',''))[:200], nid, str(data.get('emergency_contact',''))[:100],
                       str(data.get('emergency_phone',''))[:30], data.get('blood_group'),
                       str(data.get('allergies',''))[:200], str(data.get('chronic_conditions',''))[:200], now, now))
            pid = cur.lastrowid
            existing = False

        conn.commit()
        cur.close()
        conn.close()

        active = query(
            '''SELECT * FROM visits WHERE patient_id = ? AND patient_cleared = 0 AND morgue_completed = 0''',
            (pid,), fetchone=True
        )
        if active:
            return jsonify({
                'success': True, 'message': 'Active visit already exists.',
                'visit': dict_from_row(active), 'already_active': True
            })

        conn2 = get_db()
        cur2 = conn2.cursor()
        vn = 'VIS-' + datetime.now().strftime('%y%m%d') + '-' + ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=4))
        fp = 1 if data.get('registration_fee_paid', False) else 0
        fa = float(data.get('registration_fee_amount', 200))
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cur2.execute('''INSERT INTO visits (patient_id,visit_number,registration_fee_paid,registration_fee_amount,
                     registration_by,registration_completed,registration_completed_at,created_at,updated_at)
                     VALUES (?,?,?,?,?,1,?,?,?)''',
                  (pid, vn, fp, fa, session['user']['user_id'], now, now, now))
        vid = cur2.lastrowid

        cur2.execute('''INSERT INTO visit_history (visit_id,patient_id,from_department,to_department,
                     action_by,action_name,notes) VALUES (?,?,?,?,?,?,?)''',
                  (vid, pid, 'OUTSIDE', 'REGISTRATION', session['user']['user_id'], 'Patient Registered',
                   'Fee: KES '+str(fa)+(' (Paid)' if fp else ' (Pending)')))

        cur2.execute('''INSERT INTO billing_items (visit_id,patient_id,item_description,department,amount,
                     is_paid,paid_at,paid_by,payment_method) VALUES (?,?,?,?,?,?,?,?,?)''',
                  (vid, pid, 'Registration Fee', 'registration', fa, fp,
                   now if fp else None, session['user']['user_id'] if fp else None, 'Cash' if fp else None))

        conn2.commit()
        cur2.execute('''SELECT v.*, p.first_name, p.last_name, p.gender, p.date_of_birth, p.national_id,
                     p.phone, p.address, p.blood_group, p.allergies, p.chronic_conditions,
                     p.emergency_contact, p.emergency_phone
                     FROM visits v JOIN patients p ON v.patient_id = p.patient_id
                     WHERE v.visit_id = ?''', (vid,))
        result = cur2.fetchone()
        cur2.close()
        conn2.close()

        return jsonify({'success': True, 'visit': dict_from_row(result), 'already_active': False})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/visits', methods=['POST'])
@require_role('registration')
def create_visit():
    """Create a new visit for an existing patient."""
    try:
        data = request.get_json()
        patient_id = int(data.get('patient_id', 0))
        fp = 1 if data.get('registration_fee_paid', False) else 0
        fa = float(data.get('registration_fee_amount', 200))
        now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        active = query(
            'SELECT * FROM visits WHERE patient_id = ? AND patient_cleared = 0 AND morgue_completed = 0',
            (patient_id,), fetchone=True
        )
        if active:
            return jsonify({
                'success': True, 'message': 'Patient already has an active visit.',
                'visit': dict_from_row(active), 'already_active': True
            })

        vn = 'VIS-' + datetime.now().strftime('%y%m%d') + '-' + ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=4))

        conn = get_db()
        cur = conn.cursor()
        cur.execute('''INSERT INTO visits (patient_id,visit_number,registration_fee_paid,registration_fee_amount,
                     registration_by,registration_completed,registration_completed_at,created_at,updated_at)
                     VALUES (?,?,?,?,?,1,?,?,?)''',
                  (patient_id, vn, fp, fa, session['user']['user_id'], now, now, now))
        vid = cur.lastrowid

        cur.execute('''INSERT INTO visit_history (visit_id,patient_id,from_department,to_department,
                     action_by,action_name,notes) VALUES (?,?,?,?,?,?,?)''',
                  (vid, patient_id, 'OUTSIDE', 'REGISTRATION', session['user']['user_id'],
                   'Visit Created', 'Fee: KES '+str(fa)+(' (Paid)' if fp else ' (Pending)')))

        if fp and fa > 0:
            cur.execute('''INSERT INTO billing_items (visit_id,patient_id,item_description,department,amount,
                         is_paid,paid_at,paid_by,payment_method) VALUES (?,?,?,?,?,?,?,?,?)''',
                      (vid, patient_id, 'Registration Fee', 'registration', fa, 1,
                       now, session['user']['user_id'], 'Cash'))

        conn.commit()
        cur.execute('''SELECT v.*, p.first_name, p.last_name, p.gender, p.date_of_birth, p.national_id,
                     p.phone, p.address, p.blood_group, p.allergies, p.chronic_conditions,
                     p.emergency_contact, p.emergency_phone
                     FROM visits v JOIN patients p ON v.patient_id = p.patient_id
                     WHERE v.visit_id = ?''', (vid,))
        result = cur.fetchone()
        cur.close()
        conn.close()

        return jsonify({'success': True, 'visit': dict_from_row(result), 'already_active': False})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/visits/<int:vid>/send-to-triage', methods=['POST'])
@require_role('registration')
def send_to_triage(vid):
    """Transfer patient from Registration to Triage department."""
    try:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query('''UPDATE visits SET current_department = ?, status = ?,
               registration_completed = 1, updated_at = ? WHERE visit_id = ?''',
              ('triage', 'in_triage', current_time, vid))
        query('''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
               action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
              ('registration', 'triage', session['user']['user_id'], 'Sent to Triage',
               'Patient sent for triage assessment', vid))
        return jsonify({'success': True, 'message': 'Patient sent to Triage successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/visits/<int:vid>/confirm-patient', methods=['POST'])
@require_auth
def confirm_patient(vid):
    """Confirm patient identity at any department."""
    try:
        data = request.get_json()
        field_name = session['user']['role'] + '_confirmed_patient'
        confirmed = 1 if data.get('confirmed', False) else 0
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        try:
            query('UPDATE visits SET ' + field_name + ' = ?, updated_at = ? WHERE visit_id = ?',
                  (confirmed, current_time, vid))
        except:
            pass
        query('''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
               action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
              (session['user']['role'], session['user']['role'], session['user']['user_id'],
               'Patient Identity Confirmed', 'Confirmed by ' + session['user']['full_name'], vid))
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/visits/<int:vid>/transfer', methods=['POST'])
@require_auth
def transfer_patient(vid):
    """Transfer patient between departments with Home Base concept."""
    try:
        data = request.get_json()
        to_department = data.get('to_department', '')
        notes = data.get('notes', '')
        complete_department = data.get('complete_department', False)
        keep_home_base = data.get('keep_home_base', False)
        from_department = session['user']['role']
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        if complete_department:
            completed_field = from_department + '_completed'
            completed_at_field = from_department + '_completed_at'
            completed_by_field = from_department + '_by'
            query(
                'UPDATE visits SET ' + completed_field + ' = 1, ' +
                completed_at_field + ' = ?, ' + completed_by_field + ' = ?, updated_at = ? WHERE visit_id = ?',
                (current_time, session['user']['user_id'], current_time, vid)
            )

        if not keep_home_base:
            query(
                'UPDATE visits SET current_department = ?, status = ?, updated_at = ? WHERE visit_id = ?',
                (to_department, 'in_' + to_department, current_time, vid)
            )
        else:
            query(
                'UPDATE visits SET status = ?, updated_at = ? WHERE visit_id = ?',
                ('referred_to_' + to_department, current_time, vid)
            )

        query(
            '''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
               action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
            (from_department, to_department, session['user']['user_id'],
             'Referred to ' + to_department if keep_home_base else 'Transferred to ' + to_department,
             notes, vid)
        )
        return jsonify({
            'success': True,
            'message': 'Patient ' + ('referred' if keep_home_base else 'transferred') + ' to ' + to_department
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/visits/<int:vid>/refer-with-orders', methods=['POST'])
@require_auth
def refer_with_orders(vid):
    """Refer patient with orders (Ward -> Lab/Radiology/Pharmacy)."""
    try:
        data = request.get_json()
        to_department = data.get('to_department', '')
        orders = data.get('orders', '')
        from_department = session['user']['role']
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        if to_department == 'laboratory':
            query('UPDATE visits SET lab_orders = ?, updated_at = ? WHERE visit_id = ?', (orders, current_time, vid))
        elif to_department == 'radiology':
            query('UPDATE visits SET radiology_orders = ?, updated_at = ? WHERE visit_id = ?', (orders, current_time, vid))
        elif to_department == 'pharmacy':
            query('UPDATE visits SET pharmacy_orders = ?, updated_at = ? WHERE visit_id = ?', (orders, current_time, vid))

        query('UPDATE visits SET status = ?, updated_at = ? WHERE visit_id = ?',
              ('referred_to_' + to_department, current_time, vid))
        query('UPDATE visits SET current_department = ?, updated_at = ? WHERE visit_id = ?',
              (to_department, current_time, vid))

        query('''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
               action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
              (from_department, to_department, session['user']['user_id'],
               'Referred with orders', 'Orders: ' + orders, vid))
        return jsonify({'success': True, 'message': 'Patient referred to ' + to_department + ' with orders.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/visits/<int:vid>/return-to-ward', methods=['POST'])
@require_auth
def return_to_ward(vid):
    """Return patient to ward bed after referral."""
    try:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        visit = query('SELECT ward_bed_number FROM visits WHERE visit_id = ?', (vid,), fetchone=True)
        bed_number = visit['ward_bed_number'] if visit else 'Unknown'
        query('UPDATE visits SET current_department = ?, status = ?, updated_at = ? WHERE visit_id = ?',
              ('ward', 'admitted', current_time, vid))
        query('''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
               action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
              (session['user']['role'], 'ward', session['user']['user_id'],
               'Returned to Ward', 'Returned to bed ' + str(bed_number), vid))
        return jsonify({'success': True, 'message': 'Patient returned to Ward Bed ' + str(bed_number)})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/visits/department/<dept>')
@require_auth
def department_visits(dept):
    """Get all patients currently in a specific department."""
    try:
        dept = str(dept).replace('/', '').replace('\\', '')[:30]
        results = query('''SELECT v.*, p.first_name, p.last_name, p.gender, p.date_of_birth, p.national_id
                        FROM visits v JOIN patients p ON v.patient_id = p.patient_id
                        WHERE v.current_department = ? AND v.patient_cleared = 0 AND v.morgue_completed = 0
                        ORDER BY CASE WHEN v.priority = 'emergency' THEN 0 ELSE 1 END, v.updated_at DESC LIMIT 100''',
                       (dept,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/visits/active')
@require_auth
def active_visits():
    """Get all active visits across all departments."""
    try:
        results = query('''SELECT v.*, p.first_name, p.last_name, p.gender, p.national_id
                        FROM visits v JOIN patients p ON v.patient_id = p.patient_id
                        WHERE v.patient_cleared = 0 AND v.morgue_completed = 0
                        ORDER BY v.updated_at DESC LIMIT 200''', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/visits/<int:vid>')
@require_auth
def get_visit(vid):
    """Get complete visit details with ALL patient information."""
    try:
        result = query('''SELECT v.*, p.* FROM visits v JOIN patients p ON v.patient_id = p.patient_id
                       WHERE v.visit_id = ?''', (vid,), fetchone=True)
        if not result:
            return jsonify({'error': 'Visit not found.'}), 404
        return jsonify(dict_from_row(result))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/visits/<int:vid>/full-history', methods=['GET'])
@require_auth
def visit_full_history(vid):
    """Get COMPLETE patient data from ALL departments."""
    try:
        visit = query('''SELECT v.*, p.* FROM visits v JOIN patients p ON v.patient_id = p.patient_id
                      WHERE v.visit_id = ?''', (vid,), fetchone=True)
        if not visit:
            return jsonify({'error': 'Visit not found.', 'success': False}), 404

        history = query('''SELECT vh.*, u.full_name FROM visit_history vh
                        LEFT JOIN users u ON vh.action_by = u.user_id
                        WHERE vh.visit_id = ? ORDER BY vh.created_at ASC''', (vid,), fetchall=True)
        bills = query('SELECT * FROM billing_items WHERE visit_id = ? ORDER BY created_at', (vid,), fetchall=True)

        total_billed = sum(float(b['amount'] or 0) for b in bills)
        total_paid = sum(float(b['amount'] or 0) for b in bills if b['is_paid'])
        total_balance = total_billed - total_paid

        return jsonify({
            'success': True,
            'visit': dict_from_row(visit),
            'history': [dict_from_row(h) for h in history],
            'bills': [dict_from_row(b) for b in bills],
            'total_billed': total_billed,
            'total_paid': total_paid,
            'total_balance': total_balance
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/visits/<int:vid>/history')
@require_auth
def visit_history(vid):
    """Get transfer and treatment history for a visit."""
    try:
        results = query('''SELECT vh.*, u.full_name FROM visit_history vh
                        LEFT JOIN users u ON vh.action_by = u.user_id
                        WHERE vh.visit_id = ? ORDER BY vh.created_at DESC LIMIT 200''', (vid,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/visits/<int:vid>', methods=['PUT'])
@require_auth
def update_visit(vid):
    """Update visit fields. Auto-logs treatment to history."""
    try:
        data = request.get_json()
        allowed_fields = [
            'triage_category', 'triage_vitals_bp', 'triage_vitals_hr', 'triage_vitals_temp',
            'triage_vitals_spo2', 'triage_vitals_weight', 'triage_notes',
            'diagnosis', 'treatment_plan', 'consultation_notes',
            'lab_orders', 'lab_results', 'radiology_type', 'radiology_body_part',
            'radiology_orders', 'radiology_findings', 'pharmacy_orders', 'pharmacy_dispensed',
            'ward_bed_number', 'ward_notes', 'ward_admitted', 'dietary_plan', 'dietary_restrictions',
            'bloodbank_request_type', 'bloodbank_units', 'bloodbank_blood_group', 'bloodbank_status',
            'socialwork_assessment', 'socialwork_support_type', 'socialwork_notes',
            'physio_assessment', 'physio_treatment_plan', 'physio_sessions_completed',
            'isolation_type', 'isolation_precautions', 'isolation_room_number',
            'medrecords_file_reference', 'medrecords_notes',
            'cashier_payment_method', 'cashier_receipt_number',
            'referral_hospital_name', 'referral_hospital_level', 'referral_reason', 'referral_completed',
            'sha_scheme_name', 'sha_member_number', 'sha_authorization_code', 'sha_status', 'sha_notes', 'sha_completed',
            'morgue_cause_of_death', 'morgue_body_released_to', 'morgue_notes', 'morgue_completed',
            'morgue_completed_at', 'status', 'priority',
            'triage_completed', 'triage_by', 'triage_completed_at',
            'consultation_completed', 'consultation_by', 'consultation_completed_at',
            'lab_completed', 'lab_by', 'lab_completed_at',
            'radiology_completed', 'radiology_by', 'radiology_completed_at',
            'pharmacy_completed', 'pharmacy_by', 'pharmacy_completed_at',
            'dietary_completed', 'dietary_by', 'bloodbank_completed', 'bloodbank_by',
            'socialwork_completed', 'socialwork_by', 'physio_completed', 'physio_by',
            'isolation_completed', 'isolation_by', 'medrecords_completed', 'medrecords_by',
            'referral_by', 'sha_by', 'morgue_by', 'triage_confirmed_patient'
        ]

        updates = []
        values = []
        for key, value in data.items():
            if key in allowed_fields:
                updates.append(key + ' = ?')
                if isinstance(value, str):
                    values.append(value[:5000])
                else:
                    values.append(value)

        if not updates:
            return jsonify({'success': False, 'message': 'No valid fields to update.'})

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        values.append(current_time)
        values.append(vid)
        query('UPDATE visits SET ' + ', '.join(updates) + ', updated_at = ? WHERE visit_id = ?', tuple(values))

        if data.get('diagnosis') or data.get('treatment_plan'):
            treatment_note = ''
            if data.get('diagnosis'):
                treatment_note += 'Diagnosis: ' + str(data.get('diagnosis'))[:500]
            if data.get('treatment_plan'):
                if treatment_note: treatment_note += '. '
                treatment_note += 'Treatment: ' + str(data.get('treatment_plan'))[:500]
            query('''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
                   action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
                   FROM visits WHERE visit_id = ?''',
                  (session['user']['role'], session['user']['role'], session['user']['user_id'],
                   'Treatment Recorded', treatment_note, vid))

        updated_visit = dict_from_row(query('SELECT * FROM visits WHERE visit_id = ?', (vid,), fetchone=True))
        return jsonify({'success': True, 'visit': updated_visit})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
    # ============================================================================
# BILLING ROUTES - WITH PAYMENT METHOD TRACKING
# ============================================================================

@app.route('/api/billing', methods=['POST'])
@require_auth
def add_bill():
    """Add a bill/invoice for a patient visit."""
    try:
        data = request.get_json()
        query('''INSERT INTO billing_items (visit_id, patient_id, item_description, department, amount)
               VALUES (?, ?, ?, ?, ?)''',
              (int(data['visit_id']), int(data['patient_id']),
               str(data.get('item_description', ''))[:255],
               str(data.get('department', ''))[:50],
               float(data.get('amount', 0))))
        query('''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
               action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
              (session['user']['role'], session['user']['role'], session['user']['user_id'],
               'Bill Added', 'Added bill: ' + str(data.get('item_description', ''))[:200] +
               ' - KES ' + str(data.get('amount', 0)), int(data['visit_id'])))
        return jsonify({'success': True, 'message': 'Bill added successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/billing/<int:vid>')
@require_auth
def get_billing(vid):
    """Get all billing items for a visit."""
    try:
        results = query('SELECT * FROM billing_items WHERE visit_id = ? ORDER BY created_at', (vid,), fetchall=True)
        bills = [dict_from_row(r) for r in results]
        total = sum(float(b['amount'] or 0) for b in bills)
        paid = sum(float(b['amount'] or 0) for b in bills if b['is_paid'])
        balance = total - paid
        return jsonify({'bills': bills, 'total': total, 'paid': paid, 'balance': balance})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/all')
@require_role('cashier', 'admin', 'manager')
def get_all_billing():
    """Get ALL bills for ALL active patients - consolidated view."""
    try:
        results = query('''SELECT b.*, p.first_name, p.last_name, p.national_id, v.visit_number, v.visit_id
                        FROM billing_items b JOIN patients p ON b.patient_id = p.patient_id
                        JOIN visits v ON b.visit_id = v.visit_id
                        WHERE v.patient_cleared = 0 AND v.morgue_completed = 0
                        ORDER BY v.visit_id, b.created_at''', fetchall=True)
        bills = [dict_from_row(r) for r in results]
        patients_map = {}
        for bill in bills:
            key = str(bill['visit_id'])
            if key not in patients_map:
                patients_map[key] = {
                    'visit_id': bill['visit_id'], 'visit_number': bill.get('visit_number', ''),
                    'patient_name': (bill.get('first_name', '') + ' ' + bill.get('last_name', '')).strip(),
                    'national_id': bill.get('national_id', ''), 'bills': [], 'total': 0, 'paid': 0, 'balance': 0
                }
            patients_map[key]['bills'].append(bill)
            amt = float(bill['amount'] or 0)
            patients_map[key]['total'] += amt
            if bill['is_paid']:
                patients_map[key]['paid'] += amt
            else:
                patients_map[key]['balance'] += amt

        grand_total = sum(p['total'] for p in patients_map.values())
        grand_paid = sum(p['paid'] for p in patients_map.values())
        grand_balance = sum(p['balance'] for p in patients_map.values())

        return jsonify({
            'success': True, 'patients': list(patients_map.values()),
            'grand_total': grand_total, 'grand_paid': grand_paid,
            'grand_balance': grand_balance, 'total_patients': len(patients_map)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/billing/<int:bid>/pay', methods=['PUT'])
@require_role('cashier', 'doctor', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'ward', 'admin')
def pay_bill(bid):
    """Mark a bill as paid with payment method (Cash/SHA/Insurance)."""
    try:
        data = request.get_json() or {}
        payment_method = data.get('payment_method', 'Cash')
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query('''UPDATE billing_items SET is_paid = 1, paid_at = ?, paid_by = ?,
               payment_method = ? WHERE bill_id = ?''',
              (current_time, session['user']['user_id'], payment_method, bid))
        return jsonify({'success': True, 'message': 'Bill marked as paid via ' + payment_method})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/billing/<int:bid>', methods=['DELETE'])
@require_auth
def delete_bill(bid):
    """Delete a bill/invoice."""
    try:
        query('DELETE FROM billing_items WHERE bill_id = ?', (bid,))
        return jsonify({'success': True, 'message': 'Bill deleted.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# DISCHARGE ROUTE
# ============================================================================

@app.route('/api/visits/<int:vid>/discharge', methods=['POST'])
@require_role('cashier', 'doctor', 'consultation', 'pharmacy', 'admin')
def discharge(vid):
    """Discharge a patient. All bills must be paid."""
    try:
        unpaid = query('SELECT COUNT(*) as c FROM billing_items WHERE visit_id = ? AND is_paid = 0',
                      (vid,), fetchone=True)
        if unpaid['c'] > 0:
            return jsonify({'success': False,
                          'message': 'Cannot discharge. ' + str(unpaid['c']) + ' unpaid bill(s).'})

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query('''UPDATE billing_items SET is_paid = 1, paid_at = ?, paid_by = ?
               WHERE visit_id = ? AND is_paid = 0''', (current_time, session['user']['user_id'], vid))
        query('''UPDATE visits SET patient_cleared = 1, clearance_date = ?, clearance_by = ?,
               status = ?, current_department = ?, updated_at = ? WHERE visit_id = ?''',
              (current_time, session['user']['user_id'], 'discharged', 'discharged', current_time, vid))

        data = request.get_json() or {}
        if data.get('free_bed'):
            query("UPDATE beds SET is_occupied = 0, current_visit_id = NULL, status = 'available' WHERE current_visit_id = ?", (vid,))

        query('''INSERT INTO visit_history (visit_id, patient_id, from_department, to_department,
               action_by, action_name, notes) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
              ('cashier', 'DISCHARGED', session['user']['user_id'],
               'Patient Discharged', 'All bills cleared - patient discharged', vid))
        return jsonify({'success': True, 'message': 'Patient discharged successfully!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# INVENTORY ROUTES
# ============================================================================

@app.route('/api/inventory')
@require_auth
def get_inventory():
    try:
        results = query('SELECT * FROM inventory ORDER BY current_stock ASC', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/inventory/low-stock')
@require_auth
def low_stock():
    try:
        results = query('SELECT * FROM inventory WHERE current_stock <= minimum_stock ORDER BY current_stock ASC', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/inventory', methods=['POST'])
@require_role('store')
def add_inventory():
    try:
        data = request.get_json()
        query('''INSERT INTO inventory (item_name, category, department, current_stock, minimum_stock, unit, unit_price)
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
              (str(data.get('item_name',''))[:200], data.get('category'), data.get('department'),
               int(data.get('current_stock',0)), int(data.get('minimum_stock',10)),
               data.get('unit'), float(data.get('unit_price',0))))
        return jsonify({'success': True, 'message': 'Item added.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/inventory/<int:iid>', methods=['PUT'])
@require_role('store')
def update_inventory(iid):
    try:
        data = request.get_json()
        new_stock = int(data.get('current_stock', 0))
        query('''UPDATE inventory SET current_stock = ?, minimum_stock = ?, unit_price = ?,
               last_restocked = CASE WHEN ? > (SELECT current_stock FROM inventory WHERE item_id = ?)
               THEN datetime('now','localtime') ELSE last_restocked END WHERE item_id = ?''',
              (new_stock, int(data.get('minimum_stock',10)), float(data.get('unit_price',0)),
               new_stock, iid, iid))
        return jsonify({'success': True, 'message': 'Inventory updated.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# BEDS ROUTES
# ============================================================================

@app.route('/api/beds')
@require_auth
def get_beds():
    try:
        results = query('SELECT * FROM beds ORDER BY department, bed_number', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/beds/available')
@require_auth
def available_beds():
    try:
        results = query("SELECT * FROM beds WHERE is_occupied = 0 AND status = 'available' ORDER BY department, bed_number", fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/beds/assign', methods=['POST'])
@require_role('ward', 'isolation')
def assign_bed():
    try:
        data = request.get_json()
        bed_id = int(data.get('bed_id', 0))
        visit_id = int(data.get('visit_id', 0))
        query('UPDATE beds SET is_occupied = 1, current_visit_id = ?, status = ? WHERE bed_id = ?',
              (visit_id, 'occupied', bed_id))
        query('''UPDATE visits SET ward_bed_number = (SELECT bed_number FROM beds WHERE bed_id = ?),
               ward_admitted = 1, ward_admission_date = ? WHERE visit_id = ?''',
              (bed_id, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), visit_id))
        return jsonify({'success': True, 'message': 'Bed assigned.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/beds', methods=['POST'])
@require_role('admin')
def add_bed():
    try:
        data = request.get_json()
        bed_number = str(data.get('bed_number', '')).strip()
        ward_type = data.get('ward_type', 'General')
        department = data.get('department', 'ward')
        if not bed_number:
            return jsonify({'success': False, 'error': 'Bed number required.'})
        existing = query('SELECT bed_id FROM beds WHERE bed_number = ?', (bed_number,), fetchone=True)
        if existing:
            return jsonify({'success': False, 'error': 'Bed number already exists.'})
        query('INSERT INTO beds (bed_number, ward_type, department) VALUES (?, ?, ?)',
              (bed_number, ward_type, department))
        return jsonify({'success': True, 'message': 'Bed added.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# BLOOD BANK ROUTES
# ============================================================================

@app.route('/api/bloodbank')
@require_auth
def blood_inventory():
    try:
        results = query('SELECT * FROM blood_inventory ORDER BY blood_group', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# USER MANAGEMENT ROUTES
# ============================================================================

@app.route('/api/users')
@require_auth
def get_users():
    try:
        results = query('SELECT user_id, username, full_name, role, department_name, is_active, last_login FROM users ORDER BY role', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/users', methods=['POST'])
@require_role('admin')
def add_user():
    try:
        data = request.get_json()
        username = str(data.get('username', '')).strip().lower()
        password = str(data.get('password', ''))
        full_name = str(data.get('full_name', '')).strip()
        role = str(data.get('role', '')).strip()
        dept = str(data.get('department_name', '')).strip()
        if not username or not password or not full_name or not role:
            return jsonify({'success': False, 'message': 'All fields required.'})
        existing = query('SELECT user_id FROM users WHERE username = ?', (username,), fetchone=True)
        if existing:
            return jsonify({'success': False, 'message': 'Username already exists.'})
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()
        query('INSERT INTO users (username, password, full_name, role, department_name) VALUES (?,?,?,?,?)',
              (username, hashed, full_name, role, dept))
        return jsonify({'success': True, 'message': 'User created.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/users/<int:uid>', methods=['PUT'])
@require_role('admin')
def update_user(uid):
    try:
        data = request.get_json()
        full_name = str(data.get('full_name', '')).strip()
        role = str(data.get('role', '')).strip()
        dept = str(data.get('department_name', '')).strip()
        is_active = 1 if data.get('is_active', True) else 0
        query('UPDATE users SET full_name=?, role=?, department_name=?, is_active=? WHERE user_id=?',
              (full_name, role, dept, is_active, uid))
        if data.get('password'):
            hashed = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt(rounds=12)).decode()
            query('UPDATE users SET password=? WHERE user_id=?', (hashed, uid))
        return jsonify({'success': True, 'message': 'User updated.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# DASHBOARD ROUTES
# ============================================================================

@app.route('/api/dashboard')
@require_auth
def dashboard():
    try:
        total_patients = query('SELECT COUNT(*) as c FROM patients', fetchone=True)['c']
        active_visits = query('SELECT COUNT(*) as c FROM visits WHERE patient_cleared=0 AND morgue_completed=0', fetchone=True)['c']
        today_visits = query("SELECT COUNT(*) as c FROM visits WHERE date(created_at)=date('now','localtime')", fetchone=True)['c']
        pending_bills = float(query('SELECT COALESCE(SUM(amount),0) as t FROM billing_items WHERE is_paid=0', fetchone=True)['t'])
        occupied_beds = query('SELECT COUNT(*) as c FROM beds WHERE is_occupied=1', fetchone=True)['c']
        total_beds = query('SELECT COUNT(*) as c FROM beds', fetchone=True)['c']
        low_stock_items = query('SELECT COUNT(*) as c FROM inventory WHERE current_stock<=minimum_stock', fetchone=True)['c']
        department_counts = query('''SELECT current_department, COUNT(*) as count FROM visits
                                  WHERE patient_cleared=0 AND morgue_completed=0
                                  GROUP BY current_department ORDER BY count DESC''', fetchall=True)
        low_blood = query('SELECT * FROM blood_inventory WHERE units_available<=3 ORDER BY blood_group', fetchall=True)
        return jsonify({
            'totalPatients': total_patients, 'activeVisits': active_visits,
            'todayVisits': today_visits, 'pendingBills': pending_bills,
            'occupiedBeds': occupied_beds, 'totalBeds': total_beds,
            'lowStockItems': low_stock_items,
            'departmentCounts': [dict_from_row(r) for r in department_counts],
            'lowBlood': [dict_from_row(r) for r in low_blood]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/manager/queues')
@require_role('manager')
def manager_queues():
    try:
        results = query("""SELECT current_department, COUNT(*) as waiting FROM visits
                        WHERE patient_cleared=0 AND morgue_completed=0 AND status LIKE 'in_%'
                        GROUP BY current_department ORDER BY waiting DESC""", fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/manager/revenue')
@require_role('manager')
def manager_revenue():
    try:
        results = query("""SELECT date(created_at) as date, SUM(amount) as total, COUNT(*) as transactions,
                        payment_method FROM billing_items WHERE is_paid=1
                        AND created_at>=date('now','localtime','-30 days')
                        GROUP BY date(created_at), payment_method ORDER BY date DESC""", fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    # ============================================================================
# DEPARTMENT MANAGEMENT ROUTES
# ============================================================================

@app.route('/api/department/<dept>/staff')
@require_auth
def department_staff(dept):
    """Get all staff members belonging to a specific department."""
    try:
        dept = str(dept).replace('/', '').replace('\\', '')[:30]
        staff = query(
            '''SELECT user_id, username, full_name, role, department_name, is_active, last_login 
               FROM users WHERE department_name LIKE ? OR role = ? ORDER BY full_name''',
            ('%' + dept + '%', dept), fetchall=True
        )
        return jsonify({'success': True, 'department': dept, 'staff': [dict_from_row(s) for s in staff], 'count': len(staff)})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/department/<dept>/daily-stats')
@require_auth
def department_daily_stats(dept):
    """Get daily patient count for a specific department."""
    try:
        dept = str(dept).replace('/', '').replace('\\', '')[:30]
        current = query("""SELECT COUNT(*) as count FROM visits WHERE current_department = ? 
                        AND patient_cleared = 0 AND morgue_completed = 0""", (dept,), fetchone=True)['count']
        today_count = query("""SELECT COUNT(DISTINCT visit_id) as count FROM visit_history 
                            WHERE (from_department = ? OR to_department = ?)
                            AND date(created_at) = date('now','localtime')""", (dept, dept), fetchone=True)['count']
        completed_today = 0
        try:
            completed_today = query("""SELECT COUNT(*) as count FROM visits WHERE """ + dept + """_completed = 1""", fetchone=True)['count']
        except:
            pass
        week_count = query("""SELECT COUNT(DISTINCT visit_id) as count FROM visit_history 
                           WHERE (from_department = ? OR to_department = ?)
                           AND date(created_at) >= date('now','localtime','-7 days')""", (dept, dept), fetchone=True)['count']
        month_count = query("""SELECT COUNT(DISTINCT visit_id) as count FROM visit_history 
                            WHERE (from_department = ? OR to_department = ?)
                            AND date(created_at) >= date('now','localtime','-30 days')""", (dept, dept), fetchone=True)['count']
        return jsonify({'success': True, 'department': dept, 'currentlyWaiting': current,
                       'todayServed': today_count, 'todayCompleted': completed_today,
                       'weekTotal': week_count, 'monthTotal': month_count})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/department/<dept>/clear-day', methods=['POST'])
@require_auth
def department_clear_day(dept):
    """Mark all completed patients as cleared for the day."""
    try:
        dept = str(dept).replace('/', '').replace('\\', '')[:30]
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query("""UPDATE visits SET updated_at = ? WHERE current_department = ? 
               AND """ + dept + """_completed = 1 AND patient_cleared = 0""", (current_time, dept))
        return jsonify({'success': True, 'message': 'Department daily cleanup completed.',
                       'department': dept, 'clearedBy': session['user']['full_name']})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


# ============================================================================
# APPOINTMENT SCHEDULING ROUTES
# ============================================================================

@app.route('/api/appointments')
@require_auth
def get_appointments():
    """Get all appointments, optionally filtered by date."""
    try:
        date_filter = request.args.get('date', '')
        if date_filter:
            results = query('''SELECT a.*, p.first_name, p.last_name, p.phone, p.national_id,
                            u.full_name as doctor_name FROM appointments a
                            JOIN patients p ON a.patient_id = p.patient_id
                            LEFT JOIN users u ON a.doctor_id = u.user_id
                            WHERE a.appointment_date = ? ORDER BY a.appointment_time ASC''',
                          (date_filter,), fetchall=True)
        else:
            today = datetime.now().strftime('%Y-%m-%d')
            results = query('''SELECT a.*, p.first_name, p.last_name, p.phone, p.national_id,
                            u.full_name as doctor_name FROM appointments a
                            JOIN patients p ON a.patient_id = p.patient_id
                            LEFT JOIN users u ON a.doctor_id = u.user_id
                            WHERE a.appointment_date >= ? ORDER BY a.appointment_date ASC, 
                            a.appointment_time ASC LIMIT 100''', (today,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/appointments', methods=['POST'])
@require_auth
def create_appointment():
    """Book a new appointment."""
    try:
        data = request.get_json()
        patient_id = int(data.get('patient_id', 0))
        doctor_id = int(data.get('doctor_id', 0)) if data.get('doctor_id') else None
        appointment_date = str(data.get('appointment_date', ''))
        appointment_time = str(data.get('appointment_time', ''))
        reason = str(data.get('reason', ''))[:500]
        notes = str(data.get('notes', ''))[:500]
        if not patient_id or not appointment_date:
            return jsonify({'success': False, 'error': 'Patient and date are required.'})
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query('''INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time,
               reason, notes, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (patient_id, doctor_id, appointment_date, appointment_time, reason, notes,
               session['user']['user_id'], current_time, current_time))
        return jsonify({'success': True, 'message': 'Appointment booked successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/appointments/<int:aid>', methods=['PUT'])
@require_auth
def update_appointment(aid):
    """Update appointment status or details."""
    try:
        data = request.get_json()
        status = data.get('status', '')
        notes = data.get('notes', '')
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        if status:
            query('UPDATE appointments SET status=?, notes=?, updated_at=? WHERE appointment_id=?',
                  (status, notes, current_time, aid))
        else:
            query('UPDATE appointments SET notes=?, updated_at=? WHERE appointment_id=?', (notes, current_time, aid))
        return jsonify({'success': True, 'message': 'Appointment updated.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/doctors')
@require_auth
def get_doctors():
    """Get list of doctors for appointment booking."""
    try:
        results = query("""SELECT user_id, full_name, department_name, role FROM users 
                        WHERE role IN ('consultation','doctor','pediatrics','emergency') 
                        AND is_active = 1 ORDER BY full_name""", fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


# ============================================================================
# TRIAGE ACUITY SCORING ROUTE
# ============================================================================

@app.route('/api/triage/acuity-score', methods=['POST'])
@require_role('triage', 'consultation', 'emergency')
def calculate_acuity_score():
    """Calculate triage acuity score based on vitals (NEWS2-based)."""
    try:
        data = request.get_json()
        score = 0
        details = []

        # Respiratory rate scoring
        rr = float(data.get('respiratory_rate', 0) or 0)
        if rr > 0:
            if rr <= 8: score += 3; details.append('RR<=8: +3')
            elif rr <= 11: score += 2; details.append('RR 9-11: +2')
            elif rr <= 20: details.append('RR 12-20: normal')
            elif rr <= 24: score += 2; details.append('RR 21-24: +2')
            else: score += 3; details.append('RR>24: +3')

        # SpO2 scoring
        spo2 = float(data.get('spo2', 0) or 0)
        if spo2 > 0:
            if spo2 <= 91: score += 3; details.append('SpO2<=91: +3')
            elif spo2 <= 93: score += 2; details.append('SpO2 92-93: +2')
            elif spo2 <= 95: score += 1; details.append('SpO2 94-95: +1')
            else: details.append('SpO2>=96: normal')

        # Heart rate scoring
        hr = float(data.get('heart_rate', 0) or 0)
        if hr > 0:
            if hr <= 40: score += 3; details.append('HR<=40: +3')
            elif hr <= 50: score += 1; details.append('HR 41-50: +1')
            elif hr <= 90: details.append('HR 51-90: normal')
            elif hr <= 110: score += 1; details.append('HR 91-110: +1')
            elif hr <= 130: score += 2; details.append('HR 111-130: +2')
            else: score += 3; details.append('HR>130: +3')

        # Blood pressure scoring
        sbp = float(data.get('systolic_bp', 0) or 0)
        if sbp > 0:
            if sbp <= 90: score += 3; details.append('SBP<=90: +3')
            elif sbp <= 100: score += 2; details.append('SBP 91-100: +2')
            elif sbp <= 110: score += 1; details.append('SBP 101-110: +1')
            elif sbp <= 219: details.append('SBP 111-219: normal')
            else: score += 3; details.append('SBP>=220: +3')

        # Temperature scoring
        temp = float(data.get('temperature', 0) or 0)
        if temp > 0:
            if temp <= 35.0: score += 3; details.append('Temp<=35: +3')
            elif temp <= 36.0: score += 1; details.append('Temp 35.1-36: +1')
            elif temp <= 38.0: details.append('Temp 36.1-38: normal')
            elif temp <= 39.0: score += 1; details.append('Temp 38.1-39: +1')
            else: score += 2; details.append('Temp>39: +2')

        # Determine category
        if score >= 7: category = 'Emergency'; color = 'red'
        elif score >= 5: category = 'Urgent'; color = 'orange'
        elif score >= 3: category = 'Semi-Urgent'; color = 'yellow'
        else: category = 'Routine'; color = 'green'

        return jsonify({
            'success': True, 'score': score, 'category': category, 'color': color,
            'details': details, 'max_score': 20
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# WARD ROUNDS ROUTES
# ============================================================================

@app.route('/api/ward-rounds/<int:vid>')
@require_auth
def get_ward_rounds(vid):
    """Get all ward rounds records for a visit."""
    try:
        results = query('''SELECT wr.*, u.full_name FROM ward_rounds wr
                        LEFT JOIN users u ON wr.recorded_by = u.user_id
                        WHERE wr.visit_id = ? ORDER BY wr.created_at DESC''', (vid,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/ward-rounds', methods=['POST'])
@require_role('ward', 'isolation', 'consultation', 'doctor')
def add_ward_round():
    """Record a ward round entry (vitals + medication)."""
    try:
        data = request.get_json()
        visit_id = int(data.get('visit_id', 0))
        patient_id = int(data.get('patient_id', 0))
        query('''INSERT INTO ward_rounds (visit_id, patient_id, recorded_by, temperature,
               blood_pressure, heart_rate, spo2, respiratory_rate, blood_sugar, pain_score,
               medication_given, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (visit_id, patient_id, session['user']['user_id'],
               data.get('temperature'), data.get('blood_pressure'),
               data.get('heart_rate'), data.get('spo2'),
               data.get('respiratory_rate'), data.get('blood_sugar'),
               data.get('pain_score'), str(data.get('medication_given', ''))[:500],
               str(data.get('notes', ''))[:500]))
        return jsonify({'success': True, 'message': 'Ward round recorded.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# DIGITAL PRESCRIPTIONS ROUTES
# ============================================================================

@app.route('/api/prescriptions/<int:vid>')
@require_auth
def get_prescriptions(vid):
    """Get all prescriptions for a visit."""
    try:
        results = query('''SELECT p.*, u.full_name as doctor_name FROM prescriptions p
                        LEFT JOIN users u ON p.doctor_id = u.user_id
                        WHERE p.visit_id = ? ORDER BY p.created_at DESC''', (vid,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/prescriptions', methods=['POST'])
@require_role('consultation', 'doctor', 'pediatrics', 'emergency')
def add_prescription():
    """Add a prescription."""
    try:
        data = request.get_json()
        query('''INSERT INTO prescriptions (visit_id, patient_id, doctor_id, drug_name,
               dosage, frequency, duration, route, instructions)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (int(data.get('visit_id', 0)), int(data.get('patient_id', 0)),
               session['user']['user_id'], str(data.get('drug_name', ''))[:200],
               str(data.get('dosage', ''))[:100], str(data.get('frequency', ''))[:100],
               str(data.get('duration', ''))[:100], str(data.get('route', ''))[:50],
               str(data.get('instructions', ''))[:500]))
        return jsonify({'success': True, 'message': 'Prescription added.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/prescriptions/<int:pid>/dispense', methods=['PUT'])
@require_role('pharmacy')
def dispense_prescription(pid):
    """Mark prescription as dispensed by pharmacy."""
    try:
        query('UPDATE prescriptions SET status = ? WHERE prescription_id = ?', ('dispensed', pid))
        return jsonify({'success': True, 'message': 'Prescription marked as dispensed.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# LAB REQUISITION FORMS / PANELS
# ============================================================================

@app.route('/api/lab-panels')
@require_auth
def get_lab_panels():
    """Get predefined lab test panels."""
    try:
        results = query('SELECT * FROM lab_panels ORDER BY panel_name', fetchall=True)
        if not results:
            # Seed default panels if none exist
            default_panels = [
                ('Malaria Panel', 'Malaria Rapid Test, Blood Smear, FBC', 'laboratory'),
                ('Typhoid Panel', 'Widal Test, Blood Culture, FBC', 'laboratory'),
                ('UTI Panel', 'Urinalysis, Urine Culture, Sensitivity', 'laboratory'),
                ('Renal Panel', 'Urea, Creatinine, Electrolytes, eGFR', 'laboratory'),
                ('Liver Panel', 'ALT, AST, ALP, Bilirubin, Albumin', 'laboratory'),
                ('Lipid Panel', 'Total Cholesterol, HDL, LDL, Triglycerides', 'laboratory'),
                ('Diabetic Panel', 'FBS, HbA1c, Urine Glucose', 'laboratory'),
                ('FBC', 'Full Blood Count, Hb, WBC, Platelets', 'laboratory'),
            ]
            for panel in default_panels:
                query('INSERT INTO lab_panels (panel_name, tests_included, department) VALUES (?,?,?)', panel)
            results = query('SELECT * FROM lab_panels ORDER BY panel_name', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


# ============================================================================
# MATERNITY MODULE ROUTES
# ============================================================================

@app.route('/api/maternity/<int:pid>')
@require_auth
def get_maternity_records(pid):
    """Get all maternity records for a patient."""
    try:
        results = query('''SELECT m.*, u.full_name FROM maternity_records m
                        LEFT JOIN users u ON m.created_by = u.user_id
                        WHERE m.patient_id = ? ORDER BY m.created_at DESC''', (pid,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/maternity', methods=['POST'])
@require_role('ward', 'consultation', 'doctor')
def add_maternity_record():
    """Add a maternity record."""
    try:
        data = request.get_json()
        query('''INSERT INTO maternity_records (patient_id, visit_id, record_type, gravida, para,
               lmp, edd, delivery_date, delivery_type, birth_weight, apgar_score, complications,
               notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (int(data.get('patient_id', 0)), int(data.get('visit_id', 0)) if data.get('visit_id') else None,
               str(data.get('record_type', '')), int(data.get('gravida', 0) or 0),
               int(data.get('para', 0) or 0), str(data.get('lmp', '')),
               str(data.get('edd', '')), str(data.get('delivery_date', '')),
               str(data.get('delivery_type', '')), float(data.get('birth_weight', 0) or 0),
               str(data.get('apgar_score', '')), str(data.get('complications', ''))[:500],
               str(data.get('notes', ''))[:500], session['user']['user_id']))
        return jsonify({'success': True, 'message': 'Maternity record saved.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
    # ============================================================================
# DENTAL MODULE ROUTES
# ============================================================================

@app.route('/api/dental/<int:pid>')
@require_auth
def get_dental_records(pid):
    """Get all dental records for a patient."""
    try:
        results = query('''SELECT d.*, u.full_name FROM dental_records d
                        LEFT JOIN users u ON d.created_by = u.user_id
                        WHERE d.patient_id = ? ORDER BY d.created_at DESC''', (pid,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/dental', methods=['POST'])
@require_role('consultation', 'doctor')
def add_dental_record():
    """Add a dental record."""
    try:
        data = request.get_json()
        query('''INSERT INTO dental_records (patient_id, visit_id, tooth_number, procedure_type,
               findings, treatment_done, notes, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
              (int(data.get('patient_id', 0)), int(data.get('visit_id', 0)) if data.get('visit_id') else None,
               str(data.get('tooth_number', '')), str(data.get('procedure_type', '')),
               str(data.get('findings', ''))[:500], str(data.get('treatment_done', ''))[:500],
               str(data.get('notes', ''))[:500], session['user']['user_id']))
        return jsonify({'success': True, 'message': 'Dental record saved.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# EYE / OPHTHALMOLOGY MODULE ROUTES
# ============================================================================

@app.route('/api/eye/<int:pid>')
@require_auth
def get_eye_records(pid):
    """Get all eye records for a patient."""
    try:
        results = query('''SELECT e.*, u.full_name FROM eye_records e
                        LEFT JOIN users u ON e.created_by = u.user_id
                        WHERE e.patient_id = ? ORDER BY e.created_at DESC''', (pid,), fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/eye', methods=['POST'])
@require_role('consultation', 'doctor')
def add_eye_record():
    """Add an eye/ophthalmology record."""
    try:
        data = request.get_json()
        query('''INSERT INTO eye_records (patient_id, visit_id, right_eye_vision, left_eye_vision,
               right_eye_pressure, left_eye_pressure, refraction_right, refraction_left,
               diagnosis, treatment, notes, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
              (int(data.get('patient_id', 0)), int(data.get('visit_id', 0)) if data.get('visit_id') else None,
               str(data.get('right_eye_vision', '')), str(data.get('left_eye_vision', '')),
               float(data.get('right_eye_pressure', 0) or 0), float(data.get('left_eye_pressure', 0) or 0),
               str(data.get('refraction_right', '')), str(data.get('refraction_left', '')),
               str(data.get('diagnosis', ''))[:500], str(data.get('treatment', ''))[:500],
               str(data.get('notes', ''))[:500], session['user']['user_id']))
        return jsonify({'success': True, 'message': 'Eye record saved.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# DISCHARGE SUMMARY ROUTE
# ============================================================================

@app.route('/api/visits/<int:vid>/discharge-summary')
@require_auth
def discharge_summary(vid):
    """Generate a complete discharge summary for a visit."""
    try:
        visit = query(
            '''SELECT v.*, p.first_name, p.last_name, p.date_of_birth, p.gender, p.phone,
               p.national_id, p.blood_group, p.allergies
               FROM visits v JOIN patients p ON v.patient_id = p.patient_id
               WHERE v.visit_id = ?''', (vid,), fetchone=True
        )
        if not visit:
            return jsonify({'error': 'Visit not found.', 'success': False}), 404

        history = query(
            '''SELECT vh.*, u.full_name FROM visit_history vh
               LEFT JOIN users u ON vh.action_by = u.user_id
               WHERE vh.visit_id = ? ORDER BY vh.created_at ASC''', (vid,), fetchall=True
        )
        bills = query(
            'SELECT * FROM billing_items WHERE visit_id = ? ORDER BY created_at', (vid,), fetchall=True
        )

        # Try to get prescriptions
        prescriptions = []
        try:
            prescriptions = query(
                'SELECT * FROM prescriptions WHERE visit_id = ? ORDER BY created_at', (vid,), fetchall=True
            )
        except:
            prescriptions = []

        total_billed = sum(float(b['amount'] or 0) for b in bills)
        total_paid = sum(float(b['amount'] or 0) for b in bills if b['is_paid'])

        v = dict_from_row(visit)
        
        summary = {
            'success': True,
            'patient': {
                'name': (v.get('first_name', '') + ' ' + v.get('last_name', '')).strip(),
                'national_id': v.get('national_id', 'N/A'),
                'dob': v.get('date_of_birth', 'N/A'),
                'gender': v.get('gender', 'N/A'),
                'phone': v.get('phone', 'N/A'),
                'blood_group': v.get('blood_group', 'Unknown'),
                'allergies': v.get('allergies', 'None')
            },
            'visit': {
                'visit_number': v.get('visit_number', 'N/A'),
                'admission_date': v.get('created_at', 'N/A'),
                'discharge_date': v.get('clearance_date', 'Not yet discharged'),
                'status': v.get('status', 'N/A')
            },
            'clinical': {
                'diagnosis': v.get('diagnosis', 'Not recorded'),
                'treatment_plan': v.get('treatment_plan', 'Not recorded'),
                'consultation_notes': v.get('consultation_notes', ''),
                'lab_results': v.get('lab_results', 'No lab tests'),
                'radiology_findings': v.get('radiology_findings', 'No imaging')
            },
            'medications': [dict_from_row(p) for p in prescriptions],
            'billing': {
                'total': total_billed,
                'paid': total_paid,
                'balance': total_billed - total_paid,
                'items': [dict_from_row(b) for b in bills]
            },
            'timeline': [dict_from_row(h) for h in history]
        }

        return jsonify(summary)
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


# ============================================================================
# FINANCIAL / EXPENSES ROUTES
# ============================================================================

@app.route('/api/finance/summary')
@require_role('admin', 'manager', 'cashier')
def finance_summary():
    """Get complete financial summary - revenue and expenses."""
    try:
        total_billed = float(query('SELECT COALESCE(SUM(amount), 0) as t FROM billing_items', fetchone=True)['t'])
        total_paid = float(query('SELECT COALESCE(SUM(amount), 0) as t FROM billing_items WHERE is_paid = 1', fetchone=True)['t'])
        total_pending = total_billed - total_paid

        payment_methods = query('''SELECT payment_method, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
                                FROM billing_items WHERE is_paid = 1 GROUP BY payment_method ORDER BY total DESC''', fetchall=True)
        dept_revenue = query('''SELECT department, COALESCE(SUM(amount), 0) as total, COUNT(*) as count,
                             COALESCE(SUM(CASE WHEN is_paid=1 THEN amount ELSE 0 END), 0) as paid
                             FROM billing_items GROUP BY department ORDER BY total DESC''', fetchall=True)
        today_collections = float(query("""SELECT COALESCE(SUM(amount), 0) as t FROM billing_items 
                                        WHERE is_paid = 1 AND date(paid_at) = date('now','localtime')""", fetchone=True)['t'])

        total_expenses = 0
        expenses_by_category = []
        try:
            total_expenses = float(query('SELECT COALESCE(SUM(amount), 0) as t FROM expenses', fetchone=True)['t'])
            expenses_by_category = query('''SELECT category, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
                                        FROM expenses GROUP BY category ORDER BY total DESC''', fetchall=True)
        except:
            pass

        return jsonify({
            'success': True,
            'revenue': {
                'totalBilled': total_billed, 'totalPaid': total_paid, 'totalPending': total_pending,
                'todayCollections': today_collections,
                'byPaymentMethod': [dict_from_row(r) for r in payment_methods],
                'byDepartment': [dict_from_row(r) for r in dept_revenue]
            },
            'expenses': {'total': total_expenses, 'byCategory': [dict_from_row(r) for r in expenses_by_category]},
            'netIncome': total_paid - total_expenses
        })
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/expenses', methods=['POST'])
@require_role('admin', 'manager', 'cashier')
def add_expense():
    """Add an expense record."""
    try:
        data = request.get_json()
        description = str(data.get('description', ''))[:255]
        category = str(data.get('category', 'General'))[:50]
        amount = float(data.get('amount', 0))
        if not description or amount <= 0:
            return jsonify({'success': False, 'error': 'Description and amount required.'})
        query('INSERT INTO expenses (description, category, amount, recorded_by) VALUES (?, ?, ?, ?)',
              (description, category, amount, session['user']['user_id']))
        return jsonify({'success': True, 'message': 'Expense recorded.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/expenses')
@require_role('admin', 'manager', 'cashier')
def get_expenses():
    """Get all expenses."""
    try:
        results = query('''SELECT e.*, u.full_name as recorded_by_name FROM expenses e
                        LEFT JOIN users u ON e.recorded_by = u.user_id
                        ORDER BY e.created_at DESC LIMIT 200''', fetchall=True)
        return jsonify([dict_from_row(r) for r in results])
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


# ============================================================================
# PATIENT COMPLETE HISTORY (NEVER DELETED)
# ============================================================================

@app.route('/api/patients/<int:pid>/history')
@require_auth
def patient_complete_history(pid):
    """Get ALL historical visits for a patient, including discharged ones."""
    try:
        patient = query('SELECT * FROM patients WHERE patient_id = ?', (pid,), fetchone=True)
        if not patient:
            return jsonify({'error': 'Patient not found.'}), 404
        visits = query('''SELECT v.* FROM visits v WHERE v.patient_id = ? ORDER BY v.created_at DESC''',
                      (pid,), fetchall=True)
        visits_data = []
        for visit in visits:
            v = dict_from_row(visit)
            bills = query('SELECT * FROM billing_items WHERE visit_id = ? ORDER BY created_at',
                        (v['visit_id'],), fetchall=True)
            v['bills'] = [dict_from_row(b) for b in bills]
            v['total_billed'] = sum(float(b['amount'] or 0) for b in bills)
            v['total_paid'] = sum(float(b['amount'] or 0) for b in bills if b['is_paid'])
            visits_data.append(v)
        return jsonify({'success': True, 'patient': dict_from_row(patient),
                       'visits': visits_data, 'total_visits': len(visits_data)})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


# ============================================================================
# BACKUP AND EXPORT ROUTES
# ============================================================================

@app.route('/api/export/csv')
@require_role('admin', 'manager')
def export_csv():
    """Export all patients and visits as CSV file."""
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['Patient ID', 'First Name', 'Last Name', 'DOB', 'Gender', 'Phone',
                        'National ID', 'Visit Number', 'Status', 'Department', 'Diagnosis',
                        'Registration Fee Paid', 'Total Billed', 'Total Paid', 'Balance', 'Created At'])
        results = query('''SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth, p.gender,
                        p.phone, p.national_id, v.visit_number, v.status, v.current_department,
                        v.diagnosis, v.registration_fee_paid, v.created_at, v.visit_id
                        FROM patients p LEFT JOIN visits v ON p.patient_id = v.patient_id
                        ORDER BY p.created_at DESC''', fetchall=True)
        for row in results:
            bills = query('SELECT SUM(amount) as total, SUM(CASE WHEN is_paid=1 THEN amount ELSE 0 END) as paid FROM billing_items WHERE visit_id = ?',
                        (row['visit_id'],), fetchone=True) if row['visit_id'] else None
            total_billed = float(bills['total'] or 0) if bills else 0
            total_paid = float(bills['paid'] or 0) if bills else 0
            balance = total_billed - total_paid
            writer.writerow([row['patient_id'], row['first_name'], row['last_name'],
                           row['date_of_birth'], row['gender'], row['phone'], row['national_id'],
                           row['visit_number'], row['status'], row['current_department'],
                           row['diagnosis'], 'Yes' if row['registration_fee_paid'] else 'No',
                           total_billed, total_paid, balance, row['created_at']])
        output.seek(0)
        filename = 'hospital_backup_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.csv'
        return output.getvalue(), 200, {'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=' + filename}
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/backup/download')
@require_role('admin', 'manager')
def download_database():
    """Download complete SQLite database as backup."""
    try:
        temp_dir = tempfile.gettempdir()
        backup_file = os.path.join(temp_dir, 'hospital_full_backup.db')
        shutil.copy2(DB_PATH, backup_file)
        download_name = 'hospital_full_backup_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.db'
        return send_from_directory(temp_dir, 'hospital_full_backup.db',
                                   as_attachment=True, download_name=download_name)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# ============================================================================
# CLEAR TEST DATA
# ============================================================================

@app.route('/api/wipe-test-data', methods=['POST'])
def wipe_test_data():
    try:
        tables = ['billing_items','visit_history','ward_rounds','prescriptions','appointments','expenses','maternity_records','dental_records','eye_records','visits','patients']
        for t in tables:
            try: query('DELETE FROM ' + t)
            except: pass
        query("UPDATE beds SET is_occupied=0, current_visit_id=NULL, status='available'")
        return jsonify({'success':True,'message':'All test data cleared.'})
    except Exception as e:
        return jsonify({'success':False,'error':str(e)}), 500
    
# ============================================================================
# SERVE FRONTEND APPLICATION
# ============================================================================

@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path='index.html'):
    """Serve the frontend Single Page Application."""
    if path and '.' in path:
        return send_from_directory('public', path)
    return send_from_directory('public', 'index.html')


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found.'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error.'}), 500


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({'error': 'Method not allowed.'}), 405


# ============================================================================
# START SERVER
# ============================================================================

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5443))

    ssl_context = None
    cert_path = os.getenv('SSL_CERT_PATH', './certs/server.cert')
    key_path = os.getenv('SSL_KEY_PATH', './certs/server.key')
    passphrase_file = './certs/server.passphrase'

    if os.path.exists(cert_path) and os.path.exists(key_path):
        passphrase = 'hospital-ssl-passphrase-2026'
        if os.path.exists(passphrase_file):
            with open(passphrase_file, 'r') as f:
                passphrase = f.read().strip()

        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2
        ssl_context.set_ciphers('ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256')
        ssl_context.load_cert_chain(cert_path, key_path, passphrase)

    print()
    print("=" * 70)
    print("  🏥 HOSPITAL MANAGEMENT SYSTEM v5.1")
    print("  Real Hospital Workflow Edition")
    print("  Python / Flask Backend - SQLite Edition")
    print("  Developer: Safari Softwares")
    print("  Copyright (c) 2026 Safari Softwares")
    print("  All Rights Reserved")
    print("=" * 70)
    print()
    print("  🔧 Configuration:")
    print("    • Database: SQLite (" + DB_PATH + ")")
    print("    • Port: " + str(port))
    print("    • SSL: " + ("Enabled (HTTPS)" if ssl_context else "Disabled (HTTP)"))
    print()
    print("  ✅ Features Active:")
    print("    • 22 Hospital Modules + Appointment Scheduling")
    print("    • Triage Acuity Scoring (NEWS2-based)")
    print("    • Ward Rounds & Vitals Charting")
    print("    • Digital Prescriptions")
    print("    • Lab Requisition Panels")
    print("    • Pharmacy Inventory & Expiry Tracking")
    print("    • Discharge Summary Generation")
    print("    • Maternity, Dental & Eye Modules")
    print("    • Patient Home Base Concept")
    print("    • Cashier Revenue & Expense Tracking")
    print("    • Collapsible Admin & Cashier Views")
    print("    • Payment Methods (Cash/SHA/Insurance)")
    print("    • CSV Export & Full Database Backup")
    print()
    print("  📋 Departments:")
    print("    Registration | Triage | Consultation | Laboratory")
    print("    Radiology | Pharmacy | Ward | Dietary | Blood Bank")
    print("    Social Work | Physiotherapy | Isolation | Med Records")
    print("    Cashier | Referral | SHA | Morgue | Store")
    print("    Manager | Admin | Emergency | Pediatrics")
    print("    Appointments | Maternity | Dental | Eye")
    print()
    print("  🌐 Access:")
    protocol = 'https' if ssl_context else 'http'
    print("    Local:   " + protocol + "://127.0.0.1:" + str(port))
    print("    Network: " + protocol + "://0.0.0.0:" + str(port))
    print()
    print("  🔑 Default Logins (change after first login):")
    print("    admin / password123")
    print("    registration / password123")
    print("    doctor / password123")
    print("    cashier / password123")
    print("    ward / password123")
    print("    lab / password123")
    print("    (All 22 users use: password123)")
    print()
    print("  💡 Tip: Use 🔑 Password button in header to change password")
    print()
    print("  Press CTRL+C to stop the server")
    print("=" * 70)
    print()

    app.run(host='0.0.0.0', port=port, ssl_context=ssl_context, debug=False)
