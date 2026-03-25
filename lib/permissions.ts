import { getSession } from "./auth";

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return session;
}
