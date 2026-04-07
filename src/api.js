const API_URL = process.env.REACT_APP_API_URL || 'https://gainsys-api.onrender.com/api';

export const getToken = () => localStorage.getItem('gainsys_admin_token');
export const setToken = (t) => localStorage.setItem('gainsys_admin_token', t);
export const removeToken = () => localStorage.removeItem('gainsys_admin_token');
export const getUser = () => { const u = localStorage.getItem('gainsys_admin_user'); return u ? JSON.parse(u) : null; };
export const setUser = (u) => localStorage.setItem('gainsys_admin_user', JSON.stringify(u));
export const removeUser = () => localStorage.removeItem('gainsys_admin_user');

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (endpoint.includes('/payroll/export') && res.ok) return res.blob();
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ralat tidak diketahui');
  return data;
}

// Auth
export const login = async (email, password) => {
  const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token); setUser(data.user); return data;
};
export const logout = () => { removeToken(); removeUser(); };

// Attendance
export const getAllToday = (date) => apiFetch(`/attendance/all${date ? `?date=${date}` : ''}`);
export const getMonthlyReport = (month) => apiFetch(`/attendance/report${month ? `?month=${month}` : ''}`);

// Leave
export const getPendingLeaves = () => apiFetch('/leave/pending');
export const approveLeave = (id) => apiFetch(`/leave/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
export const rejectLeave = (id, reason) => apiFetch(`/leave/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });

// Overtime
export const getPendingOvertime = () => apiFetch('/overtime/pending');
export const approveOvertime = (id) => apiFetch(`/overtime/${id}/approve`, { method: 'POST', body: JSON.stringify({}) });
export const rejectOvertime = (id) => apiFetch(`/overtime/${id}/reject`, { method: 'POST', body: JSON.stringify({}) });

// Payroll
export const getPayrollPreview = (month) => apiFetch(`/payroll/preview${month ? `?month=${month}` : ''}`);
export const exportPayrollCSV = async (month) => {
  const blob = await apiFetch(`/payroll/export${month ? `?month=${month}` : ''}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `gainsys_payroll_${month}.csv`; a.click();
  URL.revokeObjectURL(url);
};

// Users
export const getUsers = () => apiFetch('/users');
export const createUser = (data) => apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });

// Service Management
export const getCustomers = () => apiFetch('/customers');
export const getContracts = () => apiFetch('/contracts');
export const getCases = () => apiFetch('/cases');
export const createCustomer = (data) => apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) });
export const createContract = (data) => apiFetch('/contracts', { method: 'POST', body: JSON.stringify(data) });
export const createCase = (data) => apiFetch('/cases', { method: 'POST', body: JSON.stringify(data) });
