// ============================================
// HOSPITAL MANAGEMENT SYSTEM v5.1
// Real Hospital Workflow Edition
// Complete Frontend JavaScript - All Modules
// Developer: Safari Softwares
// Copyright (c) 2026 Safari Softwares
// All Rights Reserved
// ============================================

const API = '';
let currentUser = null;

// ============ PASSWORD TOGGLE ============
function togglePassword(inputId, icon) {
    var input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

// ============ INITIALIZATION ============
async function init() {
    try {
        var res = await fetch(API + '/api/auth/me');
        var data = await res.json();
        if (data.authenticated) {
            currentUser = data.user;
            showApp();
        }
    } catch (e) {
        console.log('Server not connected');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await handleLogin();
        });
    }
    init();
});

// ============ LOGIN ============
async function handleLogin() {
    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        toast('Please enter username and password', 'error');
        return;
    }

    try {
        var res = await fetch(API + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        });
        var data = await res.json();

        if (data.success) {
            currentUser = data.user;
            showApp();
            toast('Welcome, ' + currentUser.full_name, 'success');
        } else {
            toast(data.message || 'Login failed', 'error');
        }
    } catch (err) {
        toast('Connection error. Is the server running?', 'error');
    }
}

// ============ LOGOUT ============
function logout() {
    fetch(API + '/api/auth/logout', { method: 'POST' }).then(function() {
        currentUser = null;
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('appScreen').style.display = 'none';
        document.getElementById('appFooter').style.display = 'none';
    });
}

// ============ SHOW APPLICATION ============
function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('headerRole').textContent = currentUser.department_name || currentUser.role;
    document.getElementById('headerDept').textContent = 'Dept: ' + currentUser.role.toUpperCase();
    document.getElementById('appFooter').style.display = 'block';

    if (!document.getElementById('changePassBtn')) {
        var headerRight = document.querySelector('.header div:last-child');
        if (headerRight) {
            var btn = document.createElement('button');
            btn.id = 'changePassBtn';
            btn.textContent = '🔑 Password';
            btn.style.cssText = 'background:#8e44ad;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:10px;margin-right:8px;font-weight:600';
            btn.onclick = showChangePasswordForm;
            headerRight.insertBefore(btn, headerRight.firstChild);
        }
    }

    loadDashboard();
}

// ============ TOAST NOTIFICATIONS ============
function toast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toastContainer');
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(function() {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s';
        setTimeout(function() { el.remove(); }, 300);
    }, 4000);
}

// ============ MODALS ============
function closeModal() { document.getElementById('patientModal').style.display = 'none'; }
function closeLegalModal() { document.getElementById('legalModal').style.display = 'none'; }
window.onclick = function(event) {
    if (event.target === document.getElementById('patientModal')) closeModal();
    if (event.target === document.getElementById('legalModal')) closeLegalModal();
};

// ============ DASHBOARD LOADER ============
async function loadDashboard() {
    var content = document.getElementById('dashboardContent');
    try {
        var statsRes = await fetch(API + '/api/dashboard');
        var stats = await statsRes.json();

        var html = '<div class="stats-grid">';
        html += '<div class="stat-card"><div class="number">' + stats.totalPatients + '</div><div class="label">Total Patients</div></div>';
        html += '<div class="stat-card"><div class="number">' + stats.activeVisits + '</div><div class="label">Active Visits</div></div>';
        html += '<div class="stat-card"><div class="number">' + stats.todayVisits + '</div><div class="label">Today</div></div>';
        html += '<div class="stat-card"><div class="number">KES ' + (stats.pendingBills || 0).toLocaleString() + '</div><div class="label">Pending Bills</div></div>';
        html += '<div class="stat-card"><div class="number">' + (stats.occupiedBeds || 0) + '/' + (stats.totalBeds || 5) + '</div><div class="label">Beds Occupied</div></div>';
        html += '<div class="stat-card ' + ((stats.lowStockItems || 0) > 0 ? 'warning' : '') + '"><div class="number">' + (stats.lowStockItems || 0) + '</div><div class="label">Low Stock</div></div>';
        html += '</div>';

        switch (currentUser.role) {
            case 'registration': html += await regScreen(); break;
            case 'triage': html += await triageScreen(); break;
            case 'consultation': html += await consultScreen(); break;
            case 'laboratory': html += await labScreen(); break;
            case 'radiology': html += await radioScreen(); break;
            case 'pharmacy': html += await pharmScreen(); break;
            case 'ward': html += await wardScreen(); break;
            case 'dietary': html += await dietScreen(); break;
            case 'bloodbank': html += await bloodScreen(); break;
            case 'socialwork': html += await socialScreen(); break;
            case 'physio': html += await physioScreen(); break;
            case 'isolation': html += await isoScreeen(); break;
            case 'medrecords': html += await medScreen(); break;
            case 'cashier': html += await cashScreen(); break;
            case 'referral': html += await refScreen(); break;
            case 'sha': html += await shaScreen(); break;
            case 'morgue': html += await morgScreen(); break;
            case 'store': html += await storeScreen(); break;
            case 'manager': html += await mgrScreen(); break;
            case 'admin': html += await adminScreen(); break;
            case 'emergency': html += await emergScreen(); break;
            case 'pediatrics': html += await pedScreen(); break;
            case 'appointments': html += await appointmentScreen(); break;
            case 'maternity': html += await maternityScreen(); break;
            case 'dental': html += await dentalScreen(); break;
            case 'eye': html += await eyeScreen(); break;
            default:
                html += '<div class="card"><div class="card-body"><p>Unknown role: ' + currentUser.role + '</p></div></div>';
        }

        content.innerHTML = html;
        attachEvents();
    } catch (err) {
        content.innerHTML = '<div class="card"><div class="card-body"><p class="alert alert-danger">Error loading dashboard. Check server connection.</p></div></div>';
    }
}

// ============ PATIENT CONFIRMATION BOX ============
function confirmBox(role, visitId, data) {
    var field = role + '_confirmed_patient';
    var isChecked = data[field] ? ' checked' : '';
    var isConfirmed = data[field] ? ' confirmed' : '';
    var allergyWarning = data.allergies ? '<br><span style="color:var(--danger);font-weight:600">⚠️ Allergies: ' + data.allergies + '</span>' : '';

    var html = '<div class="patient-confirm' + isConfirmed + '" style="margin-bottom:10px">';
    html += '<input type="checkbox" id="confirm_' + visitId + '"' + isChecked + ' onchange="toggleConfirm(' + visitId + ',\'' + role + '\')">';
    html += '<label for="confirm_' + visitId + '">✅ I confirm this is the correct patient: <strong>' + data.first_name + ' ' + data.last_name + '</strong> | ' + (data.gender || '?') + ' | ' + (data.national_id || 'No ID') + ' | ' + (data.phone || 'No phone') + allergyWarning + '</label>';
    html += '</div>';
    return html;
}

async function toggleConfirm(visitId, role) {
    var checkbox = document.getElementById('confirm_' + visitId);
    try {
        await fetch(API + '/api/visits/' + visitId + '/confirm-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmed: checkbox.checked })
        });
        var box = checkbox.closest('.patient-confirm');
        if (checkbox.checked) {
            toast('✅ Patient identity confirmed', 'success');
            if (box) box.classList.add('confirmed');
        } else {
            if (box) box.classList.remove('confirmed');
        }
    } catch (err) {
        toast('Error confirming patient', 'error');
    }
}

// ============ PATIENT TABLE RENDERER ============
function pTable(patients) {
    if (!patients || patients.length === 0) {
        return '<p style="color:var(--text-muted)">No patients.</p>';
    }
    var html = '<table><tr><th>Visit#</th><th>Patient</th><th>ID</th><th>Dept</th><th>Status</th><th>Actions</th></tr>';
    for (var i = 0; i < patients.length; i++) {
        var v = patients[i];
        html += '<tr>';
        html += '<td><small>' + v.visit_number + '</small></td>';
        html += '<td><strong>' + v.first_name + ' ' + v.last_name + '</strong></td>';
        html += '<td>' + (v.national_id || 'N/A') + '</td>';
        html += '<td><span style="text-transform:capitalize">' + (v.current_department || '') + '</span></td>';
        html += '<td><span class="badge badge-info">' + (v.status || '') + '</span></td>';
        html += '<td>';
        html += '<button class="btn btn-info btn-small" onclick="viewPatientFull(' + v.visit_id + ')">📋 Full View</button> ';
        html += '<button class="btn btn-warning btn-small" onclick="multiTransfer(' + v.visit_id + ')">📤 Send</button> ';
        html += '<button class="btn btn-success btn-small" onclick="addBillForPatient(' + v.visit_id + ',' + v.patient_id + ')">💰 Bill</button> ';
        html += '<button class="btn btn-purple btn-small" onclick="bookApptForPatient(' + v.patient_id + ')">📅 Book</button>';
        html += '</td></tr>';
    }
    html += '</table>';
    return html;
}

// ============ FULL PATIENT VIEW (ALL DEPARTMENTS) ============
async function viewPatientFull(visitId) {
    try {
        var res = await fetch(API + '/api/visits/' + visitId + '/full-history');
        if (!res.ok) { throw new Error('Server returned ' + res.status); }
        var data = await res.json();
        if (!data.success) { toast('Error: ' + (data.error || 'Unknown error'), 'error'); return; }

        var visit = data.visit;
        var history = data.history || [];
        var bills = data.bills || [];
        var totalBilled = data.total_billed || 0;
        var totalPaid = data.total_paid || 0;
        var totalBalance = data.total_balance || 0;

        document.getElementById('modalTitle').textContent = '📋 Full Patient Record: ' + visit.first_name + ' ' + visit.last_name;
        var body = '';

        // DEMOGRAPHICS
        body += '<div style="background:#e8f5e9;padding:12px;border-radius:6px;margin-bottom:12px">';
        body += '<h4 style="color:var(--primary);margin-bottom:8px">📝 Patient Demographics</h4>';
        body += '<div class="row">';
        body += '<div><p><strong>Name:</strong> ' + visit.first_name + ' ' + visit.last_name + '</p></div>';
        body += '<div><p><strong>Visit:</strong> ' + visit.visit_number + '</p></div>';
        body += '<div><p><strong>DOB:</strong> ' + (visit.date_of_birth || 'N/A') + '</p></div>';
        body += '<div><p><strong>Gender:</strong> ' + (visit.gender || 'N/A') + '</p></div>';
        body += '<div><p><strong>Phone:</strong> ' + (visit.phone || 'N/A') + '</p></div>';
        body += '<div><p><strong>National ID:</strong> ' + (visit.national_id || 'N/A') + '</p></div>';
        body += '<div><p><strong>Blood Group:</strong> ' + (visit.blood_group || 'Unknown') + '</p></div>';
        body += '<div><p><strong>Status:</strong> <span class="badge badge-info">' + (visit.status || '') + '</span></p></div>';
        if (visit.allergies) body += '<div class="full-width"><p style="color:var(--danger)"><strong>⚠️ Allergies:</strong> ' + visit.allergies + '</p></div>';
        if (visit.chronic_conditions) body += '<div class="full-width"><p><strong>Chronic Conditions:</strong> ' + visit.chronic_conditions + '</p></div>';
        if (visit.ward_bed_number) body += '<div class="full-width"><p><strong>🛏️ Bed:</strong> ' + visit.ward_bed_number + ' (Admitted)</p></div>';
        body += '</div></div>';

        // VITALS
        if (visit.triage_category) {
            body += '<div style="background:#e3f2fd;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">🩺 Vital Signs (Triage)</h4>';
            body += '<p><strong>BP:</strong> ' + (visit.triage_vitals_bp || 'N/A') + ' | <strong>HR:</strong> ' + (visit.triage_vitals_hr || 'N/A') + ' | <strong>Temp:</strong> ' + (visit.triage_vitals_temp || 'N/A') + '°C</p>';
            body += '<p><strong>SpO2:</strong> ' + (visit.triage_vitals_spo2 || 'N/A') + '% | <strong>Weight:</strong> ' + (visit.triage_vitals_weight || 'N/A') + 'kg</p>';
            body += '<p><strong>Category:</strong> ' + visit.triage_category + ' | <strong>Notes:</strong> ' + (visit.triage_notes || 'None') + '</p>';
            body += '</div>';
        }

        // DIAGNOSIS
        if (visit.diagnosis) {
            body += '<div style="background:#fff3e0;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">👨‍⚕️ Diagnosis & Treatment</h4>';
            body += '<p><strong>Diagnosis:</strong> ' + visit.diagnosis + '</p>';
            if (visit.treatment_plan) body += '<p><strong>Treatment Plan:</strong> ' + visit.treatment_plan + '</p>';
            if (visit.consultation_notes) body += '<p><strong>Notes:</strong> ' + visit.consultation_notes + '</p>';
            body += '</div>';
        }

        // LAB
        if (visit.lab_orders || visit.lab_results) {
            body += '<div style="background:#f3e5f5;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">🧪 Laboratory</h4>';
            if (visit.lab_orders) body += '<p><strong>Orders:</strong> ' + visit.lab_orders + '</p>';
            if (visit.lab_results) body += '<p><strong>Results:</strong> ' + visit.lab_results + '</p>';
            body += '</div>';
        }

        // RADIOLOGY
        if (visit.radiology_orders || visit.radiology_findings) {
            body += '<div style="background:#e8eaf6;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">🩻 Radiology</h4>';
            body += '<p><strong>Type:</strong> ' + (visit.radiology_type || 'N/A') + ' | <strong>Body Part:</strong> ' + (visit.radiology_body_part || 'N/A') + '</p>';
            if (visit.radiology_orders) body += '<p><strong>Orders:</strong> ' + visit.radiology_orders + '</p>';
            if (visit.radiology_findings) body += '<p><strong>Findings:</strong> ' + visit.radiology_findings + '</p>';
            body += '</div>';
        }

        // PHARMACY
        if (visit.pharmacy_orders || visit.pharmacy_dispensed) {
            body += '<div style="background:#e0f2f1;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">💊 Pharmacy</h4>';
            if (visit.pharmacy_orders) body += '<p><strong>Prescription:</strong> ' + visit.pharmacy_orders + '</p>';
            if (visit.pharmacy_dispensed) body += '<p><strong>Dispensed:</strong> ' + visit.pharmacy_dispensed + '</p>';
            body += '</div>';
        }

        // WARD
        if (visit.ward_notes || visit.ward_bed_number) {
            body += '<div style="background:#fce4ec;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">🛏️ Ward</h4>';
            if (visit.ward_bed_number) body += '<p><strong>Bed:</strong> ' + visit.ward_bed_number + '</p>';
            if (visit.ward_notes) body += '<p><strong>Notes:</strong> ' + visit.ward_notes + '</p>';
            body += '</div>';
        }

        // BILLING
        body += '<hr><h4 style="color:var(--primary)">💰 Billing Summary</h4>';
        body += '<div style="background:#f8f9fa;padding:12px;border-radius:6px;margin-bottom:10px">';
        body += '<div style="display:flex;justify-content:space-between;font-size:14px"><span><strong>Total Billed:</strong></span><span><strong>KES ' + totalBilled.toLocaleString() + '</strong></span></div>';
        body += '<div style="display:flex;justify-content:space-between;color:green;font-size:14px"><span><strong>Total Paid:</strong></span><span><strong>KES ' + totalPaid.toLocaleString() + '</strong></span></div>';
        body += '<div style="display:flex;justify-content:space-between;font-size:16px;color:' + (totalBalance > 0 ? 'red' : 'green') + ';font-weight:bold;border-top:2px solid #ddd;padding-top:8px;margin-top:5px"><span><strong>Balance:</strong></span><span><strong>KES ' + totalBalance.toLocaleString() + '</strong></span></div>';
        body += '</div>';

        body += '<table style="width:100%"><tr><th>Item</th><th>Dept</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th></tr>';
        for (var j = 0; j < bills.length; j++) {
            var b = bills[j];
            body += '<tr>';
            body += '<td>' + b.item_description + '</td>';
            body += '<td><span style="text-transform:capitalize">' + (b.department || '') + '</span></td>';
            body += '<td><strong>KES ' + parseFloat(b.amount || 0).toLocaleString() + '</strong></td>';
            body += '<td>' + (b.payment_method || 'N/A') + '</td>';
            body += '<td>' + (b.is_paid ? '<span class="badge badge-success">✅ Paid</span>' : '<span class="badge badge-warning">❌ Pending</span>') + '</td>';
            body += '<td>';
            if (!b.is_paid) body += '<button class="btn btn-success btn-small" onclick="markBillPaidWithMethod(' + b.bill_id + ',' + visitId + ')">Pay</button> ';
            body += '<button class="btn btn-danger btn-small" onclick="deleteBill(' + b.bill_id + ',' + visitId + ')">🗑️</button>';
            body += '</td></tr>';
        }
        body += '</table>';
        body += '<button class="btn btn-info btn-small" style="margin-top:8px" onclick="addBillForPatient(' + visitId + ',' + visit.patient_id + ')">➕ Add Bill</button>';

        // DISCHARGE BUTTON
        var canDischarge = (currentUser.role === 'admin' || currentUser.role === 'doctor' || currentUser.role === 'consultation' || currentUser.role === 'cashier' || currentUser.role === 'pharmacy');
        if (canDischarge && totalBalance <= 0 && visit.status !== 'discharged') {
            body += '<button class="btn btn-success btn-block" style="margin-top:10px" onclick="dischargePatientDirect(' + visitId + ')">✅ DISCHARGE PATIENT</button>';
        }
        if (canDischarge && visit.status !== 'discharged') {
            body += '<button class="btn btn-info btn-block" style="margin-top:5px" onclick="viewDischargeSummary(' + visitId + ')">📄 View Discharge Summary</button>';
        }

        // TIMELINE
        body += '<hr><h4 style="color:var(--primary)">📋 Visit Timeline (All Departments)</h4>';
        body += '<table style="width:100%"><tr><th>Time</th><th>From</th><th>To</th><th>By</th><th>Notes</th></tr>';
        for (var k = 0; k < history.length; k++) {
            var h = history[k];
            body += '<tr>';
            body += '<td><small>' + new Date(h.created_at).toLocaleString() + '</small></td>';
            body += '<td>' + (h.from_department || '') + '</td>';
            body += '<td>' + (h.to_department || '') + '</td>';
            body += '<td>' + (h.full_name || '') + '</td>';
            body += '<td>' + (h.notes || '') + '</td>';
            body += '</tr>';
        }
        body += '</table>';

        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('patientModal').style.display = 'block';
    } catch (err) {
        toast('Error loading patient details: ' + err.message, 'error');
        console.error('viewPatientFull error:', err);
    }
}

// ============ DISCHARGE SUMMARY ============
async function viewDischargeSummary(visitId) {
    try {
        var res = await fetch(API + '/api/visits/' + visitId + '/discharge-summary');
        var data = await res.json();
        if (!data.success) { toast('Error loading summary', 'error'); return; }

        var s = data;
        var body = '<div style="font-size:12px">';
        body += '<h3>📄 DISCHARGE SUMMARY</h3>';
        body += '<p><strong>Patient:</strong> ' + s.patient.name + ' | <strong>ID:</strong> ' + s.patient.national_id + '</p>';
        body += '<p><strong>Visit:</strong> ' + s.visit.visit_number + ' | <strong>Admitted:</strong> ' + new Date(s.visit.admission_date).toLocaleDateString() + '</p>';
        body += '<hr><h4>Clinical Information</h4>';
        body += '<p><strong>Diagnosis:</strong> ' + s.clinical.diagnosis + '</p>';
        body += '<p><strong>Treatment:</strong> ' + s.clinical.treatment_plan + '</p>';
        if (s.clinical.lab_results && s.clinical.lab_results !== 'No lab tests') body += '<p><strong>Lab:</strong> ' + s.clinical.lab_results + '</p>';
        if (s.clinical.radiology_findings && s.clinical.radiology_findings !== 'No imaging') body += '<p><strong>Radiology:</strong> ' + s.clinical.radiology_findings + '</p>';

        if (s.medications.length > 0) {
            body += '<h4>💊 Medications</h4><table><tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr>';
            for (var i = 0; i < s.medications.length; i++) {
                var m = s.medications[i];
                body += '<tr><td>' + m.drug_name + '</td><td>' + (m.dosage || '') + '</td><td>' + (m.frequency || '') + '</td><td>' + (m.duration || '') + '</td></tr>';
            }
            body += '</table>';
        }

        body += '<h4>💰 Billing</h4>';
        body += '<p>Total: KES ' + s.billing.total.toLocaleString() + ' | Paid: KES ' + s.billing.paid.toLocaleString() + ' | Balance: KES ' + s.billing.balance.toLocaleString() + '</p>';
        body += '</div>';
        body += '<button class="btn btn-info btn-block" style="margin-top:10px" onclick="window.print()">🖨️ Print Discharge Summary</button>';

        document.getElementById('modalTitle').textContent = '📄 Discharge Summary';
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('patientModal').style.display = 'block';
    } catch (err) {
        toast('Error loading discharge summary', 'error');
    }
}

