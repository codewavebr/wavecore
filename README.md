# @codewavebr/wavecore

Shared product and infrastructure foundation for Code Wave projects.

WaveCore owns reusable business and platform concerns:

- `auth`: shared auth contracts and permission helpers.
- `tenant`: tenant contracts, authorization, resolution, route access helpers, and multi-tenant utilities.
- `billing`: billing contracts and plan helpers.
- `config`: shared runtime configuration helpers.
- `next`: optional server-only Next.js adapter for tenant context.

WaveCore should not export React components, CSS, or layout primitives. Those belong in `@codewavebr/wavekit`.

## Package format

- `@codewavebr/wavecore`: core contracts and helpers without framework coupling.
- `@codewavebr/wavecore/next`: factory of a server-only Next.js tenant adapter.

The package does not know about app auth tables or schema. The app injects those dependencies.

## Publish

Publishing happens automatically when a GitHub Release is published.
The workflow syncs `package.json` version from the release tag (e.g. `v0.1.0`)
and publishes `@codewavebr/wavecore` to the public npm registry
(`https://registry.npmjs.org`). No install auth is required for consumers.

The repository secret `NPM_TOKEN` (Automation token with publish rights on the
`@codewavebr` npm org) must be set for the publish workflow.

## Tenant resolution

```ts
import { resolveTenantContext } from "@codewavebr/wavecore";

const context = await resolveTenantContext({
  actor: { userId: "user-1", role: "admin", tenantId: "tenant-a" },
  explicitTenantId: "tenant-a",
  loadTenantById: async (tenantId) => ({ id: tenantId, status: "active" }),
});
```

## Next.js adapter

```ts
import { createNextTenantContextAdapter } from "@codewavebr/wavecore/next";

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
