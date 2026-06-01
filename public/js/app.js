// ============================================
// HOSPITAL MANAGEMENT SYSTEM v5.0
// Real Hospital Workflow Edition
// Complete Frontend JavaScript - 22 Modules
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

    // Add Change Password button to header
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
        html += '<button class="btn btn-success btn-small" onclick="addBillForPatient(' + v.visit_id + ',' + v.patient_id + ')">💰 Bill</button>';
        html += '</td></tr>';
    }
    html += '</table>';
    return html;
}

// ============ FULL PATIENT VIEW (ALL DEPARTMENTS) - FIXED VERSION ============
async function viewPatientFull(visitId) {
    try {
        var res = await fetch(API + '/api/visits/' + visitId + '/full-history');
        if (!res.ok) {
            throw new Error('Server returned ' + res.status);
        }
        var data = await res.json();

        if (!data.success) {
            toast('Error: ' + (data.error || 'Unknown error'), 'error');
            return;
        }

        var visit = data.visit;
        var history = data.history || [];
        var bills = data.bills || [];
        var totalBilled = data.total_billed || 0;
        var totalPaid = data.total_paid || 0;
        var totalBalance = data.total_balance || 0;

        document.getElementById('modalTitle').textContent = '📋 Full Patient Record: ' + visit.first_name + ' ' + visit.last_name;

        var body = '';

        // DEMOGRAPHICS SECTION
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

        // VITALS SECTION
        if (visit.triage_category) {
            body += '<div style="background:#e3f2fd;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">🩺 Vital Signs (Triage)</h4>';
            body += '<p><strong>BP:</strong> ' + (visit.triage_vitals_bp || 'N/A') + ' | <strong>HR:</strong> ' + (visit.triage_vitals_hr || 'N/A') + ' | <strong>Temp:</strong> ' + (visit.triage_vitals_temp || 'N/A') + '°C</p>';
            body += '<p><strong>SpO2:</strong> ' + (visit.triage_vitals_spo2 || 'N/A') + '% | <strong>Weight:</strong> ' + (visit.triage_vitals_weight || 'N/A') + 'kg</p>';
            body += '<p><strong>Category:</strong> ' + visit.triage_category + ' | <strong>Notes:</strong> ' + (visit.triage_notes || 'None') + '</p>';
            body += '</div>';
        }

        // DIAGNOSIS & TREATMENT
        if (visit.diagnosis) {
            body += '<div style="background:#fff3e0;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">👨‍⚕️ Diagnosis & Treatment</h4>';
            body += '<p><strong>Diagnosis:</strong> ' + visit.diagnosis + '</p>';
            if (visit.treatment_plan) body += '<p><strong>Treatment Plan:</strong> ' + visit.treatment_plan + '</p>';
            if (visit.consultation_notes) body += '<p><strong>Notes:</strong> ' + visit.consultation_notes + '</p>';
            body += '</div>';
        }

        // LAB RESULTS
        if (visit.lab_orders || visit.lab_results) {
            body += '<div style="background:#f3e5f5;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">🧪 Laboratory</h4>';
            if (visit.lab_orders) body += '<p><strong>Orders:</strong> ' + visit.lab_orders + '</p>';
            if (visit.lab_results) body += '<p><strong>Results:</strong> ' + visit.lab_results + '</p>';
            body += '</div>';
        }

        // RADIOLOGY FINDINGS
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

        // WARD NOTES
        if (visit.ward_notes || visit.ward_bed_number) {
            body += '<div style="background:#fce4ec;padding:12px;border-radius:6px;margin-bottom:12px">';
            body += '<h4 style="color:var(--primary);margin-bottom:8px">🛏️ Ward</h4>';
            if (visit.ward_bed_number) body += '<p><strong>Bed:</strong> ' + visit.ward_bed_number + '</p>';
            if (visit.ward_notes) body += '<p><strong>Notes:</strong> ' + visit.ward_notes + '</p>';
            body += '</div>';
        }

        // BILLING SUMMARY
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

        // Discharge button
        var canDischarge = (currentUser.role === 'admin' || currentUser.role === 'doctor' || currentUser.role === 'consultation' || currentUser.role === 'cashier' || currentUser.role === 'pharmacy');
        if (canDischarge && totalBalance <= 0 && visit.status !== 'discharged') {
            body += '<button class="btn btn-success btn-block" style="margin-top:10px" onclick="dischargePatientDirect(' + visitId + ')">✅ DISCHARGE PATIENT</button>';
        }

        // VISIT HISTORY TIMELINE
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

// ============ TRANSFER PATIENT - FIXED WITH NOTES POPUP ============
async function transferPatient(visitId, toDepartment, notes) {
    notes = notes || '';
    
    // Get current visit data to preserve existing notes
    var visitData = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
    
    // Show confirmation with notes input
    var deptDisplay = toDepartment.charAt(0).toUpperCase() + toDepartment.slice(1);
    var existingDiagnosis = visitData.diagnosis || '';
    var existingTreatment = visitData.treatment_plan || '';
    
    var popupContent = '<div style="background:#e3f2fd;padding:10px;border-radius:5px;margin-bottom:12px">';
    popupContent += '<p><strong>Patient:</strong> ' + visitData.first_name + ' ' + visitData.last_name + '</p>';
    popupContent += '<p><strong>Visit:</strong> ' + visitData.visit_number + '</p>';
    if (existingDiagnosis) popupContent += '<p><strong>Diagnosis:</strong> ' + existingDiagnosis + '</p>';
    if (existingTreatment) popupContent += '<p><strong>Treatment:</strong> ' + existingTreatment + '</p>';
    popupContent += '<p><strong>Sending to:</strong> ' + deptDisplay + '</p>';
    popupContent += '</div>';
    
    popupContent += '<div class="form-group"><label>📝 Instructions/Notes for ' + deptDisplay + ' *</label>';
    popupContent += '<textarea id="referralNotes" rows="4" placeholder="Enter instructions for ' + deptDisplay + ' department... (e.g., tests required, observations needed, special instructions)">' + notes + '</textarea></div>';
    popupContent += '<p style="font-size:11px;color:var(--text-muted)">💡 These notes will be visible to ' + deptDisplay + ' department staff.</p>';
    popupContent += '<button class="btn btn-success btn-block" onclick="confirmTransfer(' + visitId + ',\'' + toDepartment + '\')">✅ Send Patient to ' + deptDisplay + '</button>';
    popupContent += '<button class="btn btn-warning btn-block" style="margin-top:5px" onclick="closeModal()">❌ Cancel</button>';
    
    document.getElementById('modalTitle').textContent = '📤 Send Patient to ' + deptDisplay;
    document.getElementById('modalBody').innerHTML = popupContent;
    document.getElementById('patientModal').style.display = 'block';
}

async function confirmTransfer(visitId, toDepartment) {
    var notes = document.getElementById('referralNotes').value.trim();
    
    if (!notes) {
        toast('⚠️ Please enter instructions for the receiving department', 'error');
        return;
    }
    
    // Get current visit data to preserve everything
    var visitData = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
    
    // Build complete notes that include existing treatment info
    var fullNotes = notes;
    if (visitData.diagnosis && !notes.includes(visitData.diagnosis)) {
        fullNotes = 'Dx: ' + visitData.diagnosis + ' | ' + notes;
    }
    if (visitData.treatment_plan) {
        fullNotes += ' | Treatment: ' + visitData.treatment_plan;
    }
    
    try {
        // Save current department notes before transferring
        var saveData = {};
        if (currentUser.role === 'consultation') {
            var diagnosis = document.getElementById('diag_' + visitId);
            var treatment = document.getElementById('treat_' + visitId);
            var cnotes = document.getElementById('cnotes_' + visitId);
            if (diagnosis && diagnosis.value) saveData.diagnosis = diagnosis.value;
            if (treatment && treatment.value) saveData.treatment_plan = treatment.value;
            if (cnotes && cnotes.value) saveData.consultation_notes = cnotes.value;
        }
        
        if (Object.keys(saveData).length > 0) {
            await fetch(API + '/api/visits/' + visitId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saveData)
            });
        }
        
        // Do the actual transfer
        await fetch(API + '/api/visits/' + visitId + '/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                to_department: toDepartment, 
                notes: fullNotes, 
                complete_department: false 
            })
        });
        
        toast('✅ Patient sent to ' + toDepartment + ' with instructions', 'success');
        closeModal();
        loadDashboard();
        
    } catch (err) {
        toast('Error transferring patient: ' + err.message, 'error');
    }
}

// ============ COMPLETE AND TRANSFER - FIXED ============
async function completeAndTransfer(visitId, toDepartment, updates, notes) {
    updates = updates || {};
    notes = notes || '';
    
    try {
        // Save all updates first
        if (Object.keys(updates).length > 0) {
            await fetch(API + '/api/visits/' + visitId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
        }
        
        // Get visit data to build complete notes
        var visitData = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        
        var fullNotes = notes;
        if (visitData.diagnosis && !notes.includes(visitData.diagnosis)) {
            fullNotes = 'Dx: ' + visitData.diagnosis + ' | ' + notes;
        }
        if (visitData.treatment_plan && !fullNotes.includes(visitData.treatment_plan)) {
            fullNotes += ' | Rx: ' + visitData.treatment_plan;
        }
        
        // Mark department as complete and transfer
        await fetch(API + '/api/visits/' + visitId + '/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                to_department: toDepartment, 
                notes: fullNotes, 
                complete_department: true 
            })
        });
        
        toast('✅ Completed and sent to ' + toDepartment, 'success');
        loadDashboard();
        
    } catch (err) {
        toast('Error completing transfer: ' + err.message, 'error');
    }
}

// ============ MULTI-TRANSFER ============
function multiTransfer(visitId) {
    var departments = relevantDepts[currentUser.role] || [];
    if (departments.length === 0) {
        toast('No relevant departments available for transfer', 'error');
        return;
    }

    var options = '';
    for (var i = 0; i < departments.length; i++) {
        options += '<div style="padding:8px;border-bottom:1px solid #eee">';
        options += '<label style="cursor:pointer;display:flex;align-items:center;gap:8px">';
        options += '<input type="checkbox" class="multiDept" value="' + departments[i] + '" style="width:18px;height:18px">';
        options += '<strong>' + departments[i] + '</strong>';
        options += '</label></div>';
    }

    document.getElementById('modalTitle').textContent = '📤 Send Patient to Multiple Departments';
    document.getElementById('modalBody').innerHTML =
        '<p style="margin-bottom:10px;color:var(--text-muted);font-size:12px">✅ Select departments. Patient stays in your queue until you click "Mark Complete".</p>' +
        '<div style="max-height:300px;overflow-y:auto;border:1px solid var(--border);border-radius:5px;margin-bottom:10px">' + options + '</div>' +
        '<div class="form-group"><label>Notes</label><textarea id="multiNotes" placeholder="Reason for transfer..."></textarea></div>' +
        '<div style="display:flex;gap:10px">' +
        '<button class="btn btn-success" style="flex:1" onclick="doMultiTransfer(' + visitId + ')">✅ Send to Selected</button>' +
        '<button class="btn btn-warning" style="flex:1" onclick="completeMyDepartment(' + visitId + ')">✅ Mark My Dept Complete</button>' +
        '</div>';
    document.getElementById('patientModal').style.display = 'block';
}

async function doMultiTransfer(visitId) {
    var checkboxes = document.querySelectorAll('.multiDept:checked');
    if (checkboxes.length === 0) {
        toast('Please select at least one department', 'error');
        return;
    }
    var notes = document.getElementById('multiNotes').value || 'Forwarded from ' + currentUser.role;
    var count = 0;
    for (var i = 0; i < checkboxes.length; i++) {
        var dept = checkboxes[i].value;
        await fetch(API + '/api/visits/' + visitId + '/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_department: dept, notes: notes, complete_department: false })
        });
        count++;
    }
    toast('✅ Patient sent to ' + count + ' department(s)', 'success');
    closeModal();
    loadDashboard();
}

async function completeMyDepartment(visitId) {
    if (!confirm('Mark your department as complete for this patient? They will be removed from your active queue.')) return;
    var updates = {};
    updates[currentUser.role + '_completed'] = 1;
    updates[currentUser.role + '_by'] = currentUser.user_id;
    updates[currentUser.role + '_completed_at'] = new Date().toISOString();
    await fetch(API + '/api/visits/' + visitId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    toast('✅ Department marked as complete', 'success');
    loadDashboard();
}

// ============ QUICK BILL & REFER - For Lab, Radiology, Pharmacy ============
function quickBillAndRefer(visitId, department, defaultDesc, defaultAmt) {
    defaultAmt = defaultAmt || 0;
    
    var deptDisplay = department.charAt(0).toUpperCase() + department.slice(1);
    
    document.getElementById('modalTitle').textContent = '💰 Add ' + deptDisplay + ' Bill & Complete';
    document.getElementById('modalBody').innerHTML = 
        '<div class="form-group"><label>Bill Description *</label><input type="text" id="qbillDesc" value="' + (defaultDesc || '') + '" required></div>' +
        '<div class="form-group"><label>Amount (KES) *</label><input type="number" id="qbillAmt" value="' + defaultAmt + '" min="0" required></div>' +
        '<div class="form-group"><label>📝 Notes for next department</label><textarea id="qnotes" rows="3" placeholder="Enter findings, results, or instructions..."></textarea></div>' +
        '<p style="font-size:11px;color:var(--text-muted)">💡 Bill will be added and patient will be marked complete in ' + currentUser.role + '.</p>' +
        '<button class="btn btn-success btn-block" onclick="submitQuickBillRefer(' + visitId + ',\'' + department + '\')">✅ Add Bill & Complete</button>' +
        '<button class="btn btn-warning btn-block" style="margin-top:5px" onclick="skipBillComplete(' + visitId + ',\'' + department + '\')">⏭️ Skip Bill & Just Complete</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function submitQuickBillRefer(visitId, department) {
    var desc = document.getElementById('qbillDesc').value.trim();
    var amt = parseFloat(document.getElementById('qbillAmt').value);
    var notes = document.getElementById('qnotes').value.trim();
    
    if (!desc) { toast('⚠️ Please enter a bill description', 'error'); return; }
    if (isNaN(amt) || amt < 0) { toast('⚠️ Please enter a valid amount (0 for no charge)', 'error'); return; }
    
    try {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        
        if (amt > 0) {
            await fetch(API + '/api/billing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visit_id: visitId,
                    patient_id: detail.patient_id,
                    item_description: desc,
                    department: currentUser.role,
                    amount: amt
                })
            });
            toast('✅ Bill added: ' + desc + ' - KES ' + amt.toLocaleString(), 'success');
        }
        
        closeModal();
        
        // Build complete notes
        var fullNotes = (notes || 'Completed in ' + currentUser.role);
        if (amt > 0) fullNotes += ' | Fee: KES ' + amt;
        
        await completeAndTransfer(visitId, department, {}, fullNotes);
        
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

async function skipBillComplete(visitId, department) {
    closeModal();
    var notes = document.getElementById('qnotes') ? document.getElementById('qnotes').value.trim() : '';
    await completeAndTransfer(visitId, department, {}, notes || 'Completed in ' + currentUser.role);
}

