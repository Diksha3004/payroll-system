/**
 * Payroll Management System - Attendance Management Module
 */
const AttendanceManager = {
  currentDate: "2026-11-22", // Today in demo system
  selectedMonth: 11,
  selectedYear: 2026,
  filterDept: "All",
  searchQuery: "",
  init() {
    this.populateFilterDropdown();
    this.render();
    this.bindEvents();
  },
  populateFilterDropdown() {
    const depts = Store.getDepartments();
    const sel = document.getElementById("attFilterDept");
    if (sel) {
      sel.innerHTML = `<option value="All">All Departments</option>` +
        depts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
    }
  },
    render() {
    this.renderStats();
    this.renderDailyTable();
    this.renderMonthlyMatrix();
  },
  renderStats() {
    const employees = Store.getEmployees();
    const attData = Store.getAttendanceData();
    let presentToday = 0;
    let absentToday = 0;
    let halfDayToday = 0;
    let onLeaveToday = 0;
    employees.forEach(emp => {
      const status = (attData[emp.id] && attData[emp.id][this.currentDate]) || "Present";
      if (status === "Present") presentToday++;
      else if (status === "Absent") absentToday++;
      else if (status === "Half Day") halfDayToday++;
      else if (status === "On Leave") onLeaveToday++;
    });
    const total = employees.length || 1;
    const rate = Math.round(((presentToday + (halfDayToday * 0.5)) / total) * 100);
    const elTotal = document.getElementById("attStatTotal");
    const elPresent = document.getElementById("attStatPresent");
    const elAbsent = document.getElementById("attStatAbsent");
    const elRate = document.getElementById("attStatRate");
    if (elTotal) elTotal.textContent = total;
    if (elPresent) elPresent.textContent = presentToday;
    if (elAbsent) elAbsent.textContent = absentToday + halfDayToday;
    if (elRate) elRate.textContent = `${rate}%`;
  },
    renderDailyTable() {
    const tableBody = document.getElementById("attendanceDailyTableBody");
    if (!tableBody) return;
    let employees = Store.getEmployees();
    const attData = Store.getAttendanceData();
    if (this.filterDept !== "All") {
      employees = employees.filter(e => e.department === this.filterDept);
    }
    if (this.searchQuery.trim() !== "") {
      const q = this.searchQuery.toLowerCase();
      employees = employees.filter(e => e.fullName.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
    }
    tableBody.innerHTML = employees.map(emp => {
      const currentStatus = (attData[emp.id] && attData[emp.id][this.currentDate]) || "Present";
      const monthlyStats = Store.getMonthlyAttendanceStats(emp.id, this.selectedYear, this.selectedMonth);
            return `
        <tr>
          <td>
            <div class="d-flex align-items-center">
              <img src="${emp.photo || 'https://via.placeholder.com/35'}" class="rounded-circle me-2 border" style="width: 32px; height: 32px; object-fit: cover;">
              <div>
                <span class="fw-semibold text-dark d-block">${emp.fullName}</span>
                <span class="text-muted small">${emp.id}</span>
              </div>
            </div>
          </td>
          <td><span class="badge bg-light text-dark border">${emp.department}</span></td>
          <td>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn ${currentStatus === 'Present' ? 'btn-success text-white' : 'btn-outline-secondary'}" onclick="AttendanceManager.markStatus('${emp.id}', 'Present')">
                <i class="bi bi-check-lg"></i> Present
              </button>
              <button type="button" class="btn ${currentStatus === 'Half Day' ? 'btn-warning text-dark' : 'btn-outline-secondary'}" onclick="AttendanceManager.markStatus('${emp.id}', 'Half Day')">
                <i class="bi bi-brightness-high"></i> Half Day
              </button>
              <button type="button" class="btn ${currentStatus === 'Absent' ? 'btn-danger text-white' : 'btn-outline-secondary'}" onclick="AttendanceManager.markStatus('${emp.id}', 'Absent')">
                <i class="bi bi-x-lg"></i> Absent
              </button>
              <button type="button" class="btn ${currentStatus === 'On Leave' ? 'btn-primary text-white' : 'btn-outline-secondary'}" onclick="AttendanceManager.markStatus('${emp.id}', 'On Leave')">
                <i class="bi bi-calendar-event"></i> Leave
              </button>
              <button type="button" class="btn ${currentStatus === 'Weekly Off' ? 'btn-secondary text-white' : 'btn-outline-secondary'}" onclick="AttendanceManager.markStatus('${emp.id}', 'Weekly Off')">
                Off
              </button>
            </div>
                      </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-fill" style="height: 6px; width: 70px;">
                <div class="progress-bar ${monthlyStats.attendancePercentage >= 90 ? 'bg-success' : monthlyStats.attendancePercentage >= 75 ? 'bg-warning' : 'bg-danger'}" 
                     role="progressbar" style="width: ${monthlyStats.attendancePercentage}%"></div>
              </div>
              <span class="small fw-semibold text-dark">${monthlyStats.attendancePercentage}%</span>
            </div>
          </td>
          <td class="text-muted small">
            ${monthlyStats.effectivePresent} / ${monthlyStats.totalWorkingDays} Days
          </td>
        </tr>
      `;
    }).join("");
  },
    renderMonthlyMatrix() {
    const container = document.getElementById("attendanceMatrixContainer");
    if (!container) return;
    const employees = Store.getEmployees();
    const attData = Store.getAttendanceData();
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    let headerHtml = `<th>Employee</th>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(this.selectedYear, this.selectedMonth - 1, d).getDay();
      const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      headerHtml += `<th class="text-center p-1 ${isWeekend ? 'bg-light text-muted' : ''}" style="font-size: 0.75rem; min-width: 28px;">${d}</th>`;
    }
    headerHtml += `<th>Rate</th>`;
    let rowsHtml = employees.map(emp => {
      const stats = Store.getMonthlyAttendanceStats(emp.id, this.selectedYear, this.selectedMonth);
      let cells = `<td class="text-nowrap small fw-medium">${emp.fullName} <span class="text-muted">(${emp.id})</span></td>`;
            for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayOfWeek = new Date(this.selectedYear, this.selectedMonth - 1, d).getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        let status = (attData[emp.id] && attData[emp.id][dateStr]);
        if (!status) {
          status = isWeekend ? "Weekly Off" : (d > 22 ? "Upcoming" : "Present");
        }
        let symbol = "P";
        let cellClass = "bg-success-subtle text-success";
        if (status === "Weekly Off") {
          symbol = "W";
          cellClass = "bg-light text-muted";
        } else if (status === "Absent") {
          symbol = "A";
          cellClass = "bg-danger text-white";
        } else if (status === "Half Day") {
          symbol = "H";
          cellClass = "bg-warning text-dark";
        } else if (status === "On Leave") {
          symbol = "L";
          cellClass = "bg-primary text-white";
        } else if (status === "Upcoming") {
          symbol = "-";
          cellClass = "text-muted";
        }
        cells += `<td class="text-center p-1 ${cellClass}" style="font-size: 0.7rem; font-weight: 600;" title="${dateStr}: ${status}">${symbol}</td>`;
      }
      cells += `<td class="text-center fw-bold small text-primary">${stats.attendancePercentage}%</td>`;
      return `<tr>${cells}</tr>`;
    }).join("");
        container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-bordered table-sm align-middle mb-0">
          <thead class="table-light">
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  },
  markStatus(empId, status) {
    Store.markAttendance(empId, this.currentDate, status);
    App.showToast(`Marked ${status} for ${empId}`, "success");
    this.render();
  },
  markAllPresent() {
    const employees = Store.getEmployees();
    employees.forEach(emp => {
      Store.markAttendance(emp.id, this.currentDate, "Present");
    });
    App.showToast("Marked all active employees as Present for today.", "success");
    this.render();
  },
  bindEvents() {
    const searchInput = document.getElementById("attSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value;
        this.renderDailyTable();
      });
    }
        const filterDept = document.getElementById("attFilterDept");
    if (filterDept) {
      filterDept.addEventListener("change", (e) => {
        this.filterDept = e.target.value;
        this.renderDailyTable();
      });
    }
    const datePicker = document.getElementById("attDatePicker");
    if (datePicker) {
      datePicker.value = this.currentDate;
      datePicker.addEventListener("change", (e) => {
        this.currentDate = e.target.value;
        this.render();
      });
    }
  }
};