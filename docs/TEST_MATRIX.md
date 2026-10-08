# Test matrix

| ID | Path | Expected invariant | Test |
|---|---|---|---|
| H1 | Valid exact sources → clear → permit → activate | One permit activates one exact revision once | `test_happy_path_consumes_exact_permit` |
| R1 | Deployer calls review action | No special authority; same rules as any reviewer | `test_deployer_has_no_authority_and_reviewer_is_permissionless` |
| F1 | OSV advisory / stale CI / bad manifest / wrong repo | Source snapshot rejected | `test_deterministic_source_failures_cannot_pin` |
| C1 | Source changes after snapshot | Assessment becomes `UNRESOLVED` | `test_source_change_after_pin_is_unresolved` |
| C2 | Semantic conflict or unknown mandatory fact | `QUARANTINED` or `UNRESOLVED`, never permit | `test_semantic_negative_and_cross_field_results_fail_closed` |
| A1 | Other wallet attempts next target revision | Owner binding rejects it | `test_target_owner_and_revision_are_enforced` |
| A2 | Reuse or expired permit | Activation rejects without changing target | `test_permit_replay_and_expiry_preserve_target` |
| A3 | Criteria contains prompt injection | Strict schema and fail-closed result | `test_prompt_injection_in_criteria_cannot_bypass_schema` |
| UI1 | Receipt says finalized but consensus disagrees | UI marks failed, never reports success | `transactions.test.mjs` |
| UI2 | Wallet/chain/version drift | UI blocks before transaction submission | `transactions.test.mjs` + `genlayer.js` |
