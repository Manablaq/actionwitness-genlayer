import { isAddress } from './guards.mjs';
/** GenLayerJS v2.0.0-rc.1 reads account?.address in fee simulations.
 * A plain 0x-string is valid for some wallet APIs but becomes zeroAddress when
 * the SDK constructs sim_estimateTransactionFees/gen_call request params.
 * This shape is used ONLY for unsigned fee simulation, not signing.
 */
export function quoteSimulationAccount(walletAddress) {
  if (!isAddress(walletAddress) || /^0x0{40}$/i.test(walletAddress)) {
    throw new Error('A connected, nonzero EVM wallet address is required for fee simulation.');
  }
  return { address: walletAddress };
}
