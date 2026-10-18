# Source provenance and verified evidence

The current Intelligent Contract was already deployed and live-verified before this frontend was authored. The frontend **does not** alter it or deploy a replacement.

- Contract: `0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4`.
- Network: Studio Devnet `61997`, canonical RPC `https://studio-dev.genlayer.com/api`.
- Contract source SHA-256: `e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9`.
- DENY tx: `0x0506b03f065d2b026d57116c4a8cc369466e2e1276e6fa99fe6769405db24b4f`.
- ALLOW tx: `0xf48d2ab93a11c0c9b049a17ea6baea0c64f87215eb149696d5c8d7c00fe8f2a5`.
- Gate 1E-R13: `PASS_FINALIZED_ALLOW` and `ALLOW_POST_STATE_VERIFIED=TRUE`, 9 read-only network calls.
- Reviewer seal: 143 primary evidence files hashed, manifest SHA-256 `a04c6ce9245b9f5cdb277d90757e1bdc62869f1869431bedd5067d9d6aca4441`.
- Historical test decision input hashes are pinned in `lib/constants.mjs`.
- Formal Gate 1D certification remains separately pending.

This generated app includes the *identifiers and outcomes* that were supplied as Terminal evidence; it does not contain the original signed transaction bytes, RPC response journals or the canonical Python contract source. The latter remain primary records in the user's Mac environment and should be shared only after a separate privacy and integrity review.

## References

- [Official GenLayer JS SDK](https://docs.genlayer.com/api-references/genlayer-js)
- [Studio network documentation](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-studio)
- [Reading contract state](https://docs.genlayer.com/developers/decentralized-applications/reading-data)
- [Writing to Intelligent Contracts](https://docs.genlayer.com/developers/decentralized-applications/writing-data)
