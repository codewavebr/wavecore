export type TenantActor = {
  userId: string;
  role?: string | null;
  tenantId?: string | null;
};

export type TenantContext = {
  tenantId: string;
  actor: TenantActor;
  isPlatformAdmin: boolean;
};

export type TenantAccessInput = {
  actor: TenantActor;
  requestedTenantId?: string | null;
};

export type TenantSelectionInput = {
  explicitTenantId?: string | null;
  hostTenantId?: string | null;
};

export type TenantStatusRecord = {
  id: string;
  status: string;
};

export type TenantContextResolverInput = TenantSelectionInput & {
  actor: TenantActor;
  loadTenantById: (
    tenantId: string,
  ) => Promise<TenantStatusRecord | null | undefined>;
};

export class TenantAccessError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "TENANT_REQUIRED"
      | "TENANT_ACCESS_DENIED"
      | "TENANT_NOT_FOUND"
      | "TENANT_INACTIVE",
    message: string,
    public readonly status: 401 | 403 | 404 = 403,
  ) {
    super(message);
    this.name = "TenantAccessError";
  }
}

export function isPlatformAdmin(role?: string | null) {
  return role === "superadmin";
}

export function authorizeTenantRole(
  context: TenantContext,
  allowedRoles: readonly string[],
) {
  if (
    !context.isPlatformAdmin &&
    (!context.actor.role || !allowedRoles.includes(context.actor.role))
  ) {
    throw new TenantAccessError(
      "TENANT_ACCESS_DENIED",
      "Usuário não possui permissão para esta operação",
      403,
    );
  }

  return context;
}

export function authorizePlatformAdmin(actor: TenantActor) {
  if (!isPlatformAdmin(actor.role)) {
    throw new TenantAccessError(
      "TENANT_ACCESS_DENIED",
      "Acesso restrito ao administrador da plataforma",
      403,
    );
  }

  return actor;
}

export function selectTenantIdFromRequest({
  explicitTenantId,
  hostTenantId,
}: TenantSelectionInput) {
  const normalizedExplicitTenantId = explicitTenantId || undefined;
  const normalizedHostTenantId = hostTenantId || undefined;

  if (
    normalizedExplicitTenantId &&
    normalizedHostTenantId &&
    normalizedExplicitTenantId !== normalizedHostTenantId
  ) {
    throw new TenantAccessError(
      "TENANT_ACCESS_DENIED",
      "O tenant solicitado não corresponde ao domínio atual",
      403,
    );
  }

  return normalizedExplicitTenantId || normalizedHostTenantId;
}

export function assertActiveTenant(
  tenant: TenantStatusRecord | null | undefined,
) {
  if (!tenant) {
    throw new TenantAccessError(
      "TENANT_NOT_FOUND",
      "Tenant não encontrado",
      404,
    );
  }

  if (tenant.status !== "active") {
    throw new TenantAccessError("TENANT_INACTIVE", "Tenant inativo", 403);
  }

  return tenant;
}

export async function resolveTenantContext({
  actor,
  explicitTenantId,
  hostTenantId,
  loadTenantById,
}: TenantContextResolverInput) {
  const context = authorizeTenantAccess({
    actor,
    requestedTenantId: selectTenantIdFromRequest({
      explicitTenantId,
      hostTenantId,
    }),
  });

  await loadTenantById(context.tenantId).then(assertActiveTenant);

  return context;
}

export function getTenantDomainFromHost(host: string, rootDomain: string) {
  const normalizedHost = host.trim().toLowerCase();
  const normalizedRoot = rootDomain.trim().toLowerCase();

  if (
    !normalizedHost ||
    normalizedHost === normalizedRoot ||
    normalizedHost === `www.${normalizedRoot}` ||
    normalizedHost === `app.${normalizedRoot}`
  ) {
    return undefined;
  }

  if (normalizedHost.endsWith(`.${normalizedRoot}`)) {
    const subdomain = normalizedHost.slice(0, -(normalizedRoot.length + 1));
    return subdomain && subdomain !== "www" && subdomain !== "app"
      ? subdomain
      : undefined;
  }

  return normalizedHost.split(":")[0] || undefined;
}

/**
 * Selects a tenant only from authenticated claims. A client supplied tenant ID
 * is a hint that must match those claims, except for platform administrators.
 */
export function authorizeTenantAccess({
  actor,
  requestedTenantId,
}: TenantAccessInput): TenantContext {
  const platformAdmin = isPlatformAdmin(actor.role);
  const normalizedRequest = requestedTenantId || undefined;

  if (platformAdmin) {
    if (!normalizedRequest) {
      throw new TenantAccessError(
        "TENANT_REQUIRED",
        "Um tenant deve ser selecionado",
        403,
      );
    }

    return {
      tenantId: normalizedRequest,
      actor,
      isPlatformAdmin: true,
    };
  }

  if (!actor.tenantId) {
    throw new TenantAccessError(
      "TENANT_ACCESS_DENIED",
      "Usuário não possui acesso a um tenant",
      403,
    );
  }

  if (normalizedRequest && normalizedRequest !== actor.tenantId) {
    throw new TenantAccessError(
      "TENANT_ACCESS_DENIED",
      "Usuário não possui acesso ao tenant solicitado",
      403,
    );
  }

  return {
    tenantId: actor.tenantId,
    actor,
    isPlatformAdmin: false,
  };
}