// ============ RELEVANT DEPARTMENTS FOR TRANSFER ============
var relevantDepts = {
    'registration': ['triage'],
    'triage': ['consultation', 'emergency'],
    'consultation': ['laboratory', 'radiology', 'pharmacy', 'ward', 'dietary', 'bloodbank', 'socialwork', 'physio', 'isolation', 'medrecords', 'emergency', 'pediatrics', 'referral', 'sha', 'cashier'],
    'laboratory': ['consultation', 'cashier', 'ward'],
    'radiology': ['consultation', 'cashier', 'ward'],
    'pharmacy': ['cashier', 'ward', 'consultation'],
    'ward': ['laboratory', 'radiology', 'consultation', 'dietary', 'physio', 'cashier', 'socialwork', 'isolation', 'morgue', 'emergency', 'pediatrics', 'pharmacy'],
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
    'admin': ['triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'ward', 'dietary', 'bloodbank', 'socialwork', 'physio', 'isolation', 'medrecords', 'cashier', 'referral', 'sha', 'emergency', 'pediatrics'],
    'manager': ['triage', 'consultation', 'laboratory', 'radiology', 'pharmacy', 'ward', 'cashier', 'emergency', 'pediatrics'],
    'store': [],
    'morgue': []
};

// ============ ADD BILL ============
function addBillForPatient(visitId, patientId) {
    document.getElementById('modalTitle').textContent = '💰 Add Bill / Invoice';
    document.getElementById('modalBody').innerHTML =
        '<div class="form-group"><label>Item Description *</label><input type="text" id="billDesc" placeholder="e.g., Consultation Fee, Lab Test, X-Ray..." required></div>' +
        '<div class="form-group"><label>Amount (KES) *</label><input type="number" id="billAmount" placeholder="Enter amount" min="1" required></div>' +
        '<div class="form-group"><label>Department</label><input type="text" id="billDept" value="' + currentUser.role + '" readonly></div>' +
        '<button class="btn btn-success btn-block" onclick="submitBill(' + visitId + ',' + patientId + ')">✅ Add Bill</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function submitBill(visitId, patientId) {
    var description = document.getElementById('billDesc').value.trim();
    var amount = parseFloat(document.getElementById('billAmount').value);
    if (!description || !amount || amount <= 0) {
        toast('Please enter a valid description and amount', 'error');
        return;
    }
    try {
        await fetch(API + '/api/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ visit_id: visitId, patient_id: patientId, item_description: description, department: currentUser.role, amount: amount })
        });
        toast('✅ Bill added: ' + description + ' - KES ' + amount.toLocaleString(), 'success');
        closeModal();
        loadDashboard();
    } catch (err) {
        toast('Error adding bill', 'error');
    }
}

// ============ DELETE BILL ============
async function deleteBill(billId, visitId) {
    if (!confirm('Are you sure you want to DELETE this bill? This cannot be undone.')) return;
    try {
        await fetch(API + '/api/billing/' + billId, { method: 'DELETE' });
        toast('🗑️ Bill deleted', 'success');
        viewPatientFull(visitId);
    } catch (err) {
        toast('Error deleting bill', 'error');
    }
}

// ============ DISCHARGE PATIENT ============
async function dischargePatientDirect(visitId) {
    if (!confirm('Are you sure you want to DISCHARGE this patient? This will finalize all records.')) return;
    try {
        var res = await fetch(API + '/api/visits/' + visitId + '/discharge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ free_bed: true })
        });
        var data = await res.json();
        if (data.success) {
            toast('✅ Patient discharged successfully!', 'success');
        } else {
            toast('❌ ' + (data.message || 'Discharge failed'), 'error');
        }
        closeModal();
        loadDashboard();
    } catch (err) {
        toast('Error discharging patient', 'error');
    }
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_password: cp, new_password: np })
        });
        var data = await res.json();
        if (data.success) { toast('✅ Password changed!', 'success'); closeModal(); }
        else toast(data.message || 'Failed', 'error');
    } catch (err) {
        toast('Error changing password', 'error');
    }
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
    } catch (err) {
        toast('Error searching patients', 'error');
    }
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
    } catch (err) {
        toast('Error loading patient history', 'error');
    }
}

// ============ RETURN TO WARD (HOME BASE) ============
async function returnToWard(visitId) {
    if (!confirm('Return patient to their ward bed? They will keep the same bed.')) return;
    try {
        await fetch(API + '/api/visits/' + visitId + '/return-to-ward', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' } 
        });
        toast('✅ Patient returned to Ward', 'success');
        loadDashboard();
    } catch (err) {
        toast('Error returning to ward', 'error');
    }
}

// ============ WARD REFERRAL WITH ORDERS ============
function wardReferWithOrders(visitId, department) {
    var deptName = department === 'laboratory' ? 'Lab' : (department === 'radiology' ? 'Radiology' : 'Pharmacy');
    document.getElementById('modalTitle').textContent = '📝 Send to ' + deptName + ' - Enter Orders';
    document.getElementById('modalBody').innerHTML =
        '<div class="form-group"><label>Orders / Tests Required *</label><textarea id="wardOrders" rows="4" placeholder="e.g., FBC, Malaria Test, Urinalysis..."></textarea></div>' +
        '<p style="font-size:11px;color:var(--text-muted)">Patient will keep their bed. They will return to the same bed after ' + deptName + '.</p>' +
        '<button class="btn btn-success btn-block" onclick="submitWardReferral(' + visitId + ',\'' + department + '\')">✅ Send Patient with Orders</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function submitWardReferral(visitId, department) {
    var orders = document.getElementById('wardOrders').value.trim();
    if (!orders) {
        toast('⚠️ Please enter the tests or orders required', 'error');
        return;
    }
    try {
        await fetch(API + '/api/visits/' + visitId + '/refer-with-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_department: department, orders: orders })
        });
        toast('✅ Patient sent to ' + department + ' with orders. Bed preserved.', 'success');
        closeModal();
        loadDashboard();
    } catch (err) {
        toast('Error sending referral', 'error');
    }
}

// ============ CREATE VISIT FOR EXISTING PATIENT ============
async function createVisitExisting(pid) {
    try {
        var r = await fetch(API + '/api/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: pid, registration_fee_paid: true, registration_fee_amount: 200 })
        });
        var d = await r.json();
        if (d.success && !d.already_active) {
            toast('✅ Visit Created: ' + d.visit.visit_number + ' | Use 📤 Send to move to Triage', 'success');
            loadDashboard();
        } else if (d.already_active) {
            toast('ℹ️ Patient already has active visit. Use 📤 Send button.', 'info');
        } else {
            toast('❌ ' + (d.message || 'Error creating visit'), 'error');
        }
    } catch (err) {
        toast('Error creating visit', 'error');
    }
}

// ==================== REGISTRATION SCREEN ====================
async function regScreen() {
    var dp = await fetch(API + '/api/visits/department/registration').then(function(r) { return r.json(); });
    var saved = JSON.parse(localStorage.getItem('regFormData') || '{}');

    var h = '';

    // Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID / Birth Certificate</div><div class="card-body">';
    h += '<div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID or Birth Certificate number..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div>';
    h += '<div id="nidResults"></div></div></div>';

    h += '<div class="card"><div class="card-header">📋 Register New Patient</div><div class="card-body">';
    h += '<p style="font-size:11px;color:var(--text-muted);margin-bottom:10px">💾 Use Save button to preserve form data. All fields marked with * are required.</p>';
    h += '<form id="regForm"><div class="row">';
    h += '<div class="form-group"><label>First Name *</label><input type="text" id="rfname" required value="' + (saved.rfname || '') + '"></div>';
    h += '<div class="form-group"><label>Last Name *</label><input type="text" id="rlname" required value="' + (saved.rlname || '') + '"></div>';
    h += '<div class="form-group"><label>Date of Birth (DD/MM/YYYY)</label><input type="text" id="rdob" placeholder="e.g., 15/06/1990" value="' + (saved.rdob || '') + '"></div>';
    h += '<div class="form-group"><label>Gender</label><select id="rgen"><option value="">Select</option><option' + (saved.rgen === 'Male' ? ' selected' : '') + '>Male</option><option' + (saved.rgen === 'Female' ? ' selected' : '') + '>Female</option></select></div>';
    h += '<div class="form-group"><label>Phone</label><input type="text" id="rphone" value="' + (saved.rphone || '') + '"></div>';
    h += '<div class="form-group"><label>National ID / Birth Certificate *</label><input type="text" id="rnid" required value="' + (saved.rnid || '') + '"></div>';
    h += '<div class="form-group full-width"><label>Address</label><input type="text" id="raddr" value="' + (saved.raddr || '') + '"></div>';
    h += '<div class="form-group"><label>Emergency Contact</label><input type="text" id="remc" value="' + (saved.remc || '') + '"></div>';
    h += '<div class="form-group"><label>Emergency Phone</label><input type="text" id="remp" value="' + (saved.remp || '') + '"></div>';
    h += '<div class="form-group"><label>Blood Group</label><select id="rbg"><option value="">Unknown</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>';
    h += '<div class="form-group"><label>Allergies</label><input type="text" id="rall" value="' + (saved.rall || '') + '" placeholder="e.g., Penicillin"></div>';
    h += '<div class="form-group"><label>Chronic Conditions</label><input type="text" id="rchronic" value="' + (saved.rchronic || '') + '" placeholder="e.g., Diabetes"></div>';
    h += '</div>';
    h += '<div class="alert alert-info">💳 Registration Fee: Enter amount below</div>';
    h += '<div class="form-group"><label><input type="checkbox" id="rfeePaid" onchange="toggleFee()"> Patient has paid registration fee</label></div>';
    h += '<div class="form-group"><label>Amount Paid (KES)</label><input type="number" id="rfeeAmount" value="200" disabled></div>';
    h += '<div style="display:flex;gap:10px">';
    h += '<button type="submit" class="btn btn-success" style="flex:2">✅ Register & Create Visit</button>';
    h += '<button type="button" class="btn btn-info" style="flex:1" onclick="saveRegForm()">💾 Save Form</button>';
    h += '<button type="button" class="btn btn-danger" style="flex:1" onclick="clearRegForm()">🗑️ Clear</button>';
    h += '</div></form></div></div>';

    h += '<div class="card"><div class="card-header">📋 Patients at Registration (' + dp.length + ')</div><div class="card-body patient-list">' + pTable(dp) + '</div></div>';

    return h;
}

function toggleFee() {
    var cb = document.getElementById('rfeePaid');
    var amt = document.getElementById('rfeeAmount');
    amt.disabled = !cb.checked;
    if (!cb.checked) amt.value = '200';
}

function saveRegForm() {
    var d = {
        rfname: document.getElementById('rfname').value,
        rlname: document.getElementById('rlname').value,
        rdob: document.getElementById('rdob').value,
        rgen: document.getElementById('rgen').value,
        rphone: document.getElementById('rphone').value,
        rnid: document.getElementById('rnid').value,
        raddr: document.getElementById('raddr').value,
        remc: document.getElementById('remc').value,
        remp: document.getElementById('remp').value,
        rall: document.getElementById('rall').value,
        rchronic: document.getElementById('rchronic').value
    };
    localStorage.setItem('regFormData', JSON.stringify(d));
    toast('💾 Form saved successfully', 'success');
}

function clearRegForm() {
    if (confirm('Clear all form data? This cannot be undone.')) {
        localStorage.removeItem('regFormData');
        loadDashboard();
    }
}

// ==================== TRIAGE SCREEN ====================
async function triageScreen() {
    var dp = await fetch(API + '/api/visits/department/triage').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body">';
    h += '<div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div>';
    h += '<div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🩺 Patients Waiting for Triage (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) {
        h += '<p style="color:var(--text-muted)">No patients waiting. Patients are sent here from Registration using the 📤 Send button.</p>';
    } else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:12px;border:1px solid var(--border)"><div class="card-body">';
            h += confirmBox('triage', v.visit_id, d);
            h += '<div style="display:flex;justify-content:space-between;align-items:center">';
            h += '<div><strong style="font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> <span class="badge badge-info">' + v.visit_number + '</span></div>';
            h += '<div><span style="font-size:12px;color:var(--text-light)">' + (d.gender || '') + ' | DOB: ' + (d.date_of_birth || 'N/A') + ' | ID: ' + (d.national_id || 'N/A') + '</span></div>';
            h += '</div>';
            if (d.allergies) h += '<p style="color:var(--danger);font-weight:600;margin-top:5px">⚠️ Allergies: ' + d.allergies + '</p>';
            if (d.registration_fee_paid) {
                h += '<div class="alert alert-success" style="margin-top:8px"><strong>Registration Fee:</strong> ✅ Paid - KES ' + (d.registration_fee_amount || 200) + '</div>';
            } else {
                h += '<div class="alert alert-warning" style="margin-top:8px"><strong>Registration Fee:</strong> ❌ Pending - KES ' + (d.registration_fee_amount || 200) + '</div>';
            }
            h += '<form onsubmit="saveTriage(event,' + v.visit_id + ')"><div class="row" style="margin-top:10px">';
            h += '<div class="form-group"><label>Blood Pressure</label><input type="text" id="bp_' + v.visit_id + '" placeholder="e.g., 120/80"></div>';
            h += '<div class="form-group"><label>Heart Rate (bpm)</label><input type="text" id="hr_' + v.visit_id + '" placeholder="e.g., 72"></div>';
            h += '<div class="form-group"><label>Temperature (°C)</label><input type="text" id="temp_' + v.visit_id + '" placeholder="e.g., 36.5"></div>';
            h += '<div class="form-group"><label>SpO2 (%)</label><input type="text" id="spo2_' + v.visit_id + '" placeholder="e.g., 98"></div>';
            h += '<div class="form-group"><label>Weight (kg)</label><input type="text" id="wt_' + v.visit_id + '" placeholder="e.g., 70"></div>';
            h += '<div class="form-group"><label>Triage Category *</label><select id="cat_' + v.visit_id + '" required><option value="">Select Category</option><option value="Emergency">Emergency</option><option value="Urgent">Urgent</option><option value="Routine">Routine</option></select></div>';
            h += '</div>';
            h += '<div class="form-group"><label>Notes</label><textarea id="tnotes_' + v.visit_id + '" placeholder="Any additional observations..."></textarea></div>';
            h += '<button type="submit" class="btn btn-success">✅ Complete Triage & Send to Next Department</button>';
            h += '</form></div></div>';
        }
    }
    return h + '</div></div>';
}

async function saveTriage(event, visitId) {
    event.preventDefault();
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { toast('⚠️ Please confirm patient identity first!', 'error'); return; }
    var category = document.getElementById('cat_' + visitId).value;
    if (!category) { toast('⚠️ Please select a triage category', 'error'); return; }
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
    var targetDepartment = (category === 'Emergency') ? 'emergency' : 'consultation';
    await completeAndTransfer(visitId, targetDepartment, {}, 'Triage completed - Category: ' + category);
}

