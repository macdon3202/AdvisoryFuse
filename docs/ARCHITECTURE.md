# Architecture and invariants

```text
target owner proposes immutable coordinates
        │
        ▼
objective five-source snapshot ── mismatch/advisory/CI failure ──► reject
        │ exact digests
        ▼
GenLayer semantic assessment ── unknown/source change ──► UNRESOLVED
        │                         disagreement/risk ──────► QUARANTINED
        ▼ CLEAR
single-use 10-minute permit
        │ exact target + next revision + release digest
        ▼
atomic activation and permit consumption
```

## Safety invariants

1. A mutable branch or tag is never an identity; the contract requires a 40-character commit SHA.
2. npm package, repository, manifest and version must agree before AI is consulted.
3. CI success is accepted only when its `head_sha` is the proposed commit.
4. Any OSV advisory blocks the source snapshot.
5. Assessment re-fetches every source and requires the complete digest set to equal the pinned snapshot.
6. Semantic unknowns and malformed model output fail closed.
7. A permit binds the exact target, next revision, release digest and expiry; consumption is atomic and single-use.
8. Deployment creates no owner/admin capability. Target ownership originates from the first proposal, not deployment.
