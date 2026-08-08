import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  authorizePlatformAdmin,
  getTenantDomainFromHost,
  resolveTenantContext,
  TenantAccessError,
  type TenantActor,
  type TenantContext,
  type TenantStatusRecord,
} from "./tenant/resolve";

export type NextAuthenticatedUser = {
  id?: unknown;
  sub?: unknown;
  role?: unknown;
  tenantId?: unknown;
};

type DomainTenantRecord = {
  id: string;
};

export type NextTenantContextAdapterConfig = {
  authenticate: (request: NextRequest) => Promise<NextAuthenticatedUser>;
  findTenantByDomain: (
    domain: string,
  ) => Promise<DomainTenantRecord | null | undefined>;
  loadTenantById: (
    tenantId: string,
  ) => Promise<TenantStatusRecord | null | undefined>;
  getRootDomain: () => string;
};

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toTenantActor(user: NextAuthenticatedUser): TenantActor {
  const userId = asOptionalString(user.id) || asOptionalString(user.sub);
  if (!userId) {
    throw new TenantAccessError(
      "UNAUTHENTICATED",
      "Identidade autenticada inválida",
      401,
    );
  }

  return {
    userId,
    role: asOptionalString(user.role),
    tenantId: asOptionalString(user.tenantId),
  };
}

function getTenantHint(request: NextRequest) {
  return (
    request.headers.get("x-tenant-id") ||
    request.nextUrl.searchParams.get("tenantId") ||
    undefined
  );
}

export function createNextTenantContextAdapter({
  authenticate,
  findTenantByDomain,
  loadTenantById,
  getRootDomain,
}: NextTenantContextAdapterConfig) {
  async function authenticateActor(request: NextRequest) {
    try {
      return toTenantActor(await authenticate(request));
    } catch (error) {
      if (error instanceof TenantAccessError) throw error;
      throw new TenantAccessError("UNAUTHENTICATED", "Não autenticado", 401);
    }
  }

  return {
    async requireTenantContext(
      request: NextRequest,
      requestedTenantId?: string | null,
    ): Promise<TenantContext> {
      const explicitTenantId = requestedTenantId || getTenantHint(request);
      const tenantDomain = getTenantDomainFromHost(
        request.headers.get("host") || "",
        getRootDomain(),
      );
      const hostTenant = tenantDomain
        ? await findTenantByDomain(tenantDomain)
        : undefined;

      return resolveTenantContext({
        actor: await authenticateActor(request),
        explicitTenantId,
        hostTenantId: hostTenant?.id,
        loadTenantById,
      });
    },

    async requirePlatformAdmin(request: NextRequest) {
      return authorizePlatformAdmin(await authenticateActor(request));
    },
  };
}

export function tenantErrorResponse(error: unknown) {
  if (error instanceof TenantAccessError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  console.error("Erro ao resolver contexto do tenant:", error);
  return NextResponse.json(
    { error: "Erro interno do servidor" },
    { status: 500 },
  );
}
