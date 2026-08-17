export const SITE_NAME = "OPENLANE";

// Falls back to localhost for local/dev builds — set NEXT_PUBLIC_SITE_URL in
// production so sitemap/robots/canonical URLs point at the real domain.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
