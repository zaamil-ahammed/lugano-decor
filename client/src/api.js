const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'dc_admin_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: the login simply will not persist */
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload });
  } catch {
    throw new Error('Cannot reach the server. Check your internet connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  settings: () => request('/settings'),
  updateSettings: (body) => request('/settings', { method: 'PUT', body }),
  cars: () => request('/cars'),
  car: (id) => request(`/cars/${id}`),
  createCar: (body) => request('/cars', { method: 'POST', body }),
  updateCar: (id, body) => request(`/cars/${id}`, { method: 'PUT', body }),
  deleteCar: (id) => request(`/cars/${id}`, { method: 'DELETE' }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  checkLogin: () => request('/auth/me'),
  upload: (files) => {
    const form = new FormData();
    for (const f of files) form.append('photos', f);
    return request('/uploads', { method: 'POST', form });
  },
};
