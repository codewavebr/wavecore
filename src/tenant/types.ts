export type WaveTenant = {
  id: string;
  name: string;
  subdomain?: string | null;
  customDomain?: string | null;
  themeColor?: string | null;
};

export type WaveTenantRoute = {
  href: string;
  roles?: string[];
};

export type WaveTenantNavItem = {
  title?: string;
  href?: string;
  position?: "top" | "bottom";
  items?: WaveTenantNavItem[];
};

export type WaveTenantRole = "admin" | "staff" | "superadmin" | string;