// ==================== CONSULTATION SCREEN ====================
async function consultScreen() {
    var dp = await fetch(API + '/api/visits/department/consultation').then(function(r) { return r.json(); });
    var allActive = await fetch(API + '/api/visits/active').then(function(r) { return r.json(); });
    var myPatients = allActive.filter(function(v) { return v.current_department === 'consultation' || v.consultation_completed; });
    var h = '';

    // Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';
    
    // Department Panel button
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || 'CONSULTATION') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body">';
    h += '<div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div>';
    h += '<div id="nidResults"></div></div></div>';
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
            h += '</div></form>';
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


// ==================== CONSULT TO CASHIER - MULTIPLE BILL ITEMS ====================
async function consultToCashier(visitId) {
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { 
        toast('⚠️ Please confirm patient identity first!', 'error'); 
        return; 
    }
    
    // Save diagnosis and treatment FIRST
    var diagnosis = document.getElementById('diag_' + visitId) ? document.getElementById('diag_' + visitId).value : '';
    var treatment = document.getElementById('treat_' + visitId) ? document.getElementById('treat_' + visitId).value : '';
    var notes = document.getElementById('cnotes_' + visitId) ? document.getElementById('cnotes_' + visitId).value : '';
    
    if (!diagnosis) {
        toast('⚠️ Please enter a diagnosis before referring to Cashier', 'error');
        return;
    }
    
    // Save to server immediately
    try {
        await fetch(API + '/api/visits/' + visitId, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                diagnosis: diagnosis, 
                treatment_plan: treatment, 
                consultation_notes: notes 
            }) 
        });
    } catch (err) {
        toast('Error saving notes', 'error');
        return;
    }
    
    // Show MULTIPLE billing items form
    document.getElementById('modalTitle').textContent = '💰 Consultation Billing - Add All Fees';
    document.getElementById('modalBody').innerHTML = 
        '<div style="background:#fff3e0;padding:10px;border-radius:5px;margin-bottom:12px">' +
        '<p><strong>Patient:</strong> Diagnosis: ' + (diagnosis || 'None') + '</p>' +
        '<p><strong>Treatment:</strong> ' + (treatment || 'None') + '</p>' +
        '</div>' +
        '<div id="consultBillsContainer">' +
        '<div class="consult-bill-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
        '<input type="text" class="cbill-desc" placeholder="Item (e.g., Consultation Fee)" style="flex:2" value="Consultation Fee">' +
        '<input type="number" class="cbill-amt" placeholder="Amount (KES)" style="flex:1" min="0" value="">' +
        '<button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()" style="flex:0">✕</button>' +
        '</div>' +
        '<div class="consult-bill-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
        '<input type="text" class="cbill-desc" placeholder="Item (e.g., Treatment Fee)" style="flex:2">' +
        '<input type="number" class="cbill-amt" placeholder="Amount (KES)" style="flex:1" min="0" value="">' +
        '<button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()" style="flex:0">✕</button>' +
        '</div>' +
        '<div class="consult-bill-row" style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
        '<input type="text" class="cbill-desc" placeholder="Item (e.g., In-office Medication)" style="flex:2">' +
        '<input type="number" class="cbill-amt" placeholder="Amount (KES)" style="flex:1" min="0" value="">' +
        '<button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()" style="flex:0">✕</button>' +
        '</div>' +
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
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center';
    row.innerHTML = 
        '<input type="text" class="cbill-desc" placeholder="Item description..." style="flex:2">' +
        '<input type="number" class="cbill-amt" placeholder="Amount (KES)" style="flex:1" min="0" value="">' +
        '<button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()" style="flex:0">✕</button>';
    container.appendChild(row);
}

async function submitMultipleConsultBills(visitId) {
    var rows = document.querySelectorAll('.consult-bill-row');
    var bills = [];
    var totalAmt = 0;
    
    for (var i = 0; i < rows.length; i++) {
        var desc = rows[i].querySelector('.cbill-desc').value.trim();
        var amt = parseFloat(rows[i].querySelector('.cbill-amt').value) || 0;
        if (desc && amt > 0) {
            bills.push({ desc: desc, amt: amt });
            totalAmt += amt;
        }
    }
    
    if (bills.length === 0) {
        toast('⚠️ Please add at least one bill item with an amount', 'error');
        return;
    }
    
    try {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        
        // Add all bills
        for (var j = 0; j < bills.length; j++) {
            await fetch(API + '/api/billing', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    visit_id: visitId, 
                    patient_id: detail.patient_id, 
                    item_description: bills[j].desc, 
                    department: 'consultation', 
                    amount: bills[j].amt 
                }) 
            });
        }
        
        toast('✅ ' + bills.length + ' bill(s) added - Total: KES ' + totalAmt.toLocaleString(), 'success');
        closeModal();
        
        var diagnosis = document.getElementById('diag_' + visitId) ? document.getElementById('diag_' + visitId).value : '';
        var treatment = document.getElementById('treat_' + visitId) ? document.getElementById('treat_' + visitId).value : '';
        var notes = document.getElementById('cnotes_' + visitId) ? document.getElementById('cnotes_' + visitId).value : '';
        
        await completeAndTransfer(
            visitId, 'cashier',
            {},
            'Consultation complete | Dx: ' + (diagnosis || 'N/A') + 
            ' | Treatment: ' + (treatment || 'N/A') + 
            ' | Bills: ' + bills.length + ' items, KES ' + totalAmt
        );
        
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

// ==================== LABORATORY SCREEN ====================
async function labScreen() {
    var dp = await fetch(API + '/api/visits/department/laboratory').then(function(r) { return r.json(); });
    var h = '';

    // Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🧪 Lab Orders (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) {
        h += '<p style="color:var(--text-muted)">No lab orders pending.</p>';
    } else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('lab', v.visit_id, d);
            h += '<strong style="font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> | <span class="badge badge-info">' + v.visit_number + '</span>';
            if (d.allergies) h += '<p style="color:red;font-weight:600">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<p><strong>Diagnosis:</strong> ' + (d.diagnosis || 'N/A') + '</p>';
            h += '<p><strong>Lab Orders:</strong> ' + (d.lab_orders || 'No orders specified') + '</p>';
            if (d.ward_bed_number) h += '<p><strong>🛏️ Ward Bed:</strong> ' + d.ward_bed_number + ' (Admitted Patient)</p>';
            if (d.registration_fee_paid) {
                h += '<div class="alert alert-success"><strong>Registration Fee:</strong> ✅ Paid - KES ' + (d.registration_fee_amount || 200) + '</div>';
            } else {
                h += '<div class="alert alert-warning"><strong>Registration Fee:</strong> ❌ Pending - KES ' + (d.registration_fee_amount || 200) + '</div>';
            }
            h += '<form onsubmit="saveLab(event,' + v.visit_id + ')">';
            h += '<div class="form-group"><label>Lab Results *</label><textarea id="lres_' + v.visit_id + '" required placeholder="Enter test results here..."></textarea></div>';
            h += '<div class="form-group"><label>Test Cost (KES)</label><input type="number" id="lcost_' + v.visit_id + '" value="0" placeholder="Enter amount"></div>';
            h += '<button type="button" class="btn btn-success" onclick="labCompleteWithBill(' + v.visit_id + ')">✅ Submit Results & Complete</button></form>';
            if (d.ward_bed_number) {
                h += '<div style="margin-top:8px"><button class="btn btn-warning btn-small" onclick="returnToWard(' + v.visit_id + ')">🛏️ Return to Ward Bed ' + d.ward_bed_number + '</button></div>';
            }
            h += '<div class="transfer-panel" style="margin-top:10px"><strong>Forward Patient To:</strong><div class="transfer-options">';
            var labDepts = relevantDepts['laboratory'] || [];
            for (var j = 0; j < labDepts.length; j++) {
                h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + labDepts[j] + '\',\'Sent from Laboratory\')">📤 ' + labDepts[j] + '</button> ';
            }
            h += '</div></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}

async function saveLab(event, visitId) {
    event.preventDefault();
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { toast('⚠️ Please confirm patient identity first!', 'error'); return; }
    var results = document.getElementById('lres_' + visitId).value;
    var cost = parseFloat(document.getElementById('lcost_' + visitId).value) || 0;
    if (!results) { toast('⚠️ Please enter lab results', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lab_results: results }) });
    if (cost > 0) {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: visitId, patient_id: detail.patient_id, item_description: 'Laboratory Tests', department: 'laboratory', amount: cost }) });
    }
    await transferPatient(visitId, 'consultation', 'LAB RESULTS: ' + results + (cost > 0 ? ' | Cost: KES ' + cost : ''));
    if (cost > 0) await transferPatient(visitId, 'cashier', 'Lab tests completed - payment required KES ' + cost);
    toast('✅ Lab results sent to Doctor' + (cost > 0 ? ' and Cashier' : ''), 'success');
    loadDashboard();
}

// In labScreen(), replace the submit button line with:
h += '<button type="button" class="btn btn-success" onclick="labCompleteWithBill(' + v.visit_id + ')">✅ Submit Results & Complete</button>';

// ADD THIS NEW FUNCTION:
async function labCompleteWithBill(visitId) {
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { 
        toast('⚠️ Please confirm patient identity first!', 'error'); 
        return; 
    }
    
    var results = document.getElementById('lres_' + visitId).value;
    if (!results) { 
        toast('⚠️ Please enter lab results', 'error'); 
        return; 
    }
    
    // Save results first
    await fetch(API + '/api/visits/' + visitId, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ lab_results: results }) 
    });
    
    // Get the cost entered
    var cost = parseFloat(document.getElementById('lcost_' + visitId).value) || 0;
    
    // Show bill popup
    quickBillAndRefer(visitId, 'consultation', 'Laboratory Tests', cost);
}

// ==================== RADIOLOGY SCREEN ====================
async function radioScreen() {
    var dp = await fetch(API + '/api/visits/department/radiology').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🩻 Radiology Orders (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) {
        h += '<p style="color:var(--text-muted)">No imaging orders pending.</p>';
    } else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('radiology', v.visit_id, d);
            h += '<strong style="font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> | <span class="badge badge-info">' + v.visit_number + '</span>';
            if (d.allergies) h += '<p style="color:red;font-weight:600">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<p><strong>Diagnosis:</strong> ' + (d.diagnosis || 'N/A') + '</p>';
            h += '<p><strong>Radiology Orders:</strong> ' + (d.radiology_orders || 'No orders specified') + '</p>';
            if (d.ward_bed_number) h += '<p><strong>🛏️ Ward Bed:</strong> ' + d.ward_bed_number + ' (Admitted Patient)</p>';
            h += '<form onsubmit="saveRadio(event,' + v.visit_id + ')"><div class="row">';
            h += '<div class="form-group"><label>Imaging Type *</label><select id="rtype_' + v.visit_id + '" required><option value="">Select Type</option><option>X-Ray</option><option>CT Scan</option><option>Ultrasound</option><option>MRI</option><option>Mammogram</option></select></div>';
            h += '<div class="form-group"><label>Body Part</label><input type="text" id="rbody_' + v.visit_id + '" placeholder="e.g., Chest, Abdomen, Head..."></div></div>';
            h += '<div class="form-group"><label>Findings *</label><textarea id="rfind_' + v.visit_id + '" required placeholder="Enter radiology findings here..."></textarea></div>';
            h += '<div class="form-group"><label>Cost (KES)</label><input type="number" id="rcost_' + v.visit_id + '" value="0" placeholder="Enter amount"></div>';
            h += '<button type="submit" class="btn btn-purple">✅ Submit Findings & Return Patient</button></form>';
            if (d.ward_bed_number) {
                h += '<div style="margin-top:8px"><button class="btn btn-warning btn-small" onclick="returnToWard(' + v.visit_id + ')">🛏️ Return to Ward Bed ' + d.ward_bed_number + '</button></div>';
            }
            h += '<div class="transfer-panel" style="margin-top:10px"><strong>Forward Patient To:</strong><div class="transfer-options">';
            var radDepts = relevantDepts['radiology'] || [];
            for (var j = 0; j < radDepts.length; j++) {
                h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + radDepts[j] + '\',\'Sent from Radiology\')">📤 ' + radDepts[j] + '</button> ';
            }
            h += '</div></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}

async function saveRadio(event, visitId) {
    event.preventDefault();
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { toast('⚠️ Please confirm patient identity first!', 'error'); return; }
    var findings = document.getElementById('rfind_' + visitId).value;
    var cost = parseFloat(document.getElementById('rcost_' + visitId).value) || 0;
    if (!findings) { toast('⚠️ Please enter radiology findings', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ radiology_type: document.getElementById('rtype_' + visitId).value, radiology_body_part: document.getElementById('rbody_' + visitId).value, radiology_findings: findings }) });
    if (cost > 0) {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: visitId, patient_id: detail.patient_id, item_description: 'Radiology: ' + document.getElementById('rtype_' + visitId).value, department: 'radiology', amount: cost }) });
    }
    await transferPatient(visitId, 'consultation', 'RADIOLOGY FINDINGS: ' + findings);
    if (cost > 0) await transferPatient(visitId, 'cashier', 'Radiology completed - payment required KES ' + cost);
    toast('✅ Radiology findings sent to Doctor' + (cost > 0 ? ' and Cashier' : ''), 'success');
    loadDashboard();
}

// In radioScreen(), replace the submit button with:
h += '<button type="button" class="btn btn-purple" onclick="radioCompleteWithBill(' + v.visit_id + ')">✅ Submit Findings & Complete</button>';

// ADD THIS FUNCTION:
async function radioCompleteWithBill(visitId) {
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { 
        toast('⚠️ Please confirm patient identity first!', 'error'); 
        return; 
    }
    
    var findings = document.getElementById('rfind_' + visitId).value;
    if (!findings) { 
        toast('⚠️ Please enter radiology findings', 'error'); 
        return; 
    }
    
    // Save findings first
    await fetch(API + '/api/visits/' + visitId, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            radiology_type: document.getElementById('rtype_' + visitId).value,
            radiology_body_part: document.getElementById('rbody_' + visitId).value,
            radiology_findings: findings 
        }) 
    });
    
    var cost = parseFloat(document.getElementById('rcost_' + visitId).value) || 0;
    var type = document.getElementById('rtype_' + visitId).value || 'Imaging';
    
    quickBillAndRefer(visitId, 'consultation', 'Radiology: ' + type, cost);
}

// ==================== PHARMACY SCREEN ====================
async function pharmScreen() {
    var dp = await fetch(API + '/api/visits/department/pharmacy').then(function(r) { return r.json(); });
    var h = '';

    // Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">💊 Pharmacy Dispensing (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) {
        h += '<p style="color:var(--text-muted)">No patients at pharmacy.</p>';
    } else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('pharmacy', v.visit_id, d);
            h += '<strong style="font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> | <span class="badge badge-info">' + v.visit_number + '</span>';
            if (d.allergies) h += '<p style="color:red;font-weight:600">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<p><strong>Diagnosis:</strong> ' + (d.diagnosis || 'N/A') + '</p>';
            h += '<p><strong>Prescription:</strong> ' + (d.pharmacy_orders || d.treatment_plan || 'No prescription specified') + '</p>';
            h += '<form onsubmit="dispenseMeds(event,' + v.visit_id + ')">';
            h += '<div class="form-group"><label>Medications Dispensed *</label><textarea id="pdisp_' + v.visit_id + '" required placeholder="List all medications dispensed..."></textarea></div>';
            h += '<div class="form-group"><label>Amount to Bill (KES)</label><input type="number" id="pamt_' + v.visit_id + '" value="0" required></div>';
            h += '<button type="button" class="btn btn-success" onclick="pharmCompleteWithBill(' + v.visit_id + ')">✅ Dispense & Complete</button></form>';
            h += '<div class="transfer-panel" style="margin-top:10px"><strong>Forward Patient To:</strong><div class="transfer-options">';
            var pharmDepts = relevantDepts['pharmacy'] || [];
            for (var j = 0; j < pharmDepts.length; j++) {
                h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + pharmDepts[j] + '\',\'Sent from Pharmacy\')">📤 ' + pharmDepts[j] + '</button> ';
            }
            h += '</div></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}

