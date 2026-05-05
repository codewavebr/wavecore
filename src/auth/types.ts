export type WaveRole = "admin" | "superadmin" | "staff" | string;

export type WaveAuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: WaveRole | null;
  tenantId?: string | null;
};

export type WaveSessionLike = {
  user?: WaveAuthUser | null;
} | null;
