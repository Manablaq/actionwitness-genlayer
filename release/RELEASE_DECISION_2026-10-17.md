# ActionWitness R7 — release decision (2026-10-17)

**Decision: HOLD — NOT SUBMISSION READY.** This is an evidence-led assessment, not a GenLayer reviewer approval or certification.

## Verified
- Contract and consensus evidence: prior isolated DENY/ALLOW transactions finalized on Studio Devnet. Original signed evidence and 143-file sealed manifest are preserved on operator's Mac, **not** reproduced in this archive.
- R5 deployed production-style build: Vercel READY; 37 checks passed; npm audit zero reported; read-only health and snapshot show chain 61997, source hash `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9`, schema and latest final ALLOW.
- Transaction detail: `eth_getTransactionByHash` links historical ALLOW to contract, owner and nonce 17; `gen_getTransactionReceipt` is unavailable and no independent GenVM success is asserted.

## New R7 blocker: LIVE FEE QUOTE FAILS
- Authenticated Vercel deployment `https://actionwitness-genlayer-o5j0sp47l-mr-albert-s-projects.vercel.app`, `POST /api/quote` on 2026-10-17 UTC using a **public test wallet address** and the previously finalized synthetic, redacted sample action returned **HTTP 502**.
- Returned error: `Missing or invalid parameters. Double check you have provided the correct parameters. Details: execution failed. Version: viem@2.57.7`.
- This test was fee quotation only: **no signing, transaction broadcast or chain write**. Do not call the product write-ready while a live quote cannot complete.
- Resolve using a *supported* GenLayer SDK fee profile and network configuration. Never silently fabricate or cache a quote, and never bypass simulation without explicitly documented, verified fees and wallet confirmation.

## Unclosed gates
1. Live fee-quote success and cap consistency for the exact call and account.
2. Real EIP-1193 wallet test with account/chain changes, wallet rejection, and separately-authorized one-time positive transaction if warranted.
3. Authoritative matched GenVM execution result, or explicit documented exception accepted by reviewer.
4. Durable public reviewer access (not expiring share links) and abuse protection for fee simulation.
5. Canonical original Python Intelligent Contract and original raw signed evidence exported from `~/Downloads/actionwitness-gate0` on operator's Mac and hash verified; source absent in this environment.
6. Complete owned GitHub repo with lockfile/reproducible build and provenance, plus final independent reviewer test.
7. Separate Gate 1D formal certificate if required by original reviewer process.

## Do not claim
- `authorization_usable` is **false**, not permission for external action.
- Latest on-chain snapshot is **global**, not an indexed user-specific history.
- `FINALIZED` or successful EVM receipt is not by itself successful GenVM execution or proof of policy result.
- Build/test/audit passes cannot substitute for live signing and fees.

## Safe next action
Run a read-only release gate: `node scripts/r7_release_gate.mjs https://YOUR-VERCEL-DEPLOYMENT.vercel.app` from an authorized browser/terminal. For protected deployments, use normal authenticated access. **It cannot submit transactions.**

**REVIEWER_SUBMISSION=BLOCKED; BLOCKCHAIN_WRITES=0; PRIOR_EVIDENCE_MODIFIED=NO.**
