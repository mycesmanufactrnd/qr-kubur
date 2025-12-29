type UserRole = "superadmin" | "admin" | "employee";

export function assertRole(role: string): asserts role is UserRole {
  if (!["superadmin", "admin", "employee"].includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
}
