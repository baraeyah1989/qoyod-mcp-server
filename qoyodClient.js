const BASE_URL = "https://api.qoyod.com/2.0";

/**
 * Thin wrapper around the Qoyod REST API.
 * Docs: https://apidoc.qoyod.com/
 * Auth: every request needs an `API-KEY` header (from Qoyod > Settings > General Settings).
 */
export async function qoyodRequest({ method = "GET", path, query, body }) {
  const apiKey = process.env.QOYOD_API_KEY;
  if (!apiKey) {
    throw new Error(
      "QOYOD_API_KEY is not set. Configure it as an environment variable on your hosting provider."
    );
  }

  if (!path || !path.startsWith("/")) {
    throw new Error('`path` must start with "/", e.g. "/customers" or "/invoices/123"');
  }

  const url = new URL(BASE_URL + path);
  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const init = {
    method,
    headers: {
      "API-KEY": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };

  if (body !== undefined && method !== "GET" && method !== "DELETE") {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), init);
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const err = new Error(`Qoyod API error ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }

  return parsed;
}
