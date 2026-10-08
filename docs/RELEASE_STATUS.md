# Release status

| Gate | Status | Evidence |
|---|---|---|
| GenVM lint + validation | PASS | 10 methods; 5 view, 5 write |
| Deterministic contract suite | PASS | 14 tests |
| Frontend transaction-state suite | PASS | 4 tests |
| StudioNet deployment identity | PASS | `ADVISORY_FUSE_V2`, deployer authority `NONE` |
| Two-wallet happy lifecycle | PASS | `PROPOSED → PINNED → CLEARED → PERMITTED → ACTIVATED` |
| Objective failure rollback | PASS | missing CI check rejected; proposal unchanged |
| Permit replay rollback | PASS | consumed permit rejected; target unchanged |
| Conflict/adversarial audit | PASS | V1 disagreement reproduced twice and fixed via V2 canonical evidence |
| UI reconciliation | PASS | UI reads proposal, assessment and permit from V2 contract |

Final contract: `0xA85b5871CeDb87cAe063d54A455DC6c9873D0b73` on StudioNet.

Production frontend: `https://advisoryfuse.macdonnellhodgkinson3202.workers.dev` (Cloudflare Pages on the Workers platform, version `29a3b2e5-557a-4a91-bce8-d8cc42c781ee`).
