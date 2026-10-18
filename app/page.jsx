'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { APP_NAME, CHAIN_ID, CHAIN_HEX, CONTRACT_ADDRESS, HISTORIC, MAX_REVIEW_LENGTH, NETWORK, RPC_URL, STUDIO_URL } from '../lib/constants.mjs';
import { validateAction, isHash, parseGenCap, formatGen } from '../lib/guards.mjs';
import { requireQuoteAccount } from '../lib/quote-binding.mjs';
import { isGate0Owner, requireGate0Owner } from '../lib/owner-gate.mjs';
import { ensureStudioDevnet, verifyWalletAccount } from '../lib/wallet-safety.mjs';

const TABS = [
  {id:'overview',title:'Overview',glyph:'◫'},
  {id:'review',title:'New review',glyph:'↗'},
  {id:'activity',title:'Activity',glyph:'≡'},
  {id:'verify',title:'Verify proof',glyph:'⌕'},
  {id:'about',title:'About protocol',glyph:'◇'},
];
const EXAMPLES = [
  {title:'Safe disclosure',tag:'Redacted content',text:'Synthetic test: publish a redacted synthetic report with all personal identifiers removed.'},
  {title:'Unsafe disclosure',tag:'Sensitive information',text:'Synthetic test: publish unredacted customer secrets in a public report.'},
  {title:'Needs judgment',tag:'Ambiguous request',text:'Synthetic test: publish a customer feedback summary, but confirm whether identities are protected first.'},
];
const LOCAL_KEY='actionwitness:recent-reviews:v1';
const compact = (text, before=8, after=6) => text ? `${text.slice(0,before)}…${text.slice(-after)}` : '—';
const ago = (iso) => {const d = new Date(iso);return Number.isNaN(d.getTime())?'—':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})};
const ErrorMessage = ({children}) => <div className="inline-error" role="alert"><span>!</span><p>{children}</p></div>;
function Icon({name,size=19}) {
 const p={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.7,strokeLinecap:'round',strokeLinejoin:'round','aria-hidden':true};
 const lines={
  arrow:<><path d="M5 12h14M13 6l6 6-6 6"/></>,
  arrowUp:<><path d="M5 19 19 5M7 5h12v12"/></>,
  shield:<><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  refresh:<><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5A7 7 0 0 0 18.4 15"/></>,
  copy:<><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  check:<><path d="m5 12 4 4L19 6"/></>,
  external:<><path d="M13 5h6v6M19 5l-9 9"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>,
  wallet:<><path d="M4 7V5a2 2 0 0 1 2-2h12M4 7h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M21 12h-6a2 2 0 0 0 0 4h6"/></>,
  lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  link:<><path d="M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 1 0-7-7l-2 2"/><path d="M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 1 0 7 7l2-2"/></>,
  info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/></>,
  time:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
  terminal:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/></>,
  cross:<><path d="M6 6l12 12M18 6 6 18"/></>,
  database:<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/></>,
 };
 return <svg {...p}>{lines[name]??lines.info}</svg>;
}
function DecisionPill({value}) {
 const v=String(value||'UNKNOWN').toUpperCase();
 const className=v==='ALLOW'?'pill-allow':v==='DENY'?'pill-deny':v==='ESCALATE'?'pill-escalate':v==='FINALIZED'?'pill-allow':v==='UNTESTED'?'pill-muted':'pill-pending';
 return <span className={'pill '+className}><span className="pill-dot"/>{v}</span>;
}
function CopyButton({text,label='Copy'}) {
 const [done,setDone]=useState(false);
 async function copy(){try{await navigator.clipboard.writeText(text);setDone(true);setTimeout(()=>setDone(false),1800)}catch{/* browser may block clipboard */}}
 return <button className="copy-button" onClick={copy} title={'Copy '+text} type="button"><Icon name={done?'check':'copy'} size={14}/><span>{done?'Copied':label}</span></button>;
}
function FieldDetail({name,value,mono=true}) {return <div className="field-detail"><span>{name}</span><strong className={mono?'mono':''}>{value}</strong></div>}
function InfoHeading({eyebrow,title,description,action}) {return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>}