async function dispenseMeds(event, visitId) {
    event.preventDefault();
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { toast('⚠️ Please confirm patient identity first!', 'error'); return; }
    var dispensed = document.getElementById('pdisp_' + visitId).value;
    var amount = parseFloat(document.getElementById('pamt_' + visitId).value) || 0;
    if (!dispensed) { toast('⚠️ Please enter medications dispensed', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pharmacy_dispensed: dispensed }) });
    if (amount > 0) {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: visitId, patient_id: detail.patient_id, item_description: 'Pharmacy: ' + dispensed.substring(0, 100), department: 'pharmacy', amount: amount }) });
    }
    await transferPatient(visitId, 'cashier', 'PHARMACY DISPENSED: ' + dispensed + (amount > 0 ? ' | Amount: KES ' + amount : ''));
    toast('✅ Medications dispensed and sent to Cashier', 'success');
    loadDashboard();
}

// In pharmScreen(), replace the submit button with:
h += '<button type="button" class="btn btn-success" onclick="pharmCompleteWithBill(' + v.visit_id + ')">✅ Dispense & Complete</button>';

// ADD THIS FUNCTION:
async function pharmCompleteWithBill(visitId) {
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { 
        toast('⚠️ Please confirm patient identity first!', 'error'); 
        return; 
    }
    
    var dispensed = document.getElementById('pdisp_' + visitId).value;
    if (!dispensed) { 
        toast('⚠️ Please enter medications dispensed', 'error'); 
        return; 
    }
    
    // Save dispensed meds first
    await fetch(API + '/api/visits/' + visitId, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ pharmacy_dispensed: dispensed }) 
    });
    
    var amount = parseFloat(document.getElementById('pamt_' + visitId).value) || 0;
    
    quickBillAndRefer(visitId, 'cashier', 'Pharmacy: ' + dispensed.substring(0, 80), amount);
}

// ==================== WARD SCREEN (WITH REFERRAL ORDERS + DECLARE DEATH) ====================
async function wardScreen() {
    var dp = await fetch(API + '/api/visits/department/ward').then(function(r) { return r.json(); });
    var beds = await fetch(API + '/api/beds/available').then(function(r) { return r.json(); });
    var allActive = await fetch(API + '/api/visits/active').then(function(r) { return r.json(); });
    var admitted = allActive.filter(function(v) { return v.ward_admitted; });
    var h = '';
    
// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    // Department Panel button
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🛏️ ' + (currentUser.department_name || 'WARD') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🛏️ Available Beds (' + beds.length + ')</div><div class="card-body">';
    for (var i = 0; i < beds.length; i++) {
        h += '<span class="badge badge-success" style="margin:2px">' + beds[i].bed_number + ' (' + beds[i].ward_type + ')</span> ';
    }
    if (beds.length === 0) h += '<p style="color:var(--danger)">⚠️ No beds available!</p>';
    h += '</div></div>';
    h += '<div class="card"><div class="card-header">🛏️ New Admissions (' + dp.length + ')</div><div class="card-body patient-list">';
    if (dp.length === 0) {
        h += '<p style="color:var(--text-muted)">No new admissions.</p>';
    } else {
        for (var j = 0; j < dp.length; j++) {
            var v = dp[j];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('ward', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p><strong>Diagnosis:</strong> ' + (d.diagnosis || 'N/A') + '</p>';
            if (d.allergies) h += '<p style="color:red">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<form onsubmit="admitPatient(event,' + v.visit_id + ')"><div class="form-group"><label>Assign Bed *</label><select id="bed_' + v.visit_id + '" required><option value="">Select bed</option>';
            for (var k = 0; k < beds.length; k++) {
                h += '<option value="' + beds[k].bed_number + '">' + beds[k].bed_number + ' (' + beds[k].ward_type + ')</option>';
            }
            h += '</select></div>';
            h += '<div class="form-group"><label>Ward Notes</label><textarea id="wnotes_' + v.visit_id + '" placeholder="Ward admission notes..."></textarea></div>';
            h += '<button type="submit" class="btn btn-success">✅ Admit Patient</button></form>';
            h += '</div></div>';
        }
    }
    h += '</div></div>';
    if (admitted.length > 0) {
        h += '<div class="card"><div class="card-header">🏥 Admitted Patients (' + admitted.length + ')</div><div class="card-body patient-list">';
        for (var m = 0; m < admitted.length; m++) {
            var av = admitted[m];
            var ad = await fetch(API + '/api/visits/' + av.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:8px;border-left:4px solid var(--warning)"><div class="card-body">';
            h += '<strong>' + av.first_name + ' ' + av.last_name + '</strong> | Bed: ' + (av.ward_bed_number || '?') + ' | ' + av.visit_number;
            if (ad.diagnosis) h += '<p><strong>Dx:</strong> ' + ad.diagnosis + '</p>';
            if (ad.lab_results) h += '<div class="alert alert-info"><strong>🧪 Lab:</strong> ' + ad.lab_results + '</div>';
            if (ad.radiology_findings) h += '<div class="alert alert-info"><strong>🩻 Radiology:</strong> ' + ad.radiology_findings + '</div>';
            h += '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">';
            h += '<button class="btn btn-info btn-small" onclick="viewPatientFull(' + av.visit_id + ')">📋 Full View</button> ';
            h += '<button class="btn btn-info btn-small" onclick="addBillForPatient(' + av.visit_id + ',' + av.patient_id + ')">💰 Add Bill</button> ';
            h += '<button class="btn btn-purple btn-small" onclick="wardReferWithOrders(' + av.visit_id + ',\'laboratory\')">🧪 Send to Lab (with orders)</button> ';
            h += '<button class="btn btn-purple btn-small" onclick="wardReferWithOrders(' + av.visit_id + ',\'radiology\')">🩻 Send to Radiology (with orders)</button> ';
            h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + av.visit_id + ',\'pharmacy\',\'Sent from Ward\')">💊 Send to Pharmacy</button> ';
            h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + av.visit_id + ',\'consultation\',\'Sent from Ward\')">👨‍⚕️ Send to Doctor</button> ';
            h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + av.visit_id + ',\'physio\',\'Sent from Ward\')">🏃 Send to Physio</button> ';
            h += '<button class="btn btn-danger btn-small" onclick="declareDeath(' + av.visit_id + ')">⚰️ Declare Death</button> ';
            h += '<button class="btn btn-info btn-small" onclick="multiTransfer(' + av.visit_id + ')">📤 Multi-Send</button> ';
            h += '</div>';
            h += '</div></div>';
        }
        h += '</div></div>';
    }
    return h;
}

async function admitPatient(event, visitId) {
    event.preventDefault();
    var confirmCheckbox = document.getElementById('confirm_' + visitId);
    if (confirmCheckbox && !confirmCheckbox.checked) { toast('⚠️ Please confirm patient identity first!', 'error'); return; }
    var bedNumber = document.getElementById('bed_' + visitId).value;
    if (!bedNumber) { toast('⚠️ Please select a bed', 'error'); return; }
    await fetch(API + '/api/visits/' + visitId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ward_bed_number: bedNumber, ward_notes: document.getElementById('wnotes_' + visitId).value, ward_admitted: 1, status: 'admitted' }) });
    var wardFee = prompt('Enter ward admission fee (KES):', '');
    if (wardFee && !isNaN(parseFloat(wardFee)) && parseFloat(wardFee) > 0) {
        var detail = await fetch(API + '/api/visits/' + visitId).then(function(r) { return r.json(); });
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: visitId, patient_id: detail.patient_id, item_description: 'Ward Admission - Bed ' + bedNumber, department: 'ward', amount: parseFloat(wardFee) }) });
    }
    var allBeds = await fetch(API + '/api/beds').then(function(r) { return r.json(); });
    var bed = allBeds.find(function(b) { return b.bed_number === bedNumber; });
    if (bed) {
        await fetch(API + '/api/beds/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bed_id: bed.bed_id, visit_id: visitId }) });
    }
    toast('✅ Patient admitted to Bed ' + bedNumber, 'success');
    loadDashboard();
}

// ==================== CASHIER SCREEN - WITH REVENUE & EXPENSES ====================
async function cashScreen() {
    var h = '';
    
    // Department Panel button
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">💰 ' + (currentUser.department_name || 'CASHIER') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    // ====== FINANCIAL SUMMARY CARDS ======
    h += '<div class="stats-grid" id="cashierStats">';
    h += '<div class="stat-card"><div class="number" id="cashToday">KES 0</div><div class="label">Collected Today</div></div>';
    h += '<div class="stat-card success"><div class="number" id="cashTotal">KES 0</div><div class="label">Total Revenue</div></div>';
    h += '<div class="stat-card warning"><div class="number" id="cashPending">KES 0</div><div class="label">Outstanding</div></div>';
    h += '<div class="stat-card danger"><div class="number" id="cashExpenses">KES 0</div><div class="label">Expenses</div></div>';
    h += '</div>';
    
    // ====== PATIENT SEARCH ======
    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    
    // ====== CONSOLIDATED BILLING (COLLAPSIBLE) ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="toggleAdminSection(\'cashierBilling\')">';
    h += '<span>💰 Patient Billing <span id="cashierBilling_icon">▼</span></span>';
    h += '<span style="font-size:11px;color:var(--text-muted)" id="cashierPatientCount">0 patients</span>';
    h += '</div>';
    h += '<div id="cashierBilling" class="card-body" style="display:none">';
    h += '<div id="cashierBillingContent"><p style="text-align:center;color:var(--text-muted)">Loading...</p></div>';
    h += '</div></div>';
    
    // ====== RECORD EXPENSE ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierExpense\')">';
    h += '💸 Record Expense <span id="cashierExpense_icon">▼</span>';
    h += '</div>';
    h += '<div id="cashierExpense" class="card-body" style="display:none">';
    h += '<div class="row">';
    h += '<div class="form-group"><label>Description *</label><input type="text" id="expDesc" placeholder="e.g., Staff salaries, Equipment purchase..."></div>';
    h += '<div class="form-group"><label>Category</label><select id="expCat"><option>Salaries</option><option>Supplies</option><option>Equipment</option><option>Maintenance</option><option>Utilities</option><option>Cleaning</option><option>Food</option><option>Transport</option><option>Other</option></select></div>';
    h += '<div class="form-group"><label>Amount (KES) *</label><input type="number" id="expAmt" placeholder="0" min="1"></div>';
    h += '</div>';
    h += '<button class="btn btn-danger btn-block" onclick="recordExpense()">💸 Record Expense</button>';
    h += '</div></div>';
    
    // ====== EXPENSE HISTORY ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierExpHistory\')">';
    h += '📋 Expense History <span id="cashierExpHistory_icon">▼</span>';
    h += '</div>';
    h += '<div id="cashierExpHistory" class="card-body patient-list" style="display:none">';
    h += '<div id="cashierExpHistoryContent"><p style="text-align:center;color:var(--text-muted)">Loading...</p></div>';
    h += '</div></div>';
    
    // ====== PAYMENT METHOD BREAKDOWN ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'cashierMethods\')">';
    h += '💳 Payment Methods Breakdown <span id="cashierMethods_icon">▼</span>';
    h += '</div>';
    h += '<div id="cashierMethods" class="card-body" style="display:none">';
    h += '<div id="cashierMethodsContent"><p style="text-align:center;color:var(--text-muted)">Loading...</p></div>';
    h += '</div></div>';
    
    // Load all data
    setTimeout(function() { 
        loadCashierBilling(); 
        loadCashierExpenses(); 
        loadCashierMethods();
        loadCashierStats();
    }, 200);
    
    return h;
}

// ============ LOAD CASHIER BILLING DATA ============
async function loadCashierBilling() {
    try {
        var res = await fetch(API + '/api/billing/all');
        var data = await res.json();
        var patients = data.patients || [];
        
        document.getElementById('cashierPatientCount').textContent = patients.length + ' patients';
        
        if (patients.length === 0) {
            document.getElementById('cashierBillingContent').innerHTML = '<p style="color:var(--text-muted);text-align:center">No patients with active bills.</p>';
            return;
        }
        
        var html = '<div style="background:#f8f9fa;padding:10px;border-radius:6px;margin-bottom:10px">';
        html += '<div style="display:flex;justify-content:space-between"><span>Total Expected:</span><span><strong>KES ' + (data.grand_total || 0).toLocaleString() + '</strong></span></div>';
        html += '<div style="display:flex;justify-content:space-between;color:green"><span>Total Collected:</span><span><strong>KES ' + (data.grand_paid || 0).toLocaleString() + '</strong></span></div>';
        html += '<div style="display:flex;justify-content:space-between;color:red;font-weight:bold;font-size:15px"><span>Outstanding:</span><span><strong>KES ' + (data.grand_balance || 0).toLocaleString() + '</strong></span></div>';
        html += '</div>';
        
        for (var i = 0; i < patients.length; i++) {
            var pt = patients[i];
            var cardId = 'cashBill_' + pt.visit_id;
            var borderColor = pt.balance > 0 ? 'var(--warning)' : 'var(--success)';
            
            html += '<div class="card" style="margin-bottom:6px;border:1px solid ' + borderColor + '">';
            html += '<div style="padding:8px 12px;cursor:pointer;background:' + (pt.balance > 0 ? '#fffdf0' : '#f0fff0') + '" onclick="toggleAdminSection(\'' + cardId + '\')">';
            html += '<strong>' + pt.patient_name + '</strong> | ' + pt.visit_number + ' | Balance: <strong style="color:' + (pt.balance > 0 ? 'red' : 'green') + '">KES ' + pt.balance.toLocaleString() + '</strong> <span id="' + cardId + '_icon" style="float:right">▼</span>';
            html += '</div>';
            html += '<div id="' + cardId + '" style="display:none;padding:8px">';
            html += '<table style="width:100%"><tr><th>Item</th><th>Dept</th><th>Amount</th><th>Method</th><th>Status</th><th>Action</th></tr>';
            for (var j = 0; j < pt.bills.length; j++) {
                var b = pt.bills[j];
                html += '<tr>';
                html += '<td style="font-size:11px">' + b.item_description + '</td>';
                html += '<td>' + (b.department || '') + '</td>';
                html += '<td>KES ' + parseFloat(b.amount || 0).toLocaleString() + '</td>';
                html += '<td>' + (b.payment_method || 'N/A') + '</td>';
                html += '<td>' + (b.is_paid ? '✅' : '❌') + '</td>';
                html += '<td>';
                if (!b.is_paid) html += '<button class="btn btn-success btn-small" onclick="markBillPaidWithMethod(' + b.bill_id + ',' + pt.visit_id + ')">Pay</button> ';
                html += '<button class="btn btn-danger btn-small" onclick="deleteBill(' + b.bill_id + ',' + pt.visit_id + ');setTimeout(function(){loadCashierBilling();loadCashierStats();},500)">🗑️</button>';
                html += '</td></tr>';
            }
            html += '</table>';
            if (pt.balance <= 0) {
                html += '<button class="btn btn-success btn-small" style="margin-top:5px" onclick="dischargePatientDirect(' + pt.visit_id + ')">✅ DISCHARGE</button>';
            }
            html += '</div></div>';
        }
        
        document.getElementById('cashierBillingContent').innerHTML = html;
    } catch (err) {
        document.getElementById('cashierBillingContent').innerHTML = '<p style="color:red">Error loading billing data</p>';
    }
}

