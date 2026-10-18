# ActionWitness R6 — reviewer release gate

Date: 2026-10-17. **Status: NOT RELEASE-CERTIFIED**.

## Verified

- Prior on-chain Gate 0 DENY/ALLOW smoke tests finalized on Studio Devnet (chain 61997). ALLOW hash `0xf48d2ab93a11c0c9b049a17ea6baea0c64f87215eb149696d5c8d7c00fe8f2a5`; DENY hash `0x0506b03f065d2b026d57116c4a8cc369466e2e1276e6fa99fe6769405db24b4f`.
- The R5 Next.js application was built on Vercel (deployment `dpl_3dL1E8sepnUqn6g5QQtifiUdeKQS`, READY), with 37/37 Node tests and zero reported npm audit advisories.
- The deployed R5 health/snapshot/transaction endpoints previously returned HTTP 200, correct pinned contract source SHA-256 `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9`, latest-final review count 2 and ALLOW, and a correct transaction envelope for nonce 17.
- The R5 source package was re-inspected on 2026-10-17; 37/37 offline tests passed. No chain writes.

## Outstanding blockers — do not claim completion

1. **Live wallet E2E:** A real EIP-1193 wallet has not completed a browser flow. Verify account, chain, fee quote, wallet rejection, and, only with separate authorization, a live transaction. Never sign or send by automation without distinct user approval.
2. **Live quote:** `/api/quote` has not been exercised live from a real connected wallet account. The backend calls `estimateTransactionFeesForWrite`; the browser requotes before signing. A simulated code-path unit test is not a substitute.
3. **GenVM receipt:** `gen_getTransactionReceipt` returned Method not found on Studio Devnet; the app correctly reports `FINALIZED_EXECUTION_UNVERIFIED`, even where EVM transport receipt succeeds. Do not conflate a successful EVM receipt or historical snapshot with independent GenVM execution proof.
4. **Production-grade rate limiting:** The `quotePermit()` in-process guard is not globally distributed and is not sufficient for an unrestricted public quote API.
5. **Public reviewer access:** The deployment is protected by Vercel Authentication; unrestricted access has not been demonstrated. An expiring share link is not a permanent solution.
6. **Source provenance:** The canonical contract Python source and original Mac journal bytes are not in this frontend archive. Do not manufacture, reconstruct, or publish them without checking exact hashes/privacy.
7. **Repository and formal certificate:** A complete owned ActionWitness GitHub repository and the separate Gate 1D formal certificate remain missing.

## Release order

- First run the R6 read-only verification script in a browser-enabled machine with the correct testnet-only wallet environment; do not enter private keys into the website.
- Confirm contract code, snapshot, both transaction identities and labels via primary evidence; do not infer unprovided GenVM execution proof.
- Run a quote and wallet **rejection** scenario without signing. Record redacted console/network evidence and exact SDK versions.
- Complete rate limiting and public access safely, then publish a full reproducible repository with canonical source and `package-lock.json`.
- Ask for specific capped permission before any new Studio Devnet transaction; never reuse nonce 16/17 permissions or retry an ambiguous broadcast.
- Only after passing all gates, consider promotion and reviewer submission. GenLayer reviewers, not this document, determine approval.

## Current verified release

R5 protected deployment: `https://actionwitness-genlayer-o5j0sp47l-mr-albert-s-projects.vercel.app`.
R5 production alias was intentionally NOT replaced by R6.