// ============ MARK BILL PAID WITH PAYMENT METHOD ============
function markBillPaidWithMethod(billId, visitId) {
    document.getElementById('modalTitle').textContent = '💳 Payment Method';
    document.getElementById('modalBody').innerHTML =
        '<div class="form-group"><label>Select Payment Method</label><select id="payMethod"><option value="Cash">Cash</option><option value="SHA">SHA</option><option value="Insurance">Insurance</option></select></div>' +
        '<button class="btn btn-success btn-block" onclick="confirmPay(' + billId + ',' + visitId + ')">✅ Confirm Payment</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function confirmPay(billId, visitId) {
    var method = document.getElementById('payMethod').value;
    try {
        await fetch(API + '/api/billing/' + billId + '/pay', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_method: method })
        });
        toast('✅ Bill paid via ' + method, 'success');
        closeModal();
        viewPatientFull(visitId);
    } catch (err) {
        toast('Error processing payment', 'error');
    }
}

// ============ TRANSFER PATIENT - WITH NOTES POPUP ============
async function transferPatient(visitId, toDepartment, notes) {
    notes = notes || '';
    var visitData = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
    var deptDisplay = toDepartment.charAt(0).toUpperCase() + toDepartment.slice(1);
    var existingDiagnosis = visitData.diagnosis || '';
    var existingTreatment = visitData.treatment_plan || '';
    
    var popupContent = '<div style="background:#e3f2fd;padding:10px;border-radius:5px;margin-bottom:12px">';
    popupContent += '<p><strong>Patient:</strong> ' + visitData.first_name + ' ' + visitData.last_name + '</p>';
    popupContent += '<p><strong>Visit:</strong> ' + visitData.visit_number + '</p>';
    if (existingDiagnosis) popupContent += '<p><strong>Diagnosis:</strong> ' + existingDiagnosis + '</p>';
    if (existingTreatment) popupContent += '<p><strong>Treatment:</strong> ' + existingTreatment + '</p>';
    popupContent += '<p><strong>Sending to:</strong> ' + deptDisplay + '</p></div>';
    popupContent += '<div class="form-group"><label>📝 Instructions/Notes for ' + deptDisplay + ' *</label>';
    popupContent += '<textarea id="referralNotes" rows="4" placeholder="Enter instructions...">' + notes + '</textarea></div>';
    popupContent += '<button class="btn btn-success btn-block" onclick="confirmTransfer(' + visitId + ',\'' + toDepartment + '\')">✅ Send Patient to ' + deptDisplay + '</button>';
    popupContent += '<button class="btn btn-warning btn-block" style="margin-top:5px" onclick="closeModal()">❌ Cancel</button>';
    
    document.getElementById('modalTitle').textContent = '📤 Send Patient to ' + deptDisplay;
    document.getElementById('modalBody').innerHTML = popupContent;
    document.getElementById('patientModal').style.display = 'block';
}

async function confirmTransfer(visitId, toDepartment) {
    var notes = document.getElementById('referralNotes').value.trim();
    if (!notes) { toast('⚠️ Please enter instructions', 'error'); return; }
    
    var visitData = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
    var fullNotes = notes;
    if (visitData.diagnosis && !notes.includes(visitData.diagnosis)) fullNotes = 'Dx: ' + visitData.diagnosis + ' | ' + notes;
    if (visitData.treatment_plan) fullNotes += ' | Treatment: ' + visitData.treatment_plan;
    
    try {
        var saveData = {};
        if (currentUser.role === 'consultation') {
            var d = document.getElementById('diag_' + visitId);
            var t = document.getElementById('treat_' + visitId);
            var c = document.getElementById('cnotes_' + visitId);
            if (d && d.value) saveData.diagnosis = d.value;
            if (t && t.value) saveData.treatment_plan = t.value;
            if (c && c.value) saveData.consultation_notes = c.value;
        }
        if (Object.keys(saveData).length > 0) {
            await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saveData) });
        }
        await fetch(API + '/api/visits/' + visitId + '/transfer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_department: toDepartment, notes: fullNotes, complete_department: false })
        });
        toast('✅ Patient sent to ' + toDepartment + ' with instructions', 'success');
        closeModal();
        loadDashboard();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function completeAndTransfer(visitId, toDepartment, updates, notes) {
    updates = updates || {};
    notes = notes || '';
    try {
        if (Object.keys(updates).length > 0) {
            await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
        }
        var visitData = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        var fullNotes = notes;
        if (visitData.diagnosis && !notes.includes(visitData.diagnosis)) fullNotes = 'Dx: ' + visitData.diagnosis + ' | ' + notes;
        if (visitData.treatment_plan && !fullNotes.includes(visitData.treatment_plan)) fullNotes += ' | Rx: ' + visitData.treatment_plan;
        await fetch(API + '/api/visits/' + visitId + '/transfer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_department: toDepartment, notes: fullNotes, complete_department: true })
        });
        toast('✅ Completed and sent to ' + toDepartment, 'success');
        loadDashboard();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

// ============ MULTI-TRANSFER ============
function multiTransfer(visitId) {
    var departments = relevantDepts[currentUser.role] || [];
    if (departments.length === 0) { toast('No relevant departments', 'error'); return; }
    var options = '';
    for (var i = 0; i < departments.length; i++) {
        options += '<div style="padding:8px;border-bottom:1px solid #eee"><label style="cursor:pointer;display:flex;align-items:center;gap:8px"><input type="checkbox" class="multiDept" value="' + departments[i] + '" style="width:18px;height:18px"><strong>' + departments[i] + '</strong></label></div>';
    }
    document.getElementById('modalTitle').textContent = '📤 Send Patient to Multiple Departments';
    document.getElementById('modalBody').innerHTML =
        '<p style="margin-bottom:10px;font-size:12px">✅ Select departments. Patient stays until you click "Mark Complete".</p>' +
        '<div style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:5px;margin-bottom:10px">' + options + '</div>' +
        '<div class="form-group"><label>Notes</label><textarea id="multiNotes"></textarea></div>' +
        '<div style="display:flex;gap:10px"><button class="btn btn-success" style="flex:1" onclick="doMultiTransfer(' + visitId + ')">✅ Send to Selected</button>' +
        '<button class="btn btn-warning" style="flex:1" onclick="completeMyDepartment(' + visitId + ')">✅ Mark Complete</button></div>';
    document.getElementById('patientModal').style.display = 'block';
}

async function doMultiTransfer(visitId) {
    var checkboxes = document.querySelectorAll('.multiDept:checked');
    if (checkboxes.length === 0) { toast('Select at least one department', 'error'); return; }
    var notes = document.getElementById('multiNotes').value || 'Forwarded from ' + currentUser.role;
    for (var i = 0; i < checkboxes.length; i++) {
        await fetch(API + '/api/visits/' + visitId + '/transfer', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_department: checkboxes[i].value, notes: notes, complete_department: false })
        });
    }
    toast('✅ Patient sent to ' + checkboxes.length + ' department(s)', 'success');
    closeModal();
    loadDashboard();
}

async function completeMyDepartment(visitId) {
    if (!confirm('Mark your department as complete?')) return;
    var updates = {};
    updates[currentUser.role + '_completed'] = 1;
    updates[currentUser.role + '_by'] = currentUser.user_id;
    updates[currentUser.role + '_completed_at'] = new Date().toISOString();
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    toast('✅ Department marked as complete', 'success');
    loadDashboard();
}

// ============ RELEVANT DEPARTMENTS ============
var relevantDepts = {
    'registration': ['triage'],
    'triage': ['consultation', 'emergency'],
    'consultation': ['laboratory', 'radiology', 'pharmacy', 'ward', 'dietary', 'bloodbank', 'socialwork', 'physio', 'isolation', 'medrecords', 'emergency', 'pediatrics', 'referral', 'sha', 'cashier', 'maternity', 'dental', 'eye'],
    'laboratory': ['consultation', 'cashier', 'ward'],
    'radiology': ['consultation', 'cashier', 'ward'],
    'pharmacy': ['cashier', 'ward', 'consultation'],
    'ward': ['laboratory', 'radiology', 'consultation', 'dietary', 'physio', 'cashier', 'socialwork', 'isolation', 'morgue', 'emergency', 'pediatrics', 'pharmacy', 'maternity'],
    'dietary': ['ward'],
    'bloodbank': ['ward', 'consultation'],
    'socialwork': ['ward', 'consultation'],
    'physio': ['ward', 'consultation'],
    'isolation': ['ward', 'consultation', 'laboratory', 'radiology'],
    'medrecords': ['consultation', 'ward'],
    'cashier': ['consultation', 'ward', 'laboratory', 'radiology', 'pharmacy', 'triage', 'registration', 'dietary', 'bloodbank', 'socialwork', 'physio', 'isolation', 'medrecords', 'emergency', 'pediatrics', 'referral', 'sha'],
    'referral': ['consultation', 'cashier'],
    'sha': ['consultation', 'cashier'],
    'emergency': ['consultation', 'ward', 'laboratory', 'radiology', 'pharmacy', 'isolation', 'pediatrics', 'cashier'],
    'pediatrics': ['consultation', 'ward', 'laboratory', 'pharmacy', 'dietary', 'emergency', 'cashier'],
    'admin': ['triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'ward', 'dietary', 'bloodbank', 'socialwork', 'physio', 'isolation', 'medrecords', 'cashier', 'referral', 'sha', 'emergency', 'pediatrics', 'appointments', 'maternity', 'dental', 'eye'],
    'manager': ['triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'ward', 'cashier', 'emergency', 'pediatrics', 'appointments'],
    'store': [],
    'morgue': [],
    'appointments': ['consultation', 'registration', 'cashier', 'triage'],
    'maternity': ['consultation', 'ward', 'laboratory', 'pharmacy', 'cashier'],
    'dental': ['consultation', 'cashier'],
    'eye': ['consultation', 'cashier']
};

// ============ ADD BILL ============
function addBillForPatient(visitId, patientId) {
    document.getElementById('modalTitle').textContent = '💰 Add Bill / Invoice';
    document.getElementById('modalBody').innerHTML =
        '<div class="form-group"><label>Item Description *</label><input type="text" id="billDesc" placeholder="e.g., Consultation Fee" required></div>' +
        '<div class="form-group"><label>Amount (KES) *</label><input type="number" id="billAmount" placeholder="Enter amount" min="1" required></div>' +
        '<div class="form-group"><label>Department</label><input type="text" id="billDept" value="' + currentUser.role + '" readonly></div>' +
        '<button class="btn btn-success btn-block" onclick="submitBill(' + visitId + ',' + patientId + ')">✅ Add Bill</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function submitBill(visitId, patientId) {
    var description = document.getElementById('billDesc').value.trim();
    var amount = parseFloat(document.getElementById('billAmount').value);
    if (!description || !amount || amount <= 0) { toast('Enter valid description and amount', 'error'); return; }
    try {
        await fetch(API + '/api/billing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visit_id: visitId, patient_id: patientId, item_description: description, department: currentUser.role, amount: amount })
        });
        toast('✅ Bill added: ' + description + ' - KES ' + amount.toLocaleString(), 'success');
        closeModal();
        loadDashboard();
    } catch (err) { toast('Error adding bill', 'error'); }
}

// ============ DELETE BILL ============
async function deleteBill(billId, visitId) {
    if (!confirm('DELETE this bill? This cannot be undone.')) return;
    try {
        await fetch(API + '/api/billing/' + billId, { method: 'DELETE' });
        toast('🗑️ Bill deleted', 'success');
        viewPatientFull(visitId);
    } catch (err) { toast('Error deleting bill', 'error'); }
}

// ============ DISCHARGE PATIENT ============
async function dischargePatientDirect(visitId) {
    if (!confirm('DISCHARGE this patient? This finalizes all records.')) return;
    try {
        var res = await fetch(API + '/api/visits/' + visitId + '/discharge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_bed: true })
        });
        var data = await res.json();
        if (data.success) { toast('✅ Patient discharged!', 'success'); }
        else { toast('❌ ' + (data.message || 'Discharge failed'), 'error'); }
        closeModal();
        loadDashboard();
    } catch (err) { toast('Error discharging patient', 'error'); }
}

// ============ CHANGE PASSWORD ============
function showChangePasswordForm() {
    document.getElementById('modalTitle').textContent = '🔑 Change Password';
    document.getElementById('modalBody').innerHTML =
        '<div class="form-group"><label>Current Password</label><div style="position:relative"><input type="password" id="currentPass" required style="padding-right:40px"><span onclick="togglePassword(\'currentPass\',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px">👁️</span></div></div>' +
        '<div class="form-group"><label>New Password</label><div style="position:relative"><input type="password" id="newPass" required style="padding-right:40px"><span onclick="togglePassword(\'newPass\',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px">👁️</span></div></div>' +
        '<div class="form-group"><label>Confirm New Password</label><div style="position:relative"><input type="password" id="confirmPass" required style="padding-right:40px"><span onclick="togglePassword(\'confirmPass\',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:18px">👁️</span></div></div>' +
        '<button class="btn btn-success btn-block" onclick="changeMyPassword()">✅ Change Password</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function changeMyPassword() {
    var cp = document.getElementById('currentPass').value;
    var np = document.getElementById('newPass').value;
    var cf = document.getElementById('confirmPass').value;
    if (!cp || !np || !cf) { toast('All fields required', 'error'); return; }
    if (np.length < 6) { toast('Min 6 characters', 'error'); return; }
    if (np !== cf) { toast('Passwords dont match', 'error'); return; }
    try {
        var res = await fetch(API + '/api/change-password', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_password: cp, new_password: np })
        });
        var data = await res.json();
        if (data.success) { toast('✅ Password changed!', 'success'); closeModal(); }
        else toast(data.message || 'Failed', 'error');
    } catch (err) { toast('Error', 'error'); }
}

// ============ NATIONAL ID SEARCH ============
async function searchByNationalID() {
    var q = document.getElementById('nidSearch').value.trim();
    if (q.length < 2) { toast('Enter at least 2 characters', 'error'); return; }
    try {
        var results = await fetch(API + '/api/patients/search?q=' + encodeURIComponent(q)).then(function(r) { return r.json(); });
        var div = document.getElementById('nidResults');
        if (!results || !results.length) { div.innerHTML = '<p style="color:#888">No patients found.</p>'; return; }
        var h = '<table><tr><th>Name</th><th>ID</th><th>Phone</th><th>Gender</th><th>Action</th></tr>';
        for (var i = 0; i < results.length; i++) {
            var p = results[i];
            h += '<tr><td><strong>' + p.first_name + ' ' + p.last_name + '</strong></td><td>' + (p.national_id || 'N/A') + '</td><td>' + (p.phone || 'N/A') + '</td><td>' + (p.gender || 'N/A') + '</td>';
            h += '<td><button class="btn btn-info btn-small" onclick="viewPatientHistory(' + p.patient_id + ')">📋 History</button> ';
            if (currentUser.role === 'registration') h += '<button class="btn btn-success btn-small" onclick="createVisitExisting(' + p.patient_id + ')">+ Visit</button>';
            h += '</td></tr>';
        }
        h += '</table>';
        div.innerHTML = h;
    } catch (err) { toast('Error searching', 'error'); }
}

async function viewPatientHistory(pid) {
    try {
        var patient = await fetch(API + '/api/patients/' + pid).then(function(r) { return r.json(); });
        var activeVisits = await fetch(API + '/api/visits/active').then(function(r) { return r.json(); });
        var patientVisits = activeVisits.filter(function(v) { return v.patient_id === pid; });
        document.getElementById('modalTitle').textContent = 'Patient: ' + patient.first_name + ' ' + patient.last_name;
        var body = '<div class="row"><div><p><strong>Name:</strong> ' + patient.first_name + ' ' + patient.last_name + '</p></div>';
        body += '<div><p><strong>DOB:</strong> ' + (patient.date_of_birth || 'N/A') + '</p></div>';
        body += '<div><p><strong>Gender:</strong> ' + (patient.gender || 'N/A') + '</p></div>';
        body += '<div><p><strong>Phone:</strong> ' + (patient.phone || 'N/A') + '</p></div>';
        body += '<div><p><strong>National ID:</strong> ' + (patient.national_id || 'N/A') + '</p></div>';
        body += '<div><p><strong>Blood:</strong> ' + (patient.blood_group || 'Unknown') + '</p></div>';
        if (patient.allergies) body += '<div class="full-width"><p style="color:red"><strong>⚠️ Allergies:</strong> ' + patient.allergies + '</p></div>';
        body += '</div><hr><h4>Active Visits (' + patientVisits.length + ')</h4>';
        if (patientVisits.length === 0) { body += '<p style="color:#888">No active visits.</p>'; }
        else {
            body += '<table><tr><th>Visit#</th><th>Status</th><th>Dept</th><th>Action</th></tr>';
            for (var i = 0; i < patientVisits.length; i++) {
                var v = patientVisits[i];
                body += '<tr><td>' + v.visit_number + '</td><td>' + v.status + '</td><td>' + (v.current_department || '') + '</td>';
                body += '<td><button class="btn btn-info btn-small" onclick="viewPatientFull(' + v.visit_id + ')">📋 Full View</button></td></tr>';
            }
            body += '</table>';
        }
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('patientModal').style.display = 'block';
    } catch (err) { toast('Error loading history', 'error'); }
}

// ============ RETURN TO WARD ============
async function returnToWard(visitId) {
    if (!confirm('Return patient to their ward bed?')) return;
    try {
        await fetch(API + '/api/visits/' + visitId + '/return-to-ward', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        toast('✅ Patient returned to Ward', 'success');
        loadDashboard();
    } catch (err) { toast('Error', 'error'); }
}

// ============ WARD REFERRAL WITH ORDERS ============
function wardReferWithOrders(visitId, department) {
    var deptName = department === 'laboratory' ? 'Lab' : (department === 'radiology' ? 'Radiology' : 'Pharmacy');
    document.getElementById('modalTitle').textContent = '📝 Send to ' + deptName + ' - Enter Orders';
    document.getElementById('modalBody').innerHTML =
        '<div class="form-group"><label>Orders / Tests Required *</label><textarea id="wardOrders" rows="4" placeholder="e.g., FBC, Malaria Test..."></textarea></div>' +
        '<p style="font-size:11px;color:var(--text-muted)">Patient keeps their bed.</p>' +
        '<button class="btn btn-success btn-block" onclick="submitWardReferral(' + visitId + ',\'' + department + '\')">✅ Send with Orders</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function submitWardReferral(visitId, department) {
    var orders = document.getElementById('wardOrders').value.trim();
    if (!orders) { toast('⚠️ Please enter orders', 'error'); return; }
    try {
        await fetch(API + '/api/visits/' + visitId + '/refer-with-orders', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_department: department, orders: orders })
        });
        toast('✅ Patient sent to ' + department + ' with orders', 'success');
        closeModal();
        loadDashboard();
    } catch (err) { toast('Error', 'error'); }
}