// ============ LOAD CASHIER EXPENSES ============
async function loadCashierExpenses() {
    try {
        var res = await fetch(API + '/api/expenses');
        var expenses = await res.json();
        
        if (!expenses || expenses.length === 0) {
            document.getElementById('cashierExpHistoryContent').innerHTML = '<p style="color:var(--text-muted);text-align:center">No expenses recorded yet.</p>';
            return;
        }
        
        var totalExp = 0;
        var html = '<table><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Recorded By</th></tr>';
        for (var i = 0; i < expenses.length; i++) {
            var e = expenses[i];
            totalExp += parseFloat(e.amount || 0);
            html += '<tr>';
            html += '<td><small>' + (e.created_at ? new Date(e.created_at).toLocaleDateString() : 'N/A') + '</small></td>';
            html += '<td>' + e.description + '</td>';
            html += '<td><span class="badge badge-info">' + (e.category || 'General') + '</span></td>';
            html += '<td><strong style="color:var(--danger)">KES ' + parseFloat(e.amount || 0).toLocaleString() + '</strong></td>';
            html += '<td><small>' + (e.recorded_by_name || 'N/A') + '</small></td>';
            html += '</tr>';
        }
        html += '<tr style="background:#ffeaea;font-weight:bold"><td colspan="3">TOTAL EXPENSES</td><td>KES ' + totalExp.toLocaleString() + '</td><td></td></tr>';
        html += '</table>';
        
        document.getElementById('cashierExpHistoryContent').innerHTML = html;
    } catch (err) {
        document.getElementById('cashierExpHistoryContent').innerHTML = '<p style="color:red">Error loading expenses</p>';
    }
}

// ============ LOAD PAYMENT METHODS BREAKDOWN ============
async function loadCashierMethods() {
    try {
        var res = await fetch(API + '/api/billing/all');
        var data = await res.json();
        
        var methodTotals = {};
        for (var i = 0; i < (data.patients || []).length; i++) {
            var pt = data.patients[i];
            for (var j = 0; j < pt.bills.length; j++) {
                var bill = pt.bills[j];
                if (bill.is_paid) {
                    var m = bill.payment_method || 'Cash';
                    methodTotals[m] = (methodTotals[m] || 0) + parseFloat(bill.amount || 0);
                }
            }
        }
        
        var totalPaid = data.grand_paid || 1;
        var methods = Object.keys(methodTotals);
        var html = '<table><tr><th>Method</th><th>Amount</th><th>%</th><th>Transactions</th></tr>';
        
        for (var k = 0; k < methods.length; k++) {
            var method = methods[k];
            var amt = methodTotals[method];
            var pct = ((amt / totalPaid) * 100).toFixed(1);
            html += '<tr><td><strong>' + method + '</strong></td><td>KES ' + amt.toLocaleString() + '</td><td>' + pct + '%</td><td>' + Math.round(amt / 200) + '</td></tr>';
        }
        
        if (methods.length === 0) {
            html += '<tr><td colspan="4" style="color:var(--text-muted)">No payments recorded</td></tr>';
        }
        html += '</table>';
        
        document.getElementById('cashierMethodsContent').innerHTML = html;
    } catch (err) {
        document.getElementById('cashierMethodsContent').innerHTML = '<p style="color:red">Error loading data</p>';
    }
}

// ============ LOAD CASHIER STATS ============
async function loadCashierStats() {
    try {
        var res = await fetch(API + '/api/billing/all');
        var data = await res.json();
        
        // Calculate today's collections
        var todayTotal = 0;
        var today = new Date().toISOString().split('T')[0];
        for (var i = 0; i < (data.patients || []).length; i++) {
            var pt = data.patients[i];
            for (var j = 0; j < pt.bills.length; j++) {
                var bill = pt.bills[j];
                if (bill.is_paid && bill.paid_at && bill.paid_at.startsWith(today)) {
                    todayTotal += parseFloat(bill.amount || 0);
                }
            }
        }
        
        // Get expenses
        var expRes = await fetch(API + '/api/expenses');
        var expenses = await expRes.json();
        var totalExp = 0;
        for (var k = 0; k < expenses.length; k++) {
            totalExp += parseFloat(expenses[k].amount || 0);
        }
        
        document.getElementById('cashToday').textContent = 'KES ' + todayTotal.toLocaleString();
        document.getElementById('cashTotal').textContent = 'KES ' + (data.grand_paid || 0).toLocaleString();
        document.getElementById('cashPending').textContent = 'KES ' + (data.grand_balance || 0).toLocaleString();
        document.getElementById('cashExpenses').textContent = 'KES ' + totalExp.toLocaleString();
    } catch (err) {
        console.log('Error loading stats:', err);
    }
}

// ============ RECORD EXPENSE ============
async function recordExpense() {
    var desc = document.getElementById('expDesc').value.trim();
    var cat = document.getElementById('expCat').value;
    var amt = parseFloat(document.getElementById('expAmt').value);
    
    if (!desc) { toast('⚠️ Please enter a description', 'error'); return; }
    if (!amt || amt <= 0) { toast('⚠️ Please enter a valid amount', 'error'); return; }
    
    try {
        var res = await fetch(API + '/api/expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: desc, category: cat, amount: amt })
        });
        var data = await res.json();
        if (data.success) {
            toast('💸 Expense recorded: ' + desc + ' - KES ' + amt.toLocaleString(), 'success');
            document.getElementById('expDesc').value = '';
            document.getElementById('expAmt').value = '';
            loadCashierExpenses();
            loadCashierStats();
        } else {
            toast(data.error || 'Error recording expense', 'error');
        }
    } catch (err) {
        toast('Error recording expense', 'error');
    }
}

// ==================== DIETARY SCREEN ====================
async function dietScreen() {
    var dp = await fetch(API + '/api/visits/department/dietary').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🍽️ Dietary Plans (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients referred to dietary services.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('dietary', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            if (d.allergies) h += '<p style="color:red;font-weight:600">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<p>Diagnosis: ' + (d.diagnosis || 'N/A') + ' | Bed: ' + (d.ward_bed_number || 'N/A') + '</p>';
            h += '<form onsubmit="saveDiet(event,' + v.visit_id + ')"><div class="form-group"><label>Dietary Restrictions</label><textarea id="drest_' + v.visit_id + '">' + (d.dietary_restrictions || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Meal Plan *</label><textarea id="dplan_' + v.visit_id + '" required>' + (d.dietary_plan || '') + '</textarea></div>';
            h += '<button class="btn btn-success">✅ Save Dietary Plan</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'ward\')">📤 Return to Ward</button></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveDiet(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dietary_restrictions: document.getElementById('drest_' + vid).value, dietary_plan: document.getElementById('dplan_' + vid).value }) });
    await completeAndTransfer(vid, 'ward', {}, 'Dietary plan assigned');
}

// ==================== BLOOD BANK SCREEN ====================
async function bloodScreen() {
    var dp = await fetch(API + '/api/visits/department/bloodbank').then(function(r) { return r.json(); });
    var inv = await fetch(API + '/api/bloodbank').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🩸 Blood Bank Inventory</div><div class="card-body"><table><tr><th>Blood Group</th><th>Units Available</th><th>Expiry Date</th></tr>';
    for (var i = 0; i < inv.length; i++) {
        h += '<tr><td><strong>' + inv[i].blood_group + '</strong></td><td>' + inv[i].units_available + '</td><td>' + (inv[i].expiry_date || 'N/A') + '</td></tr>';
    }
    h += '</table></div></div>';
    h += '<div class="card"><div class="card-header">🩸 Blood Requests (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No blood requests pending.</p>'; }
    else {
        for (var j = 0; j < dp.length; j++) {
            var v = dp[j];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('bloodbank', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Blood Group: ' + (d.blood_group || 'Unknown') + ' | Diagnosis: ' + (d.diagnosis || 'N/A') + '</p>';
            h += '<form onsubmit="saveBlood(event,' + v.visit_id + ')"><div class="row"><div class="form-group"><label>Request Type</label><select id="btype_' + v.visit_id + '"><option>Whole Blood</option><option>Packed Cells</option><option>Platelets</option><option>Plasma</option></select></div>';
            h += '<div class="form-group"><label>Units Required *</label><input type="number" id="bunits_' + v.visit_id + '" value="1" min="1" required></div></div>';
            h += '<button class="btn btn-danger">✅ Process Blood Request</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'ward\')">📤 Return to Ward</button> <button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'consultation\')">📤 Send to Doctor</button></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveBlood(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    var units = parseInt(document.getElementById('bunits_' + vid).value) || 0;
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bloodbank_request_type: document.getElementById('btype_' + vid).value, bloodbank_units: units, bloodbank_status: 'Issued' }) });
    if (units > 0) {
        var d = await fetch(API + '/api/visits/' + vid).then(function(r) { return r.json(); });
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: vid, patient_id: d.patient_id, item_description: 'Blood Bank: ' + units + ' units ' + document.getElementById('btype_' + vid).value, department: 'bloodbank', amount: units * 1500 }) });
    }
    await completeAndTransfer(vid, 'ward', {}, 'Blood issued: ' + units + ' units');
}

// ==================== SOCIAL WORK SCREEN ====================
async function socialScreen() {
    var dp = await fetch(API + '/api/visits/department/socialwork').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🤝 Social Work Cases (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No cases referred to social work.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('socialwork', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Diagnosis: ' + (d.diagnosis || 'N/A') + ' | Phone: ' + (d.phone || 'N/A') + '</p>';
            h += '<form onsubmit="saveSocial(event,' + v.visit_id + ')"><div class="form-group"><label>Assessment *</label><textarea id="sassess_' + v.visit_id + '" required>' + (d.socialwork_assessment || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Support Type</label><select id="ssupport_' + v.visit_id + '"><option>Financial Assistance</option><option>Family Support</option><option>Counseling</option><option>Discharge Planning</option><option>Child Protection</option><option>Elderly Care</option></select></div>';
            h += '<div class="form-group"><label>Notes</label><textarea id="snotes_' + v.visit_id + '">' + (d.socialwork_notes || '') + '</textarea></div>';
            h += '<button class="btn btn-purple">✅ Save Assessment</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'ward\')">📤 Return to Ward</button></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveSocial(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ socialwork_assessment: document.getElementById('sassess_' + vid).value, socialwork_support_type: document.getElementById('ssupport_' + vid).value, socialwork_notes: document.getElementById('snotes_' + vid).value }) });
    await completeAndTransfer(vid, 'ward', {}, 'Social work assessment completed');
}

// ==================== PHYSIOTHERAPY SCREEN ====================
async function physioScreen() {
    var dp = await fetch(API + '/api/visits/department/physio').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🏃 Physiotherapy (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients referred for physiotherapy.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('physio', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Diagnosis: ' + (d.diagnosis || 'N/A') + ' | Bed: ' + (d.ward_bed_number || 'N/A') + '</p>';
            h += '<form onsubmit="savePhysio(event,' + v.visit_id + ')"><div class="form-group"><label>Assessment</label><textarea id="pa_' + v.visit_id + '">' + (d.physio_assessment || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Treatment Plan</label><textarea id="pp_' + v.visit_id + '">' + (d.physio_treatment_plan || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Sessions Completed</label><input type="number" id="ps_' + v.visit_id + '" value="' + (d.physio_sessions_completed || 0) + '" min="0"></div>';
            h += '<button class="btn btn-success">✅ Save & Return to Ward</button></form>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function savePhysio(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    var sessions = parseInt(document.getElementById('ps_' + vid).value) || 0;
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ physio_assessment: document.getElementById('pa_' + vid).value, physio_treatment_plan: document.getElementById('pp_' + vid).value, physio_sessions_completed: sessions }) });
    if (sessions > 0) {
        var d = await fetch(API + '/api/visits/' + vid).then(function(r) { return r.json(); });
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: vid, patient_id: d.patient_id, item_description: 'Physiotherapy - ' + sessions + ' sessions', department: 'physio', amount: sessions * 600 }) });
    }
    await completeAndTransfer(vid, 'ward', {}, 'Physiotherapy session completed');
}

