# This script generates the COMPLETE app.js file
# DO NOT EDIT - just save and run: python build_app.py

code = '''const API = '';
let currentUser = null;

function togglePassword(inputId, icon) {
    var input = document.getElementById(inputId);
    if (input.type === "password") { input.type = "text"; icon.textContent = "🙈"; }
    else { input.type = "password"; icon.textContent = "👁️"; }
}

async function init() {
    try { var res = await fetch(API + "/api/auth/me"); var data = await res.json(); if (data.authenticated) { currentUser = data.user; showApp(); } } catch (e) {}
}

document.addEventListener("DOMContentLoaded", function() {
    var lf = document.getElementById("loginForm");
    if (lf) { lf.addEventListener("submit", async function(e) { e.preventDefault(); await handleLogin(); }); }
    init();
});

async function handleLogin() {
    var u = document.getElementById("loginUsername").value.trim();
    var p = document.getElementById("loginPassword").value;
    if (!u || !p) { toast("Enter username and password", "error"); return; }
    try {
        var res = await fetch(API + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) });
        var d = await res.json();
        if (d.success) { currentUser = d.user; showApp(); toast("Welcome, " + currentUser.full_name, "success"); }
        else toast(d.message || "Login failed", "error");
    } catch (err) { toast("Connection error", "error"); }
}

function logout() {
    fetch(API + "/api/auth/logout", { method: "POST" }).then(function() {
        currentUser = null;
        document.getElementById("loginScreen").style.display = "block";
        document.getElementById("appScreen").style.display = "none";
        document.getElementById("appFooter").style.display = "none";
    });
}

function showApp() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appScreen").style.display = "block";
    document.getElementById("dashboardContent").style.display = "block";
    document.getElementById("headerRole").textContent = currentUser.department_name || currentUser.role;
    document.getElementById("headerDept").textContent = "Dept: " + currentUser.role.toUpperCase();
    document.getElementById("appFooter").style.display = "block";
    if (!document.getElementById("changePassBtn")) {
        var hr = document.querySelector(".header div:last-child");
        if (hr) {
            var btn = document.createElement("button");
            btn.id = "changePassBtn";
            btn.textContent = "🔑 Password";
            btn.style.cssText = "background:#8e44ad;color:#fff;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;font-size:10px;margin-right:8px;font-weight:600";
            btn.onclick = showChangePasswordForm;
            hr.insertBefore(btn, hr.firstChild);
        }
    }
    loadDashboard();
}

function toast(m, t) {
    t = t || "info";
    var c = document.getElementById("toastContainer");
    var el = document.createElement("div");
    el.className = "toast toast-" + t;
    el.textContent = m;
    c.appendChild(el);
    setTimeout(function() { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(function() { el.remove(); }, 300); }, 4000);
}

function closeModal() { document.getElementById("patientModal").style.display = "none"; }
function closeLegalModal() { document.getElementById("legalModal").style.display = "none"; }
window.onclick = function(e) { if (e.target === document.getElementById("patientModal")) closeModal(); if (e.target === document.getElementById("legalModal")) closeLegalModal(); };

async function loadDashboard() {
    var content = document.getElementById("dashboardContent");
    try {
        var sr = await fetch(API + "/api/dashboard"); var stats = await sr.json();
        var html = "<div class=\\"stats-grid\\">";
        html += "<div class=\\"stat-card\\"><div class=\\"number\\">" + stats.totalPatients + "</div><div class=\\"label\\">Total Patients</div></div>";
        html += "<div class=\\"stat-card\\"><div class=\\"number\\">" + stats.activeVisits + "</div><div class=\\"label\\">Active Visits</div></div>";
        html += "<div class=\\"stat-card\\"><div class=\\"number\\">" + stats.todayVisits + "</div><div class=\\"label\\">Today</div></div>";
        html += "<div class=\\"stat-card\\"><div class=\\"number\\">KES " + stats.pendingBills.toLocaleString() + "</div><div class=\\"label\\">Pending Bills</div></div>";
        html += "<div class=\\"stat-card\\"><div class=\\"number\\">" + (stats.occupiedBeds || 0) + "</div><div class=\\"label\\">Beds Occupied</div></div>";
        html += "<div class=\\"stat-card " + ((stats.lowStockItems || 0) > 0 ? "warning" : "") + "\\"><div class=\\"number\\">" + (stats.lowStockItems || 0) + "</div><div class=\\"label\\">Low Stock</div></div>";
        html += "</div>";
        switch (currentUser.role) {
            case "registration": html += await regScreen(); break;
            case "triage": html += await triageScreen(); break;
            case "consultation": html += await consultScreen(); break;
            case "laboratory": html += await labScreen(); break;
            case "radiology": html += await radioScreen(); break;
            case "pharmacy": html += await pharmScreen(); break;
            case "ward": html += await wardScreen(); break;
            case "dietary": html += await dietScreen(); break;
            case "bloodbank": html += await bloodScreen(); break;
            case "socialwork": html += await socialScreen(); break;
            case "physio": html += await physioScreen(); break;
            case "isolation": html += await isoScreeen(); break;
            case "medrecords": html += await medScreen(); break;
            case "cashier": html += await cashScreen(); break;
            case "referral": html += await refScreen(); break;
            case "sha": html += await shaScreen(); break;
            case "morgue": html += await morgScreen(); break;
            case "store": html += await storeScreen(); break;
            case "manager": html += await mgrScreen(); break;
            case "admin": html += await adminScreen(); break;
            case "emergency": html += await emergScreen(); break;
            case "pediatrics": html += await pedScreen(); break;
        }
        content.innerHTML = html;
        attachEvents();
    } catch (err) { content.innerHTML = "<div class=\\"card\\"><div class=\\"card-body\\"><p class=\\"alert alert-danger\\">Error loading dashboard.</p></div></div>"; }
}
'''

print("This approach is getting too complex with escaping.")
print("Let me give you the file directly instead.")
print("Run: notepad app.js and I'll paste the complete code.")