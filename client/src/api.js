// Small wrapper around fetch for the Express API.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  stats: () => request('/stats'),
  listEmployees: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/employees${qs ? `?${qs}` : ''}`);
  },
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (body) => request('/employees', { method: 'POST', body }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  offboard: (id, body) => request(`/employees/${id}/offboard`, { method: 'POST', body }),
  setTaskDone: (id, done) => request(`/tasks/${id}`, { method: 'PATCH', body: { done } }),
};
