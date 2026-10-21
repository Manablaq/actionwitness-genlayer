'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  WORKFLOW_CHAIN_ID,
  WORKFLOW_CONTRACT_ADDRESS,
  WORKFLOW_NETWORK,
  WORKFLOW_SCHEMA,
} from '../lib/workflow-constants.mjs';

const ZERO = '0x0000000000000000000000000000000000000000';
const EXPLORER_TX_BASE = 'https://explorer-studio-dev.genlayer.com/tx/';
const DEFAULT_POLICY = JSON.stringify({
  name: 'Action delivery policy',
  criteria: [
    { id: 1, text: 'The action artifact identifies the requested deliverable and its intended recipient.' },
    { id: 2, text: 'The evidence artifact demonstrates completion without exposing credentials or private keys.' },
  ],
}, null, 2);

const isAddress = value => /^0x[0-9a-fA-F]{40}$/.test(String(value || '')) && String(value).toLowerCase() !== ZERO;
const isHash = value => /^[0-9a-f]{64}$/.test(String(value || ''));
const short = value => value ? `${value.slice(0, 10)}…${value.slice(-8)}` : '—';

function boundedId(value, label) {
  const result = String(value || '').trim();
  if (!result || new TextEncoder().encode(result).length > 96 || !/^[A-Za-z0-9\-_:.]+$/.test(result)) {
    throw new Error(`${label} must use 1–96 letters, numbers, hyphens, underscores, colons, or dots.`);
  }
  return result;
}

function httpsUri(value, label) {
  const result = String(value || '').trim();
  if (!result || new TextEncoder().encode(result).length > 2048 || /[\u0000-\u0020\u007f#]/.test(result)) {
    throw new Error(`${label} must be a valid HTTPS URL without whitespace or fragments.`);
  }
  let parsed;
  try { parsed = new URL(result); } catch { throw new Error(`${label} must be a valid HTTPS URL.`); }
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password || parsed.hash) {
    throw new Error(`${label} must use a credential-free HTTPS origin.`);
  }
  return result;
}

function toWei(gen) {
  const value = String(gen || '').trim();
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('Funding must be a positive GEN amount with up to 18 decimals.');
  const [whole, fraction = ''] = value.split('.');
  const wei = BigInt(whole) * 10n ** 18n + BigInt((fraction + '0'.repeat(18)).slice(0, 18));
  if (wei <= 0n) throw new Error('Funding must be greater than zero.');
  return wei;
}

async function sha256Text(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function normalizePolicy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'criteria,name') {
    throw new Error('Policy JSON must contain only name and criteria.');
  }
  if (typeof value.name !== 'string') throw new Error('Policy name must be text.');
  const name = value.name.trim();
  if (!name || new TextEncoder().encode(name).length > 160) throw new Error('Policy name must be 1–160 UTF-8 bytes.');
  if (!Array.isArray(value.criteria) || value.criteria.length < 1 || value.criteria.length > 16) throw new Error('Policy criteria must contain 1–16 items.');
  const seen = new Set();
  const criteria = value.criteria.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Each policy criterion must be an object.');
    const id = item?.id;
    if (typeof item?.text !== 'string') throw new Error('Each policy criterion text must be text.');
    const text = item.text.trim();
    if (!Number.isInteger(id) || id <= 0 || seen.has(id)) throw new Error('Policy criterion IDs must be unique positive integers.');
    if (!text || new TextEncoder().encode(text).length > 800) throw new Error('Each policy criterion must be 1–800 UTF-8 bytes.');
    seen.add(id);
    return { id, text };
  }).sort((left, right) => left.id - right.id);
  return { name, criteria };
}

function revive(value) {
  if (Array.isArray(value)) return value.map(revive);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, revive(item)]));
  return typeof value === 'string' && /^\d+$/.test(value) ? BigInt(value) : value;
}

