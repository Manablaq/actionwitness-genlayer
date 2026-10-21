# ActionWitness — Shared policy workflows with proof

**A reusable GenLayer workflow primitive for hash-pinned evidence and value-bearing policy decisions.**

The repository now contains two deliberately separated contracts:

- `contracts/action_witness_workflow.py` is the submission target. It is multi-user and value-bearing: anyone may register an immutable policy, a requester funds a workflow for a distinct beneficiary, the beneficiary submits evidence, any address may trigger independent review, and the finalized decision controls whether the beneficiary claims the escrow or the requester receives a refund.
- `contracts/action_witness_gate0.py` is retained as historical provenance for the original owner-only synthetic smoke test. It is not the product path and must not be presented as the Builder Project.

ActionWitness turns a committed policy, a public action artifact, and beneficiary-supplied evidence into an independently reviewed decision with an on-chain escrow consequence.

> **Scope:** Studio Devnet (chain **61997**) development preview. The corrected shared workflow has a finalized deployment and a completed approval-to-payout live evidence run; see [`docs/ONCHAIN_EVIDENCE_RUN.md`](docs/ONCHAIN_EVIDENCE_RUN.md). This verifies that on-chain path, not the separate hosted frontend or rejection/refund path. The historical Gate 0 address below is not the shared workflow deployment.

> **Release status:** The old Gate 0 deployment is historical only. Do not use its owner-only address or synthetic transactions as evidence for the shared workflow. The corrected replacement deployment and one approval/payout lifecycle are recorded on-chain. Frontend configuration and the rejection/refund lifecycle remain separate verification items.

## Historical Gate 0 deployment (not the submission target)

| Property | Value |
|---|---|
| Chain | `61997` / Studio Devnet |
| RPC | `https://studio-dev.genlayer.com/api` |
| Historical Intelligent Contract | `0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4` |
| Pinned source SHA-256 | `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9` |
| SDK | `genlayer-js@2.0.0-rc.1` (explicit RC pin) |
| Read method | `get_snapshot()` with `LATEST_FINAL` |
| Historical write method | `review_sample(string)` |
| Receipt/status | `gen_getTransactionStatusDetails` and `eth_getTransactionReceipt` |

Historical Gate 0 smoke-test references (real finalized references, **not evidence of the new workflow**):

- DENY: `0x0506b03f065d2b026d57116c4a8cc369466e2e1276e6fa99fe6769405db24b4f`
- ALLOW: `0xf48d2ab93a11c0c9b049a17ea6baea0c64f87215eb149696d5c8d7c00fe8f2a5`

## Shared workflow contract

Corrected deployment and evidence checkpoint:

- Contract: `0xB291b9de5D5982824CbFE6C084Ac543823254DF1`
- Deployment transaction: `0xef1b3025896c63fe71d2de563854485b79048463443006c3a972f8d9a226e809` (finalized)
- Explorer: https://explorer-studio-dev.genlayer.com/address/0xB291b9de5D5982824CbFE6C084Ac543823254DF1
- Finalized schema: `ACTIONWITNESS_SHARED_WORKFLOW_V1`
- Workflow `delivery-001`: approved, beneficiary claim finalized, `claimed: true`, final contract balance `0`
- The approval-and-payout transaction packet is in [`docs/ONCHAIN_EVIDENCE_RUN.md`](docs/ONCHAIN_EVIDENCE_RUN.md). The former `0x0B5B…` address is superseded.

The new contract exposes this lifecycle:

1. `register_policy(policy_id, policy_json, policy_sha256)` stores a canonical immutable policy. The policy contains a bounded ordered list of criteria shared by future workflows.
2. `create_workflow(workflow_id, policy_id, action_uri, action_sha256, beneficiary)` is payable. The requester must be distinct from the beneficiary, and the attached native GEN becomes the escrow amount.
3. `submit_evidence(workflow_id, evidence_uri, evidence_sha256)` is restricted to the beneficiary and can happen only once.
4. `review_workflow(workflow_id)` can be called by any address. Both the leader and validator independently retrieve the pinned action and evidence URLs, verify HTTPS/size/UTF-8/SHA-256, apply every committed criterion, and compare the decision, criterion results, and observed digests.
5. `claim_payout(workflow_id)` is restricted to the finalized recipient. `APPROVED` makes the beneficiary eligible; `REJECTED` makes the requester eligible for a refund. The claim flag is written before the external GEN transfer to prevent replay.

The contract fails closed on malformed model output, policy contradictions, unavailable or hash-mismatched artifacts, repeated IDs, wrong roles, zero funding, and duplicate claims. The old owner-only contract remains in the tree only to preserve the historical release trail.

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

