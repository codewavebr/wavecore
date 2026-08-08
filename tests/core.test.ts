import assert from "node:assert/strict";
import test from "node:test";
import {
  assertActiveTenant,
  authorizePlatformAdmin,
  authorizeTenantAccess,
  authorizeTenantRole,
  canAccessTenant,
  getTenantAllowedRoutes,
  getTenantDomainFromHost,
  getTenantNavItems,
  isSuperAdmin,
  resolveTenantContext,
  selectTenantIdFromRequest,
  TenantAccessError,
} from "../src/tenant/index.js";
import {
  checkPlanLimit,
  getCurrentMonthlyBillingPeriod,
  getTrialEndsAt,
} from "../src/billing/index.js";
import { getOptionalEnv, getRequiredEnv } from "../src/config/env.js";

test("allows tenant administrators to manage tenant resources", () => {
  const context = authorizeTenantAccess({
    actor: { userId: "admin-1", tenantId: "tenant-a", role: "admin" },
  });

  assert.equal(authorizeTenantRole(context, ["admin"]), context);
});

test("rejects staff from tenant administration", () => {
  const context = authorizeTenantAccess({
    actor: { userId: "staff-1", tenantId: "tenant-a", role: "staff" },
  });

  assert.throws(
    () => authorizeTenantRole(context, ["admin"]),
    (error: unknown) =>
      error instanceof TenantAccessError &&
      error.code === "TENANT_ACCESS_DENIED" &&
      error.status === 403,
  );
});

test("allows platform administrators to manage tenant resources", () => {
  const context = authorizeTenantAccess({
    actor: { userId: "root", role: "superadmin" },
    requestedTenantId: "tenant-a",
  });

  assert.equal(authorizeTenantRole(context, ["admin"]), context);
});

test("allows platform administrator actors", () => {
  const actor = { userId: "root", role: "superadmin" };

  assert.equal(authorizePlatformAdmin(actor), actor);
  assert.equal(isSuperAdmin(actor.role), true);
});

test("rejects tenant actors from platform administration", () => {
  assert.throws(
    () => authorizePlatformAdmin({ userId: "admin-1", role: "admin" }),
    (error: unknown) =>
      error instanceof TenantAccessError &&
      error.code === "TENANT_ACCESS_DENIED" &&
      error.status === 403,
  );
});

test("uses the tenant from authenticated claims", () => {
  const context = authorizeTenantAccess({
    actor: { userId: "user-1", tenantId: "tenant-a", role: "admin" },
  });

  assert.equal(context.tenantId, "tenant-a");
  assert.equal(context.isPlatformAdmin, false);
});

test("accepts a matching client tenant hint", () => {
  const context = authorizeTenantAccess({
    actor: { userId: "user-1", tenantId: "tenant-a", role: "staff" },
    requestedTenantId: "tenant-a",
  });

  assert.equal(context.tenantId, "tenant-a");
});

test("rejects a tenant hint belonging to another tenant", () => {
  assert.throws(
    () =>
      authorizeTenantAccess({
        actor: { userId: "user-1", tenantId: "tenant-a", role: "admin" },
        requestedTenantId: "tenant-b",
      }),
    (error: unknown) =>
      error instanceof TenantAccessError &&
      error.code === "TENANT_ACCESS_DENIED" &&
      error.status === 403,
  );
});

test("requires platform admins to select a tenant", () => {
  assert.throws(
    () =>
      authorizeTenantAccess({
        actor: { userId: "root", role: "superadmin" },
      }),
    (error: unknown) =>
      error instanceof TenantAccessError && error.code === "TENANT_REQUIRED",
  );
});

test("allows a platform admin to select any tenant", () => {
  const context = authorizeTenantAccess({
    actor: { userId: "root", role: "superadmin" },
    requestedTenantId: "tenant-b",
  });

  assert.equal(context.tenantId, "tenant-b");
  assert.equal(context.isPlatformAdmin, true);
});

test("selects the explicit tenant when it matches the host tenant", () => {
  assert.equal(
    selectTenantIdFromRequest({
      explicitTenantId: "tenant-a",
      hostTenantId: "tenant-a",
    }),
    "tenant-a",
  );
});

test("selects the host tenant when no explicit tenant is provided", () => {
  assert.equal(
    selectTenantIdFromRequest({ hostTenantId: "tenant-a" }),
    "tenant-a",
  );
});