export default function SharedWorkflowPage() {
  const [account, setAccount] = useState('');
  const [policyId, setPolicyId] = useState('delivery-v1');
  const [workflowPolicyId, setWorkflowPolicyId] = useState('delivery-v1');
  const [policyJson, setPolicyJson] = useState(DEFAULT_POLICY);
  const [policyHash, setPolicyHash] = useState('');
  const [workflowId, setWorkflowId] = useState('delivery-001');
  const [actionUri, setActionUri] = useState('');
  const [actionHash, setActionHash] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [funding, setFunding] = useState('0.001');
  const [evidenceUri, setEvidenceUri] = useState('');
  const [evidenceHash, setEvidenceHash] = useState('');
  const [lookupId, setLookupId] = useState('');
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  const configured = /^0x[0-9a-fA-F]{40}$/.test(WORKFLOW_CONTRACT_ADDRESS);
  const policyHashHint = useMemo(() => policyJson ? 'Compute the canonical JSON hash before registering.' : '', [policyJson]);

  useEffect(() => {
    if (!window.ethereum?.on) return undefined;
    const onAccountsChanged = accounts => {
      const next = accounts?.[0] || '';
      setAccount(next);
      setState(next
        ? { kind: 'success', text: `Wallet changed to ${short(next)}. Confirm the role before the next action.` }
        : { kind: 'error', text: 'Wallet disconnected. Connect an account before signing.' });
    };
    const onChainChanged = () => setState({ kind: 'error', text: `Wallet network changed. Select ${WORKFLOW_NETWORK} (chain ${WORKFLOW_CHAIN_ID}) before signing.` });
    window.ethereum.on('accountsChanged', onAccountsChanged);
    window.ethereum.on('chainChanged', onChainChanged);
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccountsChanged);
      window.ethereum.removeListener?.('chainChanged', onChainChanged);
    };
  }, []);

  async function connect() {
    setState(null);
    if (!window.ethereum) throw new Error('No browser wallet was found.');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts?.[0]) throw new Error('Wallet returned no account.');
    setAccount(accounts[0]);
  }

  async function chain() {
    if (!window.ethereum) throw new Error('No browser wallet was found.');
    const current = await window.ethereum.request({ method: 'eth_chainId' });
    if (Number.parseInt(current, 16) !== WORKFLOW_CHAIN_ID) {
      throw new Error(`Switch the wallet to ${WORKFLOW_NETWORK} (chain ${WORKFLOW_CHAIN_ID}) before signing.`);
    }
  }

  async function currentWalletAccount() {
    if (!window.ethereum) throw new Error('No browser wallet was found.');
    if (!account) throw new Error('Connect the requester, beneficiary, or reviewer wallet first.');
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const current = accounts?.[0] || '';
    if (!current || current.toLowerCase() !== account.toLowerCase()) {
      throw new Error('The connected wallet changed. Reconnect the account shown in the header before signing.');
    }
    return current;
  }

  async function readWorkflow(id) {
    const normalizedId = boundedId(id, 'Workflow ID');
    if (!configured) throw new Error('The shared workflow contract is not configured.');
    const response = await fetch(`/api/workflow/${encodeURIComponent(normalizedId)}`, { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || `Finalized workflow lookup failed (HTTP ${response.status}).`);
    if (payload?.source !== 'LATEST_FINAL' || payload?.schemaVerified !== true || payload?.workflow?.schema !== WORKFLOW_SCHEMA) {
      throw new Error('The server did not verify this workflow against the expected finalized contract schema.');
    }
    return payload.workflow;
  }

  async function write(functionName, args, value) {
    if (!configured) throw new Error('The new workflow contract is not configured yet. Set NEXT_PUBLIC_WORKFLOW_CONTRACT_ADDRESS after deployment.');
    const activeAccount = await currentWalletAccount();
    await chain();
    const { createClient } = await import('genlayer-js');
    const { studioDevnet } = await import('genlayer-js/chains');
    if (studioDevnet.id !== WORKFLOW_CHAIN_ID) throw new Error('Installed SDK chain does not match the configured network.');
    const client = createClient({ chain: studioDevnet, account: activeAccount, provider: window.ethereum });
    const call = { account: activeAccount, address: WORKFLOW_CONTRACT_ADDRESS, functionName, args, ...(value ? { value } : {}) };
    const quote = await client.estimateTransactionFeesForWrite(call);
    if (!quote?.distribution || BigInt(quote.feeValue ?? 0) <= 0n) throw new Error('The network did not return a usable consensus fee quote.');
    await currentWalletAccount();
    const transaction = await client.writeContract({
      ...call,
      fees: { distribution: revive(quote.distribution), feeValue: BigInt(quote.feeValue) },
    });
    const txHash = String(transaction || '');
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error('The wallet returned an invalid transaction hash.');
    setState({ kind: 'success', text: `Submitted ${functionName}. Wait for finalization before the next workflow step.`, txHash });
  }

  async function act(action) {
    setBusy(true);
    setState({ kind: 'pending', text: 'Preparing the action…' });
    try { await action(); } catch (error) { setState({ kind: 'error', text: error.message || 'The action failed.' }); } finally { setBusy(false); }
  }

  async function registerPolicy() {
    const id = boundedId(policyId, 'Policy ID');
    let parsed;
    try { parsed = JSON.parse(policyJson); } catch { throw new Error('Policy JSON is invalid.'); }
    const canonical = canonicalJson(normalizePolicy(parsed));
    const digest = await sha256Text(canonical);
    setPolicyHash(digest);
    await write('register_policy', [id, canonical, digest]);
  }

  return <main className="workflow-shell" aria-busy={busy}>
    <header className="topbar"><div className="brand-mark">AW</div><div><strong>ActionWitness</strong><span>Shared policy workflows</span></div><div className="topbar-spacer"/><button type="button" className="primary-button" onClick={() => act(connect)} disabled={busy}>{account ? short(account) : 'Connect wallet'}</button></header>
    <section className="hero-section"><span className="eyebrow">{WORKFLOW_SCHEMA}</span><h1>Decisions that move value.</h1><p>Fund a task, bind it to an immutable policy, let a separate beneficiary submit hash-pinned evidence, and let GenLayer decide who can claim the escrow.</p><div className="hero-meta"><span>Network: {WORKFLOW_NETWORK} · {WORKFLOW_CHAIN_ID}</span><span>Contract: {configured ? short(WORKFLOW_CONTRACT_ADDRESS) : 'deployment pending'}</span></div></section>
    {!configured && <div className="inline-error" role="alert"><span>!</span><p>The shared contract source is ready, but no deployment address is configured. This prevents accidental signing against the legacy owner-only contract.</p></div>}
    {state && <div className={state.kind === 'error' ? 'inline-error' : 'helper-note'} role={state.kind === 'error' ? 'alert' : 'status'} aria-live="polite"><span>{state.kind === 'error' ? '!' : state.kind === 'pending' ? '…' : '✓'}</span><p>{state.text}{state.txHash && <> <a className="tx-link" href={`${EXPLORER_TX_BASE}${state.txHash}`} target="_blank" rel="noreferrer">Open explorer</a></>}{state.data && <pre className="state-details">{JSON.stringify(state.data, null, 2)}</pre>}</p></div>}
    <section className="workflow-grid">
      <article className="panel workflow-card"><div className="panel-top"><div><span className="eyebrow">01 / SHARED POLICY</span><h2>Register immutable criteria</h2></div><span className="form-step">ANY PUBLISHER</span></div><label className="input-label">Policy ID<input value={policyId} onChange={event => setPolicyId(event.target.value)} maxLength={96} /></label><label className="input-label">Canonical policy JSON<textarea rows={8} value={policyJson} onChange={event => { setPolicyJson(event.target.value); setPolicyHash(''); }} maxLength={12000} /></label><div className="helper-note"><p>{policyHashHint} The contract canonicalizes and binds the exact policy digest.{policyHash && <><br /><code>{policyHash}</code></>}</p></div><button type="button" className="primary-button" onClick={() => act(registerPolicy)} disabled={busy}>Register policy</button></article>
      <article className="panel workflow-card"><div className="panel-top"><div><span className="eyebrow">02 / REQUESTER ESCROW</span><h2>Fund a beneficiary workflow</h2></div><span className="form-step">PAYABLE</span></div><label className="input-label">Workflow ID<input value={workflowId} onChange={event => setWorkflowId(event.target.value)} maxLength={96} /></label><label className="input-label">Policy ID<input value={workflowPolicyId} onChange={event => setWorkflowPolicyId(event.target.value)} maxLength={96} /></label><label className="input-label">Action artifact HTTPS URI<input value={actionUri} onChange={event => setActionUri(event.target.value)} maxLength={2048} placeholder="https://…" /></label><label className="input-label">Action SHA-256<input value={actionHash} onChange={event => setActionHash(event.target.value)} maxLength={64} placeholder="64 lowercase hex characters" spellCheck="false" /></label><label className="input-label">Beneficiary address<input value={beneficiary} onChange={event => setBeneficiary(event.target.value)} maxLength={42} placeholder="0x…" spellCheck="false" /></label><label className="input-label">Escrow amount (GEN)<input value={funding} onChange={event => setFunding(event.target.value)} inputMode="decimal" /></label><button type="button" className="primary-button" onClick={() => act(async () => { const id = boundedId(workflowId, 'Workflow ID'); const policy = boundedId(workflowPolicyId, 'Policy ID'); const uri = httpsUri(actionUri, 'Action URI'); if (!isAddress(beneficiary)) throw new Error('Beneficiary must be a nonzero EVM address.'); if (account && beneficiary.toLowerCase() === account.toLowerCase()) throw new Error('Requester and beneficiary must be different wallets.'); if (!isHash(actionHash)) throw new Error('Action SHA-256 must be lowercase 64-hex.'); const policyResponse = await fetch(`/api/policy/${encodeURIComponent(policy)}`, { cache: 'no-store' }); const policyPayload = await policyResponse.json().catch(() => null); if (!policyResponse.ok) throw new Error(policyPayload?.error || `Finalized policy lookup failed (HTTP ${policyResponse.status}).`); if (policyPayload?.source !== 'LATEST_FINAL' || policyPayload?.schemaVerified !== true) throw new Error('The server did not verify the policy against the expected finalized contract schema.'); await write('create_workflow', [id, policy, uri, actionHash, beneficiary], toWei(funding)); })} disabled={busy}>Create and fund</button></article>
      <article className="panel workflow-card"><div className="panel-top"><div><span className="eyebrow">03 / BENEFICIARY EVIDENCE</span><h2>Submit the proof</h2></div><span className="form-step">ROLE-BOUND</span></div><label className="input-label">Workflow ID<input value={workflowId} onChange={event => setWorkflowId(event.target.value)} maxLength={96} /></label><label className="input-label">Evidence HTTPS URI<input value={evidenceUri} onChange={event => setEvidenceUri(event.target.value)} maxLength={2048} placeholder="https://…" /></label><label className="input-label">Evidence SHA-256<input value={evidenceHash} onChange={event => setEvidenceHash(event.target.value)} maxLength={64} placeholder="64 lowercase hex characters" spellCheck="false" /></label><p className="field-help">Connect the beneficiary wallet before submitting. The contract rejects evidence from every other address.</p><button type="button" className="primary-button" onClick={() => act(async () => { const id = boundedId(workflowId, 'Workflow ID'); const uri = httpsUri(evidenceUri, 'Evidence URI'); if (!isHash(evidenceHash)) throw new Error('Evidence SHA-256 must be lowercase 64-hex.'); const record = await readWorkflow(id); const active = await currentWalletAccount(); if (record.status !== 'FUNDED') throw new Error(`Evidence cannot be submitted while workflow is ${record.status}.`); if (record.beneficiary?.toLowerCase() !== active.toLowerCase()) throw new Error('Connect the beneficiary wallet recorded on this workflow.'); await write('submit_evidence', [id, uri, evidenceHash]); })} disabled={busy}>Submit evidence</button></article>
      <article className="panel workflow-card"><div className="panel-top"><div><span className="eyebrow">04 / INDEPENDENT REVIEW</span><h2>Finalize the decision</h2></div><span className="form-step">ANY CALLER</span></div><label className="input-label">Workflow ID<input value={workflowId} onChange={event => { setWorkflowId(event.target.value); setLookupId(event.target.value); }} maxLength={96} /></label><p className="field-help">Any address may trigger review. The leader and validator independently retrieve both artifacts and apply every committed criterion.</p><button type="button" className="primary-button" onClick={() => act(async () => { const id = boundedId(workflowId, 'Workflow ID'); const record = await readWorkflow(id); if (record.status !== 'EVIDENCE_SUBMITTED') throw new Error(`Review cannot start while workflow is ${record.status}.`); await write('review_workflow', [id]); })} disabled={busy}>Review workflow</button><button type="button" className="outline-button" onClick={() => act(async () => { const id = boundedId(workflowId, 'Workflow ID'); const record = await readWorkflow(id); const active = await currentWalletAccount(); if (!['APPROVED', 'REJECTED'].includes(record.status) || record.claimed) throw new Error('Claim is available only once after a finalized decision.'); if (record.claim_recipient?.toLowerCase() !== active.toLowerCase()) throw new Error('Connect the finalized claim recipient wallet.'); await write('claim_payout', [id]); })} disabled={busy}>Claim finalized payout/refund</button></article>
      <article className="panel workflow-card lookup-card"><div className="panel-top"><div><span className="eyebrow">05 / PUBLIC STATE</span><h2>Inspect the workflow</h2></div><span className="form-step">READ ONLY</span></div><label className="input-label">Workflow ID<input value={lookupId} onChange={event => setLookupId(event.target.value)} maxLength={96} placeholder="Enter a finalized workflow ID" /></label><p className="field-help">Reads the latest finalized chain state without requiring a wallet. Verify roles, escrow, evidence digest, decision, recipient, and claim flag before the next step.</p><button type="button" className="outline-button" onClick={() => act(async () => { const id = boundedId(lookupId, 'Workflow ID'); const record = await readWorkflow(id); setState({ kind: 'success', text: `On-chain workflow ${record.workflow_id}: ${record.status} / ${record.decision}.`, data: record }); })} disabled={busy}>Read on-chain state</button></article>
    </section>
    <footer className="protocol-footer"><strong>Safety boundary</strong><span>Policy and artifacts are public. Never submit secrets. A payout claim is a separate wallet transaction after the finalized decision; the contract writes the claim flag before emitting native GEN.</span></footer>
  </main>;
}

