import axios from "axios";
import { getAccessToken } from "./session";

export const api = axios.create({
  baseURL:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "https://coffee-4c-be.onrender.com/",
  timeout: 15000,
});

api.interceptors.request.use(async (cfg) => {
  const tk = await getAccessToken();
  if (tk) cfg.headers.Authorization = `Bearer ${tk}`;
  return cfg;
});
