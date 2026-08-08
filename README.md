# @codewave/wavecore

Shared product and infrastructure foundation for Code Wave projects.

WaveCore owns reusable business and platform concerns:

- `auth`: shared auth contracts and permission helpers.
- `tenant`: tenant contracts, authorization, resolution, route access helpers, and multi-tenant utilities.
- `billing`: billing contracts and plan helpers.
- `config`: shared runtime configuration helpers.
- `next`: optional server-only Next.js adapter for tenant context.

WaveCore should not export React components, CSS, or layout primitives. Those belong in `@codewave/wavekit`.

## Package format

- `@codewave/wavecore`: core contracts and helpers without framework coupling.
- `@codewave/wavecore/next`: factory of a server-only Next.js tenant adapter.

The package does not know about app auth tables or schema. The app injects those dependencies.

## Publish

Prepared for GitHub Packages under the `@codewave` scope.
Run `bun run build` before publishing and use `npm publish` after authenticating to
`https://npm.pkg.github.com`.

## Tenant resolution

```ts
import { resolveTenantContext } from "@codewave/wavecore";

const context = await resolveTenantContext({
  actor: { userId: "user-1", role: "admin", tenantId: "tenant-a" },
  explicitTenantId: "tenant-a",
  loadTenantById: async (tenantId) => ({ id: tenantId, status: "active" }),
});
```

## Next.js adapter

```ts
import { createNextTenantContextAdapter } from "@codewave/wavecore/next";

export const { requireTenantContext, requirePlatformAdmin } =
  createNextTenantContextAdapter({
    authenticate: async (request) => requireAuth(request),
    findTenantByDomain: async (domain) => findTenantByDomain(domain),
    loadTenantById: async (tenantId) => loadTenantById(tenantId),
    getRootDomain: () => process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000",
  });
```

## Scripts

```bash
bun install
bun run test
bun run typecheck
bun run build
```
