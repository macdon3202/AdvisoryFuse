# Wallet compatibility fix — 2026-10-11

## Cause and implementation

Pinned genlayer-js 1.1.8 SDK connect() always calls wallet_getSnaps and
wallet_requestSnaps through global window.ethereum. That can fail on a standard
EIP-1193 provider without Snaps, and can address a different provider from the
one selected for account access.

The application no longer calls SDK connect(). Its tested connectInjected helper
requests accounts, switches/adds StudioNet only when necessary, verifies the final
chain and account, and passes the same provider to createClient. It never requests
Snaps. User rejection is propagated, not treated as permission to add a chain.
Write-time account, chain and contract-version guards remain in place.
The connect button disables during work and clears any stale session on retry.

## Verification

- Node suite: 11 passed, no failures/skips (7 new wallet regression tests).
- Covered: non-Snap provider; multi-provider selection; wrong chain; unknown chain
  add/switch; rejected switch; ineffective switch; changed account/missing wallet.
- These tests execute the production helper with simulated EIP-1193 responses.
  They are not a real browser-extension signing test or new StudioNet transactions.
- Production Vite build: success, 477 modules; main JS 913.22 kB / gzip 254.45 kB.
  Bundle-size warning remains. Dependency tree-shaking was disabled after the
  initial build stalled; font loading moved to an HTML link.
- Contract unchanged: ADVISORY_FUSE_V2 at
  0xA85b5871CeDb87cAe063d54A455DC6c9873D0b73. No redeployment required.

## Manual external-wallet check

Open https://advisoryfuse.pages.dev, connect your wallet, approve StudioNet switch
if needed, and confirm the connected account. Rejecting a prompt must show an error
without establishing a session. Use your own account for a fresh proposal/write;
check its transaction finality and canonical readback. A connected account alone
does not prove successful signing or contract execution.

## Resubmission response

Removed the mandatory Snaps connection path. The frontend now uses the selected
EIP-1193 provider consistently for account access, StudioNet network setup and the
genlayer-js client, without calling wallet_getSnaps or wallet_requestSnaps.
Connection verifies the final chain/account and propagates rejected prompts.
Added seven wallet regressions; all 11 frontend tests and the production build
pass. Contract source and deployment are unchanged. Simulated-provider tests are
documented separately from real browser-wallet signing, which has not been rerun.
