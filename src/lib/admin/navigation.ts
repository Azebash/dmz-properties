export function safeAdminDestination(value: string | undefined) {
  if (!value) return "/admin";

  try {
    const destination = new URL(value, "https://dmz.invalid");
    if (destination.origin !== "https://dmz.invalid") return "/admin";
    const path = `${destination.pathname}${destination.search}`;
    return destination.pathname === "/admin" || destination.pathname.startsWith("/admin/")
      ? path
      : "/admin";
  } catch {
    return "/admin";
  }
}
