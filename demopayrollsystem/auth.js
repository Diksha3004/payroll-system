/**
 * Payroll Management System - Role-Based Authentication & Session Management
 */
const Auth = {
  USERS: {
    admin: {
      username: "admin",
      password: "admin123",
      role: "admin",
      fullName: "System Administrator",
      designation: "Chief Operating Officer",
      department: "Administration",
      email: "admin@zenithglobal.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      employeeId: null
    },
    hr: {
      username: "hr",
      password: "hr123",
      role: "hr",
      fullName: "Priya Nair",
      designation: "Senior HR Manager",
      department: "HR",
      email: "priya.nair@zenithglobal.com",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      employeeId: "EMP-1002"
    },
    employee: {
      username: "employee",
      password: "emp123",
      role: "employee",
      fullName: "Rahul Sharma",
      designation: "Senior Software Engineer",
      department: "IT",
      email: "rahul.sharma@zenithglobal.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      employeeId: "EMP-1001"
    }
  },
    getCurrentUser() {
    const raw = localStorage.getItem(Store.KEYS.CURRENT_USER);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  login(username, password) {
    const cleanUser = (username || "").trim().toLowerCase();
    const target = this.USERS[cleanUser];
    if (target && target.password === password) {
      const session = { ...target };
      delete session.password;
      localStorage.setItem(Store.KEYS.CURRENT_USER, JSON.stringify(session));
      return { success: true, user: session };
    }
    return { success: false, message: "Invalid username or password. Please use the demo credentials provided." };
  },
    quickLogin(role) {
    const target = this.USERS[role];
    if (target) {
      const session = { ...target };
      delete session.password;
      localStorage.setItem(Store.KEYS.CURRENT_USER, JSON.stringify(session));
      return { success: true, user: session };
    }
    return { success: false };
  },
  logout() {
    localStorage.removeItem(Store.KEYS.CURRENT_USER);
    window.location.reload();
  },
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === "admin";
  },
  isHR() {
    const user = this.getCurrentUser();
    return user && (user.role === "hr" || user.role === "admin");
  },
  isEmployee() {
    const user = this.getCurrentUser();
    return user && user.role === "employee";
  },
    canApprovePayroll() {
    // Only Admin can give final approval to payroll
    return this.isAdmin();
  },
  canAccessAdminSettings() {
    return this.isAdmin();
  }
};