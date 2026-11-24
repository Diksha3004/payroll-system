/**
 * Payroll Management System - Leave Management Module
 */
const LeaveManager = {
  filterStatus: "All",
  init() {
    this.render();
    this.bindEvents();
  },
  render() {
    this.renderBalances();
    this.renderPendingRequests();
    this.renderHistoryTable();
  },
  renderBalances() {
    const user = Auth.getCurrentUser();
    const empId = (user && user.role === "employee") ? (user.employeeId || "EMP-1001") : "EMP-1001";
    const balances = Store.getEmployeeLeaveBalances(empId);
    const clEl = document.getElementById("leaveBalCl");
    const slEl = document.getElementById("leaveBalSl");
    const elEl = document.getElementById("leaveBalEl");
    if (clEl) clEl.textContent = `${balances.casual.balance} / ${balances.casual.total} Days`;
    if (slEl) slEl.textContent = `${balances.sick.balance} / ${balances.sick.total} Days`;
    if (elEl) elEl.textContent = `${balances.earned.balance} / ${balances.earned.total} Days`;
  },
    renderPendingRequests() {
    const container = document.getElementById("pendingLeavesContainer");
    if (!container) return;
    let leaves = Store.getLeaves().filter(l => l.status === "Pending");
    const user = Auth.getCurrentUser();
    if (user && user.role === "employee") {
      leaves = leaves.filter(l => l.employeeId === (user.employeeId || "EMP-1001"));
    }
    if (leaves.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted">
          <i class="bi bi-check-all fs-2 text-success opacity-75 d-block mb-2"></i>
          <span>No pending leave approvals at this time.</span>
        </div>`;
      return;
    }
    container.innerHTML = leaves.map(leave => `
      <div class="card border border-warning-subtle bg-warning-subtle bg-opacity-10 mb-3 shadow-none">
        <div class="card-body p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="mb-0 fw-bold text-dark">${leave.employeeName}</h6>
              <span class="small text-muted">${leave.employeeId} &bull; ${leave.department}</span>
            </div>
            <span class="badge bg-warning text-dark">${leave.leaveType}</span>
          </div>
          <div class="small text-dark mb-2">
            <i class="bi bi-calendar3 me-1 text-primary"></i> <strong>${leave.startDate}</strong> to <strong>${leave.endDate}</strong> (${leave.days} ${leave.days > 1 ? 'days' : 'day'})
                      </div>
          <p class="small text-muted mb-3 bg-white p-2 rounded border">"${leave.reason}"</p>
          ${(!user || user.role !== "employee") ? `
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-success flex-fill" onclick="LeaveManager.handleReview('${leave.id}', 'Approved')">
              <i class="bi bi-check-circle me-1"></i>Approve
            </button>
            <button class="btn btn-sm btn-outline-danger flex-fill" onclick="LeaveManager.handleReview('${leave.id}', 'Rejected')">
              <i class="bi bi-x-circle me-1"></i>Reject
            </button>
          </div>` : `
          <span class="badge bg-secondary-subtle text-secondary"><i class="bi bi-clock me-1"></i>Awaiting HR Review</span>
          `}
        </div>
      </div>
    `).join("");
  },
  renderHistoryTable() {
    const tableBody = document.getElementById("leaveHistoryTableBody");
    if (!tableBody) return;
    let leaves = Store.getLeaves();
    const user = Auth.getCurrentUser();
    if (user && user.role === "employee") {
      leaves = leaves.filter(l => l.employeeId === (user.employeeId || "EMP-1001"));
    }
        if (this.filterStatus !== "All") {
      leaves = leaves.filter(l => l.status === this.filterStatus);
    }
    if (leaves.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No leave records found.</td></tr>`;
      return;
    }
    tableBody.innerHTML = leaves.map(l => {
      const statusBadge = l.status === "Approved"
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-check-circle-fill me-1"></i>Approved</span>`
        : l.status === "Rejected"
        ? `<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-x-circle-fill me-1"></i>Rejected</span>`
        : `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"><i class="bi bi-hourglass-split me-1"></i>Pending</span>`;
      return `
        <tr>
          <td><span class="fw-semibold text-primary">${l.id}</span></td>
          <td>
            <div class="fw-medium text-dark">${l.employeeName}</div>
            <div class="small text-muted">${l.employeeId}</div>
          </td>
          <td><span class="badge bg-light text-dark border">${l.leaveType}</span></td>
          <td class="small">
            <div>${l.startDate} to ${l.endDate}</div>
            <span class="text-muted">(${l.days} days)</span>
          </td>
          <td class="small text-muted" style="max-width: 200px;">${l.reason}</td>
          <td>${statusBadge}</td>
          <td class="small text-muted">
            ${l.reviewedBy ? `<div>By: ${l.reviewedBy}</div>` : '-'}
            ${l.reviewComment ? `<div class="fst-italic">"${l.reviewComment}"</div>` : ''}
          </td>
        </tr>
      `;
    }).join("");
  },
    openApplyModal() {
    const user = Auth.getCurrentUser();
    const empSelect = document.getElementById("leaveEmpSelect");
    const employees = Store.getEmployees();
    if (empSelect) {
      if (user && user.role === "employee") {
        const emp = Store.getEmployeeById(user.employeeId || "EMP-1001");
        empSelect.innerHTML = `<option value="${emp.id}">${emp.fullName} (${emp.id})</option>`;
        empSelect.disabled = true;
      } else {
        empSelect.disabled = false;
        empSelect.innerHTML = employees.map(e => `<option value="${e.id}">${e.fullName} (${e.id}) - ${e.department}</option>`).join("");
      }
    }
    // Default dates
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("leaveStartDate").value = today;
    document.getElementById("leaveEndDate").value = today;
    document.getElementById("leaveReason").value = "";
    const modalEl = document.getElementById("applyLeaveModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },
  handleApply(e) {
    e.preventDefault();
    const empId = document.getElementById("leaveEmpSelect").value;
    const leaveType = document.getElementById("leaveTypeSelect").value;
    const startDate = document.getElementById("leaveStartDate").value;
    const endDate = document.getElementById("leaveEndDate").value;
    const reason = document.getElementById("leaveReason").value.trim();
        if (!startDate || !endDate || !reason) {
      App.showToast("Please fill in dates and reason for leave.", "warning");
      return;
    }
    const emp = Store.getEmployeeById(empId);
    if (!emp) return;
    // Calculate days
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const timeDiff = d2.getTime() - d1.getTime();
    if (timeDiff < 0) {
      App.showToast("End date cannot be earlier than start date.", "danger");
      return;
    }
    const days = Math.round(timeDiff / (1000 * 3600 * 24)) + 1;
    Store.applyLeave({
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      leaveType,
      startDate,
      endDate,
      days,
      reason
    });
    const modalEl = document.getElementById("applyLeaveModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    App.showToast("Leave application submitted successfully.", "success");
    this.render();
  },
    handleReview(leaveId, status) {
    const user = Auth.getCurrentUser();
    const reviewerName = user ? user.fullName : "HR Manager";
    const comment = status === "Approved" ? "Approved by HR." : "Rejected due to operational requirements.";
    Store.updateLeaveStatus(leaveId, status, comment, reviewerName);
    App.showToast(`Leave application ${status.toLowerCase()} successfully.`, status === "Approved" ? "success" : "info");
    this.render();
  },
  bindEvents() {
    const filterSelect = document.getElementById("leaveStatusFilter");
    if (filterSelect) {
      filterSelect.addEventListener("change", (e) => {
        this.filterStatus = e.target.value;
        this.renderHistoryTable();
      });
    }
  }
};