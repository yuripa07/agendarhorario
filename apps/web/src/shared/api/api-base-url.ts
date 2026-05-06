const defaultDevApiPort = "3000";

export function apiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  if (import.meta.env.DEV) {
    return devApiBaseUrl();
  }

  return `${window.location.origin}/api`;
}

function devApiBaseUrl(): string {
  const apiUrl = new URL(window.location.origin);
  apiUrl.port = defaultDevApiPort;

  return apiUrl.origin;
}
