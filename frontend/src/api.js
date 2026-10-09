// All communication with the FastAPI backend lives in this one file.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = new URLSearchParams(form); // login endpoint expects form data
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const res = await fetch(BASE + path, { method, headers, body: payload });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Expired/invalid token -> send the user back to login
    if (res.status === 401 && token) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    const detail = data?.detail;
    throw new Error(Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : detail || "Something went wrong");
  }
  return data;
}

export const api = {
  // auth
  register: (name, email, password) => request("/auth/register", { method: "POST", body: { name, email, password } }),
  login: (email, password) => request("/auth/login", { method: "POST", form: { username: email, password } }),
  me: () => request("/auth/me"),

  // projects
  listProjects: () => request("/projects"),
  createProject: (body) => request("/projects", { method: "POST", body }),
  getProject: (id) => request(`/projects/${id}`),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  addMember: (id, email) => request(`/projects/${id}/members`, { method: "POST", body: { email } }),

  // tasks
  listTasks: (projectId, filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    return request(`/projects/${projectId}/tasks?${params}`);
  },
  createTask: (projectId, body) => request(`/projects/${projectId}/tasks`, { method: "POST", body }),
  updateTask: (id, body) => request(`/tasks/${id}`, { method: "PUT", body }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