// ============ QUICK BILL & REFER ============
function quickBillAndRefer(visitId, department, defaultDesc, defaultAmt) {
    defaultAmt = defaultAmt || 0;
    var deptDisplay = department.charAt(0).toUpperCase() + department.slice(1);
    document.getElementById('modalTitle').textContent = '💰 Add ' + deptDisplay + ' Bill & Complete';
    document.getElementById('modalBody').innerHTML =
        '<div class="form-group"><label>Bill Description *</label><input type="text" id="qbillDesc" value="' + (defaultDesc || '') + '" required></div>' +
        '<div class="form-group"><label>Amount (KES) *</label><input type="number" id="qbillAmt" value="' + defaultAmt + '" min="0" required></div>' +
        '<div class="form-group"><label>📝 Notes for next department</label><textarea id="qnotes" rows="3"></textarea></div>' +
        '<button class="btn btn-success btn-block" onclick="submitQuickBillRefer(' + visitId + ',\'' + department + '\')">✅ Add Bill & Complete</button>' +
        '<button class="btn btn-warning btn-block" style="margin-top:5px" onclick="skipBillComplete(' + visitId + ',\'' + department + '\')">⏭️ Skip Bill & Just Complete</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function submitQuickBillRefer(visitId, department) {
    var desc = document.getElementById('qbillDesc').value.trim();
    var amt = parseFloat(document.getElementById('qbillAmt').value);
    var notes = document.getElementById('qnotes').value.trim();
    if (!desc) { toast('⚠️ Enter description', 'error'); return; }
    if (isNaN(amt) || amt < 0) { toast('⚠️ Enter valid amount', 'error'); return; }
    try {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        if (amt > 0) {
            await fetch(API + '/api/billing', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visit_id: visitId, patient_id: detail.patient_id, item_description: desc, department: currentUser.role, amount: amt })
            });
        }
        closeModal();
        var fullNotes = (notes || 'Completed in ' + currentUser.role);
        if (amt > 0) fullNotes += ' | Fee: KES ' + amt;
        await completeAndTransfer(visitId, department, {}, fullNotes);
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}

async function skipBillComplete(visitId, department) {
    closeModal();
    var notes = document.getElementById('qnotes') ? document.getElementById('qnotes').value.trim() : '';
    await completeAndTransfer(visitId, department, {}, notes || 'Completed in ' + currentUser.role);
}

// ============ CREATE VISIT FOR EXISTING PATIENT ============
async function createVisitExisting(pid) {
    try {
        var r = await fetch(API + '/api/visits', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: pid, registration_fee_paid: true, registration_fee_amount: 200 })
        });
        var d = await r.json();
        if (d.success && !d.already_active) { toast('✅ Visit Created: ' + d.visit.visit_number, 'success'); loadDashboard(); }
        else if (d.already_active) { toast('ℹ️ Active visit already exists', 'info'); }
        else { toast('❌ ' + (d.message || 'Error'), 'error'); }
    } catch (err) { toast('Error creating visit', 'error'); }
}

// ==================== REGISTRATION SCREEN ====================
// ==================== REGISTRATION SCREEN WITH APPOINTMENTS ====================
async function regScreen() {
    var dp = await fetch(API + '/api/visits/department/registration').then(function(r) { return r.json(); });
    var saved = JSON.parse(localStorage.getItem('regFormData') || '{}');
    var today = new Date().toISOString().split('T')[0];
    var todayAppts = await fetch(API + '/api/appointments?date=' + today).then(function(r) { return r.json(); });
    var h = '';
    
    // Department Panel
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || 'REGISTRATION') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
        // Today's Appointments (thin bar)
    if (todayAppts && todayAppts.length > 0) {
        var schedCount = 0;
        for (var ac = 0; ac < todayAppts.length; ac++) {
            if (todayAppts[ac].status === 'scheduled') schedCount++;
        }
        h += '<div class="card" style="margin-bottom:8px;border-left:4px solid var(--info)">';
        h += '<div style="padding:6px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:#e8f5e9" onclick="toggleAdminSection(\'regAppts\')">';
        h += '<span><strong>📅 Today\'s Appointments:</strong> ' + schedCount + ' scheduled of ' + todayAppts.length + ' total</span>';
        h += '<span id="regAppts_icon" style="font-size:14px">▼</span>';
        h += '</div>';
        h += '<div id="regAppts" style="display:none;padding:8px;max-height:200px;overflow-y:auto">';
        h += '<table style="font-size:10px;width:100%"><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th>Action</th></tr>';
        for (var a = 0; a < todayAppts.length; a++) {
            var apt = todayAppts[a];
            h += '<tr><td>' + (apt.appointment_time || 'N/A') + '</td><td><strong>' + apt.first_name + ' ' + apt.last_name + '</strong></td>';
            h += '<td>' + (apt.doctor_name || 'Any') + '</td><td>' + apt.status + '</td>';
            h += '<td>';
            if (apt.status === 'scheduled') {
                h += '<button class="btn btn-success btn-small" style="font-size:9px;padding:2px 5px" onclick="createVisitFromAppointment(' + apt.patient_id + ')">➕ Visit</button>';
            }
            h += '</td></tr>';
        }
        h += '</table></div></div>';
    }
    
    // Search
    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body">';
    h += '<div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div>';
    h += '<div id="nidResults"></div></div></div>';
    
    // Registration Form
    h += '<div class="card"><div class="card-header">📋 Register New Patient</div><div class="card-body">';
    h += '<form id="regForm"><div class="row">';
    h += '<div class="form-group"><label>First Name *</label><input type="text" id="rfname" required value="' + (saved.rfname || '') + '"></div>';
    h += '<div class="form-group"><label>Last Name *</label><input type="text" id="rlname" required value="' + (saved.rlname || '') + '"></div>';
    h += '<div class="form-group"><label>Date of Birth</label><input type="text" id="rdob" placeholder="DD/MM/YYYY" value="' + (saved.rdob || '') + '"></div>';
    h += '<div class="form-group"><label>Gender</label><select id="rgen"><option value="">Select</option><option' + (saved.rgen==='Male'?' selected':'') + '>Male</option><option' + (saved.rgen==='Female'?' selected':'') + '>Female</option></select></div>';
    h += '<div class="form-group"><label>Phone</label><input type="text" id="rphone" value="' + (saved.rphone || '') + '"></div>';
    h += '<div class="form-group"><label>National ID *</label><input type="text" id="rnid" required value="' + (saved.rnid || '') + '"></div>';
    h += '<div class="form-group full-width"><label>Address</label><input type="text" id="raddr" value="' + (saved.raddr || '') + '"></div>';
    h += '<div class="form-group"><label>Emergency Contact</label><input type="text" id="remc" value="' + (saved.remc || '') + '"></div>';
    h += '<div class="form-group"><label>Emergency Phone</label><input type="text" id="remp" value="' + (saved.remp || '') + '"></div>';
    h += '<div class="form-group"><label>Blood Group</label><select id="rbg"><option value="">Unknown</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>';
    h += '<div class="form-group"><label>Allergies</label><input type="text" id="rall" value="' + (saved.rall || '') + '"></div>';
    h += '<div class="form-group"><label>Chronic Conditions</label><input type="text" id="rchronic" value="' + (saved.rchronic || '') + '"></div>';
    h += '</div><div class="alert alert-info">💳 Registration Fee</div>';
    h += '<div class="form-group"><label><input type="checkbox" id="rfeePaid" onchange="toggleFee()"> Patient has paid</label></div>';
    h += '<div class="form-group"><label>Amount (KES)</label><input type="number" id="rfeeAmount" value="200" disabled></div>';
    h += '<div style="display:flex;gap:10px"><button type="submit" class="btn btn-success" style="flex:2">✅ Register & Create Visit</button>';
    h += '<button type="button" class="btn btn-info" style="flex:1" onclick="saveRegForm()">💾 Save</button>';
    h += '<button type="button" class="btn btn-danger" style="flex:1" onclick="clearRegForm()">🗑️ Clear</button></div></form></div></div>';
    
    // Patients at Registration
    h += '<div class="card"><div class="card-header">📋 Patients at Registration (' + dp.length + ')</div><div class="card-body patient-list">' + pTable(dp) + '</div></div>';
    return h;
}

function toggleFee() { var cb=document.getElementById('rfeePaid'); var amt=document.getElementById('rfeeAmount'); amt.disabled=!cb.checked; if(!cb.checked) amt.value='200'; }
function saveRegForm() {
    var d={rfname:document.getElementById('rfname').value,rlname:document.getElementById('rlname').value,rdob:document.getElementById('rdob').value,rgen:document.getElementById('rgen').value,rphone:document.getElementById('rphone').value,rnid:document.getElementById('rnid').value,raddr:document.getElementById('raddr').value,remc:document.getElementById('remc').value,remp:document.getElementById('remp').value,rall:document.getElementById('rall').value,rchronic:document.getElementById('rchronic').value};
    localStorage.setItem('regFormData',JSON.stringify(d)); toast('💾 Form saved','success');
}
function clearRegForm(){ if(confirm('Clear all form data?')){ localStorage.removeItem('regFormData'); loadDashboard(); } }

// ==================== TRIAGE SCREEN WITH ACUITY SCORING ====================
async function triageScreen() {
    var dp = await fetch(API + '/api/visits/department/triage').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🩺 ' + (currentUser.department_name || 'TRIAGE') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🩺 Patients Waiting (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) { h += '<p style="color:var(--text-muted)">No patients waiting.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:12px"><div class="card-body">';
            h += confirmBox('triage', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> <span class="badge badge-info">' + v.visit_number + '</span>';
            if (d.allergies) h += '<p style="color:red">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<form onsubmit="saveTriageWithAcuity(event,' + v.visit_id + ')"><div class="row">';
            h += '<div class="form-group"><label>BP</label><input type="text" id="bp_' + v.visit_id + '" placeholder="120/80"></div>';
            h += '<div class="form-group"><label>HR (bpm)</label><input type="number" id="hr_' + v.visit_id + '" placeholder="72" onchange="calcAcuity(' + v.visit_id + ')"></div>';
            h += '<div class="form-group"><label>Temp (°C)</label><input type="number" id="temp_' + v.visit_id + '" placeholder="36.5" step="0.1" onchange="calcAcuity(' + v.visit_id + ')"></div>';
            h += '<div class="form-group"><label>SpO2 (%)</label><input type="number" id="spo2_' + v.visit_id + '" placeholder="98" onchange="calcAcuity(' + v.visit_id + ')"></div>';
            h += '<div class="form-group"><label>RR (/min)</label><input type="number" id="rr_' + v.visit_id + '" placeholder="16" onchange="calcAcuity(' + v.visit_id + ')"></div>';
            h += '<div class="form-group"><label>Weight (kg)</label><input type="number" id="wt_' + v.visit_id + '" placeholder="70"></div>';
            h += '</div>';
            h += '<div id="acuityScore_' + v.visit_id + '" style="padding:8px;border-radius:5px;margin:8px 0;font-weight:bold;text-align:center;display:none"></div>';
            h += '<div class="form-group"><label>Triage Category</label><select id="cat_' + v.visit_id + '" required><option value="">Select</option><option value="Emergency">Emergency</option><option value="Urgent">Urgent</option><option value="Routine">Routine</option></select></div>';
            h += '<div class="form-group"><label>Notes</label><textarea id="tnotes_' + v.visit_id + '"></textarea></div>';
            h += '<button type="submit" class="btn btn-success">✅ Complete Triage</button>';
            h += '<button type="button" class="btn btn-info btn-small" style="margin-left:5px" onclick="calcAcuity(' + v.visit_id + ')">📊 Score Acuity</button></form>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}

async function calcAcuity(visitId) {
    var hr = parseFloat(document.getElementById('hr_' + visitId).value) || 0;
    var temp = parseFloat(document.getElementById('temp_' + visitId).value) || 0;
    var spo2 = parseFloat(document.getElementById('spo2_' + visitId).value) || 0;
    var rr = parseFloat(document.getElementById('rr_' + visitId).value) || 0;
    var bpStr = document.getElementById('bp_' + visitId).value;
    var sbp = 0;
    if (bpStr && bpStr.includes('/')) { sbp = parseFloat(bpStr.split('/')[0]) || 0; }
    
    try {
        var res = await fetch(API + '/api/triage/acuity-score', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ heart_rate: hr, temperature: temp, spo2: spo2, respiratory_rate: rr, systolic_bp: sbp })
        });
        var data = await res.json();
        var div = document.getElementById('acuityScore_' + visitId);
        div.style.display = 'block';
        var bgColor = data.color === 'red' ? '#ffeaea' : (data.color === 'orange' ? '#fff3e0' : (data.color === 'yellow' ? '#fffde0' : '#e8f5e9'));
        var textColor = data.color === 'red' ? '#c62828' : (data.color === 'orange' ? '#e65100' : (data.color === 'yellow' ? '#f9a825' : '#2e7d32'));
        div.style.background = bgColor;
        div.style.color = textColor;
        div.innerHTML = '📊 Acuity Score: <strong>' + data.score + '</strong> | Category: <strong>' + data.category + '</strong>';
        document.getElementById('cat_' + visitId).value = data.category;
    } catch (err) { toast('Error calculating score', 'error'); }
}

async function saveTriageWithAcuity(event, visitId) {
    event.preventDefault();
    var cb = document.getElementById('confirm_' + visitId);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    var category = document.getElementById('cat_' + visitId).value;
    if (!category) { toast('⚠️ Select triage category', 'error'); return; }
    var vitalsData = {
        triage_vitals_bp: document.getElementById('bp_' + visitId).value,
        triage_vitals_hr: document.getElementById('hr_' + visitId).value,
        triage_vitals_temp: document.getElementById('temp_' + visitId).value,
        triage_vitals_spo2: document.getElementById('spo2_' + visitId).value,
        triage_vitals_weight: document.getElementById('wt_' + visitId).value,
        triage_category: category,
        triage_notes: document.getElementById('tnotes_' + visitId).value,
        priority: category === 'Emergency' ? 'emergency' : 'normal'
    };
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vitalsData) });
    await fetch(API + '/api/visits/' + visitId + '/confirm-patient', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmed: true }) });
    var target = (category === 'Emergency') ? 'emergency' : 'consultation';
    await completeAndTransfer(visitId, target, {}, 'Triage: ' + category);
}

// ==================== CONSULTATION SCREEN ====================
async function consultScreen() {
    var dp = await fetch(API + '/api/visits/department/consultation').then(function(r) { return r.json(); });
    var allActive = await fetch(API + '/api/visits/active').then(function(r) { return r.json(); });
    var myPatients = allActive.filter(function(v) { return v.current_department === 'consultation' || v.consultation_completed; });
    var today = new Date().toISOString().split('T')[0];
    var allAppts = await fetch(API + '/api/appointments').then(function(r) { return r.json(); });
    var todayAppts = [];
    for (var ta = 0; ta < allAppts.length; ta++) {
        if (allAppts[ta].status !== 'completed' && allAppts[ta].status !== 'cancelled') {
            todayAppts.push(allAppts[ta]);
        }
    }
    var h = '';
    
    // Department Panel button
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">👨‍⚕️ ' + (currentUser.department_name || 'CONSULTATION') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    // ====== APPOINTMENTS BAR (THIN, DROPDOWN) ======
    if (todayAppts && todayAppts.length > 0) {
        var scheduledCount = 0;
        for (var ac = 0; ac < todayAppts.length; ac++) {
            if (todayAppts[ac].status === 'scheduled') scheduledCount++;
        }
        h += '<div class="card" style="margin-bottom:8px;border-left:4px solid var(--info)">';
        h += '<div style="padding:6px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:#e3f2fd" onclick="toggleAdminSection(\'consultAppts\')">';
        h += '<span><strong>📅 Appointments:</strong> <span style="color:var(--warning);font-weight:bold">' + scheduledCount + ' scheduled</span> of ' + todayAppts.length + ' total</span>';
        h += '<span id="consultAppts_icon" style="font-size:14px">▼</span>';
        h += '</div>';
        h += '<div id="consultAppts" style="display:none;padding:8px;max-height:250px;overflow-y:auto">';
        h += '<table style="font-size:10px;width:100%"><tr><th>Date</th><th>Time</th><th>Patient</th><th>Reason</th><th>Status</th><th>Action</th></tr>';
        for (var a = 0; a < todayAppts.length; a++) {
            var apt = todayAppts[a];
            var isToday = (apt.appointment_date === today);
            var statusColor = apt.status === 'completed' ? 'var(--success)' : (apt.status === 'cancelled' ? 'var(--danger)' : 'var(--warning)');
            h += '<tr>';
            h += '<td>' + apt.appointment_date + '</td>';
            h += '<td><strong>' + (apt.appointment_time || 'N/A') + '</strong></td>';
            h += '<td><strong>' + apt.first_name + ' ' + apt.last_name + '</strong></td>';
            h += '<td>' + (apt.reason || 'N/A') + '</td>';
            h += '<td><span class="badge" style="background:' + statusColor + ';color:#fff;font-size:9px">' + (apt.status || 'scheduled') + '</span></td>';
            h += '<td style="white-space:nowrap">';
                        if (apt.status === 'scheduled') {
                var isToday = (apt.appointment_date === today);
                if (isToday) {
                    h += '<button class="btn btn-success btn-small" style="font-size:9px;padding:3px 6px;margin-right:6px" onclick="event.stopPropagation();completeAppointment(' + apt.appointment_id + ')" title="Mark as completed">✅ Done</button>';
                }
                h += '<button class="btn btn-info btn-small" style="font-size:9px;padding:3px 6px" onclick="event.stopPropagation();createVisitFromAppointment(' + apt.patient_id + ')" title="Create visit">➕ Visit</button>';
            }
            h += '</td></tr>';
        }
        h += '</table></div></div>';
    }
    
    // Search
    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body">';
    h += '<div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div>';
    h += '<div id="nidResults"></div></div></div>';
    
    // Consultation Inbox
    h += '<div class="card"><div class="card-header">👨‍⚕️ Consultation Inbox - New Patients (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) {
        h += '<p style="color:var(--text-muted)">No new patients waiting.</p>';
    } else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:12px;border:1px solid var(--border)"><div class="card-body">';
            h += confirmBox('consultation', v.visit_id, d);
            h += '<div style="display:flex;justify-content:space-between;align-items:center">';
            h += '<div><strong style="font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> <span class="badge badge-info">' + v.visit_number + '</span>';
            if (d.triage_category) h += ' <span class="badge badge-warning">' + d.triage_category + '</span>';
            h += '</div>';
            h += '<div><span style="font-size:12px;color:var(--text-light)">' + (d.gender || '') + ' | ID: ' + (d.national_id || 'N/A') + ' | DOB: ' + (d.date_of_birth || 'N/A') + '</span></div>';
            h += '</div>';
            if (d.allergies) h += '<p style="color:var(--danger);font-weight:600;margin-top:5px">⚠️ Allergies: ' + d.allergies + '</p>';
            if (d.chronic_conditions) h += '<p style="margin-top:3px">Chronic: ' + d.chronic_conditions + '</p>';
            if (d.blood_group) h += '<p>Blood Group: ' + d.blood_group + '</p>';
            h += '<div class="vitals-display"><strong>Triage Vitals:</strong> BP: ' + (d.triage_vitals_bp || 'N/A') + ' | HR: ' + (d.triage_vitals_hr || 'N/A') + ' | Temp: ' + (d.triage_vitals_temp || 'N/A') + '°C | SpO2: ' + (d.triage_vitals_spo2 || 'N/A') + '% | Weight: ' + (d.triage_vitals_weight || 'N/A') + 'kg';
            h += ' | <strong>Category:</strong> ' + (d.triage_category || 'N/A') + '</div>';
            if (d.triage_notes) h += '<p style="font-size:12px"><strong>Triage Notes:</strong> ' + d.triage_notes + '</p>';
            if (d.registration_fee_paid) {
                h += '<div class="alert alert-success"><strong>Registration Fee:</strong> ✅ Paid - KES ' + (d.registration_fee_amount || 200) + '</div>';
            } else {
                h += '<div class="alert alert-warning"><strong>Registration Fee:</strong> ❌ Pending - KES ' + (d.registration_fee_amount || 200) + '</div>';
            }
            if (d.lab_results) h += '<div class="alert alert-info"><strong>🧪 Lab Results:</strong> ' + d.lab_results + '</div>';
            if (d.radiology_findings) h += '<div class="alert alert-info"><strong>🩻 Radiology Findings:</strong> ' + d.radiology_findings + '</div>';
            h += '<form onsubmit="saveConsult(event,' + v.visit_id + ')">';
            h += '<div class="form-group"><label>Diagnosis</label><textarea id="diag_' + v.visit_id + '" rows="2" placeholder="Enter diagnosis...">' + (d.diagnosis || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Treatment Plan / Prescription</label><textarea id="treat_' + v.visit_id + '" rows="2" placeholder="Enter treatment plan or prescription...">' + (d.treatment_plan || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Consultation Notes</label><textarea id="cnotes_' + v.visit_id + '" rows="2" placeholder="Additional notes...">' + (d.consultation_notes || '') + '</textarea></div>';
            h += '<div class="btn-group">';
            h += '<button type="submit" class="btn btn-info btn-small">💾 Save Notes</button>';
            h += '<button type="button" class="btn btn-success btn-small" onclick="consultToCashier(' + v.visit_id + ')">✅ Complete & Send to Cashier</button>';
            h += '<button type="button" class="btn btn-purple btn-small" onclick="showPrescriptionForm(' + v.visit_id + ',' + v.patient_id + ')">💊 Write Prescription</button></div></form>';
            h += '<div class="transfer-panel"><strong>Refer Patient To (click to send):</strong><div class="transfer-options">';
            var consultDepts = relevantDepts['consultation'] || [];
            for (var j = 0; j < consultDepts.length; j++) {
                h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + consultDepts[j] + '\',\'Referred from Consultation\')">📤 ' + consultDepts[j] + '</button> ';
            }
            h += '<button class="btn btn-danger btn-small" onclick="declareDeath(' + v.visit_id + ')">⚰️ Declare Death</button> ';
            h += '</div></div>';
            h += '</div></div>';
        }
    }
    h += '</div></div>';
    
    // All My Patients
    if (myPatients.length > dp.length) {
        h += '<div class="card"><div class="card-header" style="background:#e8f5e9">📋 All My Patients - History & Current (' + myPatients.length + ')</div><div class="card-body patient-list">' + pTable(myPatients) + '</div></div>';
    }
    return h;
}

