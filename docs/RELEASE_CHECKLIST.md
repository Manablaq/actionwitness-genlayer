# ActionWitness application release checklist

**Last prepared:** 2026-10-17. **No chain write authorized by this checklist.**

## Source and dependencies

- [ ] Install exact `genlayer-js@2.0.0-rc.1` using `npm install` and record `npm ls genlayer-js next react`.
- [ ] `npm test` passes and `npm run build` completes with no errors.
- [ ] Run `npm audit` and review any findings; do not blindly upgrade the pinned SDK.
- [ ] Pin lockfile, commit reviewed source, and preserve a build artifact hash.

## Read-only end-to-end

- [ ] GET `/api/health`: `connected=true`, chain ID `61997`, all 3 expected methods in deployed schema.
- [ ] GET `/api/snapshot`: snapshot schema `ACTIONWITNESS_GATE0_V1`, `authorization_usable=false`, genuine `LATEST_FINAL` data.
- [ ] Query finalized DENY and ALLOW transaction hashes in Verify. Finalized status plus a successful receipt where available; never substitute the local historical labels as live RPC responses.
- [ ] Disconnect or block RPC: interface shows unavailable status and **does not** invent successful data.
- [ ] Verify mobile layout, keyboard navigation, and reduced-motion preference.

## Wallet and paid review

- [ ] With a *testnet-only wallet* and controlled budget, connect and validate account+chain.
- [ ] Obtain a live fee estimate for a synthetic input; verify cap calculations and re-estimate before signing.
- [ ] Verify user-denied wallet prompt produces no transaction and safe error UI.
- [ ] Independently authorize one small testnet write (if needed) with a fresh fee cap, allow it to finalize, and verify updated state. **Do not reuse historical Gate 1C/1E authorizations** and do not retry unknown broadcasts.
- [ ] Confirm the browser never asks for a private key and does not save a secret.
- [ ] Verify status polling never rebroadcasts and that unknown-finality results are labeled as such.

## Deployment

- [ ] Use a **new** project and domain; preserve existing Vercel deployments.
- [ ] Verify Vercel scope/project/account, branch and production target before deployment.
- [ ] Run smoke tests on the preview URL; promote a tested build only after checks.
- [ ] Check browser console, server logs and client errors. Record build/deployment IDs and timestamps.
- [ ] Check CDN/Cloudflare status from deployed function region; a successful Mac RPC check does not prove Vercel server access.

## Product boundaries

- [ ] Clearly display Studio Devnet/testnet, shared latest snapshot and no external authorization semantics.
- [ ] History from localStorage is clearly marked, not sold as a permanent global archive.
- [ ] Protect public fee-estimation APIs against abuse before production launch.
- [ ] Gate 1D legacy formal certificate stays "pending" unless separately completed.

## R2 reviewer hardening (2026-10-17)

- [x] Interpret matching GenLayer receipt identity and `txExecutionResult=FINISHED_WITH_RETURN` before claiming an execution success; EVM receipt and finality alone do not suffice.
- [x] Add explicit EIP-1193 wallet network and account revalidation immediately before signing; never automatically reattempt an ambiguous wallet broadcast.
- [x] Separate consensus fee deposit from possible EVM gas exposure in user consent.
- [x] Add best-effort in-process simulation burst control, cross-origin request rejection, and browser security headers. **Production global rate limiting is still pending.**
- [x] Add unit tests for false-success, wrong-receipt, failed execution, wallet refusal, chain mismatch and fee quote limiter.
- [ ] Validate `gen_getTransactionReceipt` object-parameter compatibility with the real Studio Devnet endpoint from the deployed Vercel region.
- [ ] Validate Vercel public access, wallet signing via supported RC SDK, and real network response. No paid write without separately authorized testnet transaction.
- [ ] Obtain the exact archived canonical Python contract source and merge into a complete reviewed repository, without modifying evidence. This workspace does not contain those bytes.
- [ ] Generate a registry-backed `package-lock.json` using a trusted npm-enabled environment and commit it; restricted local network prevents fetching the registry.

## R3 verified staging checks — 2026-10-17

- [x] Cloud `npm install`: 0 security advisories with Next.js 16.4.2 and PostCSS override 8.5.23.
- [x] Vercel Node tests: 29/29 passed and Next.js 16.4.2 production build READY.
- [x] Staging `/api/health`: expected chain, contract and source digest.
- [x] Staging `/api/snapshot`: latest-final shared snapshot with ALLOW, 2 reviews, authorization_usable false.
- [x] Staging finalized ALLOW hash lookup: finalized, matching successful EVM receipt.
- [ ] GenVM execution receipt: `gen_getTransactionReceipt` unsupported by observed Studio Devnet RPC; R3 fails closed with `FINALIZED_EXECUTION_UNVERIFIED`.
- [ ] Browser wallet E2E, quote and live write only under a fresh explicit authorization.
- [ ] Public reviewer access/production promotion not performed.
- [ ] Canonical source archive and lockfile not yet published.
