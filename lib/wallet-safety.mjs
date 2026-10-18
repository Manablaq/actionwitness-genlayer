import { CHAIN_HEX, CHAIN_ID, RPC_URL } from './constants.mjs';
function chainValue(value) {
  if(typeof value!=='string'||!/^0x[0-9a-fA-F]+$/.test(value))throw Error('Wallet returned an invalid chain ID.');
  return BigInt(value);
}
export async function ensureStudioDevnet(provider) {
  if(!provider || typeof provider.request!=='function')throw Error('No supported EIP-1193 wallet is connected.');
  let current=chainValue(await provider.request({method:'eth_chainId'}));
  if(current!==BigInt(CHAIN_ID)) {
    try { await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_HEX}]}); }
    catch(error) {
      if(error?.code!==4902)throw error;
      await provider.request({method:'wallet_addEthereumChain',params:[{
        chainId:CHAIN_HEX,chainName:'GenLayer Studio Devnet',rpcUrls:[RPC_URL],
        nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18}
      }]});
      await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN_HEX}]});
    }
    current=chainValue(await provider.request({method:'eth_chainId'}));
  }
  if(current!==BigInt(CHAIN_ID))throw Error('Wallet chain mismatch. Use Studio Devnet 61997.');
  return true;
}
export async function verifyWalletAccount(provider,expected) {
  if(typeof expected!=='string' || !/^0x[a-fA-F0-9]{40}$/.test(expected))throw Error('Invalid expected wallet address.');
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts) || !accounts.some(a=>typeof a==='string' && a.toLowerCase()===expected.toLowerCase())) {
    throw Error('Wallet account changed. Reconnect before submitting.');
  }
  return true;
}