async function saveConsult(event, visitId) {
    event.preventDefault();
    var updates = {
        diagnosis: document.getElementById('diag_' + visitId).value,
        treatment_plan: document.getElementById('treat_' + visitId).value,
        consultation_notes: document.getElementById('cnotes_' + visitId).value
    };
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    toast('✅ Consultation notes saved successfully', 'success');
}

// ==================== CONSULT TO CASHIER - MULTIPLE BILLS ====================
async function consultToCashier(visitId) {
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { toast('⚠️ Please confirm patient identity first!', 'error'); return; }
    var diagnosis = document.getElementById('diag_' + visitId) ? document.getElementById('diag_' + visitId).value : '';
    var treatment = document.getElementById('treat_' + visitId) ? document.getElementById('treat_' + visitId).value : '';
    var notes = document.getElementById('cnotes_' + visitId) ? document.getElementById('cnotes_' + visitId).value : '';
    if (!diagnosis) { toast('⚠️ Please enter a diagnosis before referring to Cashier', 'error'); return; }
    try {
        await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagnosis: diagnosis, treatment_plan: treatment, consultation_notes: notes }) });
    } catch (err) { toast('Error saving notes', 'error'); return; }
    
    document.getElementById('modalTitle').textContent = '💰 Consultation Billing - Add All Fees';
    document.getElementById('modalBody').innerHTML =
        '<div style="background:#fff3e0;padding:10px;border-radius:5px;margin-bottom:12px"><p><strong>Diagnosis:</strong> ' + (diagnosis||'None') + '</p><p><strong>Treatment:</strong> ' + (treatment||'None') + '</p></div>' +
        '<div id="consultBillsContainer">' +
        '<div class="consult-bill-row" style="display:flex;gap:8px;margin-bottom:8px"><input type="text" class="cbill-desc" placeholder="Item" style="flex:2" value="Consultation Fee"><input type="number" class="cbill-amt" placeholder="Amount" style="flex:1" min="0"><button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button></div>' +
        '<div class="consult-bill-row" style="display:flex;gap:8px;margin-bottom:8px"><input type="text" class="cbill-desc" placeholder="Item" style="flex:2"><input type="number" class="cbill-amt" placeholder="Amount" style="flex:1" min="0"><button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button></div>' +
        '<div class="consult-bill-row" style="display:flex;gap:8px;margin-bottom:8px"><input type="text" class="cbill-desc" placeholder="Item" style="flex:2"><input type="number" class="cbill-amt" placeholder="Amount" style="flex:1" min="0"><button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button></div>' +
        '</div>' +
        '<button type="button" class="btn btn-info btn-small" style="margin-bottom:10px" onclick="addConsultBillRow()">➕ Add Another Bill Item</button>' +
        '<button class="btn btn-success btn-block" onclick="submitMultipleConsultBills(' + visitId + ')">✅ Add All Bills & Send to Cashier</button>' +
        '<button class="btn btn-info btn-block" style="margin-top:5px" onclick="skipFeeAndRefer(' + visitId + ')">⏭️ Skip All Fees & Send to Cashier</button>';
    document.getElementById('patientModal').style.display = 'block';
}

function addConsultBillRow() {
    var container = document.getElementById('consultBillsContainer');
    var row = document.createElement('div');
    row.className = 'consult-bill-row';
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
    row.innerHTML = '<input type="text" class="cbill-desc" placeholder="Item description..." style="flex:2"><input type="number" class="cbill-amt" placeholder="Amount (KES)" style="flex:1" min="0"><button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">✕</button>';
    container.appendChild(row);
}

async function submitMultipleConsultBills(visitId) {
    var rows = document.querySelectorAll('.consult-bill-row');
    var bills = [];
    var totalAmt = 0;
    for (var i = 0; i < rows.length; i++) {
        var desc = rows[i].querySelector('.cbill-desc').value.trim();
        var amt = parseFloat(rows[i].querySelector('.cbill-amt').value) || 0;
        if (desc && amt > 0) { bills.push({ desc: desc, amt: amt }); totalAmt += amt; }
    }
    if (bills.length === 0) { toast('⚠️ Please add at least one bill item', 'error'); return; }
    try {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        for (var j = 0; j < bills.length; j++) {
            await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: visitId, patient_id: detail.patient_id, item_description: bills[j].desc, department: 'consultation', amount: bills[j].amt }) });
        }
        toast('✅ ' + bills.length + ' bill(s) added - KES ' + totalAmt.toLocaleString(), 'success');
        closeModal();
        var diagnosis = document.getElementById('diag_' + visitId) ? document.getElementById('diag_' + visitId).value : '';
        var treatment = document.getElementById('treat_' + visitId) ? document.getElementById('treat_' + visitId).value : '';
        await completeAndTransfer(visitId, 'cashier', {}, 'Consultation complete | Dx: ' + (diagnosis||'N/A') + ' | Bills: ' + bills.length + ' items, KES ' + totalAmt);
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}

async function skipFeeAndRefer(visitId) {
    closeModal();
    var diagnosis = document.getElementById('diag_' + visitId) ? document.getElementById('diag_' + visitId).value : '';
    await completeAndTransfer(visitId, 'cashier', {}, 'Consultation complete | No fee charged');
}

// ==================== PRESCRIPTION FORM ====================
function showPrescriptionForm(visitId, patientId) {
    document.getElementById('modalTitle').textContent = '💊 Write Prescription';
    document.getElementById('modalBody').innerHTML =
        '<div class="row"><div class="form-group"><label>Drug Name *</label><input type="text" id="rxDrug" placeholder="e.g., Paracetamol" required></div>' +
        '<div class="form-group"><label>Dosage</label><input type="text" id="rxDosage" placeholder="e.g., 500mg"></div>' +
        '<div class="form-group"><label>Frequency</label><input type="text" id="rxFreq" placeholder="e.g., 3x daily"></div>' +
        '<div class="form-group"><label>Duration</label><input type="text" id="rxDuration" placeholder="e.g., 5 days"></div>' +
        '<div class="form-group"><label>Route</label><select id="rxRoute"><option>Oral</option><option>IV</option><option>IM</option><option>Topical</option><option>Inhalation</option></select></div>' +
        '<div class="form-group full-width"><label>Instructions</label><textarea id="rxInstructions" rows="2" placeholder="e.g., Take after meals..."></textarea></div></div>' +
        '<button class="btn btn-success btn-block" onclick="savePrescription(' + visitId + ',' + patientId + ')">✅ Save Prescription</button>' +
        '<hr><div id="rxList"></div>';
    document.getElementById('patientModal').style.display = 'block';
    loadPrescriptions(visitId);
}

async function savePrescription(visitId, patientId) {
    var drug = document.getElementById('rxDrug').value.trim();
    if (!drug) { toast('Drug name required', 'error'); return; }
    try {
        await fetch(API + '/api/prescriptions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visit_id: visitId, patient_id: patientId, drug_name: drug, dosage: document.getElementById('rxDosage').value, frequency: document.getElementById('rxFreq').value, duration: document.getElementById('rxDuration').value, route: document.getElementById('rxRoute').value, instructions: document.getElementById('rxInstructions').value })
        });
        toast('✅ Prescription saved', 'success');
        document.getElementById('rxDrug').value = '';
        document.getElementById('rxDosage').value = '';
        document.getElementById('rxInstructions').value = '';
        loadPrescriptions(visitId);
    } catch (err) { toast('Error saving prescription', 'error'); }
}

async function loadPrescriptions(visitId) {
    try {
        var res = await fetch(API + '/api/prescriptions/' + visitId);
        var prescriptions = await res.json();
        var html = '<h4>Current Prescriptions</h4>';
        if (!prescriptions.length) { html += '<p style="color:#888">No prescriptions yet.</p>'; }
        else {
            html += '<table><tr><th>Drug</th><th>Dosage</th><th>Freq</th><th>Duration</th><th>Status</th></tr>';
            for (var i = 0; i < prescriptions.length; i++) {
                var p = prescriptions[i];
                html += '<tr><td><strong>' + p.drug_name + '</strong></td><td>' + (p.dosage||'') + '</td><td>' + (p.frequency||'') + '</td><td>' + (p.duration||'') + '</td><td>' + (p.status||'active') + '</td></tr>';
            }
            html += '</table>';
        }
        document.getElementById('rxList').innerHTML = html;
    } catch (err) { document.getElementById('rxList').innerHTML = '<p style="color:red">Error loading prescriptions</p>'; }
}

// ==================== LABORATORY SCREEN ====================
async function labScreen() {
    var dp = await fetch(API + '/api/visits/department/laboratory').then(function(r) { return r.json(); });
    var panels = await fetch(API + '/api/lab-panels').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🧪 ' + (currentUser.department_name || 'LABORATORY') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">📋 Lab Test Panels</div><div class="card-body">';
    for (var p = 0; p < panels.length; p++) {
        h += '<span class="badge badge-info" style="margin:3px;cursor:pointer" onclick="document.getElementById(\'labOrders\').value = \'' + panels[p].tests_included + '\'" title="' + panels[p].tests_included + '">' + panels[p].panel_name + '</span> ';
    }
    h += '</div></div>';
    h += '<div class="card"><div class="card-header">🧪 Lab Orders (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) { h += '<p style="color:var(--text-muted)">No lab orders pending.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('lab', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            if (d.allergies) h += '<p style="color:red">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<p><strong>Orders:</strong> ' + (d.lab_orders || 'No orders') + '</p>';
            if (d.ward_bed_number) h += '<p>🛏️ Bed: ' + d.ward_bed_number + '</p>';
            h += '<div class="form-group"><label>Results *</label><textarea id="lres_' + v.visit_id + '" required></textarea></div>';
            h += '<div class="form-group"><label>Cost (KES)</label><input type="number" id="lcost_' + v.visit_id + '" value="0"></div>';
            h += '<button class="btn btn-success" onclick="labCompleteWithBill(' + v.visit_id + ')">✅ Submit & Complete</button>';
            if (d.ward_bed_number) h += '<button class="btn btn-warning btn-small" style="margin-left:5px" onclick="returnToWard(' + v.visit_id + ')">🛏️ Return to Ward</button>';
            h += '<div class="transfer-panel" style="margin-top:8px"><strong>Forward To:</strong><div class="transfer-options">';
            var ld = relevantDepts['laboratory'] || [];
            for (var j = 0; j < ld.length; j++) { h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + ld[j] + '\')">📤 ' + ld[j] + '</button> '; }
            h += '</div></div></div></div>';
        }
    }
    return h + '</div></div>';
}

async function labCompleteWithBill(visitId) {
    var cb = document.getElementById('confirm_' + visitId);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    var results = document.getElementById('lres_' + visitId).value;
    if (!results) { toast('⚠️ Enter lab results', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lab_results: results }) });
    var cost = parseFloat(document.getElementById('lcost_' + visitId).value) || 0;
    quickBillAndRefer(visitId, 'consultation', 'Laboratory Tests', cost);
}

// ==================== RADIOLOGY SCREEN ====================
async function radioScreen() {
    var dp = await fetch(API + '/api/visits/department/radiology').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🩻 ' + (currentUser.department_name || 'RADIOLOGY') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🩻 Radiology Orders (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) { h += '<p style="color:var(--text-muted)">No imaging orders.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('radiology', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p><strong>Orders:</strong> ' + (d.radiology_orders || 'No orders') + '</p>';
            h += '<div class="row"><div class="form-group"><label>Type *</label><select id="rtype_' + v.visit_id + '" required><option>X-Ray</option><option>CT Scan</option><option>Ultrasound</option><option>MRI</option></select></div>';
            h += '<div class="form-group"><label>Body Part</label><input type="text" id="rbody_' + v.visit_id + '"></div></div>';
            h += '<div class="form-group"><label>Findings *</label><textarea id="rfind_' + v.visit_id + '" required></textarea></div>';
            h += '<div class="form-group"><label>Cost (KES)</label><input type="number" id="rcost_' + v.visit_id + '" value="0"></div>';
            h += '<button class="btn btn-purple" onclick="radioCompleteWithBill(' + v.visit_id + ')">✅ Submit & Complete</button>';
            if (d.ward_bed_number) h += '<button class="btn btn-warning btn-small" style="margin-left:5px" onclick="returnToWard(' + v.visit_id + ')">🛏️ Return to Ward</button>';
            h += '<div class="transfer-panel" style="margin-top:8px"><strong>Forward To:</strong><div class="transfer-options">';
            var rd = relevantDepts['radiology'] || [];
            for (var j = 0; j < rd.length; j++) { h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + rd[j] + '\')">📤 ' + rd[j] + '</button> '; }
            h += '</div></div></div></div>';
        }
    }
    return h + '</div></div>';
}

async function radioCompleteWithBill(visitId) {
    var cb = document.getElementById('confirm_' + visitId);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    var findings = document.getElementById('rfind_' + visitId).value;
    if (!findings) { toast('⚠️ Enter findings', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ radiology_type: document.getElementById('rtype_' + visitId).value, radiology_body_part: document.getElementById('rbody_' + visitId).value, radiology_findings: findings }) });
    var cost = parseFloat(document.getElementById('rcost_' + visitId).value) || 0;
    var type = document.getElementById('rtype_' + visitId).value || 'Imaging';
    quickBillAndRefer(visitId, 'consultation', 'Radiology: ' + type, cost);
}

// ==================== PHARMACY SCREEN ====================
async function pharmScreen() {
    var dp = await fetch(API + '/api/visits/department/pharmacy').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">💊 ' + (currentUser.department_name || 'PHARMACY') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">💊 Pharmacy (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) { h += '<p style="color:var(--text-muted)">No patients.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('pharmacy', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            if (d.allergies) h += '<p style="color:red">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<p><strong>Prescription:</strong> ' + (d.pharmacy_orders || d.treatment_plan || 'No prescription') + '</p>';
            h += '<div class="form-group"><label>Medications Dispensed *</label><textarea id="pdisp_' + v.visit_id + '" required></textarea></div>';
            h += '<div class="form-group"><label>Amount (KES)</label><input type="number" id="pamt_' + v.visit_id + '" value="0"></div>';
            h += '<button class="btn btn-success" onclick="pharmCompleteWithBill(' + v.visit_id + ')">✅ Dispense & Complete</button>';
            h += '<div class="transfer-options" style="margin-top:8px">';
            var pd = relevantDepts['pharmacy'] || [];
            for (var j = 0; j < pd.length; j++) { h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + pd[j] + '\')">📤 ' + pd[j] + '</button> '; }
            h += '</div></div></div>';
        }
    }
    return h + '</div></div>';
}

async function pharmCompleteWithBill(visitId) {
    var cb = document.getElementById('confirm_' + visitId);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    var dispensed = document.getElementById('pdisp_' + visitId).value;
    if (!dispensed) { toast('⚠️ Enter medications', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pharmacy_dispensed: dispensed }) });
    var amt = parseFloat(document.getElementById('pamt_' + visitId).value) || 0;
    quickBillAndRefer(visitId, 'cashier', 'Pharmacy: ' + dispensed.substring(0, 80), amt);
}