// ==================== ISOLATION SCREEN ====================
async function isoScreeen() {
    var dp = await fetch(API + '/api/visits/department/isolation').then(function(r) { return r.json(); });
    var h = '';
    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card" style="border:2px solid var(--danger)"><div class="card-header">🔒 Isolation Ward (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients in isolation.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px;border:2px solid var(--danger)"><div class="card-body">';
            h += confirmBox('isolation', v.visit_id, d);
            h += '<strong style="color:var(--danger);font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Diagnosis: ' + (d.diagnosis || 'N/A') + '</p>';
            h += '<form onsubmit="saveIso(event,' + v.visit_id + ')"><div class="row"><div class="form-group"><label>Isolation Type *</label><select id="itype_' + v.visit_id + '" required><option value="">Select Type</option><option>Contact</option><option>Droplet</option><option>Airborne</option><option>Strict</option><option>Reverse/Protective</option></select></div>';
            h += '<div class="form-group"><label>Room Number</label><input type="text" id="iroom_' + v.visit_id + '" placeholder="e.g., ISO-01" value="' + (d.isolation_room_number || '') + '"></div></div>';
            h += '<div class="form-group"><label>Precautions *</label><textarea id="iprec_' + v.visit_id + '" required placeholder="PPE required, hand hygiene, visitor restrictions...">' + (d.isolation_precautions || '') + '</textarea></div>';
            h += '<button class="btn btn-danger">✅ Admit to Isolation</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'ward\')">📤 Transfer to Ward</button> <button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'consultation\')">📤 Send to Doctor</button></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveIso(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isolation_type: document.getElementById('itype_' + vid).value, isolation_precautions: document.getElementById('iprec_' + vid).value, isolation_room_number: document.getElementById('iroom_' + vid).value, status: 'isolated' }) });
    var d = await fetch(API + '/api/visits/' + vid).then(function(r) { return r.json(); });
    var isoFee = prompt('Enter isolation admission fee (KES):', '');
    if (isoFee && !isNaN(parseFloat(isoFee)) && parseFloat(isoFee) > 0) {
        await fetch(API + '/api/billing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit_id: vid, patient_id: d.patient_id, item_description: 'Isolation Ward Admission', department: 'isolation', amount: parseFloat(isoFee) }) });
    }
    toast('✅ Patient admitted to Isolation', 'success');
    loadDashboard();
}

// ==================== MEDICAL RECORDS SCREEN ====================
async function medScreen() {
    var dp = await fetch(API + '/api/visits/department/medrecords').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">📁 Medical Records Requests (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No record requests pending.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('medrecords', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>National ID: ' + (d.national_id || 'N/A') + ' | DOB: ' + (d.date_of_birth || 'N/A') + '</p>';
            h += '<form onsubmit="saveMed(event,' + v.visit_id + ')"><div class="form-group"><label>File Reference Number</label><input type="text" id="mfile_' + v.visit_id + '" placeholder="e.g., MR-2026-001" value="' + (d.medrecords_file_reference || '') + '"></div>';
            h += '<div class="form-group"><label>Notes</label><textarea id="mnotes_' + v.visit_id + '" placeholder="Historical records, archived files...">' + (d.medrecords_notes || '') + '</textarea></div>';
            h += '<button class="btn btn-purple">✅ Retrieve & Attach Records</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'consultation\')">📤 Return to Doctor</button></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function saveMed(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ medrecords_file_reference: document.getElementById('mfile_' + vid).value, medrecords_notes: document.getElementById('mnotes_' + vid).value }) });
    await completeAndTransfer(vid, 'consultation', {}, 'Medical records retrieved and attached');
}

// ==================== REFERRAL SCREEN ====================
async function refScreen() {
    var dp = await fetch(API + '/api/visits/department/referral').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">🏥 Patient Referrals (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No referrals pending.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('referral', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>Diagnosis: ' + (d.diagnosis || 'N/A') + '</p>';
            h += '<form onsubmit="doRef(event,' + v.visit_id + ')"><div class="form-group"><label>Referring Hospital Name *</label><input type="text" id="rhosp_' + v.visit_id + '" required placeholder="Enter hospital name..."></div>';
            h += '<div class="form-group"><label>Hospital Level</label><select id="rlevel_' + v.visit_id + '"><option>Higher Level Hospital</option><option>Same Level Hospital</option><option>Lower Level Hospital</option></select></div>';
            h += '<div class="form-group"><label>Referral Reason *</label><textarea id="rreason_' + v.visit_id + '" required placeholder="Reason for referral..."></textarea></div>';
            h += '<button class="btn btn-purple">✅ Complete Referral</button></form>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function doRef(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referral_hospital_name: document.getElementById('rhosp_' + vid).value, referral_hospital_level: document.getElementById('rlevel_' + vid).value, referral_reason: document.getElementById('rreason_' + vid).value, referral_completed: 1, status: 'referred_out' }) });
    await completeAndTransfer(vid, 'referred_out', {}, 'Patient referred to ' + document.getElementById('rhosp_' + vid).value);
}

// ==================== SHA SCREEN ====================
async function shaScreen() {
    var dp = await fetch(API + '/api/visits/department/sha').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">📋 SHA Processing (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No SHA cases pending.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px"><div class="card-body">';
            h += confirmBox('sha', v.visit_id, d);
            h += '<strong>' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p>National ID: ' + (d.national_id || 'N/A') + '</p>';
            h += '<form onsubmit="doSha(event,' + v.visit_id + ')"><div class="row"><div class="form-group"><label>Scheme Name *</label><input type="text" id="scheme_' + v.visit_id + '" required placeholder="e.g., NHIF..."></div>';
            h += '<div class="form-group"><label>Member Number</label><input type="text" id="smember_' + v.visit_id + '" placeholder="Membership number..."></div>';
            h += '<div class="form-group"><label>Authorization Code</label><input type="text" id="sauth_' + v.visit_id + '" placeholder="Auth code..."></div>';
            h += '<div class="form-group"><label>Status</label><select id="sstatus_' + v.visit_id + '"><option>Approved</option><option>Pending</option><option>Rejected</option></select></div></div>';
            h += '<div class="form-group"><label>Notes</label><textarea id="shanotes_' + v.visit_id + '" placeholder="Additional notes...">' + (d.sha_notes || '') + '</textarea></div>';
            h += '<button class="btn btn-purple">✅ Save SHA Details</button></form>';
            h += '<div class="transfer-options" style="margin-top:8px"><button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'cashier\')">📤 Send to Cashier</button></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function doSha(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sha_scheme_name: document.getElementById('scheme_' + vid).value, sha_member_number: document.getElementById('smember_' + vid).value, sha_authorization_code: document.getElementById('sauth_' + vid).value, sha_status: document.getElementById('sstatus_' + vid).value, sha_notes: document.getElementById('shanotes_' + vid).value, sha_completed: 1 }) });
    await completeAndTransfer(vid, 'cashier', {}, 'SHA processing completed');
}

// ==================== MORGUE SCREEN - WITH BILLING & TIMESTAMPS ====================
async function morgScreen() {
    var dp = await fetch(API + '/api/visits/department/morgue').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card"><div class="card-header">⚰️ Morgue Records (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No patients in morgue.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            
            h += '<div class="card" style="margin-bottom:10px;border-left:4px solid var(--danger)"><div class="card-body">';
            h += confirmBox('morgue', v.visit_id, d);
            h += '<strong style="color:var(--danger);font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> | ' + v.visit_number;
            h += '<p><strong>DOB:</strong> ' + (d.date_of_birth || 'N/A') + ' | <strong>Gender:</strong> ' + (d.gender || 'N/A') + ' | <strong>ID:</strong> ' + (d.national_id || 'N/A') + '</p>';
            
            // Show existing death info
            if (d.morgue_cause_of_death) h += '<p><strong>Cause of Death:</strong> ' + d.morgue_cause_of_death + '</p>';
            if (d.morgue_notes) h += '<div class="alert alert-info"><strong>Medical Summary:</strong> ' + d.morgue_notes + '</div>';
            if (d.diagnosis) h += '<p><strong>Diagnosis:</strong> ' + d.diagnosis + '</p>';
            if (d.treatment_plan) h += '<p><strong>Treatment Given:</strong> ' + d.treatment_plan + '</p>';
            
            // Timestamps
            h += '<div style="background:#f8f9fa;padding:8px;border-radius:5px;margin:8px 0">';
            h += '<p><strong>⏰ Entry Time:</strong> ' + (d.updated_at || 'Not recorded') + '</p>';
            if (d.morgue_completed) {
                h += '<p><strong>✅ Cleared Time:</strong> ' + (d.morgue_completed_at || 'Not recorded') + '</p>';
                if (d.morgue_body_released_to) h += '<p><strong>📋 Released To:</strong> ' + d.morgue_body_released_to + '</p>';
            }
            h += '</div>';
            
            // Morgue form
            if (!d.morgue_completed) {
                h += '<form onsubmit="saveMorgueRecord(event,' + v.visit_id + ')">';
                h += '<div class="form-group"><label>Cause of Death *</label><textarea id="mcause_' + v.visit_id + '" required placeholder="Enter cause of death...">' + (d.morgue_cause_of_death || '') + '</textarea></div>';
                h += '<div class="form-group"><label>Medical Summary</label><textarea id="mnotes_' + v.visit_id + '" placeholder="Summary of medical condition...">' + (d.morgue_notes || '') + '</textarea></div>';
                h += '<div class="form-group"><label>Body Released To</label><input type="text" id="mrel_' + v.visit_id + '" placeholder="Family member / Funeral home..." value="' + (d.morgue_body_released_to || '') + '"></div>';
                h += '<div class="form-group"><label>Time of Release</label><input type="datetime-local" id="mtime_' + v.visit_id + '" value="' + new Date().toISOString().slice(0,16) + '"></div>';
                h += '<button type="submit" class="btn btn-danger">⚰️ Finalize Morgue Record</button></form>';
            } else {
                h += '<div class="alert alert-success">✅ Morgue record finalized</div>';
            }
            
            // Billing section
            h += '<div style="margin-top:8px"><button class="btn btn-info btn-small" onclick="addBillForPatient(' + v.visit_id + ',' + v.patient_id + ')">💰 Add Morgue Bill</button> ';
            h += '<button class="btn btn-info btn-small" onclick="viewPatientFull(' + v.visit_id + ')">📋 Full History</button></div>';
            
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}

async function saveMorgueRecord(e, vid) {
    e.preventDefault();
    var cb = document.getElementById('confirm_' + vid);
    if (cb && !cb.checked) { toast('⚠️ Confirm patient identity!', 'error'); return; }
    if (!confirm('⚠️ Finalize this morgue record? This action is IRREVERSIBLE.')) return;
    
    var releaseTime = document.getElementById('mtime_' + vid).value;
    var currentTime = new Date().toISOString();
    
    await fetch(API + '/api/visits/' + vid, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            morgue_cause_of_death: document.getElementById('mcause_' + vid).value, 
            morgue_body_released_to: document.getElementById('mrel_' + vid).value, 
            morgue_notes: document.getElementById('mnotes_' + vid).value, 
            morgue_completed: 1, 
            morgue_completed_at: releaseTime || currentTime,
            status: 'deceased_cleared' 
        }) 
    });
    
    toast('⚰️ Morgue record finalized. Body released to: ' + (document.getElementById('mrel_' + vid).value || 'N/A'), 'info');
    loadDashboard();
}

// ==================== STORE SCREEN ====================
async function storeScreen() {
    var inv = await fetch(API + '/api/inventory').then(function(r) { return r.json(); });
    var low = await fetch(API + '/api/inventory/low-stock').then(function(r) { return r.json(); });
    
    var h = '';
    
    // Department Panel button
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">📦 ' + (currentUser.department_name || 'STORE') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    h += '<div class="card"><div class="card-header">⚠️ Low Stock Alerts (' + low.length + ')</div><div class="card-body">';
    if (!low.length) { h += '<p style="color:var(--success)">✅ All items are well stocked.</p>'; }
    else {
        h += '<table><tr><th>Item</th><th>Current Stock</th><th>Minimum Required</th><th>Department</th></tr>';
        for (var i = 0; i < low.length; i++) {
            h += '<tr class="low-stock"><td><strong>' + low[i].item_name + '</strong></td><td style="color:var(--danger);font-weight:bold">' + low[i].current_stock + '</td><td>' + low[i].minimum_stock + '</td><td>' + (low[i].department || 'N/A') + '</td></tr>';
        }
        h += '</table>';
    }
    h += '</div></div>';
    
    h += '<div class="card"><div class="card-header">📦 Add New Item to Inventory</div><div class="card-body"><form id="addItemForm"><div class="row">';
    h += '<div class="form-group"><label>Item Name *</label><input type="text" id="siname" required></div>';
    h += '<div class="form-group"><label>Category</label><select id="sicat"><option>Medicine</option><option>Supplies</option><option>Equipment</option><option>Food</option><option>Cleaning</option></select></div>';
    h += '<div class="form-group"><label>Department</label><select id="sidept"><option>pharmacy</option><option>ward</option><option>laboratory</option><option>radiology</option><option>isolation</option><option>general</option></select></div>';
    h += '<div class="form-group"><label>Quantity</label><input type="number" id="siqty" value="0"></div>';
    h += '<div class="form-group"><label>Minimum Stock Level</label><input type="number" id="simin" value="10"></div>';
    h += '<div class="form-group"><label>Unit</label><input type="text" id="siunit" placeholder="tablets, bottles, pairs..."></div>';
    h += '<div class="form-group"><label>Unit Price (KES)</label><input type="number" id="siprice" value="0"></div>';
    h += '</div><button class="btn btn-success btn-block">➕ Add to Inventory</button></form></div></div>';
    
    h += '<div class="card"><div class="card-header">📋 Full Inventory (' + inv.length + ' items)</div><div class="card-body patient-list"><table><tr><th>Item</th><th>Stock</th><th>Min</th><th>Price</th><th>Dept</th></tr>';
    for (var j = 0; j < inv.length; j++) {
        var item = inv[j];
        h += '<tr class="' + (item.current_stock <= item.minimum_stock ? 'low-stock' : '') + '"><td><strong>' + item.item_name + '</strong></td><td>' + item.current_stock + ' ' + (item.unit || '') + '</td><td>' + item.minimum_stock + '</td><td>KES ' + parseFloat(item.unit_price || 0).toLocaleString() + '</td><td>' + (item.department || '') + '</td></tr>';
    }
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
    for (var i = 0; i < queues.length; i++) {
        h += '<div class="queue-item"><span style="text-transform:capitalize">' + queues[i].current_department + '</span><span class="queue-count">' + queues[i].waiting + ' waiting</span></div>';
    }
    if (queues.length === 0) h += '<p style="color:#888">No patients in queue.</p>';
    h += '</div>';
    h += '<div class="manager-card"><h4>🛏️ Bed Status</h4><div class="stats-grid" style="grid-template-columns:1fr 1fr"><div class="stat-card success"><div class="number">' + (stats.occupiedBeds || 0) + '</div><div class="label">Occupied</div></div><div class="stat-card"><div class="number">' + ((stats.totalBeds || 5) - (stats.occupiedBeds || 0)) + '</div><div class="label">Available</div></div></div></div>';
    h += '<div class="manager-card"><h4>💰 Financial Summary</h4><div class="stats-grid" style="grid-template-columns:1fr 1fr"><div class="stat-card warning"><div class="number">KES ' + (stats.pendingBills || 0).toLocaleString() + '</div><div class="label">Pending Bills</div></div><div class="stat-card success"><div class="number">' + stats.todayVisits + '</div><div class="label">Today\'s Visits</div></div></div></div>';
    h += '<div class="manager-card"><h4>📦 Inventory Alerts</h4><p>Low Stock Items: <strong style="color:var(--warning)">' + (stats.lowStockItems || 0) + '</strong></p></div>';
    h += '<div class="manager-card" style="grid-column:1/-1"><h4>📈 Revenue (Last 30 Days)</h4><div style="max-height:300px;overflow-y:auto"><table><tr><th>Date</th><th>Revenue</th><th>Transactions</th><th>Method</th></tr>';
    for (var j = 0; j < revenue.length; j++) {
        var r = revenue[j];
        h += '<tr><td>' + (r.date || 'N/A') + '</td><td><strong>KES ' + parseFloat(r.total || 0).toLocaleString() + '</strong></td><td>' + (r.transactions || 0) + '</td><td>' + (r.payment_method || 'N/A') + '</td></tr>';
    }
    h += '</table></div></div>';
    h += '</div>';
    return h;
}

