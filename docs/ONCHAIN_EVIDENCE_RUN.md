# ActionWitness live evidence run

This run sheet is for the deployed shared workflow, not the historical
owner-only Gate 0 contract.

## Fixed deployment

- Network: Studio Devnet, chain ID `61997`
- Contract: `0x0B5B0Dc6Af8556F0686e2dd3FF2106ab642C8023`
- Deployment transaction: `0x3e428186e5e3e074d7342ba45c43ff3bd4e42ae7c18680f23ae2c393e6b047e`
- Schema: `ACTIONWITNESS_SHARED_WORKFLOW_V1`
- Public app: https://actionwitness-genlayer-app.vercel.app
- Production deployment: `dpl_Cs6Qf137mxGxm3XonGqbXpZxvpZW`

## Public artifacts

The immutable release commit is
`2ae086ea2ee2e32bdf72e808297ae7b2281939bb`:

```text
https://raw.githubusercontent.com/Manablaq/actionwitness-genlayer/2ae086ea2ee2e32bdf72e808297ae7b2281939bb/public/evidence/action-delivery-v1.json
https://raw.githubusercontent.com/Manablaq/actionwitness-genlayer/2ae086ea2ee2e32bdf72e808297ae7b2281939bb/public/evidence/evidence-delivery-v1.json
```

Compute the exact lowercase SHA-256 values locally before signing:

```bash
shasum -a 256 public/evidence/action-delivery-v1.json
shasum -a 256 public/evidence/evidence-delivery-v1.json
```

Release-commit values:

- Default policy SHA-256: `2a468b13e7880df01ac8c901fb19260ae9ca2564c96e3f1d2a758d2927e51a0b`
- Action SHA-256: `c32eb9f496919b7aca2eba2b178e16ca3651788d6332c8065cba2c115334a77f`
- Evidence SHA-256: `55c5d7099fa5db9226ba3e6eb0d949c65f884b7284640dcbb1e97e63794791cd`

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