test("rejects conflicting explicit and host tenants", () => {
  assert.throws(
    () =>
      selectTenantIdFromRequest({
        explicitTenantId: "tenant-a",
        hostTenantId: "tenant-b",
      }),
    (error: unknown) =>
      error instanceof TenantAccessError &&
      error.code === "TENANT_ACCESS_DENIED" &&
      error.status === 403,
  );
});

test("accepts active tenant records", () => {
  const tenant = { id: "tenant-a", status: "active" };

  assert.equal(assertActiveTenant(tenant), tenant);
});

test("rejects missing tenant records", () => {
  assert.throws(
    () => assertActiveTenant(undefined),
    (error: unknown) =>
      error instanceof TenantAccessError &&
      error.code === "TENANT_NOT_FOUND" &&
      error.status === 404,
  );
});

test("rejects inactive tenant records", () => {
  assert.throws(
    () => assertActiveTenant({ id: "tenant-a", status: "suspended" }),
    (error: unknown) =>
      error instanceof TenantAccessError &&
      error.code === "TENANT_INACTIVE" &&
      error.status === 403,
  );
});

test("resolves tenant context through an injected tenant lookup", async () => {
  const loadedTenantIds: string[] = [];
  const context = await resolveTenantContext({
    actor: { userId: "user-1", tenantId: "tenant-a", role: "staff" },
    explicitTenantId: "tenant-a",
    loadTenantById: async (tenantId) => {
      loadedTenantIds.push(tenantId);
      return { id: tenantId, status: "active" };
    },
  });

  assert.equal(context.tenantId, "tenant-a");
  assert.deepEqual(loadedTenantIds, ["tenant-a"]);
});

test("rejects tenant context when the injected lookup returns an inactive tenant", async () => {
  await assert.rejects(
    () =>
      resolveTenantContext({
        actor: { userId: "user-1", tenantId: "tenant-a", role: "staff" },
        loadTenantById: async (tenantId) => ({
          id: tenantId,
          status: "suspended",
        }),
      }),
    (error: unknown) =>
      error instanceof TenantAccessError &&
      error.code === "TENANT_INACTIVE" &&
      error.status === 403,
  );
});

test("extracts subdomains and custom domains from a host", () => {
  assert.equal(
    getTenantDomainFromHost("studio.localhost:3000", "localhost:3000"),
    "studio",
  );
  assert.equal(
    getTenantDomainFromHost("cliente.com.br", "avexado.app"),
    "cliente.com.br",
  );
  assert.equal(
    getTenantDomainFromHost("app.avexado.app", "avexado.app"),
    undefined,
  );
});

test("allows matching tenants and platform admins via canAccessTenant", () => {
  assert.equal(canAccessTenant("tenant-a", "tenant-a", "staff"), true);
  assert.equal(canAccessTenant("tenant-a", "tenant-b", "staff"), false);
  assert.equal(canAccessTenant("tenant-a", "tenant-b", "superadmin"), true);
});

test("filters tenant navigation by role", () => {
  const navItems = [
    { title: "Home", href: "/" },
    { title: "Students", href: "/students" },
    { title: "Payments", href: "/payments" },
  ];

  assert.deepEqual(
    getTenantNavItems({ userRole: "staff", navItems }).map((item) => item.href),
    ["/", "/students"],
  );
  assert.deepEqual(getTenantAllowedRoutes({ userRole: "admin", navItems }), [
    "/",
    "/students",
    "/payments",
  ]);
});

test("checks plan limits and billing helpers", () => {
  assert.deepEqual(
    checkPlanLimit({ current: 9, limit: 10, planName: "Gratuito" }),
    {
      canAdd: true,
      current: 9,
      limit: 10,
      planName: "Gratuito",
    },
  );

  const period = getCurrentMonthlyBillingPeriod(new Date("2026-08-15T12:00:00Z"));
  assert.equal(period.periodStart.getUTCDate(), 1);
  assert.ok(getTrialEndsAt(30, new Date("2026-01-01T00:00:00Z")) > new Date("2026-01-01"));
});

test("reads required and optional environment variables", () => {
  process.env.WAVECORE_TEST_REQUIRED = "value";
  assert.equal(getRequiredEnv("WAVECORE_TEST_REQUIRED"), "value");
  assert.equal(getOptionalEnv("WAVECORE_TEST_MISSING", "fallback"), "fallback");
  delete process.env.WAVECORE_TEST_REQUIRED;

  assert.throws(() => getRequiredEnv("WAVECORE_TEST_REQUIRED"));
});
