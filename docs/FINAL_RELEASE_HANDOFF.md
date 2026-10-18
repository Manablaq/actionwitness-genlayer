# ActionWitness production handoff — 2026-10-17

Production URL: https://actionwitness-genlayer-app.vercel.app
Production deployment: dpl_ZtWFXJpsET5cmZjfA5j35u6dXk1t
Contract: 0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4
Expected contract SHA256: e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9
SDK: genlayer-js 2.0.0-rc.1; Node.js 22; Next.js 16.4.2

PROVEN via unauthenticated external Vercel sandbox: homepage 200, /api/health 200, /api/snapshot 200, /api/quote POST 200. Latest snapshot review_count=2 and last_decision=ALLOW. Latest quote feeValue=380492400010352 wei (not a fixed future quote).

PROVEN via cloud build: 43 tests passed, npm audit zero vulnerabilities.

NOT YET PROVEN: actual browser-injected real-wallet signing & network write; independent GenVM receipt result via current Studio RPC; separate Gate 1D formal certification. Cannot certify complete submission without these.

CANONICAL SOURCE NOT YET INCLUDED: Run companion Mac script to copy original hash-verified contract and seal manifest. This zip deliberately does not fabricate/reconstruct the contract source.

Security: no wallet private keys and no raw evidence journals belong in GitHub. Public Studio Devnet test data only. `authorization_usable=false` intentionally, this app is decision evidence not external enforcement.
