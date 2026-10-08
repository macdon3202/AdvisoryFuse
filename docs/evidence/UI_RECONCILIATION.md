# UI reconciliation

Production bundle was loaded against StudioNet V2 contract `0xA85b5871CeDb87cAe063d54A455DC6c9873D0b73` after live E2E completion.

The public review station loaded proposal `#1` through contract view calls and displayed:

- proposal state: `ACTIVATED`;
- owner: `0xfed9…5e43`;
- release: `genlayer-js@1.1.8`;
- reason: `ALL_GATES_CLEAR`;
- assessment `#1`: `CLEAR`, alignment `YES`, criteria `YES`, hidden risk `NO`;
- permit `#1`: `CONSUMED`;
- global counters: `2 proposals · 1 assessments`.

These values match `docs/evidence/studionet-e2e.json`. The UI does not infer success from button clicks: it waits for terminal receipt agreement and reloads authoritative view methods. Its receipt parser rejects finalized disagreement or failed execution.