The shared-workflow UI intentionally refuses to sign until a deployed
`ActionWitnessWorkflow` address is configured. Set
`NEXT_PUBLIC_WORKFLOW_CONTRACT_ADDRESS` and `WORKFLOW_CONTRACT_ADDRESS` only
after the fresh deployment has been independently inspected and recorded.

## Submission evidence required for the new release

The old Gate 0 transaction hashes cannot satisfy the Builder Project request.
The release packet must include, in order, the immutable GitHub commit, the
new deployment transaction, policy-registration transaction, requester
funding transaction, beneficiary evidence-submission transaction, finalized
review transaction, and beneficiary-claim or requester-refund transaction.
Each hash must be checked against the new contract address and the workflow
ID/state returned by `get_workflow`.

**Important:** The current repository checks the shared workflow source and the legacy UI guards. A production build and a real two-wallet workflow run must be completed against the fresh deployment before claiming end-to-end readiness.

## Historical Gate 0 provenance

The original owner-only synthetic smoke contract and its old UI helpers remain
only so the earlier release can be audited. They are not imported by the
default route and are not part of the new submission path. The Builder Project
must be evaluated from `ActionWitnessWorkflow`, the shared-workflow UI, and a
fresh multi-wallet deployment packet.

## Architecture

```text
Browser / Next.js App Router
  app/page.jsx                Shared workflow dApp entry point
  app/shared-workflow-page.jsx
                             Policy, funding, evidence, review, and claim UI
  lib/workflow-constants.mjs  Fresh deployment/network identity
  contracts/action_witness_workflow.py
                             Multi-user value-bearing workflow contract
  tests/workflow-contract.test.mjs
                             Static security and lifecycle invariants
```

The browser signs only the new workflow contract address configured through
`NEXT_PUBLIC_WORKFLOW_CONTRACT_ADDRESS`; it refuses to sign when that value is
missing. No API route accepts private keys or forwards arbitrary write methods.
The old Gate 0 helpers are historical provenance, not a fallback path.

## Security and known limitations

- **Testnet only.** Studio Devnet can reset, redeploy, or change network fee policy. The app fails closed when the configured chain is not observed and refuses to sign without the fresh workflow address.
- **Escrow safety.** The claim flag is committed before the external transfer, so a successful state transition cannot be replayed. If a child transfer fails at the network layer, the workflow remains marked claimed; the deployment must therefore be tested with the target wallet and a verified payout transaction before submission.
- **Evidence privacy.** Action and evidence URLs are public HTTPS artifacts retrieved by validators. Never use credentials, private customer data, or secrets.
- **Finality is not a verdict.** A finalized review transaction must also be checked through `get_workflow` for the expected workflow ID, decision, evidence digests, and terminal status.
- **Testnet scope.** Studio Devnet can reset, redeploy, or change fee policy. The on-chain packet must identify the exact fresh deployment and all subsequent workflow transactions.
- **Operational controls.** A public deployment still needs rate limiting, monitoring, an indexed workflow history, and an incident process. These are deployment controls, not hidden authorization assumptions in the contract.
- **SDK compatibility:** Run the installed GenLayer SDK against the fresh deployment before the evidence run. Never fall back to historical contract addresses or cached fee estimates.

## Deploy on Vercel

Create a **new** Vercel project (`actionwitness-app`, or another available slug) rather than replacing any existing deployment. Import this folder as a Next.js repository, or use the CLI from an authenticated workstation:

```bash
npm install
npm test
npm run build
npx vercel --prod
```

Follow Vercel authentication prompts locally. No secrets are required by the application itself; do not set any environment variable containing a wallet private key. The app uses the canonical public RPC, which may be blocked by Cloudflare 1010 for particular server environments. If `/api/health` reports HTTP 403, contact GenLayer; do **not** bypass Cloudflare with header spoofing or unapproved proxies.

For a release to be considered **complete**, verify all points in
[`docs/SHARED_WORKFLOW_RELEASE.md`](docs/SHARED_WORKFLOW_RELEASE.md).

## Historical evidence

The SHA-256-verified canonical contract source now resides in `contracts/action_witness_gate0.py` and the 143-entry cryptographic manifest in `evidence/SHA256_MANIFEST.txt`. The underlying raw forensic journal files remain on the operator Mac and are not published, as intended. Preserve them without modification.

## Historical artifacts

The earlier Gate 0 reports, release checklist, scripts, and deployment
references remain for audit history only. They describe the superseded
owner-only smoke path and are not release evidence for this workflow. Use
[`docs/SHARED_WORKFLOW_RELEASE.md`](docs/SHARED_WORKFLOW_RELEASE.md) for the
current implementation and evidence gate.
