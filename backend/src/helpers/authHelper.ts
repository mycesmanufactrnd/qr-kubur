type UserRole = "superadmin" | "admin" | "employee";

export function assertRole(role: string): asserts role is UserRole {
  if (!["superadmin", "admin", "employee"].includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
}

type PermissionSeedUser = { id: number };
type PermissionSeedOrg = { id?: number; canbedonated?: boolean; canmanagemosque?: boolean } | null | undefined;
type PermissionSeedTahfiz = { id?: number } | null | undefined;

export function buildDefaultPermissions({
  user,
  role,
  tahfizcenter,
  organisation,
}: {
  user: PermissionSeedUser;
  role: string;
  tahfizcenter?: PermissionSeedTahfiz;
  organisation?: PermissionSeedOrg;
}) {
  const permissions = [
    { slug: "permissions_edit", enabled: true, user },
    { slug: "permissions_view", enabled: true, user },
  ];

  if (role !== "admin") return permissions;

  permissions.push(
    { slug: "users_view", enabled: true, user },
    { slug: "users_create", enabled: true, user },
    { slug: "users_edit", enabled: true, user },
    { slug: "users_delete", enabled: true, user }
  );

  permissions.push(
    { slug: "posts_view", enabled: true, user },
    { slug: "posts_create", enabled: true, user },
    { slug: "posts_edit", enabled: true, user },
    { slug: "posts_delete", enabled: true, user }
  );

  if (tahfizcenter?.id) {
    permissions.push(
      { slug: "donations_view", enabled: true, user },
      { slug: "donations_verify", enabled: true, user },
      { slug: "donations_reject", enabled: true, user }
    );

    permissions.push(
      { slug: "tahfiz_view", enabled: true, user },
      { slug: "tahfiz_create", enabled: true, user },
      { slug: "tahfiz_edit", enabled: true, user },
      { slug: "tahfiz_delete", enabled: true, user }
    );

    permissions.push(
      { slug: "tahlil_view", enabled: true, user },
      { slug: "tahlil_accept", enabled: true, user },
      { slug: "tahlil_reject", enabled: true, user },
      { slug: "tahlil_complete", enabled: true, user }
    );
  } else if (organisation?.id) {
    permissions.push(
      { slug: "organisations_view", enabled: true, user },
      { slug: "organisations_create", enabled: true, user },
      { slug: "organisations_edit", enabled: true, user },
      { slug: "organisations_delete", enabled: true, user }
    );

    if (organisation.canbedonated) {
      permissions.push(
        { slug: "donations_view", enabled: true, user },
        { slug: "donations_verify", enabled: true, user },
        { slug: "donations_reject", enabled: true, user }
      );
    }

    if (organisation.canmanagemosque) {
      permissions.push(
        { slug: "mosques_view", enabled: true, user },
        { slug: "mosques_create", enabled: true, user },
        { slug: "mosques_edit", enabled: true, user },
        { slug: "mosques_delete", enabled: true, user }
      );
    }
  }

  return permissions;
}
