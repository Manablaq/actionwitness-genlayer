# ActionWitness live evidence run

This run sheet is for the deployed shared workflow, not the historical
owner-only Gate 0 contract.

## Fixed deployment

- Network: Studio Devnet, chain ID `61997`
- Contract: `0x0B5B0Dc6Af8556F0686e2dd3FF2106ab642C8023`
- Deployment transaction: `0x3e428186e5e3e074d7342ba45c43ff3bd4e42ae7c18680f23ae2c393e6b047e`
- Schema: `ACTIONWITNESS_SHARED_WORKFLOW_V1`

## Public artifacts

After this repository commit is pushed, replace `COMMIT_SHA` in the two URLs
with that immutable commit ID:

```text
https://raw.githubusercontent.com/Manablaq/actionwitness-genlayer/COMMIT_SHA/public/evidence/action-delivery-v1.json
https://raw.githubusercontent.com/Manablaq/actionwitness-genlayer/COMMIT_SHA/public/evidence/evidence-delivery-v1.json
```

Compute the exact lowercase SHA-256 values locally before signing:

```bash
shasum -a 256 public/evidence/action-delivery-v1.json
shasum -a 256 public/evidence/evidence-delivery-v1.json
```

## Ordered wallet run

Use separate funded wallets for requester and beneficiary. Do not paste private
keys into the browser or into the repository.

1. Connect the publisher wallet and register policy ID `delivery-v1` with the
   canonical JSON shown in the UI. Record the finalized transaction hash and
   policy SHA-256.
2. Connect the requester wallet. Use workflow ID `delivery-001`, policy ID
   `delivery-v1`, the immutable action URL above, its exact SHA-256, the
   beneficiary address, and a positive escrow amount such as `0.001 GEN`.
3. Wait for finalization, then connect the beneficiary wallet. Submit the
   immutable evidence URL above and its exact SHA-256.
4. Wait for finalization, connect any funded wallet, and trigger review.
5. Wait for finalization. Read the workflow from the public-state card and
   record the finalized status, decision, all digests, and `decision_sha256`.
6. Connect the displayed `claim_recipient` wallet and claim once. Record the
   finalized payout/refund transaction and confirm `claimed: true` through the
   read-only card.

Every step must be checked against the latest finalized chain state. A
transaction being accepted or finalized is not, by itself, proof that the
workflow reached the intended state.

## Submission packet

Attach the exact immutable Git commit, deployment transaction, six workflow
transaction hashes, contract address, network/chain ID, both artifact URLs,
their SHA-256 values, and the final `get_workflow`/`get_snapshot` responses.
The packet is complete only after the claim flag is true and the payout/refund
recipient matches the finalized decision.