// ==================== WARD SCREEN WITH ROUNDS ====================
async function wardScreen() {
    var dp = await fetch(API + '/api/visits/department/ward').then(function(r) { return r.json(); });
    var beds = await fetch(API + '/api/beds/available').then(function(r) { return r.json(); });
    var allActive = await fetch(API + '/api/visits/active').then(function(r) { return r.json(); });
    var admitted = allActive.filter(function(v) { return v.ward_admitted; });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🛏️ ' + (currentUser.department_name || 'WARD') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🛏️ Available Beds (' + beds.length + ')</div><div class="card-body">';
    for (var i = 0; i < beds.length; i++) { h += '<span class="badge badge-success" style="margin:2px">' + beds[i].bed_number + ' (' + beds[i].ward_type + ')</span> '; }
    if (beds.length === 0) h += '<p style="color:var(--danger)">⚠️ No beds available!</p>';
    h += '</div></div>';
    h += '<div class="card"><div class="card-header">🛏️ New Admissions (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) { h += '<p style="color:var(--text-muted)">No new admissions.</p>'; }
    else {
        for (var j = 0; j < dp.length; j++) {
            var v = dp[j]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('ward', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Diagnosis: ' + (d.diagnosis || 'N/A') + '</p>';
            h += '<form onsubmit="admitPatient(event,' + v.visit_id + ')"><div class="form-group"><label>Assign Bed *</label><select id="bed_' + v.visit_id + '" required><option value="">Select bed</option>';
            for (var k = 0; k < beds.length; k++) { h += '<option value="' + beds[k].bed_number + '">' + beds[k].bed_number + ' (' + beds[k].ward_type + ')</option>'; }
            h += '</select></div><div class="form-group"><label>Ward Notes</label><textarea id="wnotes_' + v.visit_id + '"></textarea></div>';
            h += '<button type="submit" class="btn btn-success">✅ Admit Patient</button></form></div></div>';
        }
    }
    h += '</div></div>';
    if (admitted.length > 0) {
        h += '<div class="card"><div class="card-header">🏥 Admitted Patients (' + admitted.length + ')</div><div class="card-body patient-list">';
        for (var m = 0; m < admitted.length; m++) {
            var av = admitted[m]; var ad = await fetch(API + '/api/visits/' + av.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:8px;border-left:4px solid var(--warning)"><div class="card-body">';
            h += '<strong>' + av.first_name + ' ' + av.last_name + '</strong> | Bed: ' + (av.ward_bed_number||'?') + ' | ' + av.visit_number;
            if (ad.diagnosis) h += '<p>Dx: ' + ad.diagnosis + '</p>';
            if (ad.lab_results) h += '<div class="alert alert-info">🧪 Lab: ' + ad.lab_results + '</div>';
            if (ad.radiology_findings) h += '<div class="alert alert-info">🩻 Radiology: ' + ad.radiology_findings + '</div>';
            h += '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">';
            h += '<button class="btn btn-info btn-small" onclick="viewPatientFull(' + av.visit_id + ')">📋 Full View</button> ';
            h += '<button class="btn btn-info btn-small" onclick="addBillForPatient(' + av.visit_id + ',' + av.patient_id + ')">💰 Bill</button> ';
            h += '<button class="btn btn-purple btn-small" onclick="showWardRoundForm(' + av.visit_id + ',' + av.patient_id + ')">🩺 Ward Round</button> ';
            h += '<button class="btn btn-purple btn-small" onclick="wardReferWithOrders(' + av.visit_id + ',\'laboratory\')">🧪 Send to Lab</button> ';
            h += '<button class="btn btn-purple btn-small" onclick="wardReferWithOrders(' + av.visit_id + ',\'radiology\')">🩻 Send to Radiology</button> ';
            h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + av.visit_id + ',\'pharmacy\')">💊 Pharmacy</button> ';
            h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + av.visit_id + ',\'consultation\')">👨‍⚕️ Doctor</button> ';
            h += '<button class="btn btn-danger btn-small" onclick="declareDeath(' + av.visit_id + ')">⚰️ Declare Death</button> ';
            h += '<button class="btn btn-info btn-small" onclick="multiTransfer(' + av.visit_id + ')">📤 Multi</button></div>';
            h += '</div></div>';
        }
        h += '</div></div>';
    }
    return h;
}

async function admitPatient(event, visitId) {
    event.preventDefault();
    var cb = document.getElementById('confirm_' + visitId);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    var bedNumber = document.getElementById('bed_' + visitId).value;
    if (!bedNumber) { toast('⚠️ Select a bed', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ward_bed_number: bedNumber, ward_notes: document.getElementById('wnotes_' + visitId).value, ward_admitted: 1, status: 'admitted' }) });
    var wardFee = prompt('Enter ward admission fee (KES):', '');
    if (wardFee && !isNaN(parseFloat(wardFee)) && parseFloat(wardFee) > 0) {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: visitId, patient_id: detail.patient_id, item_description: 'Ward Admission - Bed ' + bedNumber, department: 'ward', amount: parseFloat(wardFee) }) });
    }
    var allBeds = await fetch(API + '/api/beds').then(function(r) { return r.json(); });
    var bed = allBeds.find(function(b) { return b.bed_number === bedNumber; });
    if (bed) { await fetch(API + '/api/beds/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bed_id: bed.bed_id, visit_id: visitId }) }); }
    toast('✅ Patient admitted to Bed ' + bedNumber, 'success');
    loadDashboard();
}

// ============ WARD ROUNDS FORM ============
function showWardRoundForm(visitId, patientId) {
    document.getElementById('modalTitle').textContent = '🩺 Ward Round - Record Vitals';
    document.getElementById('modalBody').innerHTML =
        '<div class="row">' +
        '<div class="form-group"><label>Temperature (°C)</label><input type="number" id="wrTemp" step="0.1" placeholder="36.5"></div>' +
        '<div class="form-group"><label>Blood Pressure</label><input type="text" id="wrBp" placeholder="120/80"></div>' +
        '<div class="form-group"><label>Heart Rate (bpm)</label><input type="number" id="wrHr" placeholder="72"></div>' +
        '<div class="form-group"><label>SpO2 (%)</label><input type="number" id="wrSpo2" placeholder="98"></div>' +
        '<div class="form-group"><label>Respiratory Rate</label><input type="number" id="wrRr" placeholder="16"></div>' +
        '<div class="form-group"><label>Blood Sugar</label><input type="number" id="wrSugar" step="0.1" placeholder="5.5"></div>' +
        '<div class="form-group"><label>Pain Score (0-10)</label><input type="number" id="wrPain" min="0" max="10" placeholder="0"></div>' +
        '</div>' +
        '<div class="form-group"><label>Medication Given</label><textarea id="wrMeds" rows="2" placeholder="List medications administered..."></textarea></div>' +
        '<div class="form-group"><label>Notes</label><textarea id="wrNotes" rows="2"></textarea></div>' +
        '<button class="btn btn-success btn-block" onclick="saveWardRound(' + visitId + ',' + patientId + ')">✅ Record Ward Round</button>' +
        '<hr><h4>Previous Rounds</h4><div id="wrHistory"></div>';
    document.getElementById('patientModal').style.display = 'block';
    loadWardRoundHistory(visitId);
}

async function saveWardRound(visitId, patientId) {
    try {
        await fetch(API + '/api/ward-rounds', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visit_id: visitId, patient_id: patientId,
                temperature: parseFloat(document.getElementById('wrTemp').value) || null,
                blood_pressure: document.getElementById('wrBp').value,
                heart_rate: parseInt(document.getElementById('wrHr').value) || null,
                spo2: parseFloat(document.getElementById('wrSpo2').value) || null,
                respiratory_rate: parseInt(document.getElementById('wrRr').value) || null,
                blood_sugar: parseFloat(document.getElementById('wrSugar').value) || null,
                pain_score: parseInt(document.getElementById('wrPain').value) || null,
                medication_given: document.getElementById('wrMeds').value,
                notes: document.getElementById('wrNotes').value
            })
        });
        toast('✅ Ward round recorded', 'success');
        loadWardRoundHistory(visitId);
        document.getElementById('wrTemp').value = '';
        document.getElementById('wrBp').value = '';
        document.getElementById('wrHr').value = '';
        document.getElementById('wrSpo2').value = '';
        document.getElementById('wrRr').value = '';
        document.getElementById('wrSugar').value = '';
        document.getElementById('wrPain').value = '';
        document.getElementById('wrMeds').value = '';
        document.getElementById('wrNotes').value = '';
    } catch (err) { toast('Error saving ward round', 'error'); }
}

async function loadWardRoundHistory(visitId) {
    try {
        var res = await fetch(API + '/api/ward-rounds/' + visitId);
        var rounds = await res.json();
        var html = '';
        if (!rounds.length) { html = '<p style="color:#888">No previous rounds recorded.</p>'; }
        else {
            html = '<table><tr><th>Time</th><th>Temp</th><th>BP</th><th>HR</th><th>SpO2</th><th>RR</th><th>Pain</th><th>Meds</th><th>By</th></tr>';
            for (var i = 0; i < rounds.length; i++) {
                var r = rounds[i];
                html += '<tr><td><small>' + new Date(r.created_at).toLocaleString() + '</small></td>';
                html += '<td>' + (r.temperature||'-') + '</td><td>' + (r.blood_pressure||'-') + '</td><td>' + (r.heart_rate||'-') + '</td>';
                html += '<td>' + (r.spo2||'-') + '</td><td>' + (r.respiratory_rate||'-') + '</td><td>' + (r.pain_score||'-') + '</td>';
                html += '<td>' + (r.medication_given||'-') + '</td><td>' + (r.full_name||'') + '</td></tr>';
            }
            html += '</table>';
        }
        document.getElementById('wrHistory').innerHTML = html;
    } catch (err) { document.getElementById('wrHistory').innerHTML = '<p style="color:red">Error loading history</p>'; }
}

// ==================== DECLARE DEATH ====================
function declareDeath(visitId) {
    document.getElementById('modalTitle').textContent = '⚰️ Declare Patient Deceased';
    document.getElementById('modalBody').innerHTML =
        '<div class="alert alert-danger">⚠️ This action is IRREVERSIBLE.</div>' +
        '<div class="form-group"><label>Cause of Death *</label><textarea id="deathCause" rows="2" required></textarea></div>' +
        '<div class="form-group"><label>Medical Summary *</label><textarea id="deathSummary" rows="3" required></textarea></div>' +
        '<div class="form-group"><label>Time of Death</label><input type="datetime-local" id="deathTime" value="' + new Date().toISOString().slice(0,16) + '"></div>' +
        '<button class="btn btn-danger btn-block" onclick="confirmDeath(' + visitId + ')">⚰️ Confirm Death & Send to Morgue</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function confirmDeath(visitId) {
    var cause = document.getElementById('deathCause').value.trim();
    var summary = document.getElementById('deathSummary').value.trim();
    var deathTime = document.getElementById('deathTime').value;
    if (!cause) { toast('⚠️ Enter cause of death', 'error'); return; }
    if (!summary) { toast('⚠️ Enter medical summary', 'error'); return; }
    if (!confirm('⚠️ FINAL WARNING: Mark patient as DECEASED? This cannot be undone.')) return;
    try {
        await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ morgue_cause_of_death: cause, morgue_notes: 'Death: ' + currentUser.full_name + ' | Time: ' + deathTime + ' | Summary: ' + summary, status: 'died', current_department: 'morgue' }) });
        await fetch(API + '/api/visits/' + visitId + '/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_department: 'morgue', notes: 'DECEASED | Cause: ' + cause + ' | ' + summary, complete_department: true }) });
        toast('⚰️ Patient sent to Morgue', 'info');
        closeModal();
        loadDashboard();
    } catch (err) { toast('Error: ' + err.message, 'error'); }
}

// ==================== CASHIER SCREEN - COMPLETE ====================
async function cashScreen() {
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">💰 ' + (currentUser.department_name || 'CASHIER') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    // Stats cards
    h += '<div class="stats-grid" id="cashierStats">';
    h += '<div class="stat-card"><div class="number" id="cashToday">KES 0</div><div class="label">Collected Today</div></div>';
    h += '<div class="stat-card success"><div class="number" id="cashTotal">KES 0</div><div class="label">Total Revenue</div></div>';
    h += '<div class="stat-card warning"><div class="number" id="cashPending">KES 0</div><div class="label">Outstanding</div></div>';
    h += '<div class="stat-card danger"><div class="number" id="cashExpenses">KES 0</div><div class="label">Expenses</div></div>';
    h += '</div>';
    
    // Search
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    
    // Active Patient Billing
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierBilling\')">💰 Active Patient Billing <span id="cashierBilling_icon">▼</span></div>';
    h += '<div id="cashierBilling" class="card-body" style="display:none"><div id="cashierBillingContent">Loading...</div></div></div>';
    
    // Record Expense
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierExpense\')">💸 Record Expense <span id="cashierExpense_icon">▼</span></div>';
    h += '<div id="cashierExpense" class="card-body" style="display:none"><div class="row"><div class="form-group"><label>Description *</label><input type="text" id="expDesc"></div>';
    h += '<div class="form-group"><label>Category</label><select id="expCat"><option>Salaries</option><option>Supplies</option><option>Equipment</option><option>Maintenance</option><option>Utilities</option><option>Cleaning</option><option>Food</option><option>Other</option></select></div>';
    h += '<div class="form-group"><label>Amount (KES) *</label><input type="number" id="expAmt" min="1"></div></div>';
    h += '<button class="btn btn-danger btn-block" onclick="recordExpense()">💸 Record Expense</button></div></div>';
    
    // Expense History
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierExpHistory\')">📋 Expense History <span id="cashierExpHistory_icon">▼</span></div>';
    h += '<div id="cashierExpHistory" class="card-body patient-list" style="display:none"><div id="cashierExpHistoryContent">Loading...</div></div></div>';
    
    // Payment Methods Breakdown
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierMethods\')">💳 Payment Methods Breakdown <span id="cashierMethods_icon">▼</span></div>';
    h += '<div id="cashierMethods" class="card-body" style="display:none"><div id="cashierMethodsContent">Loading...</div></div></div>';
    
    // Revenue by Department (ALL TIME - includes discharged patients)
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierDeptRev\')">🏥 Revenue by Department (All Time) <span id="cashierDeptRev_icon">▼</span></div>';
    h += '<div id="cashierDeptRev" class="card-body" style="display:none"><div id="cashierDeptRevContent">Loading...</div></div></div>';
    
    // Financial Summary (All Time - includes discharged)
    h += '<div class="card"><div class="card-header" style="cursor:pointer;background:#e8f5e9" onclick="toggleAdminSection(\'cashierSummary\')">📊 Complete Financial Summary <span id="cashierSummary_icon">▼</span></div>';
    h += '<div id="cashierSummary" class="card-body" style="display:none"><div id="cashierSummaryContent">Loading...</div></div></div>';
    
    setTimeout(function() { loadCashierBilling(); loadCashierExpenses(); loadCashierMethods(); loadCashierStats(); loadCashierDeptRevenue(); loadCashierSummary(); }, 200);
    return h;
}

async function loadCashierBilling() {
    try {
        var res = await fetch(API + '/api/billing/all'); var data = await res.json();
        var patients = data.patients || [];
        if (patients.length === 0) { document.getElementById('cashierBillingContent').innerHTML = '<p style="color:var(--text-muted);text-align:center">No active patients with bills.</p>'; return; }
        var html = '<div style="background:#f8f9fa;padding:10px;border-radius:6px;margin-bottom:10px">';
        html += '<div style="display:flex;justify-content:space-between"><span>Total Expected:</span><span><strong>KES ' + (data.grand_total||0).toLocaleString() + '</strong></span></div>';
        html += '<div style="display:flex;justify-content:space-between;color:green"><span>Total Collected:</span><span><strong>KES ' + (data.grand_paid||0).toLocaleString() + '</strong></span></div>';
        html += '<div style="display:flex;justify-content:space-between;color:red;font-weight:bold"><span>Outstanding:</span><span><strong>KES ' + (data.grand_balance||0).toLocaleString() + '</strong></span></div></div>';
        for (var i = 0; i < patients.length; i++) {
            var pt = patients[i]; var cardId = 'cashBill_' + pt.visit_id;
            html += '<div class="card" style="margin-bottom:6px;border:1px solid ' + (pt.balance > 0 ? 'var(--warning)' : 'var(--success)') + '">';
            html += '<div style="padding:8px 12px;cursor:pointer;background:' + (pt.balance > 0 ? '#fffdf0' : '#f0fff0') + '" onclick="toggleAdminSection(\'' + cardId + '\')">';
            html += '<strong>' + pt.patient_name + '</strong> | ' + pt.visit_number + ' | Balance: <strong style="color:' + (pt.balance > 0 ? 'red' : 'green') + '">KES ' + pt.balance.toLocaleString() + '</strong> <span id="' + cardId + '_icon" style="float:right">▼</span></div>';
            html += '<div id="' + cardId + '" style="display:none;padding:8px">';
            html += '<table style="width:100%"><tr><th>Item</th><th>Dept</th><th>Amount</th><th>Method</th><th>Status</th><th>Action</th></tr>';
            for (var j = 0; j < pt.bills.length; j++) {
                var b = pt.bills[j];
                html += '<tr><td style="font-size:11px">' + b.item_description + '</td><td>' + (b.department||'') + '</td><td>KES ' + parseFloat(b.amount||0).toLocaleString() + '</td><td>' + (b.payment_method||'N/A') + '</td><td>' + (b.is_paid?'✅':'❌') + '</td>';
                html += '<td>';
                if (!b.is_paid) html += '<button class="btn btn-success btn-small" onclick="markBillPaidWithMethod(' + b.bill_id + ',' + pt.visit_id + ')">Pay</button> ';
                html += '<button class="btn btn-danger btn-small" onclick="deleteBill(' + b.bill_id + ',' + pt.visit_id + ');setTimeout(function(){loadCashierBilling();loadCashierStats();},500)">🗑️</button></td></tr>';
            }
            html += '</table>';
            if (pt.balance <= 0) html += '<button class="btn btn-success btn-small" style="margin-top:5px" onclick="dischargePatientDirect(' + pt.visit_id + ')">✅ DISCHARGE</button>';
            html += '</div></div>';
        }
        document.getElementById('cashierBillingContent').innerHTML = html;
    } catch (err) { document.getElementById('cashierBillingContent').innerHTML = '<p style="color:red">Error</p>'; }
}

async function loadCashierExpenses() {
    try {
        var res = await fetch(API + '/api/expenses'); var expenses = await res.json();
        if (!expenses || expenses.length === 0) { document.getElementById('cashierExpHistoryContent').innerHTML = '<p style="color:var(--text-muted);text-align:center">No expenses recorded.</p>'; return; }
        var totalExp = 0; var html = '<table><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>By</th></tr>';
        for (var i = 0; i < expenses.length; i++) { var e = expenses[i]; totalExp += parseFloat(e.amount||0); html += '<tr><td><small>' + (e.created_at?new Date(e.created_at).toLocaleDateString():'N/A') + '</small></td><td>' + e.description + '</td><td><span class="badge badge-info">' + (e.category||'General') + '</span></td><td><strong style="color:var(--danger)">KES ' + parseFloat(e.amount||0).toLocaleString() + '</strong></td><td><small>' + (e.recorded_by_name||'') + '</small></td></tr>'; }
        html += '<tr style="background:#ffeaea;font-weight:bold"><td colspan="3">TOTAL EXPENSES</td><td>KES ' + totalExp.toLocaleString() + '</td><td></td></tr></table>';
        document.getElementById('cashierExpHistoryContent').innerHTML = html;
    } catch (err) { document.getElementById('cashierExpHistoryContent').innerHTML = '<p style="color:red">Error</p>'; }
}

async function loadCashierMethods() {
    try {
        var res = await fetch(API + '/api/finance/summary'); var data = await res.json();
        var methods = data.revenue.byPaymentMethod || [];
        var html = '<table><tr><th>Method</th><th>Amount</th><th>Transactions</th></tr>';
        for (var i = 0; i < methods.length; i++) { html += '<tr><td><strong>' + (methods[i].payment_method||'Cash') + '</strong></td><td>KES ' + (methods[i].total||0).toLocaleString() + '</td><td>' + (methods[i].count||0) + '</td></tr>'; }
        if (methods.length === 0) html += '<tr><td colspan="3" style="color:var(--text-muted)">No payments recorded</td></tr>';
        html += '</table>';
        document.getElementById('cashierMethodsContent').innerHTML = html;
    } catch (err) { document.getElementById('cashierMethodsContent').innerHTML = '<p style="color:red">Error</p>'; }
}

async function loadCashierStats() {
    try {
        var res = await fetch(API + '/api/finance/summary'); var data = await res.json();
        document.getElementById('cashToday').textContent = 'KES ' + (data.revenue.todayCollections||0).toLocaleString();
        document.getElementById('cashTotal').textContent = 'KES ' + (data.revenue.totalPaid||0).toLocaleString();
        document.getElementById('cashPending').textContent = 'KES ' + (data.revenue.totalPending||0).toLocaleString();
        document.getElementById('cashExpenses').textContent = 'KES ' + (data.expenses.total||0).toLocaleString();
    } catch (err) { console.log('Error loading stats'); }
}

async function loadCashierDeptRevenue() {
    try {
        var res = await fetch(API + '/api/finance/summary'); var data = await res.json();
        var depts = data.revenue.byDepartment || [];
        var html = '<table><tr><th>Department</th><th>Total Billed</th><th>Collected</th><th>Pending</th></tr>';
        for (var i = 0; i < depts.length; i++) { var d = depts[i]; html += '<tr><td style="text-transform:capitalize">' + d.department + '</td><td>KES ' + (d.total||0).toLocaleString() + '</td><td>KES ' + (d.paid||0).toLocaleString() + '</td><td>KES ' + ((d.total-d.paid)||0).toLocaleString() + '</td></tr>'; }
        html += '</table>';
        document.getElementById('cashierDeptRevContent').innerHTML = html;
    } catch (err) { document.getElementById('cashierDeptRevContent').innerHTML = '<p style="color:red">Error</p>'; }
}

