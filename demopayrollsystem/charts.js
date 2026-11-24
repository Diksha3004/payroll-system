/**
 * Payroll Management System - Chart.js Visualizations
 */
const Charts = {
  payrollExpenditureChart: null,
  departmentChart: null,
  attendanceChart: null,
  initDashboardCharts() {
    this.renderPayrollExpenditureChart();
    this.renderDepartmentChart();
  },
  renderPayrollExpenditureChart() {
    const ctx = document.getElementById("payrollExpenditureCanvas");
    if (!ctx) return;
    if (this.payrollExpenditureChart) {
      this.payrollExpenditureChart.destroy();
    }
    const history = INITIAL_DATA.historicalPayroll;
    const labels = history.map(h => h.month);
    const grossData = history.map(h => h.grossPayroll);
    const netData = history.map(h => h.netPayroll);
    this.payrollExpenditureChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Gross Payroll (₹)",
            data: grossData,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.08)",
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: "#2563eb",
            pointRadius: 4,
            pointHoverRadius: 6
          },
                    {
            label: "Net Disbursed (₹)",
            data: netData,
            borderColor: "#059669",
            backgroundColor: "rgba(5, 150, 105, 0.04)",
            borderWidth: 2.5,
            borderDash: [5, 5],
            tension: 0.35,
            fill: false,
            pointBackgroundColor: "#059669",
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 14,
              font: { family: "'Inter', sans-serif", size: 12, weight: "500" }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += Store.formatINR(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
                scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function (val) {
                return "₹" + (val / 100000).toFixed(1) + "L";
              },
              font: { family: "'Inter', sans-serif", size: 11 }
            },
            grid: { color: "rgba(226, 232, 240, 0.6)" }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "'Inter', sans-serif", size: 11 } }
          }
        }
      }
    });
  },
    renderDepartmentChart() {
    const ctx = document.getElementById("departmentEmployeesCanvas");
    if (!ctx) return;
    if (this.departmentChart) {
      this.departmentChart.destroy();
    }
    const departments = Store.getDepartments();
    const employees = Store.getEmployees();
    const deptCounts = {};
    departments.forEach(d => { deptCounts[d.name] = 0; });
    employees.forEach(e => {
      if (deptCounts[e.department] !== undefined) {
        deptCounts[e.department]++;
      } else {
        deptCounts[e.department] = 1;
      }
    });
        const labels = Object.keys(deptCounts);
    const data = Object.values(deptCounts);
    const bgColors = [
      "#2563eb", "#0284c7", "#0d9488", "#10b981",
      "#f59e0b", "#f97316", "#8b5cf6", "#ec4899"
    ];
    this.departmentChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              font: { family: "'Inter', sans-serif", size: 11 }
            }
          },
                    tooltip: {
            callbacks: {
              label: function (context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const val = context.parsed;
                const pct = ((val / total) * 100).toFixed(1);
                return ` ${context.label}: ${val} staff (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },
    renderAttendanceTrendChart(canvasId, stats) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Present", "Half Day", "On Leave", "Absent"],
        datasets: [{
          label: "Days",
          data: [stats.present, stats.halfDay, stats.onLeave, stats.absent],
          backgroundColor: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
          x: { grid: { display: false } }
        }
      }
    });
  }
};