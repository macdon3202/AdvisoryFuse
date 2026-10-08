# AdvisoryFuse

AdvisoryFuse is a GenLayer release-activation firewall. It binds an npm version to an immutable GitHub commit, raw manifest, exact-SHA CI result, registry integrity and OSV advisory response; GenLayer validators then evaluate semantic release criteria before a short-lived, single-use activation permit can exist.

Final StudioNet V2 contract: `0xA85b5871CeDb87cAe063d54A455DC6c9873D0b73`.

This is not an escrow, voting clone or administrator oracle. Its architecture is **Proposal → immutable source Snapshot → semantic Assessment → single-use Permit → Activation**. The deployer has no stored authority.

## Roles

- **Deployment wallet:** deploys only. It is not stored and has no privileged method.
- **Target owner:** first proposer claims a target and is the only wallet allowed to propose its later revisions.
- **Independent reviewers:** any wallet—including a steward's wallet—can pin sources, assess and issue a permit.
- **Activator:** any wallet may consume a valid permit once. The on-chain target revision prevents stale activation.

## Local verification

```powershell
pytest -q
cd frontend
npm install
npm run verify
```

The Python suite uses deterministic fixtures, no live mutable internet, and covers positive, negative, conflict, replay, expiry, source-change and prompt-injection cases. See [test matrix](docs/TEST_MATRIX.md) and [source manifest](docs/TEST_SOURCE_MANIFEST.md).

## Deploy and configure

1. The current V2 source is deployed using **Normal (Full Consensus)** at the address above.
2. Copy `frontend/.env.example` to `frontend/.env` and set that exact `VITE_CONTRACT_ADDRESS`.
3. Run `npm run build`; deploy `frontend/dist` to static hosting.
4. Use two auxiliary wallets for independent roles. The deployer wallet takes no test role.

No private key, API token or wallet mnemonic belongs in this repository.
