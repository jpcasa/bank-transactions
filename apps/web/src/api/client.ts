import createClient from "openapi-fetch";
import type { paths } from "./schema";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export const api = createClient<paths>({
  baseUrl: API_URL,
  // Resolve fetch lazily so interceptors (e.g. MSW in tests) installed after import are honoured.
  fetch: (request) => globalThis.fetch(request),
});
