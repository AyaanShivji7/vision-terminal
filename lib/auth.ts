import { auth } from "@clerk/nextjs/server";

/**
 * Returns the set of Clerk user IDs allowed to hit admin-only routes.
 *
 * Configure via the ADMIN_USER_IDS environment variable — a comma-separated
 * list of Clerk user IDs (e.g. "user_abc123,user_def456"). Whitespace is
 * ignored. If the variable is unset or empty, no one is an admin.
 */
function getAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";

  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Ensures the current request is from an authenticated Clerk user whose
 * userId is in the ADMIN_USER_IDS allowlist. Returns a discriminated union
 * that route handlers can turn directly into a NextResponse.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const adminIds = getAdminUserIds();

  if (!adminIds.has(userId)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId };
}