async function loadCashierSummary() {
    try {
        var res = await fetch(API + '/api/finance/summary'); var data = await res.json();
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:15px">';
        html += '<div style="background:#e8f5e9;padding:12px;border-radius:6px;text-align:center"><div style="font-size:24px;font-weight:bold;color:var(--success)">KES ' + (data.revenue.totalPaid||0).toLocaleString() + '</div><div>Total Collected (All Time)</div></div>';
        html += '<div style="background:#fff3e0;padding:12px;border-radius:6px;text-align:center"><div style="font-size:24px;font-weight:bold;color:var(--warning)">KES ' + (data.revenue.totalPending||0).toLocaleString() + '</div><div>Outstanding</div></div>';
        html += '<div style="background:#fce4ec;padding:12px;border-radius:6px;text-align:center"><div style="font-size:24px;font-weight:bold;color:var(--danger)">KES ' + (data.expenses.total||0).toLocaleString() + '</div><div>Expenses</div></div></div>';
        html += '<div style="background:#e3f2fd;padding:15px;border-radius:8px;text-align:center;margin-bottom:10px">';
        html += '<div style="font-size:14px">Net Income (Revenue - Expenses)</div>';
        html += '<div style="font-size:28px;font-weight:bold;color:' + ((data.netIncome||0)>=0?'var(--success)':'var(--danger)') + '">KES ' + (data.netIncome||0).toLocaleString() + '</div></div>';
        html += '<p style="font-size:11px;color:var(--text-muted)">This includes ALL transactions - active and discharged patients.</p>';
        document.getElementById('cashierSummaryContent').innerHTML = html;
    } catch (err) { document.getElementById('cashierSummaryContent').innerHTML = '<p style="color:red">Error</p>'; }
}

async function recordExpense() {
    var desc = document.getElementById('expDesc').value.trim();
    var cat = document.getElementById('expCat').value;
    var amt = parseFloat(document.getElementById('expAmt').value);
    if (!desc) { toast('⚠️ Enter description', 'error'); return; }
    if (!amt || amt <= 0) { toast('⚠️ Enter valid amount', 'error'); return; }
    try {
        await fetch(API + '/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: desc, category: cat, amount: amt }) });
        toast('💸 Expense recorded: ' + desc + ' - KES ' + amt.toLocaleString(), 'success');
        document.getElementById('expDesc').value = ''; document.getElementById('expAmt').value = '';
        loadCashierExpenses(); loadCashierStats(); loadCashierSummary();
    } catch (err) { toast('Error', 'error'); }
}

async function payAllBills(vid) {
    if (!confirm('Mark ALL remaining bills as paid?')) return;
    try {
        var bd = await fetch(API + '/api/billing/' + vid).then(function(r) { return r.json(); });
        for (var i = 0; i < (bd.bills||[]).length; i++) { if (!bd.bills[i].is_paid) await fetch(API + '/api/billing/' + bd.bills[i].bill_id + '/pay', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_method: 'Cash' }) }); }
        toast('✅ All bills paid', 'success'); loadDashboard();
    } catch (err) { toast('Error', 'error'); }
}

// ==================== DIETARY SCREEN ====================
async function dietScreen() {
    var dp = await fetch(API + '/api/visits/department/dietary').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🍽️ ' + (currentUser.department_name || 'DIETARY') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🍽️ Dietary Plans (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('dietary', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Diagnosis: ' + (d.diagnosis||'N/A') + ' | Bed: ' + (d.ward_bed_number||'N/A') + '</p>';
            h += '<form onsubmit="saveDiet(event,' + v.visit_id + ')"><div class="form-group"><label>Restrictions</label><textarea id="drest_' + v.visit_id + '">' + (d.dietary_restrictions||'') + '</textarea></div>';
            h += '<div class="form-group"><label>Meal Plan *</label><textarea id="dplan_' + v.visit_id + '" required>' + (d.dietary_plan||'') + '</textarea></div>';
            h += '<button class="btn btn-success">✅ Save</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'ward\')">📤 Return to Ward</button></div></div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveDiet(e, vid) { e.preventDefault(); var cb=document.getElementById('confirm_'+vid); if(cb&&!cb.checked){toast('⚠️ Confirm patient!','error');return;} await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({dietary_restrictions:document.getElementById('drest_'+vid).value,dietary_plan:document.getElementById('dplan_'+vid).value})}); await completeAndTransfer(vid,'ward',{},'Dietary plan assigned'); }

// ==================== BLOOD BANK ====================
async function bloodScreen() {
    var dp = await fetch(API + '/api/visits/department/bloodbank').then(function(r) { return r.json(); });
    var inv = await fetch(API + '/api/bloodbank').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🩸 ' + (currentUser.department_name || 'BLOOD BANK') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🩸 Inventory</div><div class="card-body"><table><tr><th>Blood Group</th><th>Units</th><th>Expiry</th></tr>';
    for (var i = 0; i < inv.length; i++) { h += '<tr><td><strong>' + inv[i].blood_group + '</strong></td><td>' + inv[i].units_available + '</td><td>' + (inv[i].expiry_date||'N/A') + '</td></tr>'; }
    h += '</table></div></div>';
    h += '<div class="card"><div class="card-header">🩸 Requests (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No requests.</p>'; }
    else {
        for (var j = 0; j < dp.length; j++) {
            var v = dp[j]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('bloodbank', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Blood Group: ' + (d.blood_group||'Unknown') + ' | Dx: ' + (d.diagnosis||'N/A') + '</p>';
            h += '<form onsubmit="saveBlood(event,' + v.visit_id + ')"><div class="row"><div class="form-group"><label>Type</label><select id="btype_' + v.visit_id + '"><option>Whole Blood</option><option>Packed Cells</option><option>Platelets</option><option>Plasma</option></select></div>';
            h += '<div class="form-group"><label>Units *</label><input type="number" id="bunits_' + v.visit_id + '" value="1" min="1" required></div></div>';
            h += '<button class="btn btn-danger">✅ Process</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'ward\')">📤 Ward</button></div></div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveBlood(e, vid) { e.preventDefault(); var cb=document.getElementById('confirm_'+vid); if(cb&&!cb.checked){toast('⚠️ Confirm patient!','error');return;} var units=parseInt(document.getElementById('bunits_'+vid).value)||0; await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({bloodbank_request_type:document.getElementById('btype_'+vid).value,bloodbank_units:units,bloodbank_status:'Issued'})}); if(units>0){var d=await fetch(API+'/api/visits/'+vid).then(function(r){return r.json();}); await fetch(API+'/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:vid,patient_id:d.patient_id,item_description:'Blood Bank: '+units+' units',department:'bloodbank',amount:units*1500})});} await completeAndTransfer(vid,'ward',{},'Blood issued: '+units+' units'); }

// ==================== SOCIAL WORK ====================
async function socialScreen() {
    var dp = await fetch(API + '/api/visits/department/socialwork').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🤝 ' + (currentUser.department_name || 'SOCIAL WORK') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🤝 Cases (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No cases.</p>'; }
    else { for (var i=0;i<dp.length;i++){ var v=dp[i]; var d=await fetch(API+'/api/visits/'+v.visit_id).then(function(r){return r.json();}); h+='<div class="card" style="margin-bottom:10px"><div class="card-body">'; h+=confirmBox('socialwork',v.visit_id,d); h+='<strong>'+d.first_name+' '+d.last_name+'</strong> | '+v.visit_number; h+='<form onsubmit="saveSocial(event,'+v.visit_id+')"><div class="form-group"><label>Assessment *</label><textarea id="sassess_'+v.visit_id+'" required>'+(d.socialwork_assessment||'')+'</textarea></div>'; h+='<div class="form-group"><label>Support Type</label><select id="ssupport_'+v.visit_id+'"><option>Financial</option><option>Family Support</option><option>Counseling</option><option>Discharge Planning</option></select></div>'; h+='<div class="form-group"><label>Notes</label><textarea id="snotes_'+v.visit_id+'">'+(d.socialwork_notes||'')+'</textarea></div>'; h+='<button class="btn btn-purple">✅ Save</button></form>'; h+='<button class="btn btn-info btn-small" onclick="transferPatient('+v.visit_id+',\'ward\')">📤 Ward</button></div></div>'; } }
    return h+'</div></div>';
}
async function saveSocial(e,vid){e.preventDefault();var cb=document.getElementById('confirm_'+vid);if(cb&&!cb.checked){toast('⚠️ Confirm!','error');return;}await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({socialwork_assessment:document.getElementById('sassess_'+vid).value,socialwork_support_type:document.getElementById('ssupport_'+vid).value,socialwork_notes:document.getElementById('snotes_'+vid).value})});await completeAndTransfer(vid,'ward',{},'Social work completed');}

// ==================== PHYSIOTHERAPY ====================
async function physioScreen() {
    var dp = await fetch(API + '/api/visits/department/physio').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🏃 ' + (currentUser.department_name || 'PHYSIOTHERAPY') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🏃 Physio (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients.</p>'; }
    else { for (var i=0;i<dp.length;i++){ var v=dp[i]; var d=await fetch(API+'/api/visits/'+v.visit_id).then(function(r){return r.json();}); h+='<div class="card" style="margin-bottom:10px"><div class="card-body">'; h+=confirmBox('physio',v.visit_id,d); h+='<strong>'+d.first_name+' '+d.last_name+'</strong> | '+v.visit_number; h+='<form onsubmit="savePhysio(event,'+v.visit_id+')"><div class="form-group"><label>Assessment</label><textarea id="pa_'+v.visit_id+'">'+(d.physio_assessment||'')+'</textarea></div>'; h+='<div class="form-group"><label>Treatment</label><textarea id="pp_'+v.visit_id+'">'+(d.physio_treatment_plan||'')+'</textarea></div>'; h+='<div class="form-group"><label>Sessions</label><input type="number" id="ps_'+v.visit_id+'" value="'+(d.physio_sessions_completed||0)+'" min="0"></div>'; h+='<button class="btn btn-success">✅ Save</button></form>'; h+='<button class="btn btn-info btn-small" onclick="transferPatient('+v.visit_id+',\'ward\')">📤 Ward</button></div></div>'; } }
    return h+'</div></div>';
}
async function savePhysio(e,vid){e.preventDefault();var cb=document.getElementById('confirm_'+vid);if(cb&&!cb.checked){toast('⚠️ Confirm!','error');return;}var sessions=parseInt(document.getElementById('ps_'+vid).value)||0;await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({physio_assessment:document.getElementById('pa_'+vid).value,physio_treatment_plan:document.getElementById('pp_'+vid).value,physio_sessions_completed:sessions})});if(sessions>0){var d=await fetch(API+'/api/visits/'+vid).then(function(r){return r.json();});await fetch(API+'/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:vid,patient_id:d.patient_id,item_description:'Physio - '+sessions+' sessions',department:'physio',amount:sessions*600})});}await completeAndTransfer(vid,'ward',{},'Physio completed');}
                                 
                                 // ==================== ISOLATION SCREEN ====================
async function isoScreeen() {
    var dp = await fetch(API + '/api/visits/department/isolation').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🔒 ' + (currentUser.department_name || 'ISOLATION') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card" style="border:2px solid var(--danger)"><div class="card-header">🔒 Isolation (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px;border:2px solid var(--danger)"><div class="card-body">';
            h += confirmBox('isolation', v.visit_id, d);
            h += '<strong style="color:var(--danger)">' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<form onsubmit="saveIso(event,' + v.visit_id + ')"><div class="row"><div class="form-group"><label>Type *</label><select id="itype_' + v.visit_id + '" required><option>Contact</option><option>Droplet</option><option>Airborne</option><option>Strict</option></select></div>';
            h += '<div class="form-group"><label>Room</label><input type="text" id="iroom_' + v.visit_id + '" value="' + (d.isolation_room_number||'') + '"></div></div>';
            h += '<div class="form-group"><label>Precautions *</label><textarea id="iprec_' + v.visit_id + '" required>' + (d.isolation_precautions||'') + '</textarea></div>';
            h += '<button class="btn btn-danger">✅ Admit to Isolation</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'ward\')">📤 Ward</button></div></div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveIso(e, vid) { e.preventDefault(); var cb=document.getElementById('confirm_'+vid); if(cb&&!cb.checked){toast('⚠️ Confirm!','error');return;} await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({isolation_type:document.getElementById('itype_'+vid).value,isolation_precautions:document.getElementById('iprec_'+vid).value,isolation_room_number:document.getElementById('iroom_'+vid).value,status:'isolated'})}); var d=await fetch(API+'/api/visits/'+vid).then(function(r){return r.json();}); var isoFee=prompt('Enter isolation fee (KES):',''); if(isoFee&&!isNaN(parseFloat(isoFee))&&parseFloat(isoFee)>0){await fetch(API+'/api/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visit_id:vid,patient_id:d.patient_id,item_description:'Isolation Admission',department:'isolation',amount:parseFloat(isoFee)})});} toast('✅ Admitted to Isolation','success'); loadDashboard(); }

// ==================== MEDICAL RECORDS ====================
async function medScreen() {
    var dp = await fetch(API + '/api/visits/department/medrecords').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">📁 ' + (currentUser.department_name || 'MED RECORDS') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">📁 Records (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No requests.</p>'; }
    else { for (var i=0;i<dp.length;i++){ var v=dp[i]; var d=await fetch(API+'/api/visits/'+v.visit_id).then(function(r){return r.json();}); h+='<div class="card" style="margin-bottom:10px"><div class="card-body">'; h+=confirmBox('medrecords',v.visit_id,d); h+='<strong>'+d.first_name+' '+d.last_name+'</strong> | '+v.visit_number; h+='<form onsubmit="saveMed(event,'+v.visit_id+')"><div class="form-group"><label>File Reference</label><input type="text" id="mfile_'+v.visit_id+'" value="'+(d.medrecords_file_reference||'')+'"></div>'; h+='<div class="form-group"><label>Notes</label><textarea id="mnotes_'+v.visit_id+'">'+(d.medrecords_notes||'')+'</textarea></div>'; h+='<button class="btn btn-purple">✅ Retrieve</button></form>'; h+='<button class="btn btn-info btn-small" onclick="transferPatient('+v.visit_id+',\'consultation\')">📤 Doctor</button></div></div>'; } }
    return h+'</div></div>';
}
async function saveMed(e,vid){e.preventDefault();var cb=document.getElementById('confirm_'+vid);if(cb&&!cb.checked){toast('⚠️ Confirm!','error');return;}await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({medrecords_file_reference:document.getElementById('mfile_'+vid).value,medrecords_notes:document.getElementById('mnotes_'+vid).value})});await completeAndTransfer(vid,'consultation',{},'Records retrieved');}

// ==================== REFERRAL SCREEN ====================
async function refScreen() {
    var dp = await fetch(API + '/api/visits/department/referral').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || 'REFERRAL') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🏥 Referrals (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No referrals.</p>'; }
    else { for (var i=0;i<dp.length;i++){ var v=dp[i]; var d=await fetch(API+'/api/visits/'+v.visit_id).then(function(r){return r.json();}); h+='<div class="card" style="margin-bottom:10px"><div class="card-body">'; h+=confirmBox('referral',v.visit_id,d); h+='<strong>'+d.first_name+' '+d.last_name+'</strong> | '+v.visit_number; h+='<form onsubmit="doRef(event,'+v.visit_id+')"><div class="form-group"><label>Hospital *</label><input type="text" id="rhosp_'+v.visit_id+'" required></div>'; h+='<div class="form-group"><label>Level</label><select id="rlevel_'+v.visit_id+'"><option>Higher Level</option><option>Same Level</option><option>Lower Level</option></select></div>'; h+='<div class="form-group"><label>Reason *</label><textarea id="rreason_'+v.visit_id+'" required></textarea></div>'; h+='<button class="btn btn-purple">✅ Complete</button></form></div></div>'; } }
    return h+'</div></div>';
}
async function doRef(e,vid){e.preventDefault();var cb=document.getElementById('confirm_'+vid);if(cb&&!cb.checked){toast('⚠️ Confirm!','error');return;}await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({referral_hospital_name:document.getElementById('rhosp_'+vid).value,referral_hospital_level:document.getElementById('rlevel_'+vid).value,referral_reason:document.getElementById('rreason_'+vid).value,referral_completed:1,status:'referred_out'})});await completeAndTransfer(vid,'referred_out',{},'Referred to '+document.getElementById('rhosp_'+vid).value);}

// ==================== SHA SCREEN ====================
async function shaScreen() {
    var dp = await fetch(API + '/api/visits/department/sha').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">📋 ' + (currentUser.department_name || 'SHA') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">📋 SHA (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No SHA cases.</p>'; }
    else { for (var i=0;i<dp.length;i++){ var v=dp[i]; var d=await fetch(API+'/api/visits/'+v.visit_id).then(function(r){return r.json();}); h+='<div class="card" style="margin-bottom:10px"><div class="card-body">'; h+=confirmBox('sha',v.visit_id,d); h+='<strong>'+d.first_name+' '+d.last_name+'</strong> | '+v.visit_number; h+='<form onsubmit="doSha(event,'+v.visit_id+')"><div class="row"><div class="form-group"><label>Scheme *</label><input type="text" id="scheme_'+v.visit_id+'" required></div>'; h+='<div class="form-group"><label>Member #</label><input type="text" id="smember_'+v.visit_id+'"></div>'; h+='<div class="form-group"><label>Auth Code</label><input type="text" id="sauth_'+v.visit_id+'"></div>'; h+='<div class="form-group"><label>Status</label><select id="sstatus_'+v.visit_id+'"><option>Approved</option><option>Pending</option><option>Rejected</option></select></div></div>'; h+='<div class="form-group"><label>Notes</label><textarea id="shanotes_'+v.visit_id+'">'+(d.sha_notes||'')+'</textarea></div>'; h+='<button class="btn btn-purple">✅ Save</button></form>'; h+='<button class="btn btn-info btn-small" onclick="transferPatient('+v.visit_id+',\'cashier\')">📤 Cashier</button></div></div>'; } }
    return h+'</div></div>';
}
async function doSha(e,vid){e.preventDefault();var cb=document.getElementById('confirm_'+vid);if(cb&&!cb.checked){toast('⚠️ Confirm!','error');return;}await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha_scheme_name:document.getElementById('scheme_'+vid).value,sha_member_number:document.getElementById('smember_'+vid).value,sha_authorization_code:document.getElementById('sauth_'+vid).value,sha_status:document.getElementById('sstatus_'+vid).value,sha_notes:document.getElementById('shanotes_'+vid).value,sha_completed:1})});await completeAndTransfer(vid,'cashier',{},'SHA completed');}

