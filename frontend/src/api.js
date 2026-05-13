import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("netflop_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getStoredUser() {
  const raw = localStorage.getItem("netflop_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession({ token, user }) {
  localStorage.setItem("netflop_token", token);
  localStorage.setItem("netflop_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("netflop_token");
  localStorage.removeItem("netflop_user");
}
