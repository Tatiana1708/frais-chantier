import { hc } from "hono/client";
import Constants from "expo-constants";
import type { AppType } from "@template/web";
import { getToken } from "./auth";

const baseUrl = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL;

const client = hc<AppType>(baseUrl!, {
  headers: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>);
  },
});

export const api = client.api;
