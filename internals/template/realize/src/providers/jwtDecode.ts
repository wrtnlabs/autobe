export function jwtDecode(token: string): { id: string; type: string } {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) throw new Error("Invalid token format");

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    const decoded = JSON.parse(jsonPayload) as unknown;

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof (decoded as any).id === "string" &&
      typeof (decoded as any).type === "string"
    ) {
      return {
        id: (decoded as { id: string }).id,
        type: (decoded as { type: string }).type,
      };
    }

    throw new Error("Invalid token payload");
  } catch {
    throw new Error("Failed to decode JWT token");
  }
}
