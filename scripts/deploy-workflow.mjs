import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';

const EXPECTED_CHAIN_ID = 61997;
const CONFIRMATION = 'I_UNDERSTAND';
const sourcePath = resolve('contracts/action_witness_workflow.py');

function fail(message) {
  console.error(`Deployment stopped: ${message}`);
  process.exitCode = 1;
}

const source = await readFile(sourcePath, 'utf8');
if (studioDevnet.id !== EXPECTED_CHAIN_ID) {
  fail(`installed SDK targets chain ${studioDevnet.id}, expected ${EXPECTED_CHAIN_ID}`);
} else {
  const client = createClient({ chain: studioDevnet });
  const chainId = await client.request({ method: 'eth_chainId', params: [] });
  if (Number.parseInt(chainId, 16) !== EXPECTED_CHAIN_ID) {
    fail(`RPC returned chain ${chainId}, expected 0x${EXPECTED_CHAIN_ID.toString(16)}`);
  } else {
    const schema = await client.getContractSchemaForCode(source);
    const methodNames = Array.isArray(schema?.methods)
      ? schema.methods.map(method => method.name).filter(Boolean)
      : Object.keys(schema?.methods ?? {});
    const required = ['register_policy', 'create_workflow', 'submit_evidence', 'review_workflow', 'claim_payout', 'get_policy', 'get_workflow', 'get_snapshot'];
    const missing = required.filter(name => !methodNames.includes(name));
    if (missing.length) {
      fail(`schema preflight is missing methods: ${missing.join(', ')}`);
    } else if (process.env.ACTIONWITNESS_DEPLOY_CONFIRM !== CONFIRMATION) {
      console.log(JSON.stringify({
        preflight: 'passed',
        network: studioDevnet.name,
        chainId: EXPECTED_CHAIN_ID,
        rpc: studioDevnet.rpcUrls.default.http[0],
        source: sourcePath,
        methods: methodNames,
        nextStep: `Set ACTIONWITNESS_DEPLOY_CONFIRM=${CONFIRMATION} and ACTIONWITNESS_DEPLOYER_PRIVATE_KEY, then rerun this command to send the deployment.`,
      }, null, 2));
    } else {
      const privateKey = process.env.ACTIONWITNESS_DEPLOYER_PRIVATE_KEY;
      if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey ?? '')) {
        fail('ACTIONWITNESS_DEPLOYER_PRIVATE_KEY must be a 32-byte 0x-prefixed key; it is never printed or stored.');
      } else {
        const account = createAccount(privateKey);
        const signerClient = createClient({ chain: studioDevnet, account });
        const fees = await signerClient.estimateTransactionFees();
        const txHash = await signerClient.deployContract({ account, code: source, fees });
        console.log(JSON.stringify({
          submitted: true,
          network: studioDevnet.name,
          chainId: EXPECTED_CHAIN_ID,
          deployer: account.address,
          transactionHash: txHash,
          note: 'Wait for finalization, then record the deployed address and inspect the finalized schema before configuring the frontend.',
        }, null, 2));
      }
    }
  }
}
