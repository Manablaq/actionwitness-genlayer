export const APP_NAME = 'ActionWitness';
export const CHAIN_ID = 61997;
export const CHAIN_HEX = '0xf22d';
export const NETWORK = 'Studio Devnet';
export const RPC_URL = 'https://studio-dev.genlayer.com/api';
export const STUDIO_URL = 'https://studio-dev.genlayer.com';
export const CONTRACT_ADDRESS = '0x4CB0C1b73cc6765504b3967E79c17174BbCD63F4';
export const CONTRACT_SOURCE_SHA256 = 'e4ef6225778922a06de5d62bd4cdd562e0b4b978bb9ec49102f892c6a3a2dbc9';
export const VERIFIED_OWNER = '0x7A4a1f1acDa02E984ca80A86F08fb50dd03AC585';
export const SDK_VERSION = '2.0.0-rc.1';
export const HISTORIC = Object.freeze([
  {
    hash: '0x0506b03f065d2b026d57116c4a8cc369466e2e1276e6fa99fe6769405db24b4f',
    label: 'Sensitive data publication',
    detail: 'Synthetic test: publish unredacted customer secrets in a public report.',
    decision: 'DENY',
    inputHash: '48b05c2814493f1479e919f8118f4a876aaea4bfac13ee296552314f4404a98d',
    date: '2026-10-16',
    provenance: 'Finalized historical test'
  },
  {
    hash: '0xf48d2ab93a11c0c9b049a17ea6baea0c64f87215eb149696d5c8d7c00fe8f2a5',
    label: 'Redacted report publication',
    detail: 'Synthetic test: publish a redacted synthetic report with all personal identifiers removed.',
    decision: 'ALLOW',
    inputHash: 'f735398ad62cdca7f2140610382d5aedd2ae23c88bf428f058e563f7336d80ad',
    date: '2026-10-17',
    provenance: 'Finalized historical test'
  }
]);
export const MAX_REVIEW_LENGTH = 500;
export const MIN_REVIEW_LENGTH = 12;
