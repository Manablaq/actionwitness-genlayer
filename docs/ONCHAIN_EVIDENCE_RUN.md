# ActionWitness live evidence run

This run sheet is for the deployed shared workflow, not the historical
owner-only Gate 0 contract.

## Live deployment and completed workflow evidence (2026-10-21)

- Network: Studio Devnet, chain ID `61997`
- Contract: `0xB291b9de5D5982824CbFE6C084Ac543823254DF1`
- Deployment transaction: [`0xef1b3025896c63fe71d2de563854485b79048463443006c3a972f8d9a226e809`](https://explorer-studio-dev.genlayer.com/tx/0xef1b3025896c63fe71d2de563854485b79048463443006c3a972f8d9a226e809) (FINALIZED, Accepted)
- Schema: `ACTIONWITNESS_SHARED_WORKFLOW_V1`
- Deployed contract source SHA-256: `e2f8de23fc8cbd430277ef9b05196dd1a2c94e41e79f876a1b9db9e68535680a`
- Workflow ID: `delivery-001`
- Outcome: `APPROVED`; beneficiary is the claim recipient; `claimed: true`
- Escrow: `0.001 GEN` (`1000000000000000` wei); final contract balance: `0`

The following hashes and finalized execution results were emitted by
`npm run evidence:live`. The runner requires `FINISHED_WITH_RETURN` for each
write and confirms terminal state using latest-final reads.

| Step | Actor | Transaction | Final execution |
|---|---|---|---|
| Register policy | requester/publisher `0x7A4a1f1acDa02E984ca80A86F08fb50dd03AC585` | [`0x991fe40cb9f568cde4a1bbde150cc52392b5bdf2a6afe3400afe32bcfef3f488`](https://explorer-studio-dev.genlayer.com/tx/0x991fe40cb9f568cde4a1bbde150cc52392b5bdf2a6afe3400afe32bcfef3f488) | `FINISHED_WITH_RETURN` |
| Create and fund workflow | requester | [`0x98dc3e72edd139b5e4badd37944e1f4e0eab8d57ed0f9e7e107f27b89663b205`](https://explorer-studio-dev.genlayer.com/tx/0x98dc3e72edd139b5e4badd37944e1f4e0eab8d57ed0f9e7e107f27b89663b205) | `FINISHED_WITH_RETURN` |
| Submit pinned evidence | beneficiary `0x1f87Ae197af539253978d435aD45cCf28Fb95024` | [`0xdeaf493b123666d1a81acd155f268682703d199c828ab0f09bb7489e33b2c89f`](https://explorer-studio-dev.genlayer.com/tx/0xdeaf493b123666d1a81acd155f268682703d199c828ab0f09bb7489e33b2c89f) | `FINISHED_WITH_RETURN` |
| Review workflow | reviewer `0x7A4a1f1acDa02E984ca80A86F08fb50dd03AC585` | [`0x9c9ac880659405a67e65fd9013a0c7cadc099623da8815364d996e19f0051d53`](https://explorer-studio-dev.genlayer.com/tx/0x9c9ac880659405a67e65fd9013a0c7cadc099623da8815364d996e19f0051d53) | `FINISHED_WITH_RETURN` |
| Claim payout | beneficiary | [`0xc89b58ff96cdbc0e0d930d830fea0ae0c6eb91506f1532998d43702e241ac422`](https://explorer-studio-dev.genlayer.com/tx/0xc89b58ff96cdbc0e0d930d830fea0ae0c6eb91506f1532998d43702e241ac422) | `FINISHED_WITH_RETURN` |

Final `get_workflow` reported policy SHA-256
`2a468b13e7880df01ac8c901fb19260ae9ca2564c96e3f1d2a758d2927e51a0b`, action
SHA-256 `c32eb9f496919b7aca2eba2b178e16ca3651788d6332c8065cba2c115334a77f`,
evidence SHA-256
`55c5d7099fa5db9226ba3e6eb0d949c65f884b7284640dcbb1e97e63794791cd`, and
decision SHA-256
`7fafba209f69806cc78ec8e7be1450043c1fe0a2aacd9791ae074447a33b9756`.
Final `get_snapshot` reported schema `ACTIONWITNESS_SHARED_WORKFLOW_V1`, one
policy, one workflow, and zero contract balance.

The earlier deployment at `0x0B5B0Dc6Af8556F0686e2dd3FF2106ab642C8023` is
superseded for this evidence run. The hosted Vercel app is a separate artifact;
this packet does not assert that it targets this deployment.

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

## Safe local automation

The repository also includes `npm run evidence:live`. It uses the pinned
Studio Devnet SDK, waits for finalized execution after every write, and reads
the latest finalized workflow before continuing. It does not print or store
private keys. Run it only in a trusted local terminal, using two distinct
funded wallets:

```bash
read -s "ACTIONWITNESS_REQUESTER_PRIVATE_KEY?Requester key: "
export ACTIONWITNESS_REQUESTER_PRIVATE_KEY
read -s "ACTIONWITNESS_BENEFICIARY_PRIVATE_KEY?Beneficiary key: "
export ACTIONWITNESS_BENEFICIARY_PRIVATE_KEY
export ACTIONWITNESS_LIVE_CONFIRM=I_UNDERSTAND
npm run evidence:live
unset ACTIONWITNESS_REQUESTER_PRIVATE_KEY ACTIONWITNESS_BENEFICIARY_PRIVATE_KEY ACTIONWITNESS_LIVE_CONFIRM
```

An optional `ACTIONWITNESS_REVIEWER_PRIVATE_KEY` may be supplied for a third
wallet. The command prints each submitted and finalized transaction hash and
ends only after `claimed: true` is verified from finalized contract state.

For a future fresh run, target its newly deployed immutable contract explicitly;
do not reuse either deployment address above:

```bash
export ACTIONWITNESS_LIVE_CONTRACT_ADDRESS=0x<new-finalized-contract-address>
npm run evidence:live
unset ACTIONWITNESS_LIVE_CONTRACT_ADDRESS
```

## Submission packet

Attach the exact immutable Git commit, deployment transaction and five
workflow transaction hashes, contract address, network/chain ID, both artifact URLs,
their SHA-256 values, and the final `get_workflow`/`get_snapshot` responses.
The on-chain packet is complete for the recorded approval path: the claim flag
is true, the beneficiary was the claim recipient, and the contract balance is
zero. This does not certify a production frontend deployment or rejection/refund
path.
