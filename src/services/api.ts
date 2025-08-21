// src/services/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (res) => {
    return res;
  },
  (err) => {
    if (err.code === "ERR_NETWORK") console.error("[ERR_NETWORK]", err.message);
    if (err.response)
      console.error("[ERR_RES]", err.response.status, err.response.data);
    else console.error("[ERR]", err.message);
    return Promise.reject(err);
  }
);
