import axios from "axios";
import { getEMSFromURL } from "../pages/ems";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
});

api.interceptors.request.use((config) => {
  const EMS = getEMSFromURL();
  if (EMS) {
    if (config.headers) {
      (config.headers as Record<string, string>)['EMS'] = EMS;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === "ERR_NETWORK") console.error("[ERR_NETWORK]", err.message);
    if (err.response)
      console.error("[ERR_RES]", err.response.status, err.response.data);
    else console.error("[ERR]", err.message);
    return Promise.reject(err);
  }
);
