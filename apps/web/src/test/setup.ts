import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { resetServerState, server } from "./server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  resetServerState();
  window.history.replaceState(null, "", "/");
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
