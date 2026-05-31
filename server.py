#!/usr/bin/env python3
"""
Hospital Management System v5.0
Complete Python/Flask Backend - SQLite Edition
Developer: Safari Softwares
Copyright (c) 2026 Safari Softwares
All Rights Reserved
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

load_dotenv()

app = Flask(__name__, static_folder='public', static_url_path='')
app.secret_key = os.getenv('SESSION_SECRET', 'change-this-secret-key-to-something-random')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Strict'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=int(os.getenv('SESSION_MAX_HOURS', 12)))

CORS(app, supports_credentials=True)

DB_PATH = os.path.join(os.path.dirname(__file__), 'hospital.db')


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


# =====================================================================
# AUTHENTICATION ROUTES
# =====================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    Authenticate a user with username and password.
    ACCOUNT LOCKOUT DISABLED - Users can attempt unlimited times.
    """
    try:
        data = request.get_json()
        username = data.get('username', '').strip().lower()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required.'
            })

        if len(username) > 50 or len(password) > 100:
            return jsonify({
                'success': False,
                'message': 'Invalid input length.'
            })

        user = query(
            'SELECT * FROM users WHERE username = ? AND is_active = 1',
            (username,),
            fetchone=True
        )

        if not user:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password.'
            })

        locked = user['locked_until']
        if locked is not None and locked != '':
            if locked > datetime.now().strftime('%Y-%m-%d %H:%M:%S'):
                return jsonify({
                    'success': False,
                    'message': 'Account temporarily locked. Try again later.'
                })

        if not bcrypt.checkpw(password.encode(), user['password'].encode()):
            attempts = (user['login_attempts'] or 0) + 1
            query(
                'UPDATE users SET login_attempts = ? WHERE user_id = ?',
                (attempts, user['user_id'])
            )
            return jsonify({
                'success': False,
                'message': 'Invalid username or password.'
            })

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        query(
            'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = ? WHERE user_id = ?',
            (current_time, user['user_id'])
        )

        session['user'] = {
            'user_id': user['user_id'],
            'username': user['username'],
            'full_name': user['full_name'],
            'role': user['role'],
            'department_name': user['department_name'] or ''
        }

        return jsonify({
            'success': True,
            'user': session['user']
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    """Clear the current user session."""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully.'})


@app.route('/api/auth/me')
def me():
    """Return the currently authenticated user or false."""
    if 'user' in session:
        return jsonify({'authenticated': True, 'user': session['user']})
    return jsonify({'authenticated': False})


@app.route('/api/change-password', methods=['POST'])
@require_auth
def change_password():
    """Allow any authenticated user to change their own password."""
    try:
        data = request.get_json()
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')

        if not current_password or not new_password:
            return jsonify({
                'success': False,
                'message': 'Both current and new password are required.'
            })

        if len(new_password) < 6:
            return jsonify({
                'success': False,
                'message': 'New password must be at least 6 characters long.'
            })

        user = query(
            'SELECT * FROM users WHERE user_id = ?',
            (session['user']['user_id'],),
            fetchone=True
        )

        if not bcrypt.checkpw(current_password.encode(), user['password'].encode()):
            return jsonify({
                'success': False,
                'message': 'Current password is incorrect.'
            })

        hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
        query(
            'UPDATE users SET password = ? WHERE user_id = ?',
            (hashed, session['user']['user_id'])
        )

        return jsonify({
            'success': True,
            'message': 'Password changed successfully!'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =====================================================================
# PATIENT ROUTES
# =====================================================================

@app.route('/api/patients', methods=['POST'])
@require_role('registration')
def create_patient():
    """
    Register a new patient.
    National ID is REQUIRED for unique identification.
    If patient already exists, returns the existing record.
    The response includes patient_id at the TOP LEVEL for easy access.
    """
    try:
        data = request.get_json()
        first_name = str(data.get('first_name', '')).strip()[:100]
        last_name = str(data.get('last_name', '')).strip()[:100]

        if not first_name or not last_name:
            return jsonify({
                'success': False,
                'error': 'First name and last name are required.'
            })

        date_of_birth = parse_date(data.get('date_of_birth', ''))
        national_id = str(data.get('national_id', '')).strip()[:50]

        if not national_id:
            return jsonify({
                'success': False,
                'error': 'National ID or Birth Certificate number is required.'
            })

        existing_patient = query(
            'SELECT * FROM patients WHERE national_id = ?',
            (national_id,),
            fetchone=True
        )

        if existing_patient:
            ex = dict_from_row(existing_patient)
            return jsonify({
                'success': True,
                'patient_id': ex['patient_id'],
                'patient': ex,
                'existing': True,
                'message': 'Patient already registered with this National ID.'
            })

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        query(
            '''INSERT INTO patients (
                first_name, last_name, date_of_birth, gender, phone, address,
                national_id, emergency_contact, emergency_phone, blood_group,
                allergies, chronic_conditions, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                first_name,
                last_name,
                date_of_birth,
                data.get('gender'),
                str(data.get('phone', ''))[:30],
                str(data.get('address', ''))[:200],
                national_id,
                str(data.get('emergency_contact', ''))[:100],
                str(data.get('emergency_phone', ''))[:30],
                data.get('blood_group'),
                str(data.get('allergies', ''))[:200],
                str(data.get('chronic_conditions', ''))[:200],
                current_time,
                current_time
            )
        )

        new_id = query('SELECT last_insert_rowid() as id', fetchone=True)['id']
        patient = dict_from_row(query(
            'SELECT * FROM patients WHERE patient_id = ?',
            (new_id,),
            fetchone=True
        ))

        return jsonify({
            'success': True,
            'patient_id': new_id,
            'patient': patient,
            'existing': False
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/patients/search')
@require_auth
def search_patients():
    """Search patients by name, National ID, or phone. Accessible by ALL users."""
    search_query = str(request.args.get('q', '')).strip()[:50]

    if len(search_query) < 2:
        return jsonify([])

    like_pattern = f'%{search_query}%'

    results = query(
        '''SELECT * FROM patients
           WHERE first_name LIKE ? OR last_name LIKE ?
           OR national_id LIKE ? OR phone LIKE ?
           ORDER BY created_at DESC LIMIT 30''',
        (like_pattern, like_pattern, like_pattern, like_pattern),
        fetchall=True
    )

    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/patients/<int:pid>')
@require_auth
def get_patient(pid):
    """Get a single patient by ID. Accessible by ALL users."""
    result = query(
        'SELECT * FROM patients WHERE patient_id = ?',
        (pid,),
        fetchone=True
    )

    if not result:
        return jsonify({'error': 'Patient not found.'}), 404

    return jsonify(dict_from_row(result))


@app.route('/api/patients/<int:pid>', methods=['PUT'])
@require_auth
def update_patient(pid):
    """Update patient details. Accessible by ALL authenticated users."""
    try:
        data = request.get_json()
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        query(
            '''UPDATE patients SET
               first_name = ?, last_name = ?, phone = ?, address = ?,
               emergency_contact = ?, emergency_phone = ?,
               blood_group = ?, allergies = ?, chronic_conditions = ?,
               updated_at = ?
               WHERE patient_id = ?''',
            (
                str(data.get('first_name', ''))[:100],
                str(data.get('last_name', ''))[:100],
                str(data.get('phone', ''))[:30],
                str(data.get('address', ''))[:200],
                str(data.get('emergency_contact', ''))[:100],
                str(data.get('emergency_phone', ''))[:30],
                data.get('blood_group'),
                str(data.get('allergies', ''))[:200],
                str(data.get('chronic_conditions', ''))[:200],
                current_time,
                pid
            )
        )

        updated_patient = dict_from_row(query(
            'SELECT * FROM patients WHERE patient_id = ?',
            (pid,),
            fetchone=True
        ))

        return jsonify({
            'success': True,
            'patient': updated_patient,
            'message': 'Patient updated successfully.'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
    
# =====================================================================
# VISIT ROUTES
# =====================================================================

@app.route('/api/register-and-visit', methods=['POST'])
@require_role('registration')
def register_and_visit():
    """ONE‑STEP: creates patient (or finds existing) + visit. No more ID passing."""
    try:
        data = request.get_json()
        first = str(data.get('first_name', '')).strip()[:100]
        last  = str(data.get('last_name',  '')).strip()[:100]
        nid   = str(data.get('national_id', '')).strip()[:50]

        if not first or not last:
            return jsonify({'success': False, 'error': 'First and last name required.'})
        if not nid:
            return jsonify({'success': False, 'error': 'National ID / Birth Certificate required.'})

                # --- 1. Get or create patient (SINGLE CONNECTION) ---
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
                         created_at,updated_at)
                         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                      (first, last, dob, data.get('gender'), str(data.get('phone',''))[:30],
                       str(data.get('address',''))[:200], nid, str(data.get('emergency_contact',''))[:100],
                       str(data.get('emergency_phone',''))[:30], data.get('blood_group'),
                       str(data.get('allergies',''))[:200], str(data.get('chronic_conditions',''))[:200], now, now))
            pid = cur.lastrowid
            existing = False
        
        conn.commit()
        cur.close()
        conn.close()

        # --- 2. Check for active visit ---
        active = query('''SELECT * FROM visits
                         WHERE patient_id = ? AND patient_cleared = 0 AND morgue_completed = 0''',
                       (pid,), fetchone=True)
        if active:
            return jsonify({
                'success': True,
                'message': 'Active visit already exists.',
                'visit': dict_from_row(active),
                'already_active': True
            })

                # --- 3. Create visit, history, and billing (SINGLE CONNECTION) ---
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
                  (vid, pid, 'OUTSIDE', 'REGISTRATION', session['user']['user_id'], 'Registered',
                   'Fee: KES '+str(fa)+(' (Paid)' if fp else ' (Pending)')))

        cur2.execute('''INSERT INTO billing_items (visit_id,patient_id,item_description,department,amount,
                     is_paid,paid_at,paid_by) VALUES (?,?,?,?,?,?,?,?)''',
                  (vid, pid, 'Registration Fee', 'registration', fa, fp,
                   now if fp else None, session['user']['user_id'] if fp else None))

        conn2.commit()

        # Get the full visit record
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
    try:
        data = request.get_json()
        patient_id = int(data.get('patient_id', 0))
        if not patient_id:
            return jsonify({'success': False, 'error': 'Invalid patient ID.'})

        # Check for existing active visit
        active_visit = query(
            'SELECT * FROM visits WHERE patient_id = ? AND patient_cleared = 0 AND morgue_completed = 0',
            (patient_id,), fetchone=True
        )

        if active_visit is not None:
            try:
                av = dict(active_visit)
                vn = av.get('visit_number', 'Unknown')
            except Exception:
                vn = 'Unknown'
            return jsonify({
                'success': False,
                'message': 'Patient already has an active visit: ' + str(vn),
                'visit': {'visit_number': str(vn)},
                'already_active': True
            })

        # Create new visit
        visit_number = 'VIS-' + datetime.now().strftime('%y%m%d') + '-' + ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=4)
        )
        fee_paid = 1 if data.get('registration_fee_paid', False) else 0
        fee_amount = float(data.get('registration_fee_amount', 200))
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        query(
            '''INSERT INTO visits (patient_id, visit_number, registration_fee_paid,
               registration_fee_amount, registration_by, registration_completed,
               registration_completed_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)''',
            (patient_id, visit_number, fee_paid, fee_amount,
             session['user']['user_id'], current_time, current_time, current_time)
        )
        visit_id = query('SELECT last_insert_rowid() as id', fetchone=True)['id']

        query(
            'INSERT INTO visit_history (visit_id, patient_id, from_department, to_department, action_by, action_name, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (visit_id, patient_id, 'OUTSIDE', 'REGISTRATION', session['user']['user_id'], 'Patient Registered',
             'Fee: KES ' + str(fee_amount) + (' (Paid)' if fee_paid else ' (Pending)'))
        )

        query(
            'INSERT INTO billing_items (visit_id, patient_id, item_description, department, amount, is_paid, paid_at, paid_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (visit_id, patient_id, 'Registration Fee', 'registration', fee_amount, fee_paid,
             current_time if fee_paid else None, session['user']['user_id'] if fee_paid else None)
        )

        result = query(
            '''SELECT v.*, p.first_name, p.last_name, p.gender, p.date_of_birth,
               p.national_id, p.phone, p.address, p.blood_group, p.allergies,
               p.chronic_conditions, p.emergency_contact, p.emergency_phone
               FROM visits v JOIN patients p ON v.patient_id = p.patient_id
               WHERE v.visit_id = ?''',
            (visit_id,), fetchone=True
        )

        return jsonify({'success': True, 'visit': dict_from_row(result)})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/visits/<int:vid>/send-to-triage', methods=['POST'])
@require_role('registration')
def send_to_triage(vid):
    """
    Transfer patient from Registration to Triage.
    Updates current_department and logs transfer.
    """
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    query(
        '''UPDATE visits SET
           current_department = ?, status = ?,
           registration_completed = 1, updated_at = ?
           WHERE visit_id = ?''',
        ('triage', 'in_triage', current_time, vid)
    )

    query(
        '''INSERT INTO visit_history (
            visit_id, patient_id, from_department, to_department,
            action_by, action_name, notes
        ) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
           FROM visits WHERE visit_id = ?''',
        ('registration', 'triage', session['user']['user_id'],
         'Sent to Triage', 'Patient sent for triage assessment', vid)
    )

    return jsonify({
        'success': True,
        'message': 'Patient sent to Triage successfully.'
    })


@app.route('/api/visits/<int:vid>/confirm-patient', methods=['POST'])
@require_auth
def confirm_patient(vid):
    """
    Confirm patient identity at any department.
    Sets [role]_confirmed_patient flag.
    If column doesn't exist, still logs to history.
    """
    data = request.get_json()
    field_name = session['user']['role'] + '_confirmed_patient'
    confirmed = 1 if data.get('confirmed', False) else 0
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Try to update the confirmation field
    try:
        query(
            'UPDATE visits SET ' + field_name + ' = ?, updated_at = ? WHERE visit_id = ?',
            (confirmed, current_time, vid)
        )
    except:
        pass  # Column might not exist - that's okay

    # Always log to history
    query(
        '''INSERT INTO visit_history (
            visit_id, patient_id, from_department, to_department,
            action_by, action_name, notes
        ) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
           FROM visits WHERE visit_id = ?''',
        (session['user']['role'], session['user']['role'],
         session['user']['user_id'], 'Patient Identity Confirmed',
         'Confirmed by ' + session['user']['full_name'], vid)
    )

    return jsonify({'success': True})


@app.route('/api/visits/<int:vid>/transfer', methods=['POST'])
@require_auth
def transfer_patient(vid):
    """
    Transfer patient between departments.
    If complete_department=True, source department marked complete.
    If complete_department=False, patient copied to destination
    but remains in source queue (multi-transfer).
    """
    data = request.get_json()
    to_department = data.get('to_department', '')
    notes = data.get('notes', '')
    complete_department = data.get('complete_department', False)
    from_department = session['user']['role']
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Mark source department complete if requested
    if complete_department:
        query(
            'UPDATE visits SET ' + from_department + '_completed = 1, ' +
            from_department + '_completed_at = ?, ' +
            from_department + '_by = ?, updated_at = ? WHERE visit_id = ?',
            (current_time, session['user']['user_id'], current_time, vid)
        )

    # Update current department
    query(
        'UPDATE visits SET current_department = ?, status = ?, updated_at = ? WHERE visit_id = ?',
        (to_department, 'in_' + to_department, current_time, vid)
    )

    # Log transfer
    query(
        '''INSERT INTO visit_history (
            visit_id, patient_id, from_department, to_department,
            action_by, action_name, notes
        ) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
           FROM visits WHERE visit_id = ?''',
        (from_department, to_department, session['user']['user_id'],
         'Transferred to ' + to_department, notes, vid)
    )

    return jsonify({
        'success': True,
        'message': 'Patient transferred to ' + to_department + '.'
    })


@app.route('/api/visits/department/<dept>')
@require_auth
def department_visits(dept):
    """Get all patients currently in a specific department."""
    dept = str(dept).replace('/', '').replace('\\', '')[:30]

    results = query(
        '''SELECT v.*, p.first_name, p.last_name, p.gender,
           p.date_of_birth, p.national_id
           FROM visits v
           JOIN patients p ON v.patient_id = p.patient_id
           WHERE v.current_department = ?
           AND v.patient_cleared = 0
           AND v.morgue_completed = 0
           ORDER BY CASE WHEN v.priority = 'emergency' THEN 0 ELSE 1 END,
           v.updated_at DESC LIMIT 100''',
        (dept,),
        fetchall=True
    )

    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/visits/active')
@require_auth
def active_visits():
    """Get all active visits across all departments."""
    results = query(
        '''SELECT v.*, p.first_name, p.last_name, p.gender, p.national_id
           FROM visits v
           JOIN patients p ON v.patient_id = p.patient_id
           WHERE v.patient_cleared = 0
           AND v.morgue_completed = 0
           ORDER BY v.updated_at DESC LIMIT 200''',
        fetchall=True
    )

    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/visits/<int:vid>')
@require_auth
def get_visit(vid):
    """Get complete visit details with ALL patient information."""
    result = query(
        '''SELECT v.*, p.*
           FROM visits v
           JOIN patients p ON v.patient_id = p.patient_id
           WHERE v.visit_id = ?''',
        (vid,),
        fetchone=True
    )

    if not result:
        return jsonify({'error': 'Visit not found.'}), 404

    return jsonify(dict_from_row(result))


@app.route('/api/visits/<int:vid>/history')
@require_auth
def visit_history(vid):
    """Get complete transfer and treatment history for a visit."""
    results = query(
        '''SELECT vh.*, u.full_name
           FROM visit_history vh
           LEFT JOIN users u ON vh.action_by = u.user_id
           WHERE vh.visit_id = ?
           ORDER BY vh.created_at DESC LIMIT 200''',
        (vid,),
        fetchall=True
    )

    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/visits/<int:vid>', methods=['PUT'])
@require_auth
def update_visit(vid):
    """
    Update visit fields. Any authenticated user can update relevant fields.
    Treatment info (diagnosis, treatment_plan) auto-logged to history.
    """
    data = request.get_json()

    allowed_fields = [
        'triage_category', 'triage_vitals_bp', 'triage_vitals_hr',
        'triage_vitals_temp', 'triage_vitals_spo2', 'triage_vitals_weight',
        'triage_notes',
        'diagnosis', 'treatment_plan', 'consultation_notes',
        'lab_orders', 'lab_results',
        'radiology_type', 'radiology_body_part', 'radiology_orders',
        'radiology_findings',
        'pharmacy_orders', 'pharmacy_dispensed',
        'ward_bed_number', 'ward_notes', 'ward_admitted',
        'dietary_plan', 'dietary_restrictions',
        'bloodbank_request_type', 'bloodbank_units', 'bloodbank_blood_group',
        'bloodbank_status',
        'socialwork_assessment', 'socialwork_support_type', 'socialwork_notes',
        'physio_assessment', 'physio_treatment_plan', 'physio_sessions_completed',
        'isolation_type', 'isolation_precautions', 'isolation_room_number',
        'medrecords_file_reference', 'medrecords_notes',
        'cashier_payment_method', 'cashier_receipt_number',
        'referral_hospital_name', 'referral_hospital_level', 'referral_reason',
        'referral_completed',
        'sha_scheme_name', 'sha_member_number', 'sha_authorization_code',
        'sha_status', 'sha_notes', 'sha_completed',
        'morgue_cause_of_death', 'morgue_body_released_to', 'morgue_notes',
        'morgue_completed',
        'status', 'priority'
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
        return jsonify({
            'success': False,
            'message': 'No valid fields to update.'
        })

    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    values.append(current_time)
    values.append(vid)

    query(
        'UPDATE visits SET ' + ', '.join(updates) + ', updated_at = ? WHERE visit_id = ?',
        tuple(values)
    )

    # Auto-log treatment to history
    if data.get('diagnosis') or data.get('treatment_plan'):
        treatment_note = ''
        if data.get('diagnosis'):
            treatment_note += 'Diagnosis: ' + str(data.get('diagnosis'))[:500]
        if data.get('treatment_plan'):
            if treatment_note:
                treatment_note += '. '
            treatment_note += 'Treatment: ' + str(data.get('treatment_plan'))[:500]

        query(
            '''INSERT INTO visit_history (
                visit_id, patient_id, from_department, to_department,
                action_by, action_name, notes
            ) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
            (session['user']['role'], session['user']['role'],
             session['user']['user_id'], 'Treatment Recorded',
             treatment_note, vid)
        )

    updated_visit = dict_from_row(query(
        'SELECT * FROM visits WHERE visit_id = ?',
        (vid,),
        fetchone=True
    ))

    return jsonify({
        'success': True,
        'visit': updated_visit
    })


# =====================================================================
# BILLING ROUTES
# =====================================================================

@app.route('/api/billing', methods=['POST'])
@require_auth
def add_bill():
    """
    Add a bill/invoice for a patient visit.
    ANY authenticated user from ANY department can add bills.
    Amount is entered by the user (NOT fixed).
    """
    try:
        data = request.get_json()

        query(
            '''INSERT INTO billing_items (
                visit_id, patient_id, item_description, department, amount
            ) VALUES (?, ?, ?, ?, ?)''',
            (
                int(data['visit_id']),
                int(data['patient_id']),
                str(data.get('item_description', ''))[:255],
                str(data.get('department', ''))[:50],
                float(data.get('amount', 0))
            )
        )

        return jsonify({
            'success': True,
            'message': 'Bill added successfully.'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/billing/<int:vid>')
@require_auth
def get_billing(vid):
    """
    Get all billing items for a visit.
    Returns bills array plus calculated total, paid, and balance.
    """
    results = query(
        'SELECT * FROM billing_items WHERE visit_id = ? ORDER BY created_at',
        (vid,),
        fetchall=True
    )

    bills = [dict_from_row(r) for r in results]
    total = sum(float(b['amount'] or 0) for b in bills)
    paid = sum(float(b['amount'] or 0) for b in bills if b['is_paid'])
    balance = total - paid

    return jsonify({
        'bills': bills,
        'total': total,
        'paid': paid,
        'balance': balance
    })


@app.route('/api/billing/<int:bid>/pay', methods=['PUT'])
@require_role('cashier', 'doctor', 'consultation', 'laboratory', 'radiology',
              'pharmacy', 'ward', 'admin')
def pay_bill(bid):
    """
    Mark a bill as paid.
    Multiple roles can mark bills paid: cashier, doctor, consultation,
    laboratory, radiology, pharmacy, ward, and admin.
    """
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    query(
        'UPDATE billing_items SET is_paid = 1, paid_at = ?, paid_by = ? WHERE bill_id = ?',
        (current_time, session['user']['user_id'], bid)
    )

    return jsonify({
        'success': True,
        'message': 'Bill marked as paid successfully.'
    })


@app.route('/api/billing/<int:bid>', methods=['DELETE'])
@require_auth
def delete_bill(bid):
    """
    Delete a bill/invoice. Useful for removing mistakenly added bills.
    Any authenticated user can delete bills.
    """
    try:
        query('DELETE FROM billing_items WHERE bill_id = ?', (bid,))

        return jsonify({
            'success': True,
            'message': 'Bill deleted successfully.'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# =====================================================================
# DISCHARGE ROUTE
# =====================================================================

@app.route('/api/visits/<int:vid>/discharge', methods=['POST'])
@require_role('cashier', 'doctor', 'consultation', 'pharmacy', 'admin')
def discharge(vid):
    """
    Discharge a patient from the hospital.
    ALL bills must be paid before discharge.
    Roles: cashier, doctor, consultation, pharmacy, admin.
    Frees the bed if patient was admitted.
    """
    try:
        # Check for unpaid bills
        unpaid = query(
            'SELECT COUNT(*) as c FROM billing_items WHERE visit_id = ? AND is_paid = 0',
            (vid,),
            fetchone=True
        )

        if unpaid['c'] > 0:
            return jsonify({
                'success': False,
                'message': 'Cannot discharge. There are ' + str(unpaid['c']) +
                          ' unpaid bill(s). Please clear all bills first.'
            })

        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Mark any remaining bills as paid
        query(
            '''UPDATE billing_items SET is_paid = 1, paid_at = ?, paid_by = ?
               WHERE visit_id = ? AND is_paid = 0''',
            (current_time, session['user']['user_id'], vid)
        )

        # Update visit as cleared/discharged
        query(
            '''UPDATE visits SET
               patient_cleared = 1, clearance_date = ?, clearance_by = ?,
               status = ?, current_department = ?, updated_at = ?
               WHERE visit_id = ?''',
            (current_time, session['user']['user_id'], 'discharged',
             'discharged', current_time, vid)
        )

        # Free bed if patient was admitted
        if request.get_json().get('free_bed'):
            query(
                "UPDATE beds SET is_occupied = 0, current_visit_id = NULL, status = 'available' WHERE current_visit_id = ?",
                (vid,)
            )

        # Log discharge
        query(
            '''INSERT INTO visit_history (
                visit_id, patient_id, from_department, to_department,
                action_by, action_name, notes
            ) SELECT visit_id, patient_id, ?, ?, ?, ?, ?
               FROM visits WHERE visit_id = ?''',
            ('cashier', 'DISCHARGED', session['user']['user_id'],
             'Patient Discharged', 'All bills cleared - patient discharged from hospital', vid)
        )

        return jsonify({
            'success': True,
            'message': 'Patient discharged successfully!'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# =====================================================================
# INVENTORY ROUTES
# =====================================================================

@app.route('/api/inventory')
@require_auth
def get_inventory():
    """Get all inventory items ordered by current stock (lowest first)."""
    results = query(
        'SELECT * FROM inventory ORDER BY current_stock ASC',
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/inventory/low-stock')
@require_auth
def low_stock():
    """Get items at or below minimum stock level."""
    results = query(
        'SELECT * FROM inventory WHERE current_stock <= minimum_stock ORDER BY current_stock ASC',
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/inventory', methods=['POST'])
@require_role('store')
def add_inventory():
    """Add new item to inventory. Store keeper and admin only."""
    try:
        data = request.get_json()

        query(
            '''INSERT INTO inventory (
                item_name, category, department, current_stock,
                minimum_stock, unit, unit_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (
                str(data.get('item_name', ''))[:200],
                data.get('category'),
                data.get('department'),
                int(data.get('current_stock', 0)),
                int(data.get('minimum_stock', 10)),
                data.get('unit'),
                float(data.get('unit_price', 0))
            )
        )

        return jsonify({'success': True, 'message': 'Item added to inventory.'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/inventory/<int:iid>', methods=['PUT'])
@require_role('store')
def update_inventory(iid):
    """Update inventory item stock level, minimum, or price."""
    data = request.get_json()
    new_stock = int(data.get('current_stock', 0))

    query(
        '''UPDATE inventory SET current_stock = ?, minimum_stock = ?, unit_price = ?,
           last_restocked = CASE WHEN ? > (SELECT current_stock FROM inventory WHERE item_id = ?)
           THEN datetime('now','localtime') ELSE last_restocked END
           WHERE item_id = ?''',
        (new_stock, int(data.get('minimum_stock', 10)),
         float(data.get('unit_price', 0)), new_stock, iid, iid)
    )

    return jsonify({'success': True, 'message': 'Inventory updated.'})


# =====================================================================
# BEDS ROUTES
# =====================================================================

@app.route('/api/beds')
@require_auth
def get_beds():
    """Get all hospital beds with status."""
    results = query(
        'SELECT * FROM beds ORDER BY department, bed_number',
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/beds/available')
@require_auth
def available_beds():
    """Get only available (unoccupied) beds."""
    results = query(
        "SELECT * FROM beds WHERE is_occupied = 0 AND status = 'available' ORDER BY department, bed_number",
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/beds/assign', methods=['POST'])
@require_role('ward', 'isolation')
def assign_bed():
    """Assign a bed to a patient visit."""
    try:
        data = request.get_json()
        bed_id = int(data.get('bed_id', 0))
        visit_id = int(data.get('visit_id', 0))

        query(
            'UPDATE beds SET is_occupied = 1, current_visit_id = ?, status = ? WHERE bed_id = ?',
            (visit_id, 'occupied', bed_id)
        )

        query(
            '''UPDATE visits SET
               ward_bed_number = (SELECT bed_number FROM beds WHERE bed_id = ?),
               ward_admitted = 1, ward_admission_date = ?
               WHERE visit_id = ?''',
            (bed_id, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), visit_id)
        )

        return jsonify({'success': True, 'message': 'Bed assigned successfully.'})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =====================================================================
# BLOOD BANK ROUTES
# =====================================================================

@app.route('/api/bloodbank')
@require_auth
def blood_inventory():
    """Get blood bank inventory."""
    results = query(
        'SELECT * FROM blood_inventory ORDER BY blood_group',
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


# =====================================================================
# USER MANAGEMENT ROUTES
# =====================================================================

@app.route('/api/users')
@require_auth
def get_users():
    """Get all user accounts. Accessible by all authenticated users."""
    results = query(
        '''SELECT user_id, username, full_name, role, department_name,
           is_active, last_login FROM users ORDER BY role''',
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/users', methods=['POST'])
@require_role('admin')
def add_user():
    """Create a new user account. Admin only."""
    try:
        data = request.get_json()
        username = str(data.get('username', '')).strip().lower()
        password = str(data.get('password', ''))
        full_name = str(data.get('full_name', '')).strip()
        role = str(data.get('role', '')).strip()
        dept = str(data.get('department_name', '')).strip()

        if not username or not password or not full_name or not role:
            return jsonify({
                'success': False,
                'message': 'All fields are required: username, password, full name, and role.'
            })

        existing = query(
            'SELECT user_id FROM users WHERE username = ?',
            (username,),
            fetchone=True
        )
        if existing:
            return jsonify({
                'success': False,
                'message': 'Username already exists. Please choose a different username.'
            })

        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()

        query(
            '''INSERT INTO users (username, password, full_name, role, department_name)
               VALUES (?, ?, ?, ?, ?)''',
            (username, hashed, full_name, role, dept)
        )

        return jsonify({
            'success': True,
            'message': 'User created successfully.'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/users/<int:uid>', methods=['PUT'])
@require_role('admin')
def update_user(uid):
    """Update user details. Admin only."""
    try:
        data = request.get_json()
        full_name = str(data.get('full_name', '')).strip()
        role = str(data.get('role', '')).strip()
        dept = str(data.get('department_name', '')).strip()
        is_active = 1 if data.get('is_active', True) else 0

        query(
            '''UPDATE users SET full_name = ?, role = ?, department_name = ?,
               is_active = ? WHERE user_id = ?''',
            (full_name, role, dept, is_active, uid)
        )

        if data.get('password'):
            hashed = bcrypt.hashpw(
                data['password'].encode(),
                bcrypt.gensalt(rounds=12)
            ).decode()
            query(
                'UPDATE users SET password = ? WHERE user_id = ?',
                (hashed, uid)
            )

        return jsonify({
            'success': True,
            'message': 'User updated successfully.'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =====================================================================
# DASHBOARD ROUTES
# =====================================================================

@app.route('/api/dashboard')
@require_auth
def dashboard():
    """
    Get dashboard statistics.
    Returns totals for patients, visits, bills, beds, inventory.
    """
    total_patients = query('SELECT COUNT(*) as c FROM patients', fetchone=True)['c']
    active_visits = query(
        'SELECT COUNT(*) as c FROM visits WHERE patient_cleared = 0 AND morgue_completed = 0',
        fetchone=True
    )['c']
    today_visits = query(
        "SELECT COUNT(*) as c FROM visits WHERE date(created_at) = date('now','localtime')",
        fetchone=True
    )['c']
    pending_bills = float(query(
        'SELECT COALESCE(SUM(amount), 0) as t FROM billing_items WHERE is_paid = 0',
        fetchone=True
    )['t'])
    occupied_beds = query(
        'SELECT COUNT(*) as c FROM beds WHERE is_occupied = 1',
        fetchone=True
    )['c']
    low_stock_items = query(
        'SELECT COUNT(*) as c FROM inventory WHERE current_stock <= minimum_stock',
        fetchone=True
    )['c']
    department_counts = query(
        '''SELECT current_department, COUNT(*) as count
           FROM visits WHERE patient_cleared = 0 AND morgue_completed = 0
           GROUP BY current_department ORDER BY count DESC''',
        fetchall=True
    )

    return jsonify({
        'totalPatients': total_patients,
        'activeVisits': active_visits,
        'todayVisits': today_visits,
        'pendingBills': pending_bills,
        'occupiedBeds': occupied_beds,
        'lowStockItems': low_stock_items,
        'departmentCounts': [dict_from_row(r) for r in department_counts],
        'lowBlood': []
    })


@app.route('/api/manager/queues')
@require_role('manager')
def manager_queues():
    """Get department queue statistics for manager dashboard."""
    results = query(
        """SELECT current_department, COUNT(*) as waiting
           FROM visits WHERE patient_cleared = 0 AND morgue_completed = 0
           AND status LIKE 'in_%'
           GROUP BY current_department ORDER BY waiting DESC""",
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


@app.route('/api/manager/revenue')
@require_role('manager')
def manager_revenue():
    """Get daily revenue for last 30 days."""
    results = query(
        """SELECT date(created_at) as date, SUM(amount) as total, COUNT(*) as transactions
           FROM billing_items WHERE is_paid = 1
           AND created_at >= date('now','localtime','-30 days')
           GROUP BY date(created_at) ORDER BY date DESC""",
        fetchall=True
    )
    return jsonify([dict_from_row(r) for r in results])


# =====================================================================
# BACKUP AND EXPORT ROUTES
# =====================================================================

@app.route('/api/export/csv')
@require_role('admin', 'manager')
def export_csv():
    """
    Export all patients and visits as CSV file.
    Can be opened in Excel or any spreadsheet program.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        'Patient ID', 'First Name', 'Last Name', 'DOB', 'Gender', 'Phone',
        'National ID', 'Visit Number', 'Status', 'Department', 'Diagnosis',
        'Registration Fee Paid', 'Created At'
    ])

    results = query(
        '''SELECT p.patient_id, p.first_name, p.last_name, p.date_of_birth, p.gender,
           p.phone, p.national_id, v.visit_number, v.status, v.current_department,
           v.diagnosis, v.registration_fee_paid, v.created_at
           FROM patients p
           LEFT JOIN visits v ON p.patient_id = v.patient_id
           ORDER BY p.created_at DESC''',
        fetchall=True
    )

    for row in results:
        writer.writerow([
            row['patient_id'],
            row['first_name'],
            row['last_name'],
            row['date_of_birth'],
            row['gender'],
            row['phone'],
            row['national_id'],
            row['visit_number'],
            row['status'],
            row['current_department'],
            row['diagnosis'],
            'Yes' if row['registration_fee_paid'] else 'No',
            row['created_at']
        ])

    output.seek(0)
    filename = 'hospital_backup_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.csv'

    return output.getvalue(), 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=' + filename
    }


@app.route('/api/backup/download')
@require_role('admin', 'manager')
def download_database():
    """
    Download complete SQLite database as backup.
    Contains ALL data - patients, visits, billing, users, inventory, etc.
    """
    temp_dir = tempfile.gettempdir()
    backup_file = os.path.join(temp_dir, 'hospital_full_backup.db')

    shutil.copy2(DB_PATH, backup_file)

    download_name = 'hospital_full_backup_' + datetime.now().strftime('%Y%m%d_%H%M%S') + '.db'

    return send_from_directory(
        temp_dir,
        'hospital_full_backup.db',
        as_attachment=True,
        download_name=download_name
    )


# =====================================================================
# SERVE FRONTEND APPLICATION
# =====================================================================

@app.route('/')
@app.route('/<path:path>')
def serve_frontend(path='index.html'):
    """
    Serve the frontend Single Page Application.
    Static files (CSS, JS) served from public folder.
    All other routes return index.html for client-side routing.
    """
    if path and '.' in path:
        return send_from_directory('public', path)
    return send_from_directory('public', 'index.html')


# =====================================================================
# ERROR HANDLERS
# =====================================================================

@app.errorhandler(404)
def not_found(e):
    """Handle 404 Not Found errors."""
    return jsonify({
        'error': 'Resource not found. The requested endpoint does not exist.'
    }), 404


@app.errorhandler(500)
def server_error(e):
    """Handle 500 Internal Server errors."""
    return jsonify({
        'error': 'Internal server error. Please try again or contact administrator.'
    }), 500


# =====================================================================
# START SERVER
# =====================================================================

if __name__ == '__main__':
    """
    Main entry point for the Hospital Management System.
    Starts Flask server on configured port with SSL if certificates exist.
    Listens on all network interfaces (0.0.0.0) for LAN access.
    """

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
        ssl_context.set_ciphers(
            'ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256'
        )
        ssl_context.load_cert_chain(cert_path, key_path, passphrase)

    print()
    print("=" * 65)
    print("  🏥 HOSPITAL MANAGEMENT SYSTEM v5.0")
    print("  Python / Flask Backend - SQLite Edition")
    print("  Developer: Safari Softwares")
    print("  Copyright (c) 2026 Safari Softwares")
    print("  All Rights Reserved")
    print("=" * 65)
    print()
    print("  🔧 Configuration:")
    print("    • Database: SQLite (" + DB_PATH + ")")
    print("    • Port: " + str(port))
    print("    • SSL: " + ("Enabled (HTTPS)" if ssl_context else "Disabled (HTTP)"))
    print()
    print("  ✅ Features Active:")
    print("    • No Account Lockout (unlimited login attempts)")
    print("    • Any Department Can Add Bills")
    print("    • Multi-Role Bill Payment & Discharge")
    print("    • Delete Bills (mistake correction)")
    print("    • Automatic Treatment History Recording")
    print("    • National ID Patient Search")
    print("    • Patient Edit by All Departments")
    print("    • Cashier Can Return Patients to Departments")
    print("    • 22 Hospital Modules Supported")
    print("    • CSV Export & Full Database Backup")
    print()
    print("  📋 Departments:")
    print("    Registration | Triage | Consultation | Laboratory")
    print("    Radiology | Pharmacy | Ward | Dietary | Blood Bank")
    print("    Social Work | Physiotherapy | Isolation | Med Records")
    print("    Cashier | Referral | SHA | Morgue | Store")
    print("    Manager | Admin | Emergency | Pediatrics")
    print()
    print("  🌐 Access:")
    protocol = 'https' if ssl_context else 'http'
    print("    Local:   " + protocol + "://127.0.0.1:" + str(port))
    print("    Network: " + protocol + "://192.168.43.240:" + str(port))
    print()
    print("  🔑 Default Logins (change after first login):")
    print("    admin / password123")
    print("    registration / password123")
    print("    doctor / password123")
    print("    cashier / password123")
    print("    (All 22 users use: password123)")
    print()
    print("  💡 Tip: Use 🔑 Password button in header to change password")
    print()
    print("  Press CTRL+C to stop the server")
    print("=" * 65)
    print()

    app.run(
        host='0.0.0.0',
        port=port,
        ssl_context=ssl_context,
        debug=False
    )