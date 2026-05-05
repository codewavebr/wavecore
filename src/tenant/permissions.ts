import type { WaveTenantNavItem } from "./types";

export const defaultTenantAdminOnlyRoutes = ["/payments", "/settings"];

export const defaultTenantStaffRoutes = [
  "/",
  "/students",
  "/classes",
  "/teachers",
  "/schedule",
  "/attendance",
  "/reports",
];

export function flattenTenantNavRoutes(navItems: WaveTenantNavItem[]) {
  return navItems
    .flatMap((item) => [
      ...(typeof item.href === "string" ? [item.href] : []),
      ...(item.items
        ? item.items.map((subItem) => subItem.href).filter(Boolean)
        : []),
    ])
    .filter((href): href is string => Boolean(href));
}

export function getTenantAllowedRoutes({
  userRole,
  navItems,
  staffRoutes = defaultTenantStaffRoutes,
}: {
  userRole?: string | null;
  navItems: WaveTenantNavItem[];
  staffRoutes?: string[];
}) {
  if (userRole === "admin" || userRole === "superadmin") {
    return flattenTenantNavRoutes(navItems);
  }

  if (userRole === "staff") {
    return staffRoutes;
  }

  return ["/"];
}

export function getTenantNavItems<TNavItem extends WaveTenantNavItem>({
  userRole,
  navItems,
  staffRoutes = defaultTenantStaffRoutes,
  adminOnlyRoutes = defaultTenantAdminOnlyRoutes,
}: {
  userRole?: string | null;
  navItems: TNavItem[];
  staffRoutes?: string[];
  adminOnlyRoutes?: string[];
}) {
  if (userRole === "admin" || userRole === "superadmin") {
    return navItems;
  }

  if (userRole === "staff") {
    return navItems.filter(
      (item) =>
        typeof item.href === "string" &&
        staffRoutes.includes(item.href) &&
        !adminOnlyRoutes.includes(item.href),
    );
  }

  return navItems.filter((item) => item.href === "/");
}
