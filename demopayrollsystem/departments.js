/**
 * Payroll Management System - Department Management Module
 */
const DepartmentManager = {
  init() {
    this.render();
  },
  render() {
    const grid = document.getElementById("departmentGrid");
    const tableBody = document.getElementById("departmentTableBody");
    if (!grid && !tableBody) return;
    const departments = Store.getDepartments();
    const employees = Store.getEmployees();
    const structures = Store.getSalaryStructures();
    // Calculate aggregated metrics per department
    const deptStats = departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department === dept.name);
      let monthlyPayroll = 0;
      deptEmployees.forEach(e => {
        const s = structures[e.id] || Store.computeDefaultSalaryStructure(e.basicSalary);
        monthlyPayroll += (s.grossSalary || 0);
      });
            return {
        ...dept,
        employeeCount: deptEmployees.length,
        monthlyPayroll
      };
    });
    // Render department cards
    if (grid) {
      grid.innerHTML = deptStats.map(d => `
        <div class="col-md-6 col-lg-3 mb-4">
          <div class="card h-100 border-0 shadow-sm rounded-3 hover-lift">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1 fs-7">Dept #${d.id}</span>
                <div class="dropdown">
                  <button class="btn btn-sm btn-link text-muted p-0" data-bs-toggle="dropdown">
                    <i class="bi bi-three-dots-vertical"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                    <li><a class="dropdown-item" href="javascript:void(0)" onclick="DepartmentManager.openEditModal(${d.id})"><i class="bi bi-pencil me-2 text-primary"></i>Edit</a></li>
                    <li><a class="dropdown-item text-danger" href="javascript:void(0)" onclick="DepartmentManager.confirmDelete(${d.id})"><i class="bi bi-trash me-2"></i>Delete</a></li>
                  </ul>
                </div>
              </div>
              <h5 class="card-title fw-bold text-dark mb-1">${d.name}</h5>
              <p class="text-muted small mb-3" style="min-height: 38px;">${d.description || 'Department operational tasks & services'}</p>
              
              <div class="p-2 rounded bg-light mb-3">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>Head of Dept:</span>
                  <span class="fw-semibold text-dark">${d.head || 'Unassigned'}</span>
                </div>
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>Staff Strength:</span>
                  <span class="fw-bold text-primary">${d.employeeCount} Members</span>
                </div>
                <div class="d-flex justify-content-between small text-muted">
                  <span>Monthly Payroll:</span>
                  <span class="fw-bold text-success">${Store.formatINR(d.monthlyPayroll)}</span>
                                  </div>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary flex-fill" onclick="DepartmentManager.viewDepartmentMembers('${d.name}')">
                  <i class="bi bi-people me-1"></i>View Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join("");
    }
    // Render department table
    if (tableBody) {
      tableBody.innerHTML = deptStats.map(d => `
        <tr>
          <td><span class="badge bg-light text-dark border">#${d.id}</span></td>
          <td class="fw-bold text-dark">${d.name}</td>
          <td><span class="text-muted">${d.head}</span></td>
          <td><span class="badge bg-primary-subtle text-primary">${d.employeeCount} Staff</span></td>
          <td class="fw-semibold text-success">${Store.formatINR(d.monthlyPayroll)}</td>
          <td class="small text-muted">${d.description || '-'}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1" onclick="DepartmentManager.openEditModal(${d.id})" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="DepartmentManager.confirmDelete(${d.id})" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `).join("");
    }
  },
    openAddModal() {
    document.getElementById("deptModalTitle").textContent = "Add Department";
    document.getElementById("deptForm").reset();
    document.getElementById("deptModalId").value = "";
    const modalEl = document.getElementById("departmentModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },
  openEditModal(deptId) {
    const depts = Store.getDepartments();
    const d = depts.find(item => item.id === deptId);
    if (!d) return;
    document.getElementById("deptModalTitle").textContent = `Edit Department - ${d.name}`;
    document.getElementById("deptModalId").value = d.id;
    document.getElementById("deptModalName").value = d.name;
    document.getElementById("deptModalHead").value = d.head || "";
    document.getElementById("deptModalDescription").value = d.description || "";
    const modalEl = document.getElementById("departmentModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  },
    handleSave(e) {
    e.preventDefault();
    const id = document.getElementById("deptModalId").value;
    const name = document.getElementById("deptModalName").value.trim();
    const head = document.getElementById("deptModalHead").value.trim();
    const description = document.getElementById("deptModalDescription").value.trim();
    if (!name) {
      App.showToast("Department name is required.", "warning");
      return;
    }
    const deptObj = {
      name,
      head: head || "Unassigned",
      description
    };
    if (id) {
      deptObj.id = parseInt(id, 10);
    }
        Store.saveDepartment(deptObj);
    const modalEl = document.getElementById("departmentModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    App.showToast(`Department "${name}" saved successfully.`, "success");
    this.render();
    EmployeeManager.populateDepartmentDropdowns();
    if (window.Charts) Charts.renderDepartmentChart();
  },
  confirmDelete(deptId) {
    const depts = Store.getDepartments();
    const d = depts.find(item => item.id === deptId);
    if (!d) return;
    // Check if employees are assigned to this department
    const employees = Store.getEmployees().filter(e => e.department === d.name);
    if (employees.length > 0) {
      App.showToast(`Cannot delete "${d.name}". There are ${employees.length} employees currently assigned to it.`, "warning");
      return;
    }
        if (confirm(`Are you sure you want to delete the department "${d.name}"?`)) {
      Store.deleteDepartment(deptId);
      App.showToast(`Department "${d.name}" deleted.`, "info");
      this.render();
      EmployeeManager.populateDepartmentDropdowns();
      if (window.Charts) Charts.renderDepartmentChart();
    }
  },
  viewDepartmentMembers(deptName) {
    // Switch to Employees tab and filter by this department
    App.navigateTo("employees");
    const filterSelect = document.getElementById("empFilterDept");
    if (filterSelect) {
      filterSelect.value = deptName;
      EmployeeManager.currentFilter.dept = deptName;
      EmployeeManager.render();
    }
  }
};