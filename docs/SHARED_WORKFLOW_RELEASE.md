# Shared workflow release and evidence plan

This document is the release gate for the resubmission that replaces the
owner-only synthetic Gate 0 demonstration.

## What the replacement proves

`ActionWitnessWorkflow` is a reusable, multi-user, value-bearing protocol:

1. A publisher registers an immutable policy whose canonical JSON and SHA-256
   digest are stored on chain.
2. A requester funds a workflow with native GEN and names a different
   beneficiary. The contract rejects zero-value and same-party workflows.
3. Only the beneficiary may submit the hash-pinned evidence URL.
4. Any address may trigger review. The leader and validator independently fetch
   both HTTPS artifacts, verify status, UTF-8, size, and SHA-256, then apply the
   committed policy criteria.
5. The validator compares the independent result against the leader on every
   consequential field: decision, criterion results, policy digest, action
   digest, evidence digest, and failure status.
6. An `APPROVED` result makes the beneficiary eligible for the escrow; a
   `REJECTED` result makes the requester eligible for a refund. A stored claim
   flag prevents replay.

The escrow transfer is the real protocol effect. A verdict is not a generic
permission to execute arbitrary off-chain actions.

## Current deployment and live-evidence checkpoint

The corrected shared contract and an approval-to-payout workflow have been
exercised on Studio Devnet:

- Network: `Studio Devnet`, chain ID `61997`
- Contract: `0xB291b9de5D5982824CbFE6C084Ac543823254DF1`
- Explorer: https://explorer-studio-dev.genlayer.com/address/0xB291b9de5D5982824CbFE6C084Ac543823254DF1
- Finalized schema: `ACTIONWITNESS_SHARED_WORKFLOW_V1`
- Deployment transaction: `0xef1b3025896c63fe71d2de563854485b79048463443006c3a972f8d9a226e809` (FINALIZED)
- Workflow `delivery-001`: `APPROVED`, beneficiary payout claimed, final contract balance `0`
- Registration, funding, evidence, review, and claim writes finalized with `FINISHED_WITH_RETURN`; transaction hashes are recorded in `ONCHAIN_EVIDENCE_RUN.md`.

The recorded on-chain approval-and-claim path is complete. This run does not
establish the rejection/refund path or prove that the separately hosted frontend
is configured for this deployment.

## Contract safety invariants

- There is no owner, deployer, admin, or privileged review caller.
- Policy IDs and workflow IDs are immutable once used.
- The beneficiary cannot be replaced after funding.
- Evidence can be submitted only by the bound beneficiary and only once.
- Review cannot run before evidence exists or more than once after finalization.
- Malformed model output, contradictory criteria, unavailable artifacts, and
  digest mismatches fail closed to rejection/repair; they never produce an
  approval.
- The validator re-fetches the pinned artifacts instead of trusting leader
  output or a client-provided verdict.
- Payout/refund authorization is derived from the finalized decision stored in
  contract state, not from browser state.
- The claim flag is persisted before the external transfer, preventing a
  successful claim from being replayed.

## Required live evidence packet

Run this sequence against one fresh deployment and record the exact hashes:

| Order | Actor | Contract call | Required proof |
|---|---|---|---|
| 1 | deployer | deployment | deployment transaction and deployed address |
| 2 | policy publisher | `register_policy` | immutable policy ID, canonical JSON digest |
| 3 | requester | `create_workflow` with native GEN | requester, distinct beneficiary, escrow amount |
| 4 | beneficiary | `submit_evidence` | beneficiary authorization and evidence digest |
| 5 | independent caller | `review_workflow` | finalized decision and validator-checked criteria |
| 6 | decision recipient | `claim_payout` | beneficiary payout for approval or requester refund for rejection |

The evidence packet must also include the exact Git commit, contract address,
network/chain ID, policy/action/evidence URLs, all three SHA-256 values, and
the final `get_workflow` and `get_snapshot` responses. Do not reuse the old
Gate 0 address or its synthetic transactions.

## Deployment compatibility gate

The application targets the Studio development preview (`studio-dev`, chain
`61997`) and imports the matching `studioDevnet` chain from the pinned
GenLayer JS release candidate. The local CLI must expose the same `studio-dev`
network preset before deployment. An older CLI may expose only stable
`studionet` (chain `61999`); do not substitute that network or deploy with a
custom RPC while the CLI still reports the wrong chain and consensus
deployment. Upgrade the CLI to the matching release candidate, then verify:

```bash
genlayer network set studio-dev
genlayer network info
```

The reported RPC must be `https://studio-dev.genlayer.com/api` and the chain
ID must be `61997` before sending the deployment transaction.

## Local verification completed

The source is checked with:

```bash
PYTHONPYCACHEPREFIX=/private/tmp/actionwitness-pycache \
  python3 -m py_compile contracts/action_witness_workflow.py

GENVM_VERSION=v0.6.0-rc6 \
  genvm-lint check contracts/action_witness_workflow.py

npm test
npm run build
git diff --check
```

The GenVM semantic check must report `Validation passed` for
`ActionWitnessWorkflow`. Local checks do not substitute for the live
two-wallet evidence packet; deployment and on-chain execution remain separate
release gates.

## Reviewer response in one sentence

The original submission was an owner-only synthetic smoke test; this release
adds an independent policy publisher, requester/beneficiary separation,
native-GEN escrow, beneficiary-bound hash-pinned evidence, validator-side
criteria evaluation, and a final on-chain payout/refund effect.
