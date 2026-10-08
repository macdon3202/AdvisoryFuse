# Deterministic test-source manifest

Tests never depend on today's npm, GitHub, OSV or CI state. `tests/test_advisory_fuse.py` defines and injects the following fixed resources through `gltest` web mocks:

- npm: `safe-widget@1.2.3`, repository `fixture-org/safe-widget`, fixed integrity string.
- GitHub commit: `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, fixed file patch.
- Raw manifest at that exact commit: package name/version plus one dependency.
- GitHub check-runs at the exact commit: completed `security-gate`, successful, matching `head_sha`.
- OSV query: empty advisory list for happy path and explicit advisory fixture for failure.
- LLM: strict four-field JSON fixtures for CLEAR, QUARANTINE, UNRESOLVED and inconsistent cross-field output.

Patterns are end-anchored, including `check-runs?per_page=100`, so one endpoint cannot accidentally satisfy another. `strict_mocks` and pickling checks are enabled.

Live StudioNet evidence must be recorded separately in `docs/evidence/STUDIONET_E2E.md`; deterministic unit evidence must never be presented as a live transaction.
