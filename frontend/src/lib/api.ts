/**
 * Returns the API base URL without trailing slash.
 * Prevents double slashes when concatenating paths like /api/public/...
 */
export function getApiBase(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "";
  return url.replace(/\/+$/, "");
}
