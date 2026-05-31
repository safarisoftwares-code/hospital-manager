#!/usr/bin/env python3
"""
Database Setup Script - SQLite Version
Hospital Management System v5.0
Developer: Safari Softwares
Copyright (c) 2026 Safari Softwares
"""

import os
import sys
import sqlite3
from dotenv import load_dotenv
import bcrypt

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(__file__), 'hospital.db')
DEFAULT_PASSWORD = os.getenv('DEFAULT_PASSWORD', 'password123')
BACKUP_PATH = os.getenv('BACKUP_PATH', './backups')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def setup_database():
    print("=" * 55)
    print("  HOSPITAL MANAGEMENT SYSTEM v5.0")
    print("  Database Setup - SQLite Edition")
    print("  Developer: Safari Softwares")
    print("=" * 55)
    print()

    try:
        print("[1/4] Creating database file...")
        if os.path.exists(DB_PATH):
            os.remove(DB_PATH)
            print("      Old database removed.")
        
        conn = get_connection()
        cursor = conn.cursor()
        print(f"      Database created: {DB_PATH}")

        print("[2/4] Creating tables...")
        
        cursor.execute('''
            CREATE TABLE users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL,
                department_name TEXT,
                is_active INTEGER DEFAULT 1,
                last_login TEXT,
                login_attempts INTEGER DEFAULT 0,
                locked_until TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE patients (
                patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                date_of_birth TEXT,
                gender TEXT,
                phone TEXT,
                address TEXT,
                national_id TEXT UNIQUE,
                emergency_contact TEXT,
                emergency_phone TEXT,
                blood_group TEXT,
                allergies TEXT,
                chronic_conditions TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime')),
                updated_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE visits (
                visit_id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER REFERENCES patients(patient_id) ON DELETE CASCADE,
                visit_number TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'registered',
                current_department TEXT DEFAULT 'registration',
                priority TEXT DEFAULT 'normal',
                registration_completed INTEGER DEFAULT 0,
                registration_confirmed_patient INTEGER DEFAULT 0,
                registration_fee_paid INTEGER DEFAULT 0,
                registration_fee_amount REAL DEFAULT 200,
                registration_by INTEGER REFERENCES users(user_id),
                registration_completed_at TEXT,
                triage_completed INTEGER DEFAULT 0,
                triage_confirmed_patient INTEGER DEFAULT 0,
                triage_category TEXT,
                triage_vitals_bp TEXT,
                triage_vitals_hr TEXT,
                triage_vitals_temp TEXT,
                triage_vitals_spo2 TEXT,
                triage_vitals_weight TEXT,
                triage_notes TEXT,
                triage_by INTEGER REFERENCES users(user_id),
                triage_completed_at TEXT,
                consultation_completed INTEGER DEFAULT 0,
                consultation_confirmed_patient INTEGER DEFAULT 0,
                consultation_notes TEXT,
                diagnosis TEXT,
                treatment_plan TEXT,
                prescription TEXT,
                consultation_by INTEGER REFERENCES users(user_id),
                consultation_completed_at TEXT,
                lab_completed INTEGER DEFAULT 0,
                lab_confirmed_patient INTEGER DEFAULT 0,
                lab_orders TEXT,
                lab_results TEXT,
                lab_by INTEGER REFERENCES users(user_id),
                lab_completed_at TEXT,
                radiology_completed INTEGER DEFAULT 0,
                radiology_confirmed_patient INTEGER DEFAULT 0,
                radiology_type TEXT,
                radiology_body_part TEXT,
                radiology_orders TEXT,
                radiology_findings TEXT,
                radiology_by INTEGER REFERENCES users(user_id),
                radiology_completed_at TEXT,
                pharmacy_completed INTEGER DEFAULT 0,
                pharmacy_confirmed_patient INTEGER DEFAULT 0,
                pharmacy_orders TEXT,
                pharmacy_dispensed TEXT,
                pharmacy_by INTEGER REFERENCES users(user_id),
                pharmacy_completed_at TEXT,
                ward_admitted INTEGER DEFAULT 0,
                ward_confirmed_patient INTEGER DEFAULT 0,
                ward_bed_number TEXT,
                ward_notes TEXT,
                ward_by INTEGER REFERENCES users(user_id),
                ward_admission_date TEXT,
                ward_discharge_date TEXT,
                dietary_completed INTEGER DEFAULT 0,
                dietary_confirmed_patient INTEGER DEFAULT 0,
                dietary_plan TEXT,
                dietary_restrictions TEXT,
                dietary_by INTEGER REFERENCES users(user_id),
                bloodbank_completed INTEGER DEFAULT 0,
                bloodbank_confirmed_patient INTEGER DEFAULT 0,
                bloodbank_request_type TEXT,
                bloodbank_units INTEGER,
                bloodbank_blood_group TEXT,
                bloodbank_status TEXT,
                bloodbank_by INTEGER REFERENCES users(user_id),
                socialwork_completed INTEGER DEFAULT 0,
                socialwork_confirmed_patient INTEGER DEFAULT 0,
                socialwork_assessment TEXT,
                socialwork_support_type TEXT,
                socialwork_notes TEXT,
                socialwork_by INTEGER REFERENCES users(user_id),
                physio_completed INTEGER DEFAULT 0,
                physio_confirmed_patient INTEGER DEFAULT 0,
                physio_assessment TEXT,
                physio_treatment_plan TEXT,
                physio_sessions_completed INTEGER DEFAULT 0,
                physio_by INTEGER REFERENCES users(user_id),
                isolation_completed INTEGER DEFAULT 0,
                isolation_confirmed_patient INTEGER DEFAULT 0,
                isolation_type TEXT,
                isolation_precautions TEXT,
                isolation_room_number TEXT,
                isolation_by INTEGER REFERENCES users(user_id),
                medrecords_completed INTEGER DEFAULT 0,
                medrecords_confirmed_patient INTEGER DEFAULT 0,
                medrecords_file_reference TEXT,
                medrecords_notes TEXT,
                medrecords_by INTEGER REFERENCES users(user_id),
                cashier_cleared INTEGER DEFAULT 0,
                cashier_confirmed_patient INTEGER DEFAULT 0,
                cashier_payment_method TEXT,
                cashier_receipt_number TEXT,
                cashier_by INTEGER REFERENCES users(user_id),
                cashier_cleared_at TEXT,
                referral_completed INTEGER DEFAULT 0,
                referral_confirmed_patient INTEGER DEFAULT 0,
                referral_hospital_name TEXT,
                referral_hospital_level TEXT,
                referral_reason TEXT,
                referral_by INTEGER REFERENCES users(user_id),
                sha_completed INTEGER DEFAULT 0,
                sha_confirmed_patient INTEGER DEFAULT 0,
                sha_scheme_name TEXT,
                sha_member_number TEXT,
                sha_authorization_code TEXT,
                sha_status TEXT,
                sha_notes TEXT,
                sha_by INTEGER REFERENCES users(user_id),
                morgue_completed INTEGER DEFAULT 0,
                morgue_confirmed_patient INTEGER DEFAULT 0,
                morgue_cause_of_death TEXT,
                morgue_body_released_to TEXT,
                morgue_notes TEXT,
                morgue_by INTEGER REFERENCES users(user_id),
                patient_cleared INTEGER DEFAULT 0,
                clearance_date TEXT,
                clearance_by INTEGER REFERENCES users(user_id),
                created_at TEXT DEFAULT (datetime('now','localtime')),
                updated_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE visit_history (
                history_id INTEGER PRIMARY KEY AUTOINCREMENT,
                visit_id INTEGER REFERENCES visits(visit_id) ON DELETE CASCADE,
                patient_id INTEGER REFERENCES patients(patient_id) ON DELETE CASCADE,
                from_department TEXT,
                to_department TEXT,
                action_by INTEGER REFERENCES users(user_id),
                action_name TEXT,
                notes TEXT,
                ip_address TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE billing_items (
                bill_id INTEGER PRIMARY KEY AUTOINCREMENT,
                visit_id INTEGER REFERENCES visits(visit_id) ON DELETE CASCADE,
                patient_id INTEGER REFERENCES patients(patient_id) ON DELETE CASCADE,
                item_description TEXT,
                department TEXT,
                amount REAL,
                is_paid INTEGER DEFAULT 0,
                paid_at TEXT,
                paid_by INTEGER REFERENCES users(user_id),
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE audit_log (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(user_id),
                action TEXT,
                table_name TEXT,
                record_id INTEGER,
                new_values TEXT,
                ip_address TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE inventory (
                item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                category TEXT,
                department TEXT,
                current_stock INTEGER DEFAULT 0,
                minimum_stock INTEGER DEFAULT 10,
                unit TEXT,
                unit_price REAL,
                supplier TEXT,
                last_restocked TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE beds (
                bed_id INTEGER PRIMARY KEY AUTOINCREMENT,
                bed_number TEXT UNIQUE NOT NULL,
                ward_type TEXT,
                department TEXT,
                is_occupied INTEGER DEFAULT 0,
                current_visit_id INTEGER REFERENCES visits(visit_id),
                status TEXT DEFAULT 'available',
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')

        cursor.execute('''
            CREATE TABLE blood_inventory (
                blood_id INTEGER PRIMARY KEY AUTOINCREMENT,
                blood_group TEXT NOT NULL,
                units_available INTEGER DEFAULT 0,
                expiry_date TEXT,
                source TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        ''')
        
        conn.commit()
        print("      All tables created.")

        print("[3/4] Creating users...")
        hashed = bcrypt.hashpw(DEFAULT_PASSWORD.encode(), bcrypt.gensalt(rounds=12)).decode()

        users = [
            ('admin', 'System Administrator', 'admin', 'Administration'),
            ('registration', 'Alice - Registration Officer', 'registration', 'Registration Desk'),
            ('triage', 'Bob - Triage Nurse', 'triage', 'Triage Room'),
            ('doctor', 'Dr. Carol - Medical Officer', 'consultation', 'Consultation Room'),
            ('lab', 'David - Lab Technician', 'laboratory', 'Laboratory'),
            ('radiology', 'Eve - Radiologist', 'radiology', 'Radiology Department'),
            ('pharmacy', 'Frank - Pharmacist', 'pharmacy', 'Pharmacy'),
            ('ward', 'Grace - Ward Nurse', 'ward', 'Inpatient Ward'),
            ('dietary', 'Hank - Dietary Officer', 'dietary', 'Dietary Services'),
            ('bloodbank', 'Iris - Blood Bank Officer', 'bloodbank', 'Blood Bank'),
            ('socialwork', 'Jack - Social Worker', 'socialwork', 'Social Work Department'),
            ('physio', 'Kate - Physiotherapist', 'physio', 'Physiotherapy'),
            ('isolation', 'Leo - Isolation Nurse', 'isolation', 'Isolation Ward'),
            ('medrecords', 'Mary - Medical Records Officer', 'medrecords', 'Medical Records'),
            ('cashier', 'Nick - Cashier', 'cashier', 'Cashier Booth'),
            ('referral', 'Olivia - Referral Coordinator', 'referral', 'Referral Desk'),
            ('sha', 'Paul - SHA Officer', 'sha', 'SHA Desk'),
            ('morgue', 'Quinn - Mortuary Attendant', 'morgue', 'Morgue'),
            ('store', 'Ryan - Store Keeper', 'store', 'Central Store'),
            ('manager', 'Sarah - Hospital Manager', 'manager', 'Administration'),
            ('emergency', 'Tom - A&E Nurse', 'emergency', 'Accident & Emergency'),
            ('pediatrics', 'Uma - Pediatrician', 'pediatrics', 'Pediatrics Department'),
        ]

        for username, full_name, role, dept in users:
            cursor.execute(
                'INSERT INTO users (username, password, full_name, role, department_name) VALUES (?, ?, ?, ?, ?)',
                (username, hashed, full_name, role, dept)
            )

        conn.commit()
        print(f"      {len(users)} users created. Default password: {DEFAULT_PASSWORD}")

        print("[4/4] Adding sample data...")

        inventory_items = [
            ('Paracetamol 500mg', 'Medicine', 'pharmacy', 500, 50, 'tablets', 5.00),
            ('Surgical Gloves', 'Supplies', 'ward', 200, 30, 'pairs', 50.00),
            ('Syringes 5ml', 'Supplies', 'laboratory', 300, 40, 'pieces', 15.00),
        ]
        for item in inventory_items:
            cursor.execute(
                'INSERT INTO inventory (item_name, category, department, current_stock, minimum_stock, unit, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
                item
            )

        beds = [
            ('GW-01', 'General', 'ward'),
            ('GW-02', 'General', 'ward'),
            ('MW-01', 'Maternity', 'ward'),
            ('IC-01', 'ICU', 'ward'),
            ('ISO-01', 'Isolation', 'isolation'),
        ]
        for bed in beds:
            cursor.execute(
                'INSERT INTO beds (bed_number, ward_type, department) VALUES (?, ?, ?)',
                bed
            )

        blood_groups = [
            ('A+', 15, '2026-06-30'),
            ('O+', 20, '2026-07-10'),
            ('B+', 12, '2026-07-20'),
        ]
        for bg in blood_groups:
            cursor.execute(
                'INSERT INTO blood_inventory (blood_group, units_available, expiry_date) VALUES (?, ?, ?)',
                bg
            )

        conn.commit()
        conn.close()

        os.makedirs(BACKUP_PATH, exist_ok=True)

        print()
        print("=" * 55)
        print("  DATABASE SETUP COMPLETE!")
        print("=" * 55)
        print()
        print(f"  Database: {DB_PATH}")
        print(f"  Users: {len(users)} | Beds: {len(beds)} | Inventory: {len(inventory_items)} | Blood: {len(blood_groups)}")
        print(f"  Default Password: {DEFAULT_PASSWORD}")
        print("  CHANGE PASSWORDS AFTER FIRST LOGIN!")
        print()
        print("  Start server: python server.py")
        print("=" * 55)

    except Exception as e:
        print(f"\n  ERROR: {e}")
        sys.exit(1)

if __name__ == '__main__':
    setup_database()