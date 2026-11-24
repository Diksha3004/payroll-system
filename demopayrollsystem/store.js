/**
 * Payroll Management System - Data Store & LocalStorage Manager
 * Provides dynamic persistence, calculations, and reactive data helpers.
 */
const Store = {
  KEYS: {
    INITIALIZED: "payroll_demo_initialized_v2",
    EMPLOYEES: "payroll_demo_employees",
    DEPARTMENTS: "payroll_demo_departments",
    LEAVES: "payroll_demo_leaves",
    ATTENDANCE: "payroll_demo_attendance",
    SALARY_STRUCTURES: "payroll_demo_salary_structures",
    PAYROLL_RECORDS: "payroll_demo_payroll_records",
    CURRENT_USER: "payroll_demo_user"
  },
  // Initialize store with sample data if first load
  init() {
    if (!localStorage.getItem(this.KEYS.INITIALIZED)) {
      this.resetToDefaults();
    }
  },
  resetToDefaults() {
    // 1. Employees
    localStorage.setItem(this.KEYS.EMPLOYEES, JSON.stringify(INITIAL_DATA.employees));
    // 2. Departments
    localStorage.setItem(this.KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DATA.departments));
    // 3. Leaves
    localStorage.setItem(this.KEYS.LEAVES, JSON.stringify(INITIAL_DATA.leaves));
    // 4. Default Salary Structures calculated for all employees
    const structures = {};
    INITIAL_DATA.employees.forEach(emp => {
      structures[emp.id] = this.computeDefaultSalaryStructure(emp.basicSalary);
    });
    localStorage.setItem(this.KEYS.SALARY_STRUCTURES, JSON.stringify(structures));
    // 5. Seed Attendance for November 2026 (Working days 1 to 22)
    const attendanceRecords = this.generateSampleAttendance(INITIAL_DATA.employees, 2026, 11);
        localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
    // 6. Seed Payroll for October 2026 (Paid) and November 2026 (Pending Approval)
    const payrollRecords = this.seedInitialPayrollRecords(INITIAL_DATA.employees, structures);
    localStorage.setItem(this.KEYS.PAYROLL_RECORDS, JSON.stringify(payrollRecords));
    localStorage.setItem(this.KEYS.INITIALIZED, "true");
  },
  computeDefaultSalaryStructure(basic) {
    const rules = INITIAL_DATA.salaryRules;
    const hra = Math.round(basic * rules.hraPercent);
    const da = Math.round(basic * rules.daPercent);
    const conveyance = rules.conveyanceFixed;
    const medical = rules.medicalFixed;
    const otherAllowances = Math.round(basic * rules.otherAllowancePercent);
    const grossSalary = basic + hra + da + conveyance + medical + otherAllowances;
    const pf = Math.round(basic * rules.pfPercent);
    const professionalTax = rules.professionalTaxFixed;
    // Standard TDS slabs simplified for demo
    const tds = Math.round(grossSalary * rules.tdsRate);
    const otherDeductions = 0;
    const totalDeductions = pf + professionalTax + tds + otherDeductions;
    const netSalary = grossSalary - totalDeductions;
        return {
      basicSalary: basic,
      hra,
      da,
      conveyance,
      medical,
      otherAllowances,
      grossSalary,
      pf,
      professionalTax,
      tds,
      otherDeductions,
      totalDeductions,
      netSalary
    };
  },
  generateSampleAttendance(employees, year, month) {
    // Generate realistic daily logs for current month up to day 22
    // Present 대부분, 일부 Leave, 일부 Half-day, Sun/Sat as Weekly Off
    const records = {};
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = 22; // up to today's demo date
    employees.forEach(emp => {
      records[emp.id] = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = new Date(year, month - 1, day).getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
          records[emp.id][dateStr] = "Weekly Off";
        } else if (day > currentDay) {
          records[emp.id][dateStr] = "Upcoming";
        } else if (emp.employmentStatus === "On Leave" && day >= 15 && day <= 22) {
          records[emp.id][dateStr] = "On Leave";
        } else {
          // Semi-random realistic attendance
          const rand = (emp.id.charCodeAt(5) + day) % 20;
          if (rand === 0) {
            records[emp.id][dateStr] = "Absent";
          } else if (rand === 1) {
            records[emp.id][dateStr] = "Half Day";
          } else {
            records[emp.id][dateStr] = "Present";
          }
        }
      }
    });
    return records;
  },
    seedInitialPayrollRecords(employees, structures) {
    const list = [];
    
    // October 2026 - Already Approved & Paid
    employees.forEach(emp => {
      const struct = structures[emp.id] || this.computeDefaultSalaryStructure(emp.basicSalary);
      list.push({
        id: `PAY-2026-10-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        month: "October",
        year: 2026,
        monthYear: "October 2026",
        totalWorkingDays: 22,
        presentDays: 22,
        lopDays: 0,
        basicSalary: struct.basicSalary,
        hra: struct.hra,
        da: struct.da,
        conveyance: struct.conveyance,
        medical: struct.medical,
        otherAllowances: struct.otherAllowances,
        totalAllowances: (struct.grossSalary - struct.basicSalary),
        grossSalary: struct.grossSalary,
        pf: struct.pf,
        professionalTax: struct.professionalTax,
        tds: struct.tds,
        otherDeductions: struct.otherDeductions,
        totalDeductions: struct.totalDeductions,
        netSalary: struct.netSalary,
        status: "Paid",
        generatedDate: "2026-10-31",
        approvedDate: "2026-11-01",
        paidDate: "2026-11-02",
        paymentReference: `NEFT-20261102-${emp.id}`
      });
    });
        return list;
  },
  // ================= EMPLOYEES =================
  getEmployees() {
    return JSON.parse(localStorage.getItem(this.KEYS.EMPLOYEES) || "[]");
  },
  getEmployeeById(id) {
    const list = this.getEmployees();
    return list.find(e => e.id === id) || null;
  },
  saveEmployee(employee) {
    const list = this.getEmployees();
    const index = list.findIndex(e => e.id === employee.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...employee };
    } else {
      list.push(employee);
      // Auto-compute salary structure for new employee
      const structures = this.getSalaryStructures();
      structures[employee.id] = this.computeDefaultSalaryStructure(employee.basicSalary || 50000);
      localStorage.setItem(this.KEYS.SALARY_STRUCTURES, JSON.stringify(structures));
    }
    localStorage.setItem(this.KEYS.EMPLOYEES, JSON.stringify(list));
    return employee;
  },
    deleteEmployee(id) {
    let list = this.getEmployees();
    list = list.filter(e => e.id !== id);
    localStorage.setItem(this.KEYS.EMPLOYEES, JSON.stringify(list));
  },
  generateNextEmployeeId() {
    const list = this.getEmployees();
    let maxNum = 1000;
    list.forEach(e => {
      const parts = e.id.split("-");
      if (parts[1]) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `EMP-${maxNum + 1}`;
  },
    // ================= DEPARTMENTS =================
  getDepartments() {
    return JSON.parse(localStorage.getItem(this.KEYS.DEPARTMENTS) || "[]");
  },
  saveDepartment(dept) {
    const list = this.getDepartments();
    const index = list.findIndex(d => d.id === dept.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...dept };
    } else {
      dept.id = list.length > 0 ? Math.max(...list.map(d => d.id)) + 1 : 1;
      list.push(dept);
    }
    localStorage.setItem(this.KEYS.DEPARTMENTS, JSON.stringify(list));
    return dept;
  },
  deleteDepartment(id) {
    let list = this.getDepartments();
    list = list.filter(d => d.id !== id);
    localStorage.setItem(this.KEYS.DEPARTMENTS, JSON.stringify(list));
  },
    // ================= SALARY STRUCTURES =================
  getSalaryStructures() {
    return JSON.parse(localStorage.getItem(this.KEYS.SALARY_STRUCTURES) || "{}");
  },
  getSalaryStructureForEmployee(empId) {
    const structures = this.getSalaryStructures();
    if (structures[empId]) {
      return structures[empId];
    }
    const emp = this.getEmployeeById(empId);
    if (emp) {
      const struct = this.computeDefaultSalaryStructure(emp.basicSalary);
      structures[empId] = struct;
      localStorage.setItem(this.KEYS.SALARY_STRUCTURES, JSON.stringify(structures));
      return struct;
    }
    return this.computeDefaultSalaryStructure(50000);
  },
  saveSalaryStructure(empId, structure) {
    const structures = this.getSalaryStructures();
    structures[empId] = structure;
    localStorage.setItem(this.KEYS.SALARY_STRUCTURES, JSON.stringify(structures));
    // Also update employee's basicSalary
    const emp = this.getEmployeeById(empId);
    if (emp) {
      emp.basicSalary = structure.basicSalary;
      this.saveEmployee(emp);
    }
    return structure;
  },
    // ================= ATTENDANCE =================
  getAttendanceData() {
    return JSON.parse(localStorage.getItem(this.KEYS.ATTENDANCE) || "{}");
  },
  markAttendance(empId, dateStr, status) {
    const all = this.getAttendanceData();
    if (!all[empId]) all[empId] = {};
    all[empId][dateStr] = status;
    localStorage.setItem(this.KEYS.ATTENDANCE, JSON.stringify(all));
  },
  getMonthlyAttendanceStats(empId, year, month) {
    const all = this.getAttendanceData();
    const empRecords = all[empId] || {};
    const daysInMonth = new Date(year, month, 0).getDate();
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let weeklyOff = 0;
    let onLeave = 0;
    let upcoming = 0;
    let totalWorkingDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const status = empRecords[dateStr] || "Present";
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weeklyOff++;
      } else {
        totalWorkingDays++;
        if (status === "Present") present++;
        else if (status === "Absent") absent++;
        else if (status === "Half Day") halfDay++;
        else if (status === "On Leave") onLeave++;
        else if (status === "Upcoming") upcoming++;
        else present++;
      }
    }
        // Effective present days = present + (halfDay * 0.5) + onLeave (paid leave)
    const effectivePresent = present + (halfDay * 0.5) + onLeave;
    const rate = totalWorkingDays > 0 ? Math.round((effectivePresent / (totalWorkingDays - upcoming || 1)) * 100) : 100;
    return {
      totalWorkingDays,
      present,
      absent,
      halfDay,
      weeklyOff,
      onLeave,
      upcoming,
      effectivePresent,
      attendancePercentage: Math.min(100, Math.max(0, rate))
    };
  },
    // ================= LEAVES =================
  getLeaves() {
    return JSON.parse(localStorage.getItem(this.KEYS.LEAVES) || "[]");
  },
  applyLeave(leave) {
    const list = this.getLeaves();
    leave.id = `LV-${Math.floor(200 + Math.random() * 800)}`;
    leave.status = "Pending";
    leave.appliedOn = new Date().toISOString().split("T")[0];
    list.unshift(leave);
    localStorage.setItem(this.KEYS.LEAVES, JSON.stringify(list));
    return leave;
  },
  updateLeaveStatus(leaveId, status, reviewComment, reviewedBy = "HR Manager") {
    const list = this.getLeaves();
    const leave = list.find(l => l.id === leaveId);
    if (leave) {
      leave.status = status;
      leave.reviewedBy = reviewedBy;
      leave.reviewComment = reviewComment;
      localStorage.setItem(this.KEYS.LEAVES, JSON.stringify(list));
    }
    return leave;
  },
  getEmployeeLeaveBalances(empId) {
    const list = this.getLeaves().filter(l => l.employeeId === empId && l.status === "Approved");
    let clUsed = 0, slUsed = 0, elUsed = 0;
    list.forEach(l => {
      if (l.leaveType === "Casual Leave") clUsed += l.days;
      else if (l.leaveType === "Sick Leave") slUsed += l.days;
      else if (l.leaveType === "Earned Leave") elUsed += l.days;
    });
        return {
      casual: { total: 12, used: clUsed, balance: Math.max(0, 12 - clUsed) },
      sick: { total: 10, used: slUsed, balance: Math.max(0, 10 - slUsed) },
      earned: { total: 18, used: elUsed, balance: Math.max(0, 18 - elUsed) }
    };
  },
    // ================= PAYROLL =================
  getPayrollRecords() {
    return JSON.parse(localStorage.getItem(this.KEYS.PAYROLL_RECORDS) || "[]");
  },
  checkPayrollExists(month, year, employeeId = null) {
    const records = this.getPayrollRecords();
    if (employeeId) {
      return records.some(r => r.month === month && r.year === parseInt(year, 10) && r.employeeId === employeeId);
    }
    return records.some(r => r.month === month && r.year === parseInt(year, 10));
  },
  generateMonthlyPayroll(month, year) {
    const y = parseInt(year, 10);
    const mNum = new Date(`${month} 1, ${year}`).getMonth() + 1;
    const employees = this.getEmployees().filter(e => e.employmentStatus !== "Inactive");
    const structures = this.getSalaryStructures();
    const currentRecords = this.getPayrollRecords();
    const newRecords = [];
    const generatedDate = new Date().toISOString().split("T")[0];
    employees.forEach(emp => {
      // Check duplicate
      const exists = currentRecords.find(r => r.month === month && r.year === y && r.employeeId === emp.id);
      if (exists) {
        return; // skip duplicate
      }
            const struct = structures[emp.id] || this.computeDefaultSalaryStructure(emp.basicSalary);
      const attStats = this.getMonthlyAttendanceStats(emp.id, y, mNum);
      // Payable working days calculation:
      const totalDays = attStats.totalWorkingDays;
      const lop = attStats.absent + (attStats.halfDay * 0.5);
      const payableDays = Math.max(0, totalDays - lop);
      const payRatio = totalDays > 0 ? (payableDays / totalDays) : 1.0;
      // Prorated calculations based on attendance
      const proratedGross = Math.round(struct.grossSalary * payRatio);
      const proratedBasic = Math.round(struct.basicSalary * payRatio);
      const proratedAllowances = Math.round((struct.grossSalary - struct.basicSalary) * payRatio);
      
      const pf = Math.round(proratedBasic * INITIAL_DATA.salaryRules.pfPercent);
      const pt = INITIAL_DATA.salaryRules.professionalTaxFixed;
      const tds = Math.round(proratedGross * INITIAL_DATA.salaryRules.tdsRate);
      const totalDeductions = pf + pt + tds;
      const netSalary = proratedGross - totalDeductions;
      newRecords.push({
        id: `PAY-${y}-${String(mNum).padStart(2, '0')}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        month,
        year: y,
        monthYear: `${month} ${y}`,
        totalWorkingDays: totalDays,
        presentDays: payableDays,
        lopDays: lop,
        basicSalary: proratedBasic,
        hra: Math.round(struct.hra * payRatio),
        da: Math.round(struct.da * payRatio),
        conveyance: struct.conveyance,
        medical: struct.medical,
        otherAllowances: Math.round(struct.otherAllowances * payRatio),
        totalAllowances: proratedAllowances,
        grossSalary: proratedGross,
        pf,
        professionalTax: pt,
        tds,
                otherDeductions: 0,
        totalDeductions,
        netSalary,
        status: "Draft",
        generatedDate,
        approvedDate: null,
        paidDate: null,
        paymentReference: null
      });
    });
    const updated = [...currentRecords, ...newRecords];
    localStorage.setItem(this.KEYS.PAYROLL_RECORDS, JSON.stringify(updated));
    return newRecords;
  },
  approvePayroll(month, year) {
    const records = this.getPayrollRecords();
    const approvedDate = new Date().toISOString().split("T")[0];
    let count = 0;
    records.forEach(r => {
      if (r.month === month && r.year === parseInt(year, 10) && (r.status === "Draft" || r.status === "Pending")) {
        r.status = "Approved";
        r.approvedDate = approvedDate;
        count++;
      }
    });
    localStorage.setItem(this.KEYS.PAYROLL_RECORDS, JSON.stringify(records));
    return count;
  },
    markPayrollAsPaid(month, year) {
    const records = this.getPayrollRecords();
    const paidDate = new Date().toISOString().split("T")[0];
    let count = 0;
    records.forEach(r => {
      if (r.month === month && r.year === parseInt(year, 10) && r.status === "Approved") {
        r.status = "Paid";
        r.paidDate = paidDate;
        r.paymentReference = `NEFT-${year}${String(new Date().getMonth()+1).padStart(2, '0')}-${r.employeeId}`;
        count++;
      }
    });
    localStorage.setItem(this.KEYS.PAYROLL_RECORDS, JSON.stringify(records));
    return count;
  },
    // ================= UTILITIES =================
  formatINR(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
    return "₹" + Number(amount).toLocaleString("en-IN");
  },
  numberToWordsINR(amount) {
    // Standard Indian Currency Number to Words converter
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function inWords(num) {
      if ((num = num.toString()).length > 9) return 'overflow';
      let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return '';
      let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
      return str.trim();
    }
    const cleanAmount = Math.round(Number(amount));
    if (cleanAmount === 0) return "Rupees Zero Only";
    return `Rupees ${inWords(cleanAmount)} Only`;
  }
};
// Initialize immediately on load
Store.init();
