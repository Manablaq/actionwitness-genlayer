import { VERIFIED_OWNER } from './constants.mjs';
import { isAddress } from './guards.mjs';

/** Existing Gate 0 contract enforces OWNER_ONLY for review_sample.
 * This is a UX preflight, not an alternative to on-chain authorization.
 */
export function isGate0Owner(account) {
  return isAddress(account) && account.toLowerCase() === VERIFIED_OWNER.toLowerCase();
}
export function requireGate0Owner(account) {
  if (!isGate0Owner(account)) {
    throw new Error('OWNER_ONLY: This deployed Gate 0 test contract accepts review_sample only from its original owner. Other wallets can inspect proofs but cannot submit reviews.');
  }
  return true;
}