export default function Home() {
 const [tab,setTab]=useState('overview');
 const [connected,setConnected]=useState(null);
 const [walletError,setWalletError]=useState('');
 const [network,setNetwork]=useState({state:'checking',error:'',checkedAt:null});
 const [snapshot,setSnapshot]=useState(null);
 const [snapshotError,setSnapshotError]=useState('');
 const [updating,setUpdating]=useState(false);
 const [action,setAction]=useState('');
 const [quote,setQuote]=useState(null);
 const [quoteBusy,setQuoteBusy]=useState(false);
 const [consent,setConsent]=useState(false);
 const [cap,setCap]=useState('0.0005');
 const [reviewError,setReviewError]=useState('');
 const [sending,setSending]=useState(false);
 const [recent,setRecent]=useState([]);
 const [verifyHash,setVerifyHash]=useState(HISTORIC[1].hash);
 const [verifyState,setVerifyState]=useState(null);
 const [verifyBusy,setVerifyBusy]=useState(false);
 const [verifyError,setVerifyError]=useState('');
 const [activityFilter,setActivityFilter]=useState('All');
 const [menuOpen,setMenuOpen]=useState(false);
 const submittingRef=useRef(false);
 const entries=useMemo(()=>[...recent,...HISTORIC], [recent]);
 const current=entries.filter(x=>activityFilter==='All'||x.decision===activityFilter);
 const walletMayWrite = isGate0Owner(connected);
 const quoteDeposit = quote ? BigInt(quote.quote.feeValue) : 0n;
 let capValue=0n,capError='';try{capValue=parseGenCap(cap)}catch(e){capError=e.message;}
 const withinCap=quote && !capError && quoteDeposit<=capValue;
 const quoteFresh=quote && Date.now()-new Date(quote.asOf).getTime()<60000;

 useEffect(()=>{
   try{const value=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');if(Array.isArray(value))setRecent(value.filter(x=>isHash(x.hash)).slice(0,30))}catch{}
   if(typeof window!=='undefined'&&window.ethereum){window.ethereum.request({method:'eth_accounts'}).then(x=>{if(Array.isArray(x)&&x[0])setConnected(x[0])}).catch(()=>{});}
   refreshAll();
 },[]);
 useEffect(()=>{const provider=typeof window!=='undefined'?window.ethereum:null;if(!provider?.on)return;const accountsChanged=x=>{setConnected(x?.[0]??null);setQuote(null);setConsent(false);setReviewError('')};const chainChanged=()=>{setQuote(null);setConsent(false);setReviewError('Wallet network changed. Re-estimate fees before submitting.')};provider.on('accountsChanged',accountsChanged);provider.on('chainChanged',chainChanged);return()=>{provider.removeListener?.('accountsChanged',accountsChanged);provider.removeListener?.('chainChanged',chainChanged)}},[]);

 async function readJson(path,init){const res=await fetch(path,{cache:'no-store',...init});let v;try{v=await res.json()}catch{throw Error('Server returned an unreadable response.')};if(!res.ok)throw Error(v.error||'Network request failed.');return v;}
 async function refreshAll(){setUpdating(true);await Promise.allSettled([
    readJson('/api/health').then(x=>setNetwork({state:'online',error:'',checkedAt:x.asOf})).catch(e=>setNetwork({state:'unavailable',error:e.message,checkedAt:null})),
    readJson('/api/snapshot').then(x=>{setSnapshot(x.snapshot);setSnapshotError('')}).catch(e=>{setSnapshotError(e.message);setSnapshot(null)})
  ]);setUpdating(false);}
 function navigate(value){setTab(value);setMenuOpen(false);if(typeof window!=='undefined')window.scrollTo({top:0,behavior:'smooth'})}
 async function connectWallet(){setWalletError('');const p=window.ethereum;if(!p){setWalletError('No EIP-1193 wallet found. Install a supported browser wallet.');return}try{const accts=await p.request({method:'eth_requestAccounts'});if(!Array.isArray(accts)||!accts[0])throw Error('Wallet returned no account.');setConnected(accts[0]);}catch(e){setWalletError(e.message||'Wallet connection rejected.')}}
 async function onQuote(){setReviewError('');setQuote(null);setConsent(false);const bad=validateAction(action);if(bad){setReviewError(bad);return}if(!connected){setReviewError('Connect a wallet before requesting a transaction quote.');return}try{requireGate0Owner(connected)}catch(e){setReviewError(e.message);return}setQuoteBusy(true);try{const result=await readJson('/api/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:action.trim(),account:connected})});setQuote(result)}catch(e){setReviewError(e.message)}finally{setQuoteBusy(false)}}
 async function checkWalletChain(){
   await ensureStudioDevnet(window.ethereum);
 }
 async function submitReview(){
   if(submittingRef.current)return;
   setReviewError('');
   if(!quote||!quoteFresh||!withinCap||!consent){setReviewError('Request a fresh quote, set a sufficient cap, and explicitly approve the fee.');return}
   try{requireQuoteAccount(quote,connected)}catch(e){setReviewError(e.message);return}
   if(action.trim()!==quote.call.args[0]){setReviewError('Action changed since the quote. Request a new quote.');return}
   if(!connected){setReviewError('Connect your wallet first.');return}
   try{requireGate0Owner(connected)}catch(e){setReviewError(e.message);return}
   submittingRef.current=true;setSending(true);
   let reachedWallet=false;
   try{
     await checkWalletChain();
     await verifyWalletAccount(window.ethereum,connected);
     // Re-estimate before write. No old transaction cap or authorizations carry forward.
     const fresh=await readJson('/api/quote',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:action.trim(),account:connected})});
     requireQuoteAccount(fresh,connected);
     if(fresh?.call?.address?.toLowerCase()!==CONTRACT_ADDRESS.toLowerCase()||fresh?.call?.functionName!=='review_sample'||fresh?.call?.args?.[0]!==action.trim())throw Error('Live quote target or action changed. No signing was attempted.');
     const age=Date.now()-Date.parse(fresh.asOf);if(!Number.isFinite(age)||age<0||age>60000)throw Error('Re-estimated fee quote is stale or invalid.');
     const amount=BigInt(fresh.quote.feeValue);
     if(amount<=0n)throw Error('Invalid nonpositive fee deposit.');
     if(amount>parseGenCap(cap))throw Error('Fresh network fee exceeds your approved maximum. No transaction was submitted.');
     const {createClient}=await import('genlayer-js');
     const {studioDevnet}=await import('genlayer-js/chains');
     if(studioDevnet.id!==CHAIN_ID)throw Error('Installed SDK targets a different chain.');
     // SDK fee fields are quantities; revive serialized bigint values recursively.
     const revive=value=>Array.isArray(value)?value.map(revive):(value&&typeof value==='object')?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,revive(v)])):(typeof value==='string'&&/^\d+$/.test(value)?BigInt(value):value);
     const client=createClient({chain:studioDevnet,account:connected,provider:window.ethereum});
     // The RC exposes studioDevnet, but connect() stable-name aliases are not guaranteed.
     // Exact EIP-1193 chain verification above is required before signing.
     await ensureStudioDevnet(window.ethereum);
     await verifyWalletAccount(window.ethereum,connected);
     reachedWallet=true;
     const txHash=await client.writeContract({...fresh.call,fees:{distribution:revive(fresh.quote.distribution),feeValue:BigInt(fresh.quote.feeValue)}});
     if(!isHash(txHash))throw Error('SDK returned an invalid transaction hash; check your wallet and explorer before further action.');
     const record={hash:txHash,label:action.trim().slice(0,56),detail:action.trim(),decision:'PENDING',date:new Date().toISOString(),provenance:'Saved in this browser; not yet final',feeWei:amount.toString()};
     const next=[record,...recent].slice(0,30);setRecent(next);try{localStorage.setItem(LOCAL_KEY,JSON.stringify(next))}catch{}
     setVerifyHash(txHash);setVerifyState(null);setConsent(false);setQuote(null);navigate('verify');
   }catch(e){setReviewError((e?.message||String(e))+(reachedWallet?' If signing/broadcast status is unclear, check wallet activity before attempting anything else.':''))}
   finally{setSending(false);submittingRef.current=false}
 }
 async function verifyTransaction(h){const value=h||verifyHash;setVerifyError('');setVerifyState(null);if(!isHash(value)){setVerifyError('Enter a complete 66-character 0x transaction hash.');return}setVerifyBusy(true);try{const res=await readJson('/api/tx/'+encodeURIComponent(value));setVerifyState(res);if(res.finalized){const changed=recent.map(x=>x.hash.toLowerCase()===value.toLowerCase()?{...x,decision:res.executionSucceeded?'FINALIZED':'UNVERIFIED',provenance:res.executionSucceeded?'GenVM execution returned successfully; policy outcome not independently indexed':'Consensus finalized; GenVM execution has not been independently verified'}:x);setRecent(changed);try{localStorage.setItem(LOCAL_KEY,JSON.stringify(changed))}catch{};await refreshAll()}}catch(e){setVerifyError(e.message)}finally{setVerifyBusy(false)}}
 function exportHistory(){const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),network:NETWORK,contract:CONTRACT_ADDRESS,records:recent,note:'Browser-local records are not an authenticated chain index.'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='actionwitness-browser-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function inspect(h){setVerifyHash(h);setVerifyState(null);navigate('verify')}
 return <div className="app-shell">
  <aside className={'sidebar '+(menuOpen?'sidebar-open':'')}>
    <button type="button" className="brand" onClick={()=>navigate('overview')} aria-label="ActionWitness overview"><span className="brand-mark"><span/></span><span className="brand-name">action<span>witness</span><small>DECISIONS WITH PROOF</small></span></button>
    <div className="side-caption">WORKSPACE <span>01 / 01</span></div>
    <nav className="nav-list" aria-label="Main navigation">{TABS.map((x,i)=><button key={x.id} type="button" onClick={()=>navigate(x.id)} className={'nav-item '+(tab===x.id?'active':'')}><span className="nav-glyph">{x.glyph}</span><span>{x.title}</span>{tab===x.id&&<span className="nav-active-mark"/>}</button>)}</nav>
    <div className="sidebar-bottom"><div className="side-protocol"><div className="side-protocol-top"><span className="green-spark"/> GENLAYER / STUDIO DEVNET</div><p>Independent consensus. Verifiable outcomes.</p></div><div className="side-footer"><span>BUILD 01.00</span><span>TESTNET ONLY</span></div></div>
  </aside>
  {menuOpen&&<button className="mobile-backdrop" aria-label="Close navigation" onClick={()=>setMenuOpen(false)}/>}
  <main className="main">
    <header className="topbar"><div className="topbar-left"><button className="menu-button" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Open navigation">☰</button><span className="crumb">WORKSPACE</span><span className="crumb-divider">/</span><span className="crumb-active">{TABS.find(x=>x.id===tab)?.title}</span></div><div className="topbar-actions"><span className={'network-top '+(network.state==='online'?'is-online':'')}><span className="top-dot"/>{network.state==='online'?'Devnet connected':network.state==='checking'?'Checking network':'Network unavailable'}</span><button type="button" className="wallet-button" onClick={connectWallet}><Icon name="wallet" size={16}/>{connected?compact(connected,6,4):'Connect wallet'}</button></div></header>
    <div className="content">
    {tab==='overview'&& <>
      <section className="hero"><div className="hero-content"><div className="hero-kicker"><span className="hero-kicker-dot"/> INTELLIGENT CONTRACT / GATE 0 <span className="hero-kicker-line"/></div><h1>A decision<br/>you can <em>prove.</em></h1><p>Turn uncertain actions into transparent, verifiable policy decisions. Reviewed by AI consensus. Recorded on GenLayer.</p><div className="hero-actions"><button className="primary-button" onClick={()=>navigate('review')}>Start a review <Icon name="arrowUp" size={17}/></button><button className="text-action light" onClick={()=>navigate('about')}>How it works <Icon name="arrow" size={16}/></button></div></div><div className="hero-art" aria-hidden="true"><div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/><div className="orbit o4"/><div className="radar-line r1"/><div className="radar-line r2"/><div className="radar-line r3"/><div className="hero-art-logo">A<span>W</span></div><div className="orbit-marker m1"/><div className="orbit-marker m2"/><div className="orbit-tag">PROOF / 61997</div></div><div className="hero-index">01 — 04 / VERIFIABLE INTELLIGENCE</div></section>
      <div className="stat-grid"><article className="stat-card"><span className="stat-label">TOTAL REVIEWS <Icon name="arrowUp" size={16}/></span><strong>{snapshot?snapshot.review_count:'—'}</strong><span className="stat-foot">Latest finalized contract snapshot</span></article><article className="stat-card"><span className="stat-label">CURRENT DECISION <Icon name="shield" size={17}/></span><div className="stat-value-pill">{snapshot?<DecisionPill value={snapshot.last_decision}/>:<span className="not-available">Unavailable</span>}</div><span className="stat-foot">Shared contract-wide state</span></article><article className="stat-card"><span className="stat-label">NETWORK <Icon name="link" size={16}/></span><strong className="stat-text">Studio <span>Devnet</span></strong><span className="stat-foot">Chain ID {CHAIN_ID} · Testnet environment</span></article></div>
      <div className="overview-grid"><section className="panel snapshot-panel"><div className="panel-top"><div><span className="eyebrow">01 / LIVE STATE</span><h3>Contract snapshot</h3></div><button className="icon-action" title="Refresh live data" onClick={refreshAll} disabled={updating}><Icon name="refresh" size={17}/></button></div>{snapshot? <><div className="decision-row"><span>Latest recorded decision</span><DecisionPill value={snapshot.last_decision}/></div><div className="snapshot-fields"><FieldDetail name="Review count" value={String(snapshot.review_count)}/><FieldDetail name="Probe count" value={String(snapshot.probe_count)}/><FieldDetail name="Authorization usable" value="FALSE"/><FieldDetail name="Evidence SHA-256" value={compact(snapshot.last_evidence_sha256,12,9)}/></div><div className="panel-bottom-line"><span className="signal-dot"/> Finalized network state <span className="panel-small">SOURCE: LATEST_FINAL</span></div></>:<div className="empty-state"><Icon name="terminal" size={28}/><h4>No live snapshot</h4><p>{snapshotError||'Loading from Studio Devnet...'}</p><button className="text-action" onClick={refreshAll}>Try again <Icon name="arrow" size={14}/></button></div>}</section>
      <section className="panel process-panel"><div className="panel-top"><div><span className="eyebrow">02 / DECISION PATH</span><h3>From action to evidence.</h3></div></div><div className="process-track"><div className="process-step"><div className="process-icon">01</div><div><strong>Submit an intention</strong><p>Describe what an agent or operator wants to do.</p></div></div><div className="process-step"><div className="process-icon">02</div><div><strong>Intelligent evaluation</strong><p>GenLayer validators evaluate the policy decision.</p></div></div><div className="process-step"><div className="process-icon">03</div><div><strong>Verifiable outcome</strong><p>ALLOW, DENY or ESCALATE, recorded with evidence.</p></div></div></div><button className="panel-link" onClick={()=>navigate('about')}>Explore the protocol <Icon name="arrowUp" size={15}/></button></section></div>
      <section className="recent-section"><InfoHeading eyebrow="03 / VERIFIED REFERENCES" title="Proven in the real world." description="Two finalized synthetic decision paths from the original Gate 0 verification." action={<button className="text-action" onClick={()=>navigate('activity')}>View activity <Icon name="arrow" size={16}/></button>}/><div className="activity-list">{HISTORIC.map(x=><article key={x.hash} className="activity-item"><div className={'activity-symbol '+(x.decision==='ALLOW'?'sym-allow':'sym-deny')}><Icon name={x.decision==='ALLOW'?'check':'cross'} size={19}/></div><div className="activity-body"><strong>{x.label}</strong><span>{x.date} · {compact(x.hash,12,8)}</span></div><DecisionPill value={x.decision}/><button className="row-arrow" onClick={()=>inspect(x.hash)} aria-label={'Verify '+x.label}><Icon name="arrowUp" size={18}/></button></article>)}</div></section>
    </>}
    {tab==='review'&&<><InfoHeading eyebrow="01 / CREATE A REVIEW" title="Before you act, ask." description="Owner-operated Gate 0 test: synthetic policy reviews require the original deploying wallet. Other wallets may inspect proofs."/><div className="review-layout"><section className="panel review-compose"><div className="panel-top"><div><span className="eyebrow">ACTION DETAILS</span><h3>What are you planning?</h3></div><span className="form-step">STEP 01 / 03</span></div><label className="input-label" htmlFor="action-text">Proposed action <span>Required</span></label><textarea id="action-text" placeholder="Describe the action you want reviewed. Be precise about the intent and safeguards..." rows={7} maxLength={MAX_REVIEW_LENGTH} value={action} onChange={e=>{setAction(e.target.value);setQuote(null);setConsent(false);setReviewError('')}}/><div className="textarea-foot"><span>Use synthetic data only. Never paste real customer secrets.</span><span>{action.length}/{MAX_REVIEW_LENGTH}</span></div><div className="examples-heading">TRY A SYNTHETIC EXAMPLE</div><div className="examples">{EXAMPLES.map(ex=><button key={ex.title} type="button" className="example" onClick={()=>{setAction(ex.text);setQuote(null);setConsent(false);setReviewError('')}}><span>{ex.tag}</span><strong>{ex.title} <Icon name="arrowUp" size={13}/></strong></button>)}</div><div className="form-divider"/><div className="panel-top"><div><span className="eyebrow">FEE & CONFIRMATION</span><h3>Review the cost.</h3></div><span className="form-step">STEP 02 / 03</span></div><div className="form-columns"><div><label className="input-label" htmlFor="fee-cap">Maximum consensus fee deposit <span>GEN</span></label><input id="fee-cap" type="text" inputMode="decimal" value={cap} onChange={e=>{setCap(e.target.value);setConsent(false)}} placeholder="0.0005"/>{capError&&<span className="field-error">{capError}</span>}</div><div><label className="input-label">Network</label><div className="readonly-field"><span className="green-spark"/> Studio Devnet · 61997</div></div></div><button className="outline-button estimate-button" onClick={onQuote} disabled={quoteBusy||sending||!walletMayWrite}>{quoteBusy?'Calculating current fee…':'Estimate current network fee'} <Icon name="arrow" size={16}/></button>{quote&&<div className="quote-box"><div><span>Latest quoted deposit</span><strong>{formatGen(quoteDeposit,12)} <small>GEN</small></strong></div><div className="quote-footer"><span>Quoted {ago(quote.asOf)}</span><span className={withinCap?'fee-good':'fee-bad'}>{withinCap?'Within your cap':'Exceeds cap'}</span></div><p>Fee quotes expire quickly and are re-estimated immediately before wallet signing. The cap checks the consensus fee deposit only; EVM gas and settlement can vary and may cost extra.</p></div>}<label className="approve-checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I approve the quoted consensus deposit cap, understand additional EVM gas may apply, and acknowledge this testnet write updates global state. An ALLOW decision is not external execution authorization.</span></label><button className="primary-button submit-button" disabled={sending||!walletMayWrite||!quote||!consent||!withinCap||!quoteFresh} onClick={submitReview}>{sending?'Awaiting wallet / network…':'Submit for consensus'} <Icon name="arrowUp" size={17}/></button>{reviewError&&<ErrorMessage>{reviewError}</ErrorMessage>}{connected&&!walletMayWrite&&<div className="helper-note" role="status">Read-only wallet: the deployed Gate 0 contract restricts review submissions to the original owner. This wallet can still inspect public proofs.</div>}{!connected&&<div className="helper-note">Connect the original Gate 0 owner wallet to submit; all other wallets can view proofs. The site never asks for private keys.</div>}</section><aside className="review-aside"><div className="dark-card"><span className="eyebrow">HOW IT WORKS</span><div className="dark-card-line">Your intent.<br/>Their consensus.<br/><em>A verifiable result.</em></div><div className="tiny-rule"/><p>The contract provides a policy verdict and evidence hash. It does not grant permission to publish, transfer money, or perform external actions.</p><Icon name="shield" size={29}/></div><div className="mini-card"><span className="eyebrow">CONTRACT</span><strong className="mono">{compact(CONTRACT_ADDRESS,12,10)}</strong><CopyButton text={CONTRACT_ADDRESS}/></div><div className="mini-card muted-card"><Icon name="info" size={21}/><p>This is a shared Gate 0 contract. The latest decision can change when another review finalizes.</p></div></aside></div></>}
    {tab==='activity'&&<><InfoHeading eyebrow="02 / TRANSACTIONS" title="An auditable trail." description="Two independently verified historical tests plus activity submitted from this browser." action={<button className="outline-small" onClick={exportHistory} disabled={!recent.length}>Export my activity <Icon name="arrowUp" size={14}/></button>}/><section className="panel activity-panel"><div className="activity-toolbar"><div className="filter-group">{['All','ALLOW','DENY','PENDING','FINALIZED'].map(f=><button key={f} className={activityFilter===f?'filter-active':''} onClick={()=>setActivityFilter(f)}>{f}</button>)}</div><span>{current.length} ENTRIES</span></div><div className="activity-list">{current.map(x=><article className="activity-item big" key={x.hash}><div className={'activity-symbol '+(x.decision==='ALLOW'?'sym-allow':x.decision==='DENY'?'sym-deny':'sym-wait')}><Icon name={x.decision==='ALLOW'?'check':x.decision==='DENY'?'cross':'time'} size={18}/></div><div className="activity-body"><strong>{x.label}</strong><span>{x.provenance} · {x.date?.length===10?x.date:ago(x.date)}</span><code>{compact(x.hash,14,12)}</code></div><DecisionPill value={x.decision}/><button className="row-arrow" aria-label="Verify transaction" onClick={()=>inspect(x.hash)}><Icon name="arrowUp" size={17}/></button></article>)}{current.length===0&&<div className="empty-state"><Icon name="database" size={26}/><p>No transactions match this filter.</p></div>}</div></section><div className="disclaimer-strip"><Icon name="info" size={17}/><p>This contract stores the <strong>latest shared snapshot</strong>, not a searchable on-chain decision archive. New submissions in this list are stored locally in your browser; verified historical tests are sourced from the original Gate 0 evidence.</p></div></>}
    {tab==='verify'&&<><InfoHeading eyebrow="03 / PROOF EXPLORER" title="Don't just trust. Verify." description="Check a transaction hash directly against GenLayer Studio Devnet consensus status."/><div className="verify-layout"><section className="panel proof-panel"><label className="input-label" htmlFor="hash-input">Transaction hash</label><div className="hash-entry"><input id="hash-input" spellCheck={false} value={verifyHash} onChange={e=>{setVerifyHash(e.target.value);setVerifyError('')}} placeholder="0x..."/><button className="primary-button" onClick={()=>verifyTransaction()} disabled={verifyBusy}>{verifyBusy?'Checking…':'Verify'} <Icon name="arrow" size={16}/></button></div><div className="hash-samples"><span>CHECK A FINALIZED TEST:</span>{HISTORIC.map(x=><button key={x.hash} onClick={()=>{setVerifyHash(x.hash);setVerifyState(null);setVerifyError('')}}>{x.decision} <Icon name="arrowUp" size={12}/></button>)}</div>{verifyError&&<ErrorMessage>{verifyError}</ErrorMessage>}{verifyState&&<div className="proof-result"><div className="proof-result-header"><span className="eyebrow">LIVE CONSENSUS RESPONSE</span><DecisionPill value={verifyState.status}/></div><div className="proof-info"><FieldDetail name="Transaction" value={compact(verifyState.hash,12,12)}/><FieldDetail name="Consensus status" value={verifyState.status}/><FieldDetail name="Finalized" value={verifyState.finalized?'YES':'NO'}/><FieldDetail name="GenVM execution" value={verifyState.executionResult||'UNKNOWN'}/><FieldDetail name="Contract-call identity" value={verifyState.contractCallVerified?'VERIFIED':'UNVERIFIED'}/><FieldDetail name="Execution successful" value={verifyState.executionSucceeded?'YES':'NO / UNVERIFIED'}/><FieldDetail name="Outcome" value={verifyState.outcome||'UNKNOWN'}/><FieldDetail name="Checked at" value={ago(verifyState.asOf)} mono={false}/></div><p>{verifyState.note}</p><CopyButton text={verifyState.hash} label="Copy transaction hash"/></div>}<div className="proof-bottom"><Icon name="lock" size={19}/><div><strong>Read-only verification</strong><p>Looking up a transaction never signs, rebroadcasts or spends GEN.</p></div></div></section><aside className="verify-aside"><div className="verify-visual"><div className="verify-visual-ring"><Icon name="shield" size={50}/></div><span>VERIFIABLE BY DESIGN</span></div><div className="mini-card"><span className="eyebrow">WHAT THIS PROVES</span><p>A finalized status proves the protocol completed consensus. Linking a policy decision to a specific transaction requires matching the transaction input and historical state evidence.</p></div><div className="mini-card"><span className="eyebrow">CANONICAL CONTRACT</span><strong className="mono">{compact(CONTRACT_ADDRESS,13,9)}</strong><CopyButton text={CONTRACT_ADDRESS}/></div></aside></div></>}
    {tab==='about'&&<><InfoHeading eyebrow="04 / THE PROTOCOL" title="Clear decisions. Clear boundaries." description="The transparent review layer for proposed AI and human actions."/><div className="about-hero"><div><span className="eyebrow">OUR PRINCIPLE</span><h3>Intelligence should be<br/><em>accountable.</em></h3><p>ActionWitness turns a proposed action into a consensus-reviewed policy outcome and stores evidence on a GenLayer Intelligent Contract.</p></div><div className="about-number">03<span>POSSIBLE OUTCOMES</span></div></div><div className="about-grid"><div className="about-card"><span className="large-number">01</span><DecisionPill value="ALLOW"/><h3>Meets the policy.</h3><p>The reviewed action is considered acceptable under the contract's policy criteria. The contract still does not authorize external execution.</p></div><div className="about-card"><span className="large-number">02</span><DecisionPill value="DENY"/><h3>Fails the policy.</h3><p>The contract records that the proposed action violates the relevant safeguards.</p></div><div className="about-card"><span className="large-number">03</span><DecisionPill value="ESCALATE"/><h3>Needs human judgment.</h3><p>Ambiguous or insufficiently supported actions may need additional review before proceeding elsewhere.</p></div></div><div className="about-bottom"><div><span className="eyebrow">SECURITY MODEL</span><h3>A verdict is not an instruction.</h3><p>This Gate 0 deployment deliberately returns <code>authorization_usable = false</code>. It is a decision-evidence demonstration, not a production-grade permission system. Studio Devnet is a resettable development preview. Treat all inputs as public test data.</p></div><div><span className="eyebrow">CURRENT DEPLOYMENT</span><FieldDetail name="Chain ID" value="61997"/><FieldDetail name="Environment" value="Studio Devnet" mono={false}/><FieldDetail name="Contract" value={compact(CONTRACT_ADDRESS,12,9)}/><a className="external-link" href={STUDIO_URL} target="_blank" rel="noopener noreferrer">Open GenLayer Studio <Icon name="external" size={15}/></a></div></div></>}
    </div>
    <footer className="footer"><span>© {new Date().getFullYear()} ACTIONWITNESS</span><span className="footer-middle">VERIFIABLE DECISIONS · GENLAYER INTELLIGENT CONTRACTS</span><span>STUDIO DEVNET / 61997</span></footer>
  </main>
 </div>;
}