// ==================== MORGUE SCREEN ====================
async function morgScreen() {
    var dp = await fetch(API + '/api/visits/department/morgue').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">⚰️ ' + (currentUser.department_name || 'MORGUE') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">⚰️ Morgue (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No records.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i]; var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px;border-left:4px solid var(--danger)"><div class="card-body">';
            h += confirmBox('morgue', v.visit_id, d);
            h += '<strong style="color:var(--danger)">' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>DOB: ' + (d.date_of_birth||'N/A') + ' | ID: ' + (d.national_id||'N/A') + '</p>';
            if (d.morgue_cause_of_death) h += '<p><strong>Cause:</strong> ' + d.morgue_cause_of_death + '</p>';
            if (d.morgue_notes) h += '<div class="alert alert-info">' + d.morgue_notes + '</div>';
            if (d.diagnosis) h += '<p><strong>Diagnosis:</strong> ' + d.diagnosis + '</p>';
            h += '<div style="background:#f8f9fa;padding:8px;border-radius:5px;margin:8px 0">';
            h += '<p><strong>⏰ Entry:</strong> ' + (d.updated_at||'N/A') + '</p>';
            if (d.morgue_completed) h += '<p><strong>✅ Cleared:</strong> ' + (d.morgue_completed_at||'N/A') + '</p>';
            h += '</div>';
            if (!d.morgue_completed) {
                h += '<form onsubmit="saveMorgueRecord(event,' + v.visit_id + ')">';
                h += '<div class="form-group"><label>Cause of Death *</label><textarea id="mcause_' + v.visit_id + '" required>' + (d.morgue_cause_of_death||'') + '</textarea></div>';
                h += '<div class="form-group"><label>Released To</label><input type="text" id="mrel_' + v.visit_id + '" value="' + (d.morgue_body_released_to||'') + '"></div>';
                h += '<div class="form-group"><label>Time of Release</label><input type="datetime-local" id="mtime_' + v.visit_id + '" value="' + new Date().toISOString().slice(0,16) + '"></div>';
                h += '<button class="btn btn-danger">⚰️ Finalize</button></form>';
            } else { h += '<div class="alert alert-success">✅ Record finalized</div>'; }
            h += '<button class="btn btn-info btn-small" style="margin-top:5px" onclick="addBillForPatient(' + v.visit_id + ',' + v.patient_id + ')">💰 Morgue Bill</button> ';
            h += '<button class="btn btn-info btn-small" onclick="viewPatientFull(' + v.visit_id + ')">📋 History</button></div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveMorgueRecord(e, vid) { e.preventDefault(); var cb=document.getElementById('confirm_'+vid); if(cb&&!cb.checked){toast('⚠️ Confirm!','error');return;} if(!confirm('⚠️ Finalize this record? IRREVERSIBLE.')) return; var releaseTime=document.getElementById('mtime_'+vid).value; await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({morgue_cause_of_death:document.getElementById('mcause_'+vid).value,morgue_body_released_to:document.getElementById('mrel_'+vid).value,morgue_completed:1,morgue_completed_at:releaseTime||new Date().toISOString(),status:'deceased_cleared'})}); toast('⚰️ Record finalized','info'); loadDashboard(); }

// ==================== STORE SCREEN ====================
async function storeScreen() {
    var inv = await fetch(API + '/api/inventory').then(function(r) { return r.json(); });
    var low = await fetch(API + '/api/inventory/low-stock').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">📦 ' + (currentUser.department_name || 'STORE') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">⚠️ Low Stock (' + low.length + ')</div><div class="card-body">';
    if (!low.length) { h += '<p style="color:var(--success)">✅ All stocked.</p>'; }
    else { h += '<table><tr><th>Item</th><th>Stock</th><th>Min</th><th>Dept</th></tr>'; for (var i=0;i<low.length;i++){ h+='<tr class="low-stock"><td><strong>'+low[i].item_name+'</strong></td><td style="color:red">'+low[i].current_stock+'</td><td>'+low[i].minimum_stock+'</td><td>'+(low[i].department||'')+'</td></tr>'; } h+='</table>'; }
    h += '</div></div>';
    h += '<div class="card"><div class="card-header">📦 Add Item</div><div class="card-body"><form id="addItemForm"><div class="row">';
    h += '<div class="form-group"><label>Item *</label><input type="text" id="siname" required></div>';
    h += '<div class="form-group"><label>Category</label><select id="sicat"><option>Medicine</option><option>Supplies</option><option>Equipment</option><option>Food</option><option>Cleaning</option></select></div>';
    h += '<div class="form-group"><label>Dept</label><select id="sidept"><option>pharmacy</option><option>ward</option><option>laboratory</option><option>radiology</option><option>general</option></select></div>';
    h += '<div class="form-group"><label>Qty</label><input type="number" id="siqty" value="0"></div>';
    h += '<div class="form-group"><label>Min Stock</label><input type="number" id="simin" value="10"></div>';
    h += '<div class="form-group"><label>Unit</label><input type="text" id="siunit"></div>';
    h += '<div class="form-group"><label>Price (KES)</label><input type="number" id="siprice" value="0"></div>';
    h += '</div><button class="btn btn-success btn-block">➕ Add</button></form></div></div>';
    h += '<div class="card"><div class="card-header">📋 Inventory (' + inv.length + ')</div><div class="card-body patient-list"><table><tr><th>Item</th><th>Stock</th><th>Min</th><th>Price</th><th>Dept</th></tr>';
    for (var j=0;j<inv.length;j++){ var item=inv[j]; h+='<tr class="'+(item.current_stock<=item.minimum_stock?'low-stock':'')+'"><td><strong>'+item.item_name+'</strong></td><td>'+item.current_stock+' '+(item.unit||'')+'</td><td>'+item.minimum_stock+'</td><td>KES '+parseFloat(item.unit_price||0).toLocaleString()+'</td><td>'+(item.department||'')+'</td></tr>'; }
    h += '</table></div></div>';
    return h;
}

// ==================== MANAGER SCREEN ====================
async function mgrScreen() {
    var stats = await fetch(API + '/api/dashboard').then(function(r) { return r.json(); });
    var queues = await fetch(API + '/api/manager/queues').then(function(r) { return r.json(); });
    var revenue = await fetch(API + '/api/manager/revenue').then(function(r) { return r.json(); });
    var h = '<div class="manager-grid">';
    h += '<div class="manager-card"><h4>📊 Department Queues</h4>';
    for (var i = 0; i < queues.length; i++) { h += '<div class="queue-item"><span style="text-transform:capitalize">' + queues[i].current_department + '</span><span class="queue-count">' + queues[i].waiting + ' waiting</span></div>'; }
    if (queues.length === 0) h += '<p style="color:#888">No patients in queue.</p>';
    h += '</div>';
    h += '<div class="manager-card"><h4>🛏️ Bed Status</h4><div class="stats-grid" style="grid-template-columns:1fr 1fr"><div class="stat-card success"><div class="number">' + (stats.occupiedBeds||0) + '</div><div class="label">Occupied</div></div><div class="stat-card"><div class="number">' + ((stats.totalBeds||5)-(stats.occupiedBeds||0)) + '</div><div class="label">Available</div></div></div></div>';
    h += '<div class="manager-card"><h4>💰 Financial</h4><div class="stats-grid" style="grid-template-columns:1fr 1fr"><div class="stat-card warning"><div class="number">KES ' + (stats.pendingBills||0).toLocaleString() + '</div><div class="label">Pending</div></div><div class="stat-card success"><div class="number">' + stats.todayVisits + '</div><div class="label">Today</div></div></div></div>';
    h += '<div class="manager-card"><h4>📦 Inventory</h4><p>Low Stock: <strong style="color:var(--warning)">' + (stats.lowStockItems||0) + '</strong></p></div>';
    h += '<div class="manager-card" style="grid-column:1/-1"><h4>📈 Revenue (30 Days)</h4><div style="max-height:300px;overflow-y:auto"><table><tr><th>Date</th><th>Revenue</th><th>Transactions</th><th>Method</th></tr>';
    for (var j = 0; j < revenue.length; j++) { var r = revenue[j]; h += '<tr><td>' + (r.date||'N/A') + '</td><td><strong>KES ' + parseFloat(r.total||0).toLocaleString() + '</strong></td><td>' + (r.transactions||0) + '</td><td>' + (r.payment_method||'N/A') + '</td></tr>'; }
    h += '</table></div></div></div>';
    return h;
}

// ==================== ADMIN SCREEN - FOLDABLE ====================
async function adminScreen() {
    var active = await fetch(API + '/api/visits/active').then(function(r) { return r.json(); });
    var users = await fetch(API + '/api/users').then(function(r) { return r.json(); });
    var beds = await fetch(API + '/api/beds').then(function(r) { return r.json(); });
    var stats = await fetch(API + '/api/dashboard').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🏥 ADMINISTRATION</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="stats-grid">';
    h += '<div class="stat-card"><div class="number">' + (stats.totalPatients||0) + '</div><div class="label">Total Patients</div></div>';
    h += '<div class="stat-card"><div class="number">' + (stats.activeVisits||0) + '</div><div class="label">Active Visits</div></div>';
    h += '<div class="stat-card"><div class="number">' + (stats.occupiedBeds||0) + '/' + (stats.totalBeds||0) + '</div><div class="label">Beds Occupied</div></div>';
    h += '<div class="stat-card warning"><div class="number">KES ' + (stats.pendingBills||0).toLocaleString() + '</div><div class="label">Pending Bills</div></div></div>';
    
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'adminBackup\')">💾 Backup & Restore <span id="adminBackup_icon" style="float:right">▼</span></div>';
    h += '<div id="adminBackup" class="card-body">';
    h += '<button class="btn btn-success" onclick="window.open(API+\'/api/export/csv\')">📥 Export CSV</button> ';
    h += '<button class="btn btn-info" onclick="window.open(API+\'/api/backup/download\')">🗄️ Download Database</button>';
    h += '<p style="font-size:11px;color:var(--text-muted);margin-top:8px">Database: hospital.db in project folder</p></div></div>';
    
        h += '<div class="card"><div class="card-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="toggleAdminSection(\'adminUsers\')"><span>👥 Users (' + users.length + ') <button class="btn btn-success btn-small" style="margin-left:8px" onclick="event.stopPropagation();showAddUserForm()">➕ Add User</button></span><span id="adminUsers_icon">▼</span></div>';
    h += '<div id="adminUsers" class="card-body patient-list" style="display:none"><table><tr><th>User</th><th>Role</th><th>Dept</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>';
    for (var i = 0; i < users.length; i++) { var u = users[i]; h += '<tr><td><strong>' + u.full_name + '</strong><br><small>' + u.username + '</small></td><td>' + u.role + '</td><td>' + (u.department_name||'N/A') + '</td><td><small>' + (u.last_login||'Never') + '</small></td><td>' + (u.is_active?'<span class="badge badge-success">Active</span>':'<span class="badge badge-danger">Inactive</span>') + '</td><td><button class="btn btn-info btn-small" onclick="editUserSafe(' + u.user_id + ')">✏️</button> <button class="btn btn-danger btn-small" onclick="deleteUser(' + u.user_id + ',\'' + u.username + '\')">🗑️</button></td></tr>'; }
    h += '</table></div></div>';
    
        h += '<div class="card"><div class="card-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="toggleAdminSection(\'adminBeds\')"><span>🛏️ Beds (' + beds.length + ') <button class="btn btn-success btn-small" style="margin-left:8px" onclick="event.stopPropagation();showAddBedForm()">➕ Add Bed</button></span><span id="adminBeds_icon">▼</span></div>';
    h += '<div id="adminBeds" class="card-body patient-list" style="display:none"><table><tr><th>ID</th><th>Number</th><th>Type</th><th>Dept</th><th>Status</th><th>Patient</th><th>Actions</th></tr>';
    for (var j = 0; j < beds.length; j++) { var b = beds[j]; var sb = b.is_occupied?'<span class="badge badge-warning">Occupied</span>':'<span class="badge badge-success">Available</span>'; h += '<tr><td>' + b.bed_id + '</td><td><strong>' + b.bed_number + '</strong></td><td>' + (b.ward_type||'General') + '</td><td>' + (b.department||'ward') + '</td><td>' + sb + '</td><td>' + (b.current_visit_id||'None') + '</td><td>'; if(b.is_occupied) h += '<button class="btn btn-warning btn-small" onclick="freeBed(' + b.bed_id + ')">🆓</button> '; h += '<button class="btn btn-danger btn-small" onclick="removeBed(' + b.bed_id + ',\'' + b.bed_number + '\')">🗑️</button></td></tr>'; }
    h += '</table></div></div>';
    
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'adminPatients\')">👥 Active Patients (' + active.length + ') <span id="adminPatients_icon" style="float:right">▼</span></div>';
    h += '<div id="adminPatients" class="card-body patient-list" style="display:none">' + pTable(active) + '</div></div>';
    
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'adminFinance\')">💰 Financial Overview <span id="adminFinance_icon" style="float:right">▼</span></div>';
    h += '<div id="adminFinance" class="card-body" style="display:none"><div id="adminFinanceContent"><p style="text-align:center;color:var(--text-muted)">Loading...</p></div></div></div>';
    setTimeout(function() { loadAdminFinance(); }, 300);
    return h;
}

async function loadAdminFinance() {
    try {
        var res = await fetch(API + '/api/billing/all'); var data = await res.json();
        var revenue = await fetch(API + '/api/manager/revenue').then(function(r) { return r.json(); });
        var html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:15px">';
        html += '<div style="background:#e8f5e9;padding:12px;border-radius:6px;text-align:center"><div style="font-size:24px;font-weight:bold;color:var(--success)">KES ' + (data.grand_paid||0).toLocaleString() + '</div><div style="font-size:11px">Collected</div></div>';
        html += '<div style="background:#fff3e0;padding:12px;border-radius:6px;text-align:center"><div style="font-size:24px;font-weight:bold;color:var(--warning)">KES ' + (data.grand_balance||0).toLocaleString() + '</div><div style="font-size:11px">Outstanding</div></div>';
        html += '<div style="background:#e3f2fd;padding:12px;border-radius:6px;text-align:center"><div style="font-size:24px;font-weight:bold;color:var(--primary)">KES ' + (data.grand_total||0).toLocaleString() + '</div><div style="font-size:11px">Expected</div></div></div>';
        html += '<h4>💳 By Payment Method</h4><table><tr><th>Method</th><th>Amount</th><th>%</th></tr>';
        var mt = {}; var allBills = [];
        for (var i = 0; i < (data.patients||[]).length; i++) { for (var j = 0; j < data.patients[i].bills.length; j++) { if (data.patients[i].bills[j].is_paid) { var bill = data.patients[i].bills[j]; allBills.push(bill); var m = bill.payment_method || 'Cash'; mt[m] = (mt[m]||0) + parseFloat(bill.amount||0); } } }
        var gp = data.grand_paid || 1; var methods = Object.keys(mt);
        for (var k = 0; k < methods.length; k++) { html += '<tr><td><strong>' + methods[k] + '</strong></td><td>KES ' + mt[methods[k]].toLocaleString() + '</td><td>' + ((mt[methods[k]]/gp)*100).toFixed(1) + '%</td></tr>'; }
        html += '</table>';
        document.getElementById('adminFinanceContent').innerHTML = html;
    } catch (err) { document.getElementById('adminFinanceContent').innerHTML = '<p style="color:red">Error loading</p>'; }
}

function toggleAdminSection(sectionId) { var s = document.getElementById(sectionId); var i = document.getElementById(sectionId+'_icon'); if (s.style.display==='none'||s.style.display==='') { s.style.display='block'; if(i) i.textContent='▲'; } else { s.style.display='none'; if(i) i.textContent='▼'; } }

// ==================== EMERGENCY SCREEN ====================
async function emergScreen() {
    var dp = await fetch(API + '/api/visits/department/emergency').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🚨 ' + (currentUser.department_name || 'EMERGENCY') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🔍 Search</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card" style="border:2px solid var(--danger)"><div class="card-header" style="background:#ffeaea">🚨 A&E (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No emergency patients.</p>'; }
    else { for (var i=0;i<dp.length;i++){ var v=dp[i]; var d=await fetch(API+'/api/visits/'+v.visit_id).then(function(r){return r.json();}); h+='<div class="card" style="margin-bottom:10px;border-left:4px solid var(--danger)"><div class="card-body">'; h+=confirmBox('emergency',v.visit_id,d); h+='<strong style="color:var(--danger)">'+d.first_name+' '+d.last_name+'</strong> <span class="badge badge-danger">EMERGENCY</span> | '+v.visit_number; h+='<div class="vitals-display"><strong>Vitals:</strong> BP '+(d.triage_vitals_bp||'?')+' | HR '+(d.triage_vitals_hr||'?')+' | Temp '+(d.triage_vitals_temp||'?')+'°C | SpO2 '+(d.triage_vitals_spo2||'?')+'%</div>'; h+='<form onsubmit="saveEmerg(event,'+v.visit_id+')"><div class="form-group"><label>Assessment</label><textarea id="ea_'+v.visit_id+'" rows="2">'+(d.consultation_notes||'')+'</textarea></div>'; h+='<div class="form-group"><label>Action</label><textarea id="et_'+v.visit_id+'" rows="2">'+(d.treatment_plan||'')+'</textarea></div>'; h+='<button class="btn btn-danger btn-small">💾 Save</button></form>'; h+='<div class="transfer-panel" style="margin-top:8px"><strong>Route:</strong><div class="transfer-options">'; var ed=relevantDepts['emergency']||[]; for(var j=0;j<ed.length;j++){h+='<button class="btn btn-info btn-small" onclick="transferPatient('+v.visit_id+',\''+ed[j]+'\')">📤 '+ed[j]+'</button> ';} h+='<button class="btn btn-danger btn-small" onclick="declareDeath('+v.visit_id+')">⚰️ Declare Death</button></div></div></div></div>'; } }
    return h+'</div></div>';
}
async function saveEmerg(e,vid){e.preventDefault();await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({consultation_notes:document.getElementById('ea_'+vid).value,treatment_plan:document.getElementById('et_'+vid).value})});toast('✅ Saved','success');}

// ==================== PEDIATRICS SCREEN ====================
async function pedScreen() {
    var dp = await fetch(API + '/api/visits/department/pediatrics').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🧒 ' + (currentUser.department_name || 'PEDIATRICS') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🔍 Search</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card" style="border:2px solid #e91e63"><div class="card-header" style="background:#fce4ec">🧒 Pediatrics (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients.</p>'; }
    else { for (var i=0;i<dp.length;i++){ var v=dp[i]; var d=await fetch(API+'/api/visits/'+v.visit_id).then(function(r){return r.json();}); var age=d.date_of_birth?Math.floor((new Date()-new Date(d.date_of_birth))/(365.25*24*60*60*1000)):'?'; h+='<div class="card" style="margin-bottom:10px;border-left:4px solid #e91e63"><div class="card-body">'; h+=confirmBox('pediatrics',v.visit_id,d); h+='<strong style="color:#e91e63">'+d.first_name+' '+d.last_name+'</strong> <span class="badge badge-purple">Age: '+age+'</span> | '+v.visit_number; h+='<div class="vitals-display"><strong>Vitals:</strong> BP '+(d.triage_vitals_bp||'?')+' | HR '+(d.triage_vitals_hr||'?')+' | Temp '+(d.triage_vitals_temp||'?')+'°C | Wt '+(d.triage_vitals_weight||'?')+'kg</div>'; h+='<form onsubmit="savePed(event,'+v.visit_id+')"><div class="form-group"><label>Diagnosis</label><textarea id="pdiag_'+v.visit_id+'" rows="2">'+(d.diagnosis||'')+'</textarea></div>'; h+='<div class="form-group"><label>Treatment</label><textarea id="ptreat_'+v.visit_id+'" rows="2">'+(d.treatment_plan||'')+'</textarea></div>'; h+='<button class="btn btn-purple btn-small">💾 Save</button></form>'; h+='<div class="transfer-panel" style="margin-top:8px"><strong>Route:</strong><div class="transfer-options">'; var pd=relevantDepts['pediatrics']||[]; for(var j=0;j<pd.length;j++){h+='<button class="btn btn-info btn-small" onclick="transferPatient('+v.visit_id+',\''+pd[j]+'\')">📤 '+pd[j]+'</button> ';} h+='</div></div></div></div>'; } }
    return h+'</div></div>';
}
async function savePed(e,vid){e.preventDefault();await fetch(API+'/api/visits/'+vid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({diagnosis:document.getElementById('pdiag_'+vid).value,treatment_plan:document.getElementById('ptreat_'+vid).value})});toast('✅ Saved','success');}

// ==================== APPOINTMENT SCHEDULING SCREEN ====================
async function appointmentScreen() {
    var today = new Date().toISOString().split('T')[0];
    var appointments = await fetch(API + '/api/appointments?date=' + today).then(function(r) { return r.json(); });
    var doctors = await fetch(API + '/api/doctors').then(function(r) { return r.json(); });
    var upcoming = await fetch(API + '/api/appointments').then(function(r) { return r.json(); });
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">📅 APPOINTMENTS</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    var todayCount = appointments ? appointments.length : 0;
    var upcomingCount = upcoming ? upcoming.length : 0;
    h += '<div class="stats-grid"><div class="stat-card"><div class="number">' + todayCount + '</div><div class="label">Today</div></div><div class="stat-card"><div class="number">' + upcomingCount + '</div><div class="label">Upcoming</div></div><div class="stat-card"><div class="number">' + doctors.length + '</div><div class="label">Doctors</div></div></div>';
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'apptBook\')">📝 Book Appointment <span id="apptBook_icon">▼</span></div>';
    h += '<div id="apptBook" class="card-body" style="display:none"><div class="row"><div class="form-group"><label>Search Patient</label><input type="text" id="apptPatientSearch" onkeyup="searchApptPatient()"></div>';
    h += '<div class="form-group"><label>Patient</label><select id="apptPatientSelect"><option>Search first...</option></select></div>';
    h += '<div class="form-group"><label>Doctor</label><select id="apptDoctor"><option value="">Any</option>';
    for (var d=0;d<doctors.length;d++){h+='<option value="'+doctors[d].user_id+'">'+doctors[d].full_name+'</option>';}
    h += '</select></div><div class="form-group"><label>Date *</label><input type="date" id="apptDate" value="'+today+'" required></div>';
    h += '<div class="form-group"><label>Time</label><input type="time" id="apptTime"></div>';
    h += '<div class="form-group full-width"><label>Reason</label><textarea id="apptReason" rows="2"></textarea></div></div>';
    h += '<button class="btn btn-success btn-block" onclick="bookAppointment()">✅ Book</button></div></div>';
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'apptToday\')">📋 Today (' + todayCount + ') <span id="apptToday_icon">▼</span></div>';
    h += '<div id="apptToday" class="card-body patient-list"><div style="margin-bottom:8px"><input type="date" id="apptFilterDate" value="'+today+'" onchange="filterAppointments()" style="width:200px"></div><div id="apptTodayContent">' + renderAppointments(appointments) + '</div></div></div>';
    h += '<div class="card"><div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'apptUpcoming\')">📅 All Upcoming (' + upcomingCount + ') <span id="apptUpcoming_icon">▼</span></div>';
    h += '<div id="apptUpcoming" class="card-body patient-list" style="display:none"><div id="apptUpcomingContent">' + renderAppointments(upcoming) + '</div></div></div>';
    return h;
}

