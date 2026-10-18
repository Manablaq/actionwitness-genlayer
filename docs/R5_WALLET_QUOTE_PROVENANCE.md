# R5 wallet-bound quote and validation

- Each fee quote is bound to a specific EIP-1193 account.
- Live SDK `estimateTransactionFeesForWrite` receives the account, contract address, method, and reviewed text.
- Browser rejects quotes tied to any other account both before and after the fresh quote.
- The already implemented chain and wallet account checks still run before write.
- This feature is **not** a complete gas-exposure cap, and quotation does not authorize a transaction.
- No new write performed; the release still needs browser-wallet E2E and separately authorized live write.
- Studio Devnet `gen_getTransactionReceipt` not supported in observed endpoint; GenVM success remains unverified.
