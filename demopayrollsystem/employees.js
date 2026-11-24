/**
 * Payroll Management System - Employee Management Module
 */
const EmployeeManager = {
  currentFilter: {
    dept: "All",
    status: "All",
    search: ""
  },
  init() {
    this.populateDepartmentDropdowns();
    this.render();
    this.bindEvents();
  },
  populateDepartmentDropdowns() {
    const depts = Store.getDepartments();
    const filterSelect = document.getElementById("empFilterDept");
    const modalSelect = document.getElementById("empModalDept");
    if (filterSelect) {
      filterSelect.innerHTML = `<option value="All">All Departments</option>` +
        depts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
    }
    if (modalSelect) {
      modalSelect.innerHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
    }
  },
    render() {
    const tableBody = document.getElementById("employeeTableBody");
    if (!tableBody) return;
    let employees = Store.getEmployees();
    // Filter department
    if (this.currentFilter.dept !== "All") {
      employees = employees.filter(e => e.department === this.currentFilter.dept);
    }
    // Filter status
    if (this.currentFilter.status !== "All") {
      employees = employees.filter(e => e.employmentStatus === this.currentFilter.status);
    }
    // Filter search
    if (this.currentFilter.search.trim() !== "") {
      const q = this.currentFilter.search.toLowerCase();
      employees = employees.filter(e =>
        e.fullName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    }
        // Update count indicator
    const countBadge = document.getElementById("employeeCountBadge");
    if (countBadge) {
      countBadge.textContent = `${employees.length} Records`;
    }
    if (employees.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted">
            <i class="bi bi-people fs-1 d-block mb-2 text-secondary opacity-50"></i>
            No employees found matching your criteria.
          </td>
        </tr>`;
      return;
    }
    tableBody.innerHTML = employees.map(emp => {
      const statusBadge = emp.employmentStatus === "Active"
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>Active</span>`
        : emp.employmentStatus === "On Leave"
        ? `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1"><i class="bi bi-clock-fill me-1"></i>On Leave</span>`
        : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1"><i class="bi bi-x-circle-fill me-1"></i>Inactive</span>`;
              return `
        <tr>
          <td>
            <div class="d-flex align-items-center">
              <img src="${emp.photo || 'https://via.placeholder.com/40'}" alt="${emp.fullName}" class="rounded-circle me-2 border" style="width: 38px; height: 38px; object-fit: cover;">
              <div>
                <a href="javascript:void(0)" onclick="EmployeeManager.openProfileModal('${emp.id}')" class="fw-semibold text-primary text-decoration-none d-block">${emp.fullName}</a>
                <span class="text-muted small">${emp.id}</span>
              </div>
            </div>
          </td>
          <td>
            <div class="text-dark small">${emp.email}</div>
            <div class="text-muted" style="font-size: 0.75rem;">${emp.mobile}</div>
          </td>
          <td>
            <span class="badge bg-light text-dark border">${emp.department}</span>
          </td>
          <td><span class="small fw-medium">${emp.designation}</span></td>
          <td><span class="fw-semibold text-dark">${Store.formatINR(emp.basicSalary)}</span></td>
          <td><span class="small text-muted">${emp.joiningDate}</span></td>
          <td>${statusBadge}</td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" title="View Profile" onclick="EmployeeManager.openProfileModal('${emp.id}')">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-secondary" title="Edit Employee" onclick="EmployeeManager.openEditModal('${emp.id}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-info" title="ID Card" onclick="IdCardGenerator.openIdCardModal('${emp.id}')">
                <i class="bi bi-person-badge"></i>
              </button>
              ${Auth.isAdmin() ? `
                              <button class="btn btn-outline-danger" title="Delete Employee" onclick="EmployeeManager.confirmDelete('${emp.id}')">
                <i class="bi bi-trash"></i>
              </button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");
  },
  bindEvents() {
    const searchInput = document.getElementById("empSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.currentFilter.search = e.target.value;
        this.render();
      });
    }
    const filterDept = document.getElementById("empFilterDept");
    if (filterDept) {
      filterDept.addEventListener("change", (e) => {
        this.currentFilter.dept = e.target.value;
        this.render();
      });
    }
        const filterStatus = document.getElementById("empFilterStatus");
    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        this.currentFilter.status = e.target.value;
        this.render();
      });
    }
  },
  openAddModal() {
    document.getElementById("empFormModalTitle").textContent = "Add New Employee";
    document.getElementById("empForm").reset();
    document.getElementById("empModalId").value = Store.generateNextEmployeeId();
    document.getElementById("empModalId").readOnly = true;
    document.getElementById("empModalStatus").value = "Active";
    const modalEl = document.getElementById("employeeFormModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },
    openEditModal(empId) {
    const emp = Store.getEmployeeById(empId);
    if (!emp) return;
    document.getElementById("empFormModalTitle").textContent = `Edit Employee - ${emp.fullName}`;
    document.getElementById("empModalId").value = emp.id;
    document.getElementById("empModalId").readOnly = true;
    document.getElementById("empModalFullName").value = emp.fullName;
    document.getElementById("empModalEmail").value = emp.email;
    document.getElementById("empModalMobile").value = emp.mobile;
    document.getElementById("empModalGender").value = emp.gender || "Male";
    document.getElementById("empModalDob").value = emp.dob || "1992-01-01";
    document.getElementById("empModalAddress").value = emp.address || "";
    document.getElementById("empModalDept").value = emp.department;
    document.getElementById("empModalDesignation").value = emp.designation;
    document.getElementById("empModalJoiningDate").value = emp.joiningDate;
    document.getElementById("empModalStatus").value = emp.employmentStatus;
    document.getElementById("empModalBasicSalary").value = emp.basicSalary;
    document.getElementById("empModalBankAcc").value = emp.bankAccount || "";
    document.getElementById("empModalBankName").value = emp.bankName || "HDFC Bank";
    document.getElementById("empModalIfsc").value = emp.ifscCode || "";
    document.getElementById("empModalPan").value = emp.pan || "";
    document.getElementById("empModalUan").value = emp.uan || "";
    document.getElementById("empModalBloodGroup").value = emp.bloodGroup || "O+";
    const modalEl = document.getElementById("employeeFormModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },
    handleSave(e) {
    e.preventDefault();
    const id = document.getElementById("empModalId").value.trim();
    const fullName = document.getElementById("empModalFullName").value.trim();
    const email = document.getElementById("empModalEmail").value.trim();
    const mobile = document.getElementById("empModalMobile").value.trim();
    const gender = document.getElementById("empModalGender").value;
    const dob = document.getElementById("empModalDob").value;
    const address = document.getElementById("empModalAddress").value.trim();
    const department = document.getElementById("empModalDept").value;
    const designation = document.getElementById("empModalDesignation").value.trim();
    const joiningDate = document.getElementById("empModalJoiningDate").value;
    const employmentStatus = document.getElementById("empModalStatus").value;
    const basicSalary = parseFloat(document.getElementById("empModalBasicSalary").value) || 50000;
    const bankAccount = document.getElementById("empModalBankAcc").value.trim();
    const bankName = document.getElementById("empModalBankName").value.trim();
    const ifscCode = document.getElementById("empModalIfsc").value.trim();
    const pan = document.getElementById("empModalPan").value.trim();
    const uan = document.getElementById("empModalUan").value.trim();
    const bloodGroup = document.getElementById("empModalBloodGroup").value;
    if (!id || !fullName || !email || !mobile || !department || !designation) {
      App.showToast("Please fill in all mandatory fields.", "warning");
      return;
    }
    const existing = Store.getEmployeeById(id);
    const photo = existing ? existing.photo : (gender === "Female"
      ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80");
          const empData = {
      id,
      fullName,
      email,
      mobile,
      gender,
      dob,
      address,
      department,
      designation,
      joiningDate,
      employmentStatus,
      basicSalary,
      bankAccount,
      bankName,
      ifscCode,
      pan,
      uan,
      bloodGroup,
      photo
    };
    Store.saveEmployee(empData);
    const modalEl = document.getElementById("employeeFormModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    App.showToast(`Employee ${fullName} saved successfully.`, "success");
    this.render();
    if (window.SalaryManager) SalaryManager.render();
    if (window.Charts) Charts.renderDepartmentChart();
  },
  openProfileModal(empId) {
    const emp = Store.getEmployeeById(empId);
    if (!emp) return;
        const struct = Store.getSalaryStructureForEmployee(emp.id);
    const leaveBal = Store.getEmployeeLeaveBalances(emp.id);
    const attStats = Store.getMonthlyAttendanceStats(emp.id, 2026, 11);
    document.getElementById("profileModalAvatar").src = emp.photo;
    document.getElementById("profileModalName").textContent = emp.fullName;
    document.getElementById("profileModalDesignation").textContent = emp.designation;
    document.getElementById("profileModalDept").textContent = emp.department;
    document.getElementById("profileModalId").textContent = emp.id;
    document.getElementById("profileModalStatusBadge").innerHTML = emp.employmentStatus === "Active"
      ? `<span class="badge bg-success">Active</span>`
      : `<span class="badge bg-warning text-dark">${emp.employmentStatus}</span>`;
          // Overview Tab
    document.getElementById("profileEmail").textContent = emp.email;
    document.getElementById("profileMobile").textContent = emp.mobile;
    document.getElementById("profileGender").textContent = emp.gender;
    document.getElementById("profileDob").textContent = emp.dob;
    document.getElementById("profileBlood").textContent = emp.bloodGroup || "O+";
    document.getElementById("profileJoiningDate").textContent = emp.joiningDate;
    document.getElementById("profileAddress").textContent = emp.address;
    // Banking Tab
    document.getElementById("profileBankAcc").textContent = emp.bankAccount || "N/A";
    document.getElementById("profileBankName").textContent = emp.bankName || "HDFC Bank";
    document.getElementById("profileIfsc").textContent = emp.ifscCode || "N/A";
    document.getElementById("profilePan").textContent = emp.pan || "N/A";
    document.getElementById("profileUan").textContent = emp.uan || "N/A";
    // Salary Tab
    document.getElementById("profileBasic").textContent = Store.formatINR(struct.basicSalary);
    document.getElementById("profileHra").textContent = Store.formatINR(struct.hra);
    document.getElementById("profileDa").textContent = Store.formatINR(struct.da);
    document.getElementById("profileGross").textContent = Store.formatINR(struct.grossSalary);
    document.getElementById("profilePf").textContent = Store.formatINR(struct.pf);
    document.getElementById("profilePt").textContent = Store.formatINR(struct.professionalTax);
    document.getElementById("profileTds").textContent = Store.formatINR(struct.tds);
    document.getElementById("profileNet").textContent = Store.formatINR(struct.netSalary);
        // Leave & Attendance Tab
    document.getElementById("profileClBal").textContent = `${leaveBal.casual.balance}/${leaveBal.casual.total}`;
    document.getElementById("profileSlBal").textContent = `${leaveBal.sick.balance}/${leaveBal.sick.total}`;
    document.getElementById("profileElBal").textContent = `${leaveBal.earned.balance}/${leaveBal.earned.total}`;
    document.getElementById("profileAttRate").textContent = `${attStats.attendancePercentage}%`;
    // Action button handlers
    const idCardBtn = document.getElementById("profileIdCardBtn");
    if (idCardBtn) {
      idCardBtn.onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById("employeeProfileModal")).hide();
        IdCardGenerator.openIdCardModal(emp.id);
      };
    }
    const editBtn = document.getElementById("profileEditBtn");
    if (editBtn) {
      editBtn.onclick = () => {
        bootstrap.Modal.getInstance(document.getElementById("employeeProfileModal")).hide();
        EmployeeManager.openEditModal(emp.id);
      };
    }
        const modalEl = document.getElementById("employeeProfileModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },
  confirmDelete(empId) {
    const emp = Store.getEmployeeById(empId);
    if (!emp) return;
    if (confirm(`Are you sure you want to deactivate or delete employee ${emp.fullName} (${emp.id})?`)) {
      Store.deleteEmployee(empId);
      App.showToast(`Employee ${emp.fullName} deleted successfully.`, "info");
      this.render();
      if (window.SalaryManager) SalaryManager.render();
      if (window.Charts) Charts.renderDepartmentChart();
    }
  }
};