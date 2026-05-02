import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { getActiveOrgId } from "./lib/orgFetch";

// Inject X-Org-Id header into every /api request so the backend knows
// which org the user is currently operating in when they're in multiple orgs.
const _origFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const orgId = getActiveOrgId();
  if (orgId && typeof input === "string" && input.includes("/api/")) {
    const headers = new Headers(init?.headers);
    headers.set("x-org-id", orgId);
    init = { ...(init ?? {}), headers };
  }
  return _origFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