// ==================== ADMIN SCREEN - FOLDABLE SECTIONS (BUTTONS ALIGNED RIGHT) ====================
async function adminScreen() {
    var active = await fetch(API + '/api/visits/active').then(function(r) { return r.json(); });
    var users = await fetch(API + '/api/users').then(function(r) { return r.json(); });
    var beds = await fetch(API + '/api/beds').then(function(r) { return r.json(); });
    var stats = await fetch(API + '/api/dashboard').then(function(r) { return r.json(); });
    
    var h = '';
    
    // Department Panel button
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🏥 ADMINISTRATION</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    // Quick Stats
    h += '<div class="stats-grid">';
    h += '<div class="stat-card"><div class="number">' + (stats.totalPatients || 0) + '</div><div class="label">Total Patients</div></div>';
    h += '<div class="stat-card"><div class="number">' + (stats.activeVisits || 0) + '</div><div class="label">Active Visits</div></div>';
    h += '<div class="stat-card"><div class="number">' + (stats.occupiedBeds || 0) + '/' + (stats.totalBeds || 0) + '</div><div class="label">Beds Occupied</div></div>';
    h += '<div class="stat-card warning"><div class="number">KES ' + (stats.pendingBills || 0).toLocaleString() + '</div><div class="label">Pending Bills</div></div>';
    h += '</div>';
    
    // ====== SECTION 1: BACKUP & RESTORE ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'adminBackup\')">';
    h += '💾 Backup & Restore <span id="adminBackup_icon" style="float:right">▼</span>';
    h += '</div>';
    h += '<div id="adminBackup" class="card-body">';
    h += '<button class="btn btn-success" onclick="window.open(API + \'/api/export/csv\')">📥 Export Patients (CSV)</button> ';
    h += '<button class="btn btn-info" onclick="window.open(API + \'/api/backup/download\')">🗄️ Download Full Database</button>';
    h += '<p style="font-size:11px;color:var(--text-muted);margin-top:8px">💡 Database file location: hospital.db in project folder</p>';
    h += '</div></div>';
    
    // ====== SECTION 2: USER ACCOUNTS ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="toggleAdminSection(\'adminUsers\')">';
    h += '<span>👥 User Accounts (' + users.length + ') <span id="adminUsers_icon">▼</span></span>';
    h += '<button class="btn btn-success btn-small" onclick="event.stopPropagation();showAddUserForm()">➕ Add User</button>';
    h += '</div>';
    h += '<div id="adminUsers" class="card-body patient-list" style="display:none">';
    h += '<table><tr><th>User</th><th>Role</th><th>Department</th><th>Last Login</th><th>Status</th><th>Actions</th></tr>';
    for (var i = 0; i < users.length; i++) {
        var u = users[i];
        h += '<tr>';
        h += '<td><strong>' + u.full_name + '</strong><br><small>' + u.username + '</small></td>';
        h += '<td><span style="text-transform:capitalize">' + u.role + '</span></td>';
        h += '<td>' + (u.department_name || 'N/A') + '</td>';
        h += '<td><small>' + (u.last_login || 'Never') + '</small></td>';
        h += '<td>' + (u.is_active ? '<span class="badge badge-success">Active</span>' : '<span class="badge badge-danger">Inactive</span>') + '</td>';
        h += '<td>';
        h += '<button class="btn btn-info btn-small" onclick="editUserSafe(' + u.user_id + ')">✏️ Edit</button> ';
        h += '<button class="btn btn-danger btn-small" onclick="deleteUser(' + u.user_id + ',\'' + u.username + '\')">🗑️</button>';
        h += '</td></tr>';
    }
    h += '</table></div></div>';
    
    // ====== SECTION 3: BED MANAGEMENT ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center" onclick="toggleAdminSection(\'adminBeds\')">';
    h += '<span>🛏️ Bed Management (' + beds.length + ' beds) <span id="adminBeds_icon">▼</span></span>';
    h += '<button class="btn btn-success btn-small" onclick="event.stopPropagation();showAddBedForm()">➕ Add Bed</button>';
    h += '</div>';
    h += '<div id="adminBeds" class="card-body patient-list" style="display:none">';
    h += '<table><tr><th>Bed ID</th><th>Bed Number</th><th>Type</th><th>Department</th><th>Status</th><th>Patient</th><th>Actions</th></tr>';
    for (var j = 0; j < beds.length; j++) {
        var b = beds[j];
        var statusBadge = b.is_occupied ? '<span class="badge badge-warning">Occupied</span>' : '<span class="badge badge-success">Available</span>';
        if (b.status === 'maintenance') statusBadge = '<span class="badge badge-danger">Maintenance</span>';
        
        h += '<tr>';
        h += '<td>' + b.bed_id + '</td>';
        h += '<td><strong>' + b.bed_number + '</strong></td>';
        h += '<td>' + (b.ward_type || 'General') + '</td>';
        h += '<td>' + (b.department || 'ward') + '</td>';
        h += '<td>' + statusBadge + '</td>';
        h += '<td>' + (b.current_visit_id || 'None') + '</td>';
        h += '<td>';
        if (b.is_occupied) {
            h += '<button class="btn btn-warning btn-small" onclick="freeBed(' + b.bed_id + ')">🆓 Free Bed</button> ';
        }
        h += '<button class="btn btn-danger btn-small" onclick="removeBed(' + b.bed_id + ',\'' + b.bed_number + '\')">🗑️</button>';
        h += '</td></tr>';
    }
    h += '</table></div></div>';
    
    // ====== SECTION 4: ALL ACTIVE PATIENTS ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'adminPatients\')">';
    h += '👥 All Active Patients (' + active.length + ') <span id="adminPatients_icon" style="float:right">▼</span>';
    h += '</div>';
    h += '<div id="adminPatients" class="card-body patient-list" style="display:none">';
    h += pTable(active);
    h += '</div></div>';
    
    // ====== SECTION 5: FINANCIAL OVERVIEW (Cashier Records) ======
    h += '<div class="card">';
    h += '<div class="card-header" style="cursor:pointer" onclick="toggleAdminSection(\'adminFinance\')">';
    h += '💰 Financial Overview (Cashier Records) <span id="adminFinance_icon" style="float:right">▼</span>';
    h += '</div>';
    h += '<div id="adminFinance" class="card-body" style="display:none">';
    h += '<div id="adminFinanceContent"><p style="text-align:center;color:var(--text-muted)">Loading financial data...</p></div>';
    h += '</div></div>';
    
    // Load finance data after rendering
    setTimeout(function() { loadAdminFinance(); }, 300);
    
    return h;
}

// ============ LOAD ADMIN FINANCIAL OVERVIEW ============
async function loadAdminFinance() {
    try {
        var res = await fetch(API + '/api/billing/all');
        var data = await res.json();
        var revenue = await fetch(API + '/api/manager/revenue').then(function(r) { return r.json(); });
        
        var html = '';
        
        // Revenue Summary
        html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:15px">';
        html += '<div style="background:#e8f5e9;padding:12px;border-radius:6px;text-align:center">';
        html += '<div style="font-size:24px;font-weight:bold;color:var(--success)">KES ' + (data.grand_paid || 0).toLocaleString() + '</div>';
        html += '<div style="font-size:11px;color:var(--text-muted)">Total Collected</div></div>';
        
        html += '<div style="background:#fff3e0;padding:12px;border-radius:6px;text-align:center">';
        html += '<div style="font-size:24px;font-weight:bold;color:var(--warning)">KES ' + (data.grand_balance || 0).toLocaleString() + '</div>';
        html += '<div style="font-size:11px;color:var(--text-muted)">Outstanding</div></div>';
        
        html += '<div style="background:#e3f2fd;padding:12px;border-radius:6px;text-align:center">';
        html += '<div style="font-size:24px;font-weight:bold;color:var(--primary)">KES ' + (data.grand_total || 0).toLocaleString() + '</div>';
        html += '<div style="font-size:11px;color:var(--text-muted)">Total Expected</div></div>';
        html += '</div>';
        
        // Payment Method Breakdown
        html += '<h4 style="margin-bottom:8px">💳 Revenue by Payment Method</h4>';
        html += '<table><tr><th>Method</th><th>Amount Collected</th><th>% of Total</th></tr>';
        
        var methodTotals = {};
        var allBills = [];
        for (var i = 0; i < (data.patients || []).length; i++) {
            var pt = data.patients[i];
            for (var j = 0; j < pt.bills.length; j++) {
                if (pt.bills[j].is_paid) {
                    allBills.push(pt.bills[j]);
                    var method = pt.bills[j].payment_method || 'Cash';
                    methodTotals[method] = (methodTotals[method] || 0) + parseFloat(pt.bills[j].amount || 0);
                }
            }
        }
        
        var grandPaid = data.grand_paid || 1;
        var methods = Object.keys(methodTotals);
        for (var k = 0; k < methods.length; k++) {
            var m = methods[k];
            var amt = methodTotals[m];
            var pct = ((amt / grandPaid) * 100).toFixed(1);
            html += '<tr><td><strong>' + m + '</strong></td><td>KES ' + amt.toLocaleString() + '</td><td>' + pct + '%</td></tr>';
        }
        if (methods.length === 0) {
            html += '<tr><td colspan="3" style="color:var(--text-muted)">No payments recorded yet</td></tr>';
        }
        html += '</table>';
        
        // Revenue by Department
        html += '<h4 style="margin:15px 0 8px">🏥 Revenue by Department</h4>';
        html += '<table><tr><th>Department</th><th>Amount Billed</th><th>Amount Collected</th></tr>';
        
        var deptTotals = {};
        var deptPaid = {};
        for (var d = 0; d < allBills.length; d++) {
            var dept = allBills[d].department || 'unknown';
            deptTotals[dept] = (deptTotals[dept] || 0) + parseFloat(allBills[d].amount || 0);
        }
        // Also count unpaid bills by department
        for (var p = 0; p < (data.patients || []).length; p++) {
            var pt2 = data.patients[p];
            for (var q = 0; q < pt2.bills.length; q++) {
                var bill = pt2.bills[q];
                var dpt = bill.department || 'unknown';
                if (!bill.is_paid) {
                    deptTotals[dpt] = (deptTotals[dpt] || 0) + parseFloat(bill.amount || 0);
                }
            }
        }
        
        var deptNames = Object.keys(deptTotals).sort();
        for (var n = 0; n < deptNames.length; n++) {
            var dn = deptNames[n];
            var totalBilled = deptTotals[dn] || 0;
            var paidAmt = deptPaid[dn] || 0;
            html += '<tr><td style="text-transform:capitalize">' + dn + '</td><td>KES ' + totalBilled.toLocaleString() + '</td><td>KES ' + paidAmt.toLocaleString() + '</td></tr>';
        }
        html += '</table>';
        
        // Daily Revenue (Last 7 days)
        html += '<h4 style="margin:15px 0 8px">📈 Daily Collection (Last 7 Days)</h4>';
        html += '<table><tr><th>Date</th><th>Transactions</th><th>Amount</th></tr>';
        var shown = 0;
        for (var r = 0; r < revenue.length && shown < 7; r++) {
            html += '<tr><td>' + (revenue[r].date || 'N/A') + '</td><td>' + (revenue[r].transactions || 0) + '</td><td><strong>KES ' + parseFloat(revenue[r].total || 0).toLocaleString() + '</strong></td></tr>';
            shown++;
        }
        if (shown === 0) {
            html += '<tr><td colspan="3" style="color:var(--text-muted)">No transactions yet</td></tr>';
        }
        html += '</table>';
        
        document.getElementById('adminFinanceContent').innerHTML = html;
    } catch (err) {
        document.getElementById('adminFinanceContent').innerHTML = '<p style="color:red">Error loading financial data</p>';
    }
}

// ==================== EMERGENCY SCREEN ====================
async function emergScreen() {
    var dp = await fetch(API + '/api/visits/department/emergency').then(function(r) { return r.json(); });
    var h = '';

    // Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';
    
    // Department Panel button
    h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
    h += '<span style="font-weight:600;color:var(--primary)">🚨 ' + (currentUser.department_name || 'EMERGENCY') + '</span>';
    h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
    h += '</div>';
    
    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card" style="border:2px solid var(--danger)"><div class="card-header" style="background:#ffeaea">🚨 Accident & Emergency (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No emergency patients.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            h += '<div class="card" style="margin-bottom:10px;border-left:4px solid var(--danger)"><div class="card-body">';
            h += confirmBox('emergency', v.visit_id, d);
            h += '<strong style="color:var(--danger);font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> <span class="badge badge-danger">EMERGENCY</span> | ' + v.visit_number;
            if (d.allergies) h += '<p style="color:red;font-weight:600">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<div class="vitals-display"><strong>Vitals:</strong> BP ' + (d.triage_vitals_bp || '?') + ' | HR ' + (d.triage_vitals_hr || '?') + ' | Temp ' + (d.triage_vitals_temp || '?') + '°C | SpO2 ' + (d.triage_vitals_spo2 || '?') + '%</div>';
            h += '<form onsubmit="saveEmerg(event,' + v.visit_id + ')"><div class="form-group"><label>Assessment</label><textarea id="ea_' + v.visit_id + '" rows="2">' + (d.consultation_notes || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Action Taken</label><textarea id="et_' + v.visit_id + '" rows="2">' + (d.treatment_plan || '') + '</textarea></div>';
            h += '<button class="btn btn-danger btn-small">💾 Save Assessment</button></form>';
            h += '<div class="transfer-panel" style="margin-top:8px"><strong>Route Patient To:</strong><div class="transfer-options">';
            var ed = relevantDepts['emergency'] || [];
            for (var j = 0; j < ed.length; j++) {
                h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + ed[j] + '\',\'Sent from Emergency\')">📤 ' + ed[j] + '</button> ';
            }
            h += '<button class="btn btn-danger btn-small" onclick="declareDeath(' + v.visit_id + ')">⚰️ Declare Death</button> ';
            h += '</div></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}

async function saveEmerg(e, vid) {
    e.preventDefault();
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consultation_notes: document.getElementById('ea_' + vid).value, treatment_plan: document.getElementById('et_' + vid).value }) });
    toast('✅ Assessment saved', 'success');
}

// ==================== PEDIATRICS SCREEN ====================
async function pedScreen() {
    var dp = await fetch(API + '/api/visits/department/pediatrics').then(function(r) { return r.json(); });
    var h = '';

// Add this inside EVERY department screen (regScreen, triageScreen, consultScreen, etc.)
// Right after: var h = '';
h += '<div style="display:flex;gap:8px;margin-bottom:10px;align-items:center">';
h += '<span style="font-weight:600;color:var(--primary)">🏥 ' + (currentUser.department_name || currentUser.role.toUpperCase()) + '</span>';
h += '<button class="btn btn-purple btn-small" onclick="showDepartmentPanel()">📊 Dept Panel</button>';
h += '</div>';

    h += '<div class="card"><div class="card-header">🔍 Search Patient by National ID</div><div class="card-body"><div class="search-box"><input type="text" id="nidSearch" placeholder="Enter National ID..." onkeyup="if(event.key===\'Enter\')searchByNationalID()"><button class="btn btn-info" onclick="searchByNationalID()">Search</button></div><div id="nidResults"></div></div></div>';
    h += '<div class="card" style="border:2px solid #e91e63"><div class="card-header" style="background:#fce4ec">🧒 Pediatrics Department (' + dp.length + ')</div><div class="card-body patient-list">';
    if (!dp.length) { h += '<p style="color:#888">No pediatric patients.</p>'; }
    else {
        for (var i = 0; i < dp.length; i++) {
            var v = dp[i];
            var d = await fetch(API + '/api/visits/' + v.visit_id).then(function(r) { return r.json(); });
            var age = d.date_of_birth ? Math.floor((new Date() - new Date(d.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : '?';
            h += '<div class="card" style="margin-bottom:10px;border-left:4px solid #e91e63"><div class="card-body">';
            h += confirmBox('pediatrics', v.visit_id, d);
            h += '<strong style="color:#e91e63;font-size:15px">' + d.first_name + ' ' + d.last_name + '</strong> <span class="badge badge-purple">Age: ' + age + ' years</span> | ' + v.visit_number;
            if (d.allergies) h += '<p style="color:red;font-weight:600">⚠️ Allergies: ' + d.allergies + '</p>';
            h += '<div class="vitals-display"><strong>Vitals:</strong> BP ' + (d.triage_vitals_bp || '?') + ' | HR ' + (d.triage_vitals_hr || '?') + ' | Temp ' + (d.triage_vitals_temp || '?') + '°C | SpO2 ' + (d.triage_vitals_spo2 || '?') + '% | Wt ' + (d.triage_vitals_weight || '?') + 'kg</div>';
            h += '<form onsubmit="savePed(event,' + v.visit_id + ')"><div class="form-group"><label>Diagnosis</label><textarea id="pdiag_' + v.visit_id + '" rows="2">' + (d.diagnosis || '') + '</textarea></div>';
            h += '<div class="form-group"><label>Treatment Plan</label><textarea id="ptreat_' + v.visit_id + '" rows="2">' + (d.treatment_plan || '') + '</textarea></div>';
            h += '<button class="btn btn-purple btn-small">💾 Save</button></form>';
            h += '<div class="transfer-panel" style="margin-top:8px"><strong>Route Patient To:</strong><div class="transfer-options">';
            var pd = relevantDepts['pediatrics'] || [];
            for (var j = 0; j < pd.length; j++) {
                h += '<button class="btn btn-info btn-small" onclick="transferPatient(' + v.visit_id + ',\'' + pd[j] + '\',\'Sent from Pediatrics\')">📤 ' + pd[j] + '</button> ';
            }
            h += '</div></div>';
            h += '</div></div>';
        }
    }
    return h + '</div></div>';
}
async function savePed(e, vid) {
    e.preventDefault();
    await fetch(API + '/api/visits/' + vid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagnosis: document.getElementById('pdiag_' + vid).value, treatment_plan: document.getElementById('ptreat_' + vid).value }) });
    toast('✅ Saved', 'success');
}

