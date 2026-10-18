# ActionWitness — Decisions with proof

**A usable GenLayer Studio Devnet dApp around the existing, finalized ActionWitness Gate 0 Intelligent Contract.**

ActionWitness turns an intended action into a verifiable policy decision. The app has an interactive dashboard, direct wallet connection, live finalized contract snapshot, dynamic transaction-fee estimation, one-click action review (after explicit wallet confirmation), transaction finality checks, activity tracking, and an explanation of the important security boundaries.

> **Scope:** Studio Devnet (chain **61997**) development preview. No new contract deployment. This app is **not** a production authorization protocol, and the Intelligent Contract always has `authorization_usable=false` in its tested Gate 0 schema.

> **Release status (2026-10-18):** Public website https://actionwitness-genlayer-app.vercel.app is live, with HTTP 200 for health, snapshot and live account-bound fee quotation. The repository contains the SHA-256-verified original contract, lockfile, and a 143-entry evidence manifest, published at commit `d54104aa5d140562fea9295e47e9b50d08cccac1`. The contract's `review_sample` is **OWNER_ONLY**. The current owner-restriction UI/API patch must be deployed before a new reviewer release is claimed. No real browser-wallet write has been independently verified, and the separate Gate 1D formal certificate remains pending. A `FINALIZED` consensus status alone does not prove a successful GenVM execution.

## Verified deployment

| Property | Value |
|---|---|
| Chain | `61997` / Studio Devnet |
| RPC | `https://studio-dev.genlayer.com/api` |
| Existing Intelligent Contract | `0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4` |
| Pinned source SHA-256 | `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9` |
| SDK | `genlayer-js@2.0.0-rc.1` (explicit RC pin) |
| Read method | `get_snapshot()` with `LATEST_FINAL` |
| Write method | `review_sample(string)` |
| Receipt/status | `gen_getTransactionStatusDetails` and `eth_getTransactionReceipt` |

Historical Gate 0 smoke-test references (these are real finalized reference transactions, **not fabricated demo API data**):

- DENY: `0x0506b03f065d2b026d57116c4a8cc369466e2e1276e6fa99fe6769405db24b4f`
- ALLOW: `0xf48d2ab93a11c0c9b049a17ea6baea0c64f87215eb149696d5c8d7c00fe8f2a5`

## Start locally

Requires Node.js 22.x and npm.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. For a production build:

```bash
npm test
npm run build
npm start
```

**Important:** The authenticated local Mac repository verification on 2026-10-18 passed 43 tests, production build and zero-vulnerability npm audit at published commit `d54104aa5d140562fea9295e47e9b50d08cccac1`. The owner-only guard adds additional tests that must pass before its deployment. Live read-only health and snapshot endpoints returned HTTP 200 and matched the pinned deployed contract. Browser wallet execution is still **not** end-to-end verified; no new blockchain write is authorized.

## User workflow

1. **Overview:** check the network and latest finalized contract snapshot. Network errors are shown explicitly, never replaced by hard-coded mock data.
2. **Connect wallet:** a browser EIP-1193 wallet (e.g. MetaMask) is used; no private key is entered into the app. Before signing, the app requires Studio Devnet `61997` and re-verifies the selected wallet account.
3. **New review:** only the original contract owner may write (`OWNER_ONLY` on chain). Other connected wallets are read-only. The owner types a synthetic review prompt; get a *fresh* fee estimate from the SDK through `/api/quote`; specify a maximum spend cap in GEN; explicitly acknowledge the on-chain cost and safety limitations.
4. **Submit:** the app requotes the *exact* review input and checks the cap again before using the EIP-1193 wallet-backed SDK to call `review_sample`. There are **no automatic write retries**. A returned transaction hash is stored in the browser for tracking.
5. **Verify:** paste any transaction hash and query its network status. For finalized status the receipt is checked separately. Finality alone does **not** prove the policy decision; the app also shows the latest finalized shared snapshot.
6. **Activity:** two authenticated historical smoke-test references plus newer **browser-local** submissions. Activity is not presented as an indexed global history.

## Architecture

```text
Browser / Next.js App Router
  app/page.jsx                Accessible responsive dApp UI
  lib/guards.mjs              Input, cap, snapshot and hash validation
  lib/constants.mjs           Deployed contract identity and historical references
  app/api/health              Chain and pinned-source/schema health check
  app/api/snapshot            SDK finalized readContract(get_snapshot)
  app/api/quote               SDK estimateTransactionFeesForWrite(review_sample)
  app/api/tx/[hash]            Read-only finality and receipt lookup
  lib/server-rpc.mjs          RPC allowlist (no send/sign methods)
  lib/pinned.mjs              Verify deployed code against exact source SHA-256
```

The API routes do not accept private keys and cannot submit writes. Only a wallet provider in the browser can sign a review, after explicit user confirmation. No RPC proxy forwarding arbitrary methods is exposed.

## Security and known limitations

