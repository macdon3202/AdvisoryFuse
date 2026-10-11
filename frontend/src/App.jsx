import React, { useEffect, useMemo, useState } from 'react';
import { CONTRACT_ADDRESS, EXPLORER, connectWallet, isConfigured, readContract, waitFinalized, writeContract } from './genlayer.js';

const EMPTY = { target: 'treasury-router', revision: '1', package: '', version: '', repo_owner: '', repository: '', commit_sha: '', manifest_path: 'package.json', required_check: 'security-gate', criteria: 'The exact release must match its registry metadata, manifest, commit, CI gate, and have no applicable OSV advisories.' };
const phases = ['PROPOSED', 'PINNED', 'CLEARED', 'PERMITTED', 'ACTIVATED'];
const short = (x = '') => x ? `${x.slice(0, 6)}…${x.slice(-4)}` : 'Not connected';

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [proposalId, setProposalId] = useState('1');
  const [permitId, setPermitId] = useState('1');
  const [record, setRecord] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [permit, setPermit] = useState(null);
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState({ type: 'info', text: isConfigured ? 'Ready to inspect StudioNet.' : 'Contract address pending deployment.' });
  const activeStep = Math.max(0, phases.indexOf(record?.state));
  const ownerMatch = useMemo(() => wallet && record?.owner?.toLowerCase() === wallet.account.toLowerCase(), [wallet, record]);

  async function load(id = proposalId) {
    if (!isConfigured) return;
    setBusy('Reading on-chain state');
    try {
      const p = await readContract('get_proposal', [Number(id)]); setRecord(p); setProposalId(String(id));
      setAssessment(p.assessment_id ? await readContract('get_assessment', [p.assessment_id]) : null);
      setPermit(p.permit_id ? await readContract('get_permit', [p.permit_id]) : null);
      if (p.permit_id) setPermitId(String(p.permit_id));
      setNotice({ type: 'ok', text: `Proposal #${id} reconciled from contract state.` });
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
    finally { setBusy(''); }
  }

  useEffect(() => { if (isConfigured) readContract('get_config').then(setConfig).catch(() => {}); }, []);

  async function transact(label, method, args, reloadId = proposalId) {
    if (!wallet) return setNotice({ type: 'error', text: 'Connect the wallet that should perform this role.' });
    setBusy(label);
    try {
      const hash = await writeContract(wallet, method, args);
      setNotice({ type: 'info', text: `${label} submitted: ${hash}` });
      await waitFinalized(hash, (s) => setBusy(`${label} · ${s.label}`));
      setNotice({ type: 'ok', text: `${label} finalized and reconciled.` });
      if (reloadId) await load(reloadId);
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
    finally { setBusy(''); }
  }

  async function submitProposal(e) {
    e.preventDefault();
    await transact('Create proposal', 'propose_release', [form.target, Number(form.revision), form.package, form.version, form.repo_owner, form.repository, form.commit_sha, form.manifest_path, form.required_check, form.criteria], '');
    if (config) { const fresh = await readContract('get_config'); setConfig(fresh); setProposalId(String(fresh.proposal_count)); await load(fresh.proposal_count); }
  }

  return <main>
    <header className="topbar">
      <div className="brand"><img src="/advisoryfuse-logo.png"/><div><b>ADVISORY/FUSE</b><span>Release activation firewall</span></div></div>
      <div className="network"><i/> StudioNet</div>
      <button className="wallet" disabled={Boolean(busy)} onClick={async () => { setBusy('Connecting wallet'); setWallet(null); try { setWallet(await connectWallet()); setNotice({ type:'ok', text:'Wallet connected on StudioNet. No Snaps required.' }); } catch (e) { setNotice({ type:'error', text:e.message }); } finally { setBusy(''); } }}>{wallet ? short(wallet.account) : 'Connect wallet'}</button>
    </header>

    <section className="hero">
      <div><p className="eyebrow">EXACT-SOURCE SECURITY CONTROL</p><h1>Fuse a release only after<br/><em>independent verification.</em></h1><p className="lede">Registry, immutable commit, raw manifest, OSV advisories and exact-SHA CI converge into one single-use activation permit.</p></div>
      <div className="terminal"><span>CONTROL PLANE</span><b>{isConfigured ? short(CONTRACT_ADDRESS) : 'AWAITING DEPLOYMENT'}</b><code>deployer authority: NONE</code><code>permit TTL: 600 seconds</code><code>architecture: snapshot → permit</code></div>
    </section>

    <div className={`notice ${notice.type}`}>{busy ? `◌ ${busy}` : notice.text}</div>

    <section className="workflow">
      <div className="section-title"><span>01 / RELEASE PIPELINE</span><h2>Verification rail</h2></div>
      <div className="rail">{phases.map((p, i) => <div key={p} className={i <= activeStep && record ? 'done' : ''}><i>{i + 1}</i><b>{p}</b><small>{['Owner authors','Sources pinned','AI consensus','Permit issued','Release active'][i]}</small></div>)}</div>
    </section>

    <div className="grid">
      <section className="panel proposal">
        <div className="section-title"><span>02 / OWNER STATION</span><h2>Bind an exact release</h2></div>
        <form onSubmit={submitProposal}>
          <div className="twocol"><label>Target<input value={form.target} onChange={e=>setForm({...form,target:e.target.value})}/></label><label>Revision<input type="number" min="1" value={form.revision} onChange={e=>setForm({...form,revision:e.target.value})}/></label></div>
          <div className="twocol"><label>npm package<input required value={form.package} onChange={e=>setForm({...form,package:e.target.value})}/></label><label>Version<input required value={form.version} onChange={e=>setForm({...form,version:e.target.value})}/></label></div>
          <div className="twocol"><label>GitHub owner<input required value={form.repo_owner} onChange={e=>setForm({...form,repo_owner:e.target.value})}/></label><label>Repository<input required value={form.repository} onChange={e=>setForm({...form,repository:e.target.value})}/></label></div>
          <label>Exact 40-character commit SHA<input required pattern="[0-9a-fA-F]{40}" value={form.commit_sha} onChange={e=>setForm({...form,commit_sha:e.target.value})}/></label>
          <div className="twocol"><label>Manifest path<input value={form.manifest_path} onChange={e=>setForm({...form,manifest_path:e.target.value})}/></label><label>Required CI check<input value={form.required_check} onChange={e=>setForm({...form,required_check:e.target.value})}/></label></div>
          <label>Activation criteria<textarea value={form.criteria} onChange={e=>setForm({...form,criteria:e.target.value})}/></label>
          <button className="primary" disabled={!!busy}>Create proposal</button>
        </form>
      </section>

      <section className="panel console">
        <div className="section-title"><span>03 / PUBLIC REVIEW STATION</span><h2>Inspect & act</h2></div>
        <div className="lookup"><input type="number" min="1" value={proposalId} onChange={e=>setProposalId(e.target.value)}/><button onClick={()=>load()}>Load proposal</button></div>
        {record ? <>
          <div className="record-head"><div><small>PROPOSAL</small><b>#{record.id} · {record.target}</b></div><span className={`badge ${record.state.toLowerCase()}`}>{record.state}</span></div>
          <dl><dt>Owner</dt><dd>{short(record.owner)} {ownerMatch && '· connected'}</dd><dt>Release</dt><dd>{record.package}@{record.version}</dd><dt>Repository</dt><dd>{record.repo}</dd><dt>Commit</dt><dd className="mono">{short(record.commit_sha)}</dd><dt>Reason</dt><dd>{record.reason || '—'}</dd></dl>
          {assessment && <div className="finding"><span>ASSESSMENT #{assessment.id}</span><b>{assessment.verdict}</b><p>Alignment {assessment.source_alignment} · Criteria {assessment.criteria_satisfied} · Hidden risk {assessment.hidden_risk}</p></div>}
          {permit && <div className="finding permit"><span>PERMIT #{permit.id}</span><b>{permit.consumed ? 'CONSUMED' : 'LIVE'}</b><p>Expires {new Date(Number(permit.expires_at)*1000).toLocaleString()}</p></div>}
          <div className="actions">
            <button onClick={()=>transact('Pin sources','pin_sources',[Number(proposalId)])}>Pin sources</button>
            <button onClick={()=>transact('Assess release','assess_release',[Number(proposalId)])}>Assess</button>
            <button onClick={()=>transact('Issue permit','issue_permit',[Number(proposalId)])}>Issue permit</button>
            <button className="primary" onClick={()=>transact('Activate release','activate_release',[Number(permitId)])}>Activate</button>
          </div>
        </> : <div className="empty">Load a proposal to see contract-derived state. Any reviewer wallet can pin, assess and issue a permit; target ownership is enforced on-chain.</div>}
      </section>
    </div>
    <footer><span>ADVISORY/FUSE · FAIL CLOSED</span><span>{config ? `${config.proposal_count} proposals · ${config.assessment_count} assessments` : 'on-chain configuration unavailable'}</span>{isConfigured && <a href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`} target="_blank">Explorer ↗</a>}</footer>
  </main>;
}
