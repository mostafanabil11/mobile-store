import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default config: prerendered shells are served from static assets; store data is always fetched fresh.
export default defineCloudflareConfig();
