export function isSuperAdmin(userRole?: string | null) {
  return userRole === "superadmin";
}

export function canAccessTenant(
  userTenantId?: string | null,
  currentTenantId?: string | null,
  userRole?: string | null,
) {
  if (isSuperAdmin(userRole)) {
    return true;
  }

  return Boolean(userTenantId && currentTenantId && userTenantId === currentTenantId);
}
