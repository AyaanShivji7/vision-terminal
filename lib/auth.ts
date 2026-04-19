import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Admin gating for Vision Terminal.
 *
 * Two paths are supported, in order of preference:
 *
 *   1. Clerk publicMetadata.role === "admin"
 *      Set from the Clerk dashboard (or the Backend API) with no redeploy.
 *      This is the recommended path for production.
 *
 *   2. ADMIN_USER_IDS env allowlist (comma-separated Clerk user IDs)
 *      Useful for bootstrapping the first admin or as a break-glass path
 *      when Clerk metadata can't be read.
 *
 * A user only needs to pass either check.
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

async function isClerkRoleAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user?.publicMetadata as { role?: unknown } | null | undefined)
      ?.role;
    return typeof role === "string" && role.toLowerCase() === "admin";
  } catch (error) {
    // Missing/invalid CLERK_SECRET_KEY, network issue, etc. We don't want
    // a transient Clerk outage to silently open the door, but we also
    // don't want it to lock out the env-allowlisted admin.
    console.error("Clerk role lookup failed:", error);
    return false;
  }
}

export type AdminAuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Ensures the request is from an authenticated Clerk user who is either
 * (a) carrying publicMetadata.role === "admin" in Clerk, or
 * (b) listed in the ADMIN_USER_IDS env allowlist.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const { userId } = await auth();

  if (!userId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const adminIds = getAdminUserIds();
  if (adminIds.has(userId)) {
    return { ok: true, userId };
  }

  if (await isClerkRoleAdmin(userId)) {
    return { ok: true, userId };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}
