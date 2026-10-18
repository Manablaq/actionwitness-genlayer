import { isAddress } from './guards.mjs';
/** Quote must name the current EIP-1193 account; no silent account rebinding. */
export function requireQuoteAccount(quote, expected) {
  if (!isAddress(expected) || !isAddress(quote?.account) || quote.account.toLowerCase() !== expected.toLowerCase())
    throw Error('Quote belongs to a different or invalid wallet account. Reconnect and re-quote.');
  return true;
}
