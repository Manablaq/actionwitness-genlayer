import { MIN_REVIEW_LENGTH, MAX_REVIEW_LENGTH } from './constants.mjs';

export function validateAction(value) {
  if (typeof value !== 'string') return 'Describe an action to review.';
  const trimmed = value.trim();
  if (trimmed.length < MIN_REVIEW_LENGTH) return `Enter at least ${MIN_REVIEW_LENGTH} characters.`;
  if (trimmed.length > MAX_REVIEW_LENGTH) return `Keep the review under ${MAX_REVIEW_LENGTH} characters.`;
  if (/[\u0000-\u0008\u000b-\u001f\u007f]/.test(trimmed)) return 'Remove control characters.';
  return null;
}
export function isHash(value) { return typeof value === 'string' && /^0x[a-fA-F0-9]{64}$/.test(value); }
export function isAddress(value) { return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value); }
export function parseGenCap(value) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value)) throw new Error('Enter a valid GEN spending cap (up to 18 decimals).');
  const [whole, fraction=''] = value.split('.');
  const wei = BigInt(whole) * 10n ** 18n + BigInt(fraction.padEnd(18,'0') || '0');
  if (wei <= 0n) throw new Error('Spending cap must be greater than zero.');
  return wei;
}
export function formatGen(wei, decimals = 6) {
  const w=BigInt(wei);
  const sign=w<0n?'-':''; const n=w<0n?-w:w;
  const whole=n/10n**18n; const frac=(n%10n**18n).toString().padStart(18,'0');
  return `${sign}${whole}.${frac.slice(0,decimals)}`;
}
export function normalizeSnapshot(input) {
  let source = input;
  if (typeof source === 'string') { try { source = JSON.parse(source); } catch { throw new Error('Contract returned a non-JSON snapshot.'); } }
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('Invalid contract snapshot.');
  const fields=['schema','last_label','probe_count','review_count','last_decision','last_evidence_sha256','authorization_usable'];
  for (const field of fields) if (!(field in source)) throw new Error(`Snapshot missing ${field}.`);
  if (source.schema!=='ACTIONWITNESS_GATE0_V1'||!['ALLOW','DENY','ESCALATE','UNTESTED'].includes(source.last_decision)||typeof source.authorization_usable!=='boolean') throw new Error('Unexpected Gate 0 snapshot schema.');
  if (source.authorization_usable!==false) throw new Error('Contract safety boundary changed: authorization_usable is not false.');
  if (!Number.isSafeInteger(source.review_count)||!Number.isSafeInteger(source.probe_count)||source.review_count<0||source.probe_count<0) throw new Error('Invalid counters.');
  return Object.fromEntries(fields.map(f=>[f,source[f]]));
}
export function describeStatus(raw) {
  const s=String(raw ?? 'UNKNOWN').trim().replace(/[\s-]+/g,'_').toUpperCase();
  const known=new Set(['FINALIZED','ACCEPTED','PENDING','PROPOSING','COMMITTING','REVEALING','CANCELED','UNDETERMINED','UNINITIALIZED','LEADER_REVEALING','APPEAL_REVEALING','APPEAL_COMMITTING','VALIDATORS_TIMEOUT','LEADER_TIMEOUT']);
  return known.has(s)?s:'UNKNOWN';
}
