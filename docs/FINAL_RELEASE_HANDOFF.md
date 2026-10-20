# ActionWitness submission handoff — historical Gate 0 release

> This handoff describes the rejected owner-only synthetic smoke release. It
> is retained for provenance and must not be used as the Builder Project
> submission packet. The remediation is documented in
> [`SHARED_WORKFLOW_RELEASE.md`](SHARED_WORKFLOW_RELEASE.md) and implemented
> in `contracts/action_witness_workflow.py`.

## Remediation status

The replacement is a fresh multi-user, value-bearing workflow with immutable
policies, requester/beneficiary role separation, beneficiary-bound evidence,
validator-side independent artifact retrieval and criteria evaluation, and
native-GEN payout/refund settlement. It requires a new deployment and a new
six-transaction evidence packet before resubmission. None of the historical
Gate 0 hashes below prove that replacement.

## Proven and published

- Public source: https://github.com/Manablaq/actionwitness-genlayer, initial `main` commit `d54104aa5d140562fea9295e47e9b50d08cccac1`.
- Public website: https://actionwitness-genlayer-app.vercel.app, deployment `dpl_ZtWFXJpsET5cmZjfA5j35u6dXk1t`.
- Studio Devnet chain 61997; contract `0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4`; canonical contract SHA256 `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9`.
- Original source is published at `contracts/action_witness_gate0.py`. The 143-entry SHA256 manifest is published at `evidence/SHA256_MANIFEST.txt`. Raw evidence is retained separately by the operator; no raw journals or private signing material are in GitHub.
- On 2026-10-18 local verification of the initial commit passed 43 unit tests, the Next.js build and npm audit (0 reported vulnerabilities), at Node.js 22.23.3. Local certification was `PASS` with no blockchain writes.
- From a no-login client, production `/`, `/api/health`, `/api/snapshot` returned HTTP 200. The exact synthetic owner-account fee quote returned HTTP 200 with `feeValue=380492400010352` wei (time-sensitive estimate, not a current or future authorization).
- Historical DENY and ALLOW transactions finalized. Shared snapshot previously reported `review_count=2`, `last_decision=ALLOW`, `authorization_usable=false`.

## Contract/product boundary requiring attention

`review_sample` has an on-chain `OWNER_ONLY` check. This is an **owner-operated Gate 0 smoke-test**, not an open public review protocol. A wallet other than the historical authorized owner must be blocked in the client and quotation API before simulated or paid writes. The separate owner-only guard and exact 400-character input bound in this release patch require deployment and verification before claiming that the public product prevents unsupported submissions.

## Remaining formal gates — NOT claimed complete

1. Real browser-injected EIP-1193 owner wallet connect, chain check, fee re-quote, user-rejected signing, and (only with fresh explicit authorization) one bounded actual write; this is not proven by unit tests or server quotes.
2. Authoritative GenVM execution result for transaction finality. Studio Devnet did not support `gen_getTransactionReceipt` when checked; finality and EVM receipt alone must never be presented as an execution-success certificate.
3. Gate 1D separate formal certificate; remain pending until obtained or formally waived by reviewer.
4. If submitting as a general-purpose public protocol, a newly authorized design/deployment and new tests would be required to remove the owner-only Gate 0 scope. Do not claim broader capability.
5. Confirm final deployed source matches the published GitHub commit (initial production deployment preceded the repository publication); audit/CI workflow and deployed owner-only guard need validation.

**Submission verdict: SOURCE/PUBLIC RELEASE VERIFIED; COMPLETE END-TO-END CERTIFICATION NOT YET PROVEN.** No unauthorized chain writes were performed in this release verification.
