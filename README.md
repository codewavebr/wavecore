# @codewave/wavecore

Shared product and infrastructure foundation for Code Wave projects.

WaveCore owns reusable business and platform concerns:

- `auth`: shared auth contracts and permission helpers.
- `tenant`: tenant contracts, route access helpers, and multi-tenant utilities.
- `billing`: billing contracts and plan helpers.
- `config`: shared runtime configuration helpers.

WaveCore should not export React components, CSS, or layout primitives. Those belong in `@codewave/wavekit`.