// ============ DEPARTMENT HEAD PANEL ============
async function showDepartmentPanel() {
    var dept = currentUser.role;
    var deptName = currentUser.department_name || dept;
    
    document.getElementById('modalTitle').textContent = '📊 Department Management: ' + deptName;
    
    var body = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    
    // Staff section
    body += '<div style="background:#e8f5e9;padding:12px;border-radius:8px">';
    body += '<h4 style="margin-bottom:8px">👥 Department Staff</h4>';
    
    try {
        var staffRes = await fetch(API + '/api/department/' + dept + '/staff');
        var staffData = await staffRes.json();
        var staff = staffData.staff || [];
        
        if (staff.length === 0) {
            body += '<p style="color:#888;font-size:12px">No staff members found.</p>';
        } else {
            body += '<table style="font-size:11px"><tr><th>Name</th><th>Role</th><th>Status</th></tr>';
            for (var i = 0; i < staff.length; i++) {
                var s = staff[i];
                body += '<tr><td><strong>' + s.full_name + '</strong></td><td>' + s.role + '</td>';
                body += '<td>' + (s.is_active ? '✅ Active' : '❌ Inactive') + '</td></tr>';
            }
            body += '</table>';
        }
    } catch (e) {
        body += '<p style="color:red">Error loading staff</p>';
    }
    
    body += '<p style="font-size:10px;color:var(--text-muted);margin-top:8px">💡 To add/remove staff, contact Admin.</p>';
    body += '</div>';
    
    // Statistics section
    body += '<div style="background:#e3f2fd;padding:12px;border-radius:8px">';
    body += '<h4 style="margin-bottom:8px">📈 Today\'s Statistics</h4>';
    
    try {
        var statsRes = await fetch(API + '/api/department/' + dept + '/daily-stats');
        var stats = await statsRes.json();
        
        body += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px">';
        body += '<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--primary)">' + (stats.currentlyWaiting || 0) + '</div><div>Waiting Now</div></div>';
        body += '<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--success)">' + (stats.todayServed || 0) + '</div><div>Served Today</div></div>';
        body += '<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--info)">' + (stats.todayCompleted || 0) + '</div><div>Completed Today</div></div>';
        body += '<div style="background:#fff;padding:8px;border-radius:4px;text-align:center"><div style="font-size:20px;font-weight:bold;color:var(--purple)">' + (stats.weekTotal || 0) + '</div><div>This Week</div></div>';
        body += '</div>';
        
        body += '<p style="font-size:10px;color:var(--text-muted);margin-top:6px">Month Total: <strong>' + (stats.monthTotal || 0) + '</strong> patients</p>';
    } catch (e) {
        body += '<p style="color:red">Error loading statistics</p>';
    }
    
    body += '</div></div>';
    
    // Actions
    body += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">';
    body += '<button class="btn btn-warning" onclick="clearDepartmentDay(\'' + dept + '\')">🧹 Clear Completed Patients</button>';
    body += '<button class="btn btn-info" onclick="viewDepartmentHistory(\'' + dept + '\')">📋 View Department History</button>';
    body += '<button class="btn btn-purple" onclick="closeModal()">Close</button>';
    body += '</div>';
    
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('patientModal').style.display = 'block';
}

async function clearDepartmentDay(dept) {
    if (!confirm('Clear all completed patients from the ' + dept + ' queue? This helps keep the department organized.')) return;
    
    try {
        var res = await fetch(API + '/api/department/' + dept + '/clear-day', { method: 'POST' });
        var data = await res.json();
        if (data.success) {
            toast('✅ Department cleaned up by ' + data.clearedBy, 'success');
            closeModal();
            loadDashboard();
        }
    } catch (err) {
        toast('Error clearing department', 'error');
    }
}

async function viewDepartmentHistory(dept) {
    try {
        var staffRes = await fetch(API + '/api/department/' + dept + '/staff');
        var staffData = await staffRes.json();
        var statsRes = await fetch(API + '/api/department/' + dept + '/daily-stats');
        var stats = await statsRes.json();
        
        var body = '<h4>📋 ' + dept.toUpperCase() + ' Department Summary</h4>';
        body += '<table style="width:100%">';
        body += '<tr><td><strong>Staff Count:</strong></td><td>' + (staffData.count || 0) + '</td></tr>';
        body += '<tr><td><strong>Patients Waiting:</strong></td><td>' + (stats.currentlyWaiting || 0) + '</td></tr>';
        body += '<tr><td><strong>Served Today:</strong></td><td>' + (stats.todayServed || 0) + '</td></tr>';
        body += '<tr><td><strong>Completed Today:</strong></td><td>' + (stats.todayCompleted || 0) + '</td></tr>';
        body += '<tr><td><strong>Week Total:</strong></td><td>' + (stats.weekTotal || 0) + '</td></tr>';
        body += '<tr><td><strong>Month Total:</strong></td><td>' + (stats.monthTotal || 0) + '</td></tr>';
        body += '</table>';
        
        document.getElementById('modalTitle').textContent = '📊 ' + dept + ' History';
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('patientModal').style.display = 'block';
    } catch (err) {
        toast('Error loading department history', 'error');
    }
}

// ==================== EVENT ATTACHMENT ====================
function attachEvents() {
    var rf = document.getElementById('regForm');
    if (rf) {
        rf.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (window.regLock) return;
            window.regLock = true;
            var fn = document.getElementById('rfname').value.trim();
            var ln = document.getElementById('rlname').value.trim();
            var nid = document.getElementById('rnid').value.trim();
            if (!fn || !ln) { toast('⚠️ Name required', 'error'); window.regLock = false; return; }
            if (!nid) { toast('⚠️ National ID required', 'error'); window.regLock = false; return; }
            var btn = e.target.querySelector('button[type="submit"]');
            btn.textContent = '⏳ Please wait...';
            btn.disabled = true;
            try {
                var res = await fetch(API + '/api/register-and-visit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first_name: fn, last_name: ln,
                        date_of_birth: document.getElementById('rdob').value || null,
                        gender: document.getElementById('rgen').value,
                        phone: document.getElementById('rphone').value,
                        address: document.getElementById('raddr').value,
                        national_id: nid,
                        emergency_contact: document.getElementById('remc').value,
                        emergency_phone: document.getElementById('remp').value,
                        blood_group: document.getElementById('rbg').value,
                        allergies: document.getElementById('rall').value,
                        chronic_conditions: document.getElementById('rchronic').value,
                        registration_fee_paid: document.getElementById('rfeePaid').checked,
                        registration_fee_amount: document.getElementById('rfeePaid').checked ? (parseFloat(document.getElementById('rfeeAmount').value) || 200) : 0
                    })
                });
                var data = await res.json();
                if (data.success && !data.already_active) {
                    toast('✅ Visit Created: ' + data.visit.visit_number + ' | Use 📤 Send to Triage', 'success');
                    localStorage.removeItem('regFormData');
                    e.target.reset();
                    document.getElementById('rfeeAmount').disabled = true;
                    document.getElementById('rfeeAmount').value = '200';
                    document.getElementById('rfeePaid').checked = false;
                    loadDashboard();
                } else if (data.already_active) {
                    toast('ℹ️ Active visit already exists: ' + data.visit.visit_number + '. Use 📤 Send.', 'info');
                    e.target.reset();
                    loadDashboard();
                } else {
                    toast('❌ ' + (data.error || data.message || 'Registration failed'), 'error');
                }
            } catch (err) {
                toast('❌ Connection error. Check server.', 'error');
            }
            btn.textContent = '✅ Register & Create Visit';
            btn.disabled = false;
            window.regLock = false;
        });
    }
    var af = document.getElementById('addItemForm');
    if (af) {
        af.addEventListener('submit', async function(e) {
            e.preventDefault();
            await fetch(API + '/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_name: document.getElementById('siname').value,
                    category: document.getElementById('sicat') ? document.getElementById('sicat').value : 'General',
                    department: document.getElementById('sidept') ? document.getElementById('sidept').value : 'general',
                    current_stock: parseInt(document.getElementById('siqty').value) || 0,
                    minimum_stock: parseInt(document.getElementById('simin').value) || 10,
                    unit: document.getElementById('siunit') ? document.getElementById('siunit').value : '',
                    unit_price: parseFloat(document.getElementById('siprice').value) || 0
                })
            });
            toast('✅ Item added to inventory', 'success');
            e.target.reset();
            loadDashboard();
        });
    }
}

// ============ DECLARE DEATH & SEND TO MORGUE ============
function declareDeath(visitId) {
    document.getElementById('modalTitle').textContent = '⚰️ Declare Patient Deceased - Send to Morgue';
    document.getElementById('modalBody').innerHTML = 
        '<div class="alert alert-danger">⚠️ This action is IRREVERSIBLE. The patient will be marked as deceased and sent to the morgue.</div>' +
        '<div class="form-group"><label>Cause of Death *</label><textarea id="deathCause" rows="2" placeholder="Enter cause of death..." required></textarea></div>' +
        '<div class="form-group"><label>Summary of Medical Information *</label><textarea id="deathSummary" rows="3" placeholder="Brief summary of patient condition, diagnosis, treatment given..." required></textarea></div>' +
        '<div class="form-group"><label>Time of Death</label><input type="datetime-local" id="deathTime" value="' + new Date().toISOString().slice(0,16) + '"></div>' +
        '<div class="form-group"><label>Attending Staff</label><input type="text" id="deathStaff" value="' + currentUser.full_name + '" readonly></div>' +
        '<button class="btn btn-danger btn-block" onclick="confirmDeath(' + visitId + ')">⚰️ Confirm Death & Send to Morgue</button>' +
        '<button class="btn btn-warning btn-block" style="margin-top:5px" onclick="closeModal()">❌ Cancel</button>';
    document.getElementById('patientModal').style.display = 'block';
}

async function confirmDeath(visitId) {
    var cause = document.getElementById('deathCause').value.trim();
    var summary = document.getElementById('deathSummary').value.trim();
    var deathTime = document.getElementById('deathTime').value;
    
    if (!cause) { toast('⚠️ Please enter cause of death', 'error'); return; }
    if (!summary) { toast('⚠️ Please enter medical summary', 'error'); return; }
    
    if (!confirm('⚠️ FINAL WARNING: This will mark the patient as DECEASED and send to Morgue. This action CANNOT be undone. Continue?')) return;
    
    try {
        // Save death info
        await fetch(API + '/api/visits/' + visitId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                morgue_cause_of_death: cause,
                morgue_notes: 'Death declared by: ' + currentUser.full_name + ' | Time: ' + deathTime + ' | Summary: ' + summary,
                status: 'died',
                current_department: 'morgue'
            })
        });
        
        // Log to history
        await fetch(API + '/api/visits/' + visitId + '/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_department: 'morgue',
                notes: 'PATIENT DECEASED | Cause: ' + cause + ' | Summary: ' + summary + ' | Declared by: ' + currentUser.full_name + ' | Time: ' + deathTime,
                complete_department: true
            })
        });
        
        toast('⚰️ Patient marked as deceased and sent to Morgue', 'info');
        closeModal();
        loadDashboard();
    } catch (err) {
        toast('Error: ' + err.message, 'error');
    }
}

// ==================== LEGAL ====================
function showLegal(t) {
    document.getElementById('legalTitle').textContent = { terms: 'Terms of Use', privacy: 'Privacy Policy', disclaimer: 'Disclaimer' }[t] || 'Legal';
    var body = '';
    if (t === 'terms') {
        body = '<h3>1. Acceptance of Terms</h3><p>By using this Hospital Management System, you agree to be bound by these Terms of Use.</p>';
        body += '<h3>2. License</h3><p>This software is licensed, not sold. Safari Softwares grants you a limited, non-exclusive, non-transferable license to use this software within a single healthcare facility on a local area network.</p>';
        body += '<h3>3. Intellectual Property</h3><p>All code, design, and documentation are the exclusive property of Safari Softwares. Copyright © 2026 Safari Softwares. All rights reserved.</p>';
        body += '<h3>4. No Warranty</h3><p>This software is provided "AS IS" without warranty of any kind, express or implied.</p>';
        body += '<h3>5. Limitation of Liability</h3><p>Safari Softwares shall not be liable for any damages arising from the use of this software.</p>';
        body += '<h3>6. Governing Law</h3><p>These terms are governed by the laws of the Republic of Kenya.</p>';
    } else if (t === 'privacy') {
        body = '<h3>1. Offline System</h3><p>This software operates entirely on your local network. <strong>Safari Softwares does NOT collect, access, or store any patient data.</strong> All data remains on your server.</p>';
        body += '<h3>2. Your Responsibility</h3><p>You are the data controller. You are responsible for securing your server and complying with all applicable data protection laws.</p>';
        body += '<h3>3. No Internet Required</h3><p>This system is designed to work completely offline.</p>';
        body += '<h3>4. Contact</h3><p>For privacy concerns, contact: safarisoftwares@gmail.com</p>';
    } else {
        body = '<h3>Medical Disclaimer</h3><p>This software is a RECORD-KEEPING and WORKFLOW MANAGEMENT tool only. It is NOT a medical device.</p>';
        body += '<h3>Technical Disclaimer</h3><p>Regular database backups are strongly recommended.</p>';
    }
    document.getElementById('legalBody').innerHTML = body;
    document.getElementById('legalModal').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', init);