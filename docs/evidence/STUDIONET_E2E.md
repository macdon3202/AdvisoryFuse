# StudioNet E2E evidence

Status: **V2 live E2E completed and reconciled**.

## Binding

- Contract version: `ADVISORY_FUSE_V2`
- Deployment address: `0xA85b5871CeDb87cAe063d54A455DC6c9873D0b73`
- Superseded V1 address: `0xd5ec54231F7da875083c7c4d7Ac9d5db0f051C73`
- Deployment transaction: record from GenLayer Studio deployment UI (not exposed by the unauthenticated read API)
- Source commit: `TBD`

## Wallet separation

- Deployment wallet: record after deployment; deploy only.
- Auxiliary wallet A: proposer/target owner.
- Auxiliary wallet B: independent source pin and assessment.
- Reviewer wallet: may reproduce all permissionless review actions.

## Required live runs

| Run | Actor | Transaction hashes | Post-state |
|---|---|---|---|
| Happy: propose | A | `0xd8a79c22d210208061915fb7b25dd995f32dba2c2099b91233b5d8f5ee6ea977` | Proposal `#1`, `PROPOSED` |
| Happy: exact-source pin | B | `0x4ecbc6bda1bbe7a38b017a35c660fac356d61d924d7c4a497501edc6c9d69aef` | Snapshot `#1`, `PINNED` |
| Happy: semantic assessment | B | `0x1c68dddd9986e15b7b5dfd9f7581377efb2dc52cf155cfe3061f13118a32f662` | Assessment `#1`, `CLEARED` |
| Happy: issue permit | B | `0xf61db2e25178ee2f687bfcf8be92b1e1b720ad85c40f19f53534a0f2d92ccd8e` | Permit `#1`, `PERMITTED` |
| Happy: activate | A | `0x15ff24d1309468c7dfff0c6782f419ba8497862f064d2a149109930d5224b510` | `ACTIVATED`, target revision `1`, permit consumed |
| Adversarial: replay consumed permit | B | `0x779091cccc7a309e809c305532d346ca3375cae87ea55177cc4df63b099636ae` | `PERMIT_INACTIVE`; target readback unchanged |
| Failure setup: propose bad check | A | `0xb47591cfa2a6e1d4066025421164eca4b17205ecf5f4253c9254017bb64333d8` | Proposal `#2`, `PROPOSED` |
| Failure: pin missing check | B | `0x5f74b3d7ad4b7eb16041f65c1f83a9ea2836663c69cb3109dae40c0306392a00` | `SOURCE_GATES_FAILED`; exact pre/post equality |
| Conflict discovered on V1 | B | See `V1_LIVE_FINDING.md` | Two `MAJORITY_DISAGREE`; drove V2 canonicalization fix |
| UI reconciliation | read-only | same contract | Proposal `#1`, assessment `#1`, permit `#1` rendered from contract reads |

Machine-readable receipts, arguments, actors, assertions and pre/post readbacks are in `studionet-e2e.json`. Every listed transaction reached a terminal state; expected negative controls are intentionally finalized with execution errors.
