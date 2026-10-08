/** Keep the return destination inside this app, including order deep links. */
export function safeLoginRedirect(value: string | null): string {
  const fallback = "/dashboard";
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  // Browsers normalize backslashes and control characters in URLs.
  if (
    value.includes("\\") ||
    Array.from(value).some(
      (char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127,
    )
  )
    return fallback;
  try {
    const url = new URL(value, "https://dapur.invalid");
    if (url.origin !== "https://dapur.invalid" || url.pathname === "/login") {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
