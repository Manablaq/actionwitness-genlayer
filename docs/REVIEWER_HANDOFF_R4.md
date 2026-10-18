# ActionWitness R4 reviewer handoff — verification boundaries

Updated October 17, 2026. **Not a GenLayer approval certificate.**

## Immutable live evidence already established

- Studio Devnet 61997 contract: `0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4`.
- Contract source SHA-256: `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9`.
- DENY finalized transaction: `0x0506b03f065d2b026d57116c4a8cc369466e2e1276e6fa99fe6769405db24b4f`.
- ALLOW finalized transaction: `0xf48d2ab93a11c0c9b049a17ea6baea0c64f87215eb149696d5c8d7c00fe8f2a5`.
- Last independently verified snapshot: decision ALLOW, review_count 2, authorization_usable false.
- Evidence manifest SHA-256: `a04c6ce9245b9f5cdb277d90757e1bdc62869f1869431bedd5067d9d6aca4441` for 143 primary evidence files, sealed on user's Mac. The actual evidence files are **not** embedded in this frontend archive.

## R4 release guarantees and limitations

- The browser signs with the connected EIP-1193 wallet only; no server-held keys.
- Wallet chain and active account rechecked before each `writeContract` call.
- Fresh server-side quote compared with consented cap before signing. This is a **consensus fee-deposit cap**, not a full EVM gas cap.
- Writes are non-idempotent. Unknown wallet/network outcomes must **not** be retried automatically.
- Transaction verifier keeps consensus finality separate from GenVM execution, and validates the returned transaction envelope's hash and contract address before calling it linked.
- The present Studio Devnet endpoint returned **Method not found** for `gen_getTransactionReceipt`; R4 does **not** claim GenVM execution success based solely on `FINALIZED` or `eth_getTransactionReceipt`. `eth_getTransactionByHash` is a read-only supplementary linkage check, not a GenVM receipt.
- Shared Gate 0 contract is a demo; its `authorization_usable=false` prevents treating ALLOW as enforceable external permission.
- Browser-local history is not a persistent, network-wide decision index.
- Standalone Gate 1D formal certification remains pending.
- Live browser wallet paid submission, global rate-limit enforcement, public release, and full source/evidence GitHub publication **are not yet certified**.

## Reproduce offline

Use Node.js 22 and pinned dependencies; `npm ci && npm test && npm run build`. For source provenance, independently fetch the deployed contract code via `gen_getContractCode`, decode base64 and compare its SHA-256 to the pinned digest. Avoid including testnet private keys or original raw evidence in public archives.

## No authorization inferred

Packaging, deployment, and read-only tests do not authorize a new blockchain write, appeal, top-up, or redeployment.