function renderAppointments(appts) {
    if (!appts||appts.length===0) return '<p style="color:var(--text-muted)">No appointments.</p>';
    var h='<table><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Reason</th><th>Status</th><th>Actions</th></tr>';
    for(var i=0;i<appts.length;i++){var a=appts[i];var sb2='';if(a.status==='scheduled')sb2='<span class="badge badge-info">Scheduled</span>';else if(a.status==='completed')sb2='<span class="badge badge-success">Done</span>';else if(a.status==='cancelled')sb2='<span class="badge badge-danger">Cancelled</span>';h+='<tr><td>'+a.appointment_date+'</td><td>'+(a.appointment_time||'N/A')+'</td><td><strong>'+a.first_name+' '+a.last_name+'</strong></td><td>'+(a.doctor_name||'Any')+'</td><td>'+(a.reason||'')+'</td><td>'+sb2+'</td><td>';if(a.status==='scheduled'){h+='<button class="btn btn-success btn-small" onclick="completeAppointment('+a.appointment_id+')">✅</button> <button class="btn btn-warning btn-small" onclick="cancelAppointment('+a.appointment_id+')">❌</button> <button class="btn btn-info btn-small" onclick="createVisitFromAppointment('+a.patient_id+')">➕ Visit</button>';}h+='</td></tr>';}
    return h+'</table>';
}

async function searchApptPatient(){var q=document.getElementById('apptPatientSearch').value.trim();if(q.length<2)return;var results=await fetch(API+'/api/patients/search?q='+encodeURIComponent(q)).then(function(r){return r.json();});var select=document.getElementById('apptPatientSelect');select.innerHTML='<option value="">Select...</option>';for(var i=0;i<results.length;i++){select.innerHTML+='<option value="'+results[i].patient_id+'">'+results[i].first_name+' '+results[i].last_name+' ('+(results[i].national_id||'N/A')+')</option>';}}
async function bookAppointment(){var pid=document.getElementById('apptPatientSelect').value;var did=document.getElementById('apptDoctor').value;var date=document.getElementById('apptDate').value;var time=document.getElementById('apptTime').value;var reason=document.getElementById('apptReason').value;if(!pid){toast('⚠️ Select patient','error');return;}if(!date){toast('⚠️ Select date','error');return;}try{await fetch(API+'/api/appointments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patient_id:parseInt(pid),doctor_id:did?parseInt(did):null,appointment_date:date,appointment_time:time,reason:reason})});toast('✅ Booked','success');loadDashboard();}catch(err){toast('Error','error');}}
async function completeAppointment(aid){await fetch(API+'/api/appointments/'+aid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'completed',notes:'Attended'})});toast('✅ Completed','success');loadDashboard();}
async function cancelAppointment(aid){var reason=prompt('Reason for cancellation:');if(!reason)return;await fetch(API+'/api/appointments/'+aid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'cancelled',notes:reason})});toast('❌ Cancelled','info');loadDashboard();}
async function createVisitFromAppointment(pid){try{var res=await fetch(API+'/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patient_id:pid,registration_fee_paid:false,registration_fee_amount:200})});var data=await res.json();if(data.success&&!data.already_active){toast('✅ Visit: '+data.visit.visit_number,'success');}else if(data.already_active){toast('ℹ️ Active visit exists','info');}loadDashboard();}catch(err){toast('Error','error');}}
async function filterAppointments(){var date=document.getElementById('apptFilterDate').value;var results=await fetch(API+'/api/appointments?date='+date).then(function(r){return r.json();});document.getElementById('apptTodayContent').innerHTML=renderAppointments(results);}

async function bookApptForPatient(pid){var patient=await fetch(API+'/api/patients/'+pid).then(function(r){return r.json();});var doctors=await fetch(API+'/api/doctors').then(function(r){return r.json();});document.getElementById('modalTitle').textContent='📅 Book for '+patient.first_name+' '+patient.last_name;var body='<div class="row"><div class="form-group"><label>Doctor</label><select id="apptDoctor"><option value="">Any</option>';for(var d=0;d<doctors.length;d++){body+='<option value="'+doctors[d].user_id+'">'+doctors[d].full_name+'</option>';}body+='</select></div><div class="form-group"><label>Date *</label><input type="date" id="apptDate" value="'+new Date().toISOString().split('T')[0]+'" required></div><div class="form-group"><label>Time</label><input type="time" id="apptTime"></div><div class="form-group full-width"><label>Reason</label><textarea id="apptReason" rows="2"></textarea></div></div><button class="btn btn-success btn-block" onclick="submitQuickAppt('+pid+')">✅ Book</button>';document.getElementById('modalBody').innerHTML=body;document.getElementById('patientModal').style.display='block';}
async function submitQuickAppt(pid){var did=document.getElementById('apptDoctor').value;var date=document.getElementById('apptDate').value;var time=document.getElementById('apptTime').value;var reason=document.getElementById('apptReason').value;if(!date){toast('Date required','error');return;}await fetch(API+'/api/appointments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({patient_id:pid,doctor_id:did?parseInt(did):null,appointment_date:date,appointment_time:time,reason:reason})});toast('✅ Booked','success');closeModal();}

// ==================== MATERNITY SCREEN ====================
async function maternityScreen() {
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🤰 MATERNITY</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🤰 Maternity Record</div><div class="card-body">';
    h += '<p style="color:var(--text-muted)">Search for a patient above, then click 📋 History to view/add maternity records.</p>';
    h += '</div></div>';
    return h;
}

// ==================== DENTAL SCREEN ====================
async function dentalScreen() {
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🦷 DENTAL</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🦷 Dental Record</div><div class="card-body">';
    h += '<p style="color:var(--text-muted)">Search for a patient above, then click 📋 History to view/add dental records.</p>';
    h += '</div></div>';
    return h;
}

// ==================== EYE SCREEN ====================
async function eyeScreen() {
    var h = '';
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">👁️ OPHTHALMOLOGY</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button></div>';
    h += '<div class="card"><div class="card-header">🔍 Search Patient</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">👁️ Eye Record</div><div class="card-body">';
    h += '<p style="color:var(--text-muted)">Search for a patient above, then click 📋 History to view/add eye records.</p>';
    h += '</div></div>';
    return h;
}

// ============ DEPARTMENT PANEL ============
async function showDepartmentPanel() {
    var dept = currentUser.role;
    var deptName = currentUser.department_name || dept;
    document.getElementById('modalTitle').textContent = '📊 Dept: ' + deptName;
    var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    body += '<div style="background:#e8f5e9;padding:12px;border-radius:8px"><h4>👥 Staff</h4>';
    try { var sr=await fetch(API+'/api/department/'+dept+'/staff'); var sd=await sr.json(); var staff=sd.staff||[]; if(staff.length===0){body+='<p style="color:#888;font-size:12px">No staff found.</p>';}else{body+='<table style="font-size:11px"><tr><th>Name</th><th>Role</th></tr>';for(var i=0;i<staff.length;i++){body+='<tr><td><strong>'+staff[i].full_name+'</strong></td><td>'+staff[i].role+'</td></tr>';}body+='</table>';} } catch(e){body+='<p style="color:red">Error</p>';}
    body += '<p style="font-size:10px;color:var(--text-muted);margin-top:8px">💡 Admin manages users.</p></div>';
    body += '<div style="background:#e3f2fd;padding:12px;border-radius:8px"><h4>📈 Stats</h4>';
    try { var stR=await fetch(API+'/api/department/'+dept+'/daily-stats'); var st=await stR.json(); body+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">'; body+='<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--primary)">'+(st.currentlyWaiting||0)+'</div><div>Waiting</div></div>'; body+='<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--success)">'+(st.todayServed||0)+'</div><div>Served Today</div></div>'; body+='<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--info)">'+(st.todayCompleted||0)+'</div><div>Completed</div></div>'; body+='<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--purple)">'+(st.weekTotal||0)+'</div><div>Week</div></div></div>'; } catch(e){body+='<p style="color:red">Error</p>';}
    body += '</div></div>';
    body += '<button class="btn btn-warning" style="margin-top:8px" onclick="clearDepartmentDay(\''+dept+'\')">🧹 Clear Completed</button> ';
    body += '<button class="btn btn-purple" style="margin-top:8px" onclick="closeModal()">Close</button>';
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('patientModal').style.display = 'block';
}

async function clearDepartmentDay(dept){if(!confirm('Clear completed patients from '+dept+' queue?'))return;try{await fetch(API+'/api/department/'+dept+'/clear-day',{method:'POST'});toast('✅ Cleaned','success');closeModal();loadDashboard();}catch(err){toast('Error','error');}}

// ============ USER MANAGEMENT ============
function escapeQuotes(str){if(!str)return'';return str.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"');}
async function editUserSafe(uid){try{var users=await fetch(API+'/api/users').then(function(r){return r.json();});var u=null;for(var i=0;i<users.length;i++){if(users[i].user_id===uid){u=users[i];break;}}if(!u){toast('Not found','error');return;}editUser(u.user_id,u.username,u.full_name||'',u.role,u.department_name||'',u.is_active);}catch(err){toast('Error','error');}}

function editUser(uid,username,fullName,role,dept,isActive){var roles=['admin','registration','triage','consultation','laboratory','radiology','pharmacy','ward','dietary','bloodbank','socialwork','physio','isolation','medrecords','cashier','referral','sha','morgue','store','manager','emergency','pediatrics'];var ro='';for(var i=0;i<roles.length;i++){ro+='<option value="'+roles[i]+'"'+(roles[i]===role?' selected':'')+'>'+roles[i]+'</option>';}document.getElementById('modalTitle').textContent='✏️ Edit: '+fullName;document.getElementById('modalBody').innerHTML='<div class="form-group"><label>Username</label><input type="text" id="editUsername" value="'+username+'" readonly></div><div class="form-group"><label>Full Name *</label><input type="text" id="editFullName" value="'+fullName+'" required></div><div class="form-group"><label>Role *</label><select id="editRole">'+ro+'</select></div><div class="form-group"><label>Dept</label><input type="text" id="editDept" value="'+(dept||'')+'"></div><div class="form-group"><label>New Password</label><input type="password" id="editPassword" placeholder="Leave blank"></div><div class="form-group"><label><input type="checkbox" id="editActive" '+(isActive?'checked':'')+'> Active</label></div><button class="btn btn-success btn-block" onclick="saveUserEdit('+uid+')">✅ Save</button>';document.getElementById('patientModal').style.display='block';}
async function saveUserEdit(uid){var fn=document.getElementById('editFullName').value.trim();var role=document.getElementById('editRole').value;var dept=document.getElementById('editDept').value.trim();var pw=document.getElementById('editPassword').value;var active=document.getElementById('editActive').checked?1:0;if(!fn){toast('Name required','error');return;}var body={full_name:fn,role:role,department_name:dept,is_active:active};if(pw)body.password=pw;try{await fetch(API+'/api/users/'+uid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});toast('✅ Updated','success');closeModal();loadDashboard();}catch(err){toast('Error','error');}}
function showAddUserForm(){var roles=['admin','registration','triage','consultation','laboratory','radiology','pharmacy','ward','dietary','bloodbank','socialwork','physio','isolation','medrecords','cashier','referral','sha','morgue','store','manager','emergency','pediatrics'];var ro='';for(var i=0;i<roles.length;i++){ro+='<option value="'+roles[i]+'">'+roles[i]+'</option>';}document.getElementById('modalTitle').textContent='➕ Add User';document.getElementById('modalBody').innerHTML='<div class="form-group"><label>Username *</label><input type="text" id="addUsername" required></div><div class="form-group"><label>Full Name *</label><input type="text" id="addFullName" required></div><div class="form-group"><label>Password *</label><input type="password" id="addPassword" required></div><div class="form-group"><label>Role *</label><select id="addRole">'+ro+'</select></div><div class="form-group"><label>Dept</label><input type="text" id="addDept"></div><button class="btn btn-success btn-block" onclick="saveNewUser()">✅ Create</button>';document.getElementById('patientModal').style.display='block';}
async function saveNewUser(){var un=document.getElementById('addUsername').value.trim().toLowerCase();var fn=document.getElementById('addFullName').value.trim();var pw=document.getElementById('addPassword').value;var role=document.getElementById('addRole').value;var dept=document.getElementById('addDept').value.trim();if(!un||!fn||!pw||!role){toast('All * required','error');return;}if(pw.length<6){toast('Min 6 chars','error');return;}try{var res=await fetch(API+'/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:un,password:pw,full_name:fn,role:role,department_name:dept})});var data=await res.json();if(data.success){toast('✅ Created: '+fn,'success');closeModal();loadDashboard();}else{toast(data.message||'Error','error');}}catch(err){toast('Error','error');}}
async function deleteUser(uid,username){if(!confirm('DELETE user "'+username+'"? This deactivates them.'))return;if(!confirm('FINAL WARNING: Continue?'))return;try{await fetch(API+'/api/users/'+uid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_active:0})});toast('🗑️ Deactivated: '+username,'success');loadDashboard();}catch(err){toast('Error','error');}}

function showAddBedForm(){document.getElementById('modalTitle').textContent='🛏️ Add Bed';document.getElementById('modalBody').innerHTML='<div class="row"><div class="form-group"><label>Bed Number *</label><input type="text" id="newBedNumber" required></div><div class="form-group"><label>Type</label><select id="newBedType"><option>General</option><option>Maternity</option><option>ICU</option><option>Pediatric</option><option>Isolation</option><option>Private</option></select></div><div class="form-group"><label>Dept</label><select id="newBedDept"><option>ward</option><option>isolation</option><option>emergency</option><option>pediatrics</option></select></div><div class="form-group"><label>Qty</label><input type="number" id="newBedQty" value="1" min="1" max="50"></div></div><button class="btn btn-success btn-block" onclick="addNewBeds()">➕ Add</button>';document.getElementById('patientModal').style.display='block';}
async function addNewBeds(){var bn=document.getElementById('newBedNumber').value.trim();var bt=document.getElementById('newBedType').value;var bd=document.getElementById('newBedDept').value;var qty=parseInt(document.getElementById('newBedQty').value)||1;if(!bn){toast('⚠️ Enter number','error');return;}var added=0;for(var i=0;i<qty;i++){var num=qty>1?bn+'-'+(i+1):bn;try{await fetch(API+'/api/beds',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bed_number:num,ward_type:bt,department:bd})});added++;}catch(e){}}toast('✅ '+added+' bed(s) added','success');closeModal();loadDashboard();}
async function freeBed(bedId){if(!confirm('Free this bed?'))return;try{var beds=await fetch(API+'/api/beds').then(function(r){return r.json();});toast('✅ Bed freed','success');loadDashboard();}catch(err){toast('Error','error');}}
async function removeBed(bedId,bedNumber){if(!confirm('Remove bed "'+bedNumber+'"?'))return;toast('ℹ️ Bed marked for removal','info');}

// ============ EVENTS ============
function attachEvents() {
    var rf = document.getElementById('regForm');
    if (rf) { rf.addEventListener('submit', async function(e) { e.preventDefault(); if(window.regLock)return; window.regLock=true; var fn=document.getElementById('rfname').value.trim(); var ln=document.getElementById('rlname').value.trim(); var nid=document.getElementById('rnid').value.trim(); if(!fn||!ln){toast('⚠️ Name required','error');window.regLock=false;return;} if(!nid){toast('⚠️ National ID required','error');window.regLock=false;return;} var btn=e.target.querySelector('button[type="submit"]'); btn.textContent='⏳ Please wait...'; btn.disabled=true;
        try { var res=await fetch(API+'/api/register-and-visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({first_name:fn,last_name:ln,date_of_birth:document.getElementById('rdob').value||null,gender:document.getElementById('rgen').value,phone:document.getElementById('rphone').value,address:document.getElementById('raddr').value,national_id:nid,emergency_contact:document.getElementById('remc').value,emergency_phone:document.getElementById('remp').value,blood_group:document.getElementById('rbg').value,allergies:document.getElementById('rall').value,chronic_conditions:document.getElementById('rchronic').value,registration_fee_paid:document.getElementById('rfeePaid').checked,registration_fee_amount:document.getElementById('rfeePaid').checked?(parseFloat(document.getElementById('rfeeAmount').value)||200):0})}); var data=await res.json();
        if(data.success&&!data.already_active){toast('✅ Visit: '+data.visit.visit_number,'success');localStorage.removeItem('regFormData');e.target.reset();document.getElementById('rfeeAmount').disabled=true;document.getElementById('rfeeAmount').value='200';document.getElementById('rfeePaid').checked=false;loadDashboard();}else if(data.already_active){toast('ℹ️ Active visit exists: '+data.visit.visit_number,'info');e.target.reset();loadDashboard();}else{toast('❌ '+(data.error||data.message||'Failed'),'error');} } catch(err){toast('❌ Connection error','error');}
        btn.textContent='✅ Register & Create Visit'; btn.disabled=false; window.regLock=false; }); }
    var af = document.getElementById('addItemForm');
    if (af) { af.addEventListener('submit', async function(e) { e.preventDefault(); await fetch(API+'/api/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({item_name:document.getElementById('siname').value,category:document.getElementById('sicat')?document.getElementById('sicat').value:'General',department:document.getElementById('sidept')?document.getElementById('sidept').value:'general',current_stock:parseInt(document.getElementById('siqty').value)||0,minimum_stock:parseInt(document.getElementById('simin').value)||10,unit:document.getElementById('siunit')?document.getElementById('siunit').value:'',unit_price:parseFloat(document.getElementById('siprice').value)||0})}); toast('✅ Item added','success'); e.target.reset(); loadDashboard(); }); }
}

// ============ LEGAL ============
function showLegal(t) { document.getElementById('legalTitle').textContent={terms:'Terms of Use',privacy:'Privacy Policy',disclaimer:'Disclaimer'}[t]||'Legal'; var body=''; if(t==='terms'){body='<h3>1. Acceptance</h3><p>By using this system, you agree to these Terms.</p><h3>2. License</h3><p>Licensed to a single healthcare facility on LAN. Safari Softwares © 2026.</p><h3>3. No Warranty</h3><p>Provided "AS IS" without warranty.</p><h3>4. Governing Law</h3><p>Republic of Kenya.</p>';}else if(t==='privacy'){body='<h3>1. Offline System</h3><p>All data stays on your server. No internet required.</p><h3>2. Your Responsibility</h3><p>You are the data controller.</p><h3>3. Contact</h3><p>safarisoftwares@gmail.com</p>';}else{body='<h3>Medical Disclaimer</h3><p>This is a record-keeping tool, NOT a medical device.</p><h3>Technical Disclaimer</h3><p>Regular backups recommended.</p>';} document.getElementById('legalBody').innerHTML=body; document.getElementById('legalModal').style.display='block'; }

document.addEventListener('DOMContentLoaded', init);