# V1 live-test finding (superseded deployment)

Contract `0xd5ec54231F7da875083c7c4d7Ac9d5db0f051C73` correctly exposed `ADVISORY_FUSE_V1` with no deployer authority.

Verified live transactions:

- Proposal #1 by auxiliary wallet A: `0x2ccabb55fc99922b9061b2ec76f424fe8ddaafd1c6b3f4f04686ab67dac59038`.
- Exact-source pin by auxiliary wallet B: `0x37ed0c7e6e2acc6b964e113101068ed1d31cd73cc3c44662d6f963c9aaf79a31`.
- Semantic assessment conflict: `0x656c399ac5cfcb4480e6dbaa651f66ec49a38a94b4bd82a4c68259d1206e5428`, terminal `UNDETERMINED / MAJORITY_DISAGREE`; readback remained `PINNED`, `assessment_id=0`.
- Independent assessment retry: `0x02546d5c8a36219f1d529f2260e1a8da1b2489936c85c47225eaf6f8cf268bf9`, again terminal `UNDETERMINED / MAJORITY_DISAGREE`.

The retry also ended in validator disagreement. Investigation identified raw whole-response hashing as the unstable boundary: GitHub check-runs can contain reordered and repeated runs. V2 canonicalizes only security-relevant fields (deduplicated exact check facts, advisory IDs, package identity/integrity, commit file facts and manifest) before hashing. V1 must not be submitted as the final deployment.