- **Testnet only.** Studio Devnet can reset, redeploy, or change network fee policy. The app fails closed when the pinned chain/schema is not observed.
- **Global state.** `get_snapshot` exposes the *most recent* decision and counters for the contract as a whole. It does not give an authoritative per-user list. Browser history is stored in localStorage and can be deleted/modified by its owner.
- **Not an authorization system.** A contract verdict is not permission to execute a real-world action. `authorization_usable=false` is a deliberate part of this contract's Gate 0 semantics.
- **Prompt privacy.** Review strings are submitted to a public testnet and fee simulation. Never enter real credentials, private customer data, or secrets.
- **Estimates are estimates.** Network policy and prices can change. The fee is re-estimated right before signing. Your wallet independently confirms the actual transaction. No automatic retry occurs after an uncertain send outcome.
- **No transaction indexer.** `gen_getTransactionStatusDetails` verifies finality for a supplied hash, not a historical decision index. The documented two historical verdicts are backed by the original R4/R13 evidence from 2026-10-16/17.
- **No anti-spam infrastructure.** In production add rate limits, abuse mitigation, monitoring, and an authenticated indexer. On a fee-charging preview, public simulation can be expensive.
- **Known Gate 1D exception.** The separate legacy formal Gate 1D certificate remains pending; subsequent successful Gate 1E read-only and live finality checks do not retroactively complete it.
- **Browser wallet / SDK compatibility:** Before releasing, test `createClient({chain:studioDevnet, account, provider})` and SDK simulation using the *installed* v2 RC with your specific wallet. Never fall back to historical cached fees if live estimation fails.

## Deploy on Vercel

Create a **new** Vercel project (`actionwitness-app`, or another available slug) rather than replacing any existing deployment. Import this folder as a Next.js repository, or use the CLI from an authenticated workstation:

```bash
npm install
npm test
npm run build
npx vercel --prod
```

Follow Vercel authentication prompts locally. No secrets are required by the application itself; do not set any environment variable containing a wallet private key. The app uses the canonical public RPC, which may be blocked by Cloudflare 1010 for particular server environments. If `/api/health` reports HTTP 403, contact GenLayer; do **not** bypass Cloudflare with header spoofing or unapproved proxies.

For a release to be considered **complete**, verify all points in [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md).

## Historical evidence

The SHA-256-verified canonical contract source now resides in `contracts/action_witness_gate0.py` and the 143-entry cryptographic manifest in `evidence/SHA256_MANIFEST.txt`. The underlying raw forensic journal files remain on the operator Mac and are not published, as intended. Preserve them without modification.

## Archived implementation notes (historical; superseded by the release status above)

The following R2–R4 notes describe earlier staged builds and are kept for provenance. Their pending-item lists are **not** the current repository status; use the top-of-file release status and `docs/FINAL_RELEASE_HANDOFF.md` for current facts.

## R2 reviewer hardening (2026-10-17)

This version corrects the transaction-success model: the Verify page only shows successful GenVM execution when a matching canonical GenLayer transaction receipt identifies the same hash, target contract, final consensus status and `FINISHED_WITH_RETURN`. An EVM transport receipt or `FINALIZED` status **alone cannot prove contract success**. Contract ALLOW/DENY decision attribution additionally requires separately grounded decision evidence; a transaction hash is not an indexed policy decision.

Wallet network switching and account identity now use explicit EIP-1193 verification, including a final check before invoking the SDK write. `studioDevnet` is pinned via the RC's SDK chain object; no undocumented alias such as `studionet` is substituted. The fee cap applies to the consensus deposit and **does not claim to cap additional EVM gas**.

The public fee quote route now has a best-effort server-instance request limiter and same-origin checks. It is not a distributed anti-abuse system and requires Vercel Firewall or a durable rate limiter before open public production access.

Run `npm test` to execute 29 unit checks, including failure and rejection paths. A successful Next.js build is not evidence of a real wallet transaction. The existing Gate 0 contract has not been modified; its Gate 1D formal certificate remains pending. Before reviewer submission, verify the site is publicly accessible, retrieve actual canonical Python source from the operator's Mac, produce a lockfile, and perform a separately authorized wallet transaction only if necessary.

## R4 security and real-network verification (2026-10-17)

- Next.js upgraded to `16.4.2` with `postcss` override `8.5.23` (React pinned at `19.1.10`). Vercel cloud dependency audit: **0 vulnerabilities**.
- Cloud build and 29/29 tests passed. R4 isolated deployment: `dpl_4XLGYCaQ5cPfo3tuL3PuGNxm4H9e`, `https://actionwitness-genlayer-obkdk50pm-mr-albert-s-projects.vercel.app` (deployment auth may apply). The original production alias was **not promoted or replaced**.
- `/api/health`: HTTP 200, chain `61997`, expected contract, canonical source hash `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9`.
- `/api/snapshot`: HTTP 200, latest-final shared state `review_count=2`, `last_decision=ALLOW`, `authorization_usable=false`.
- `/api/tx/<allow_hash>`: HTTP 200 with consensus `FINALIZED`, EVM receipt success. **GenVM execution remains unverified**: Studio Devnet returned `Method not found: gen_getTransactionReceipt` (despite this method appearing in newer published GenLayer API docs). The app does not claim transaction execution success on this basis. Independently verified historical local R13 evidence remains separate.
- **Release blockers**: real EIP-1193 browser wallet integration/fee-quote submission test, unsupported consensus-receipt method reconciliation, public access policy, full canonical contract source/repo publication, Gate 1D certificate, and check-in of an npm lockfile. Never submit another write without separate explicit authorization.


### R4 identity verification and release requirements

See `docs/REVIEWER_HANDOFF_R4.md`. The source bundle has no private keys and does not claim GenVM execution success when Studio Devnet lacks the documented receipt RPC. Production publishing should be gated on a real wallet browser test and the original contract source archive.
