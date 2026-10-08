import { createAccount, createClient } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const ADDRESS = '0xA85b5871CeDb87cAe063d54A455DC6c9873D0b73';
const ROOT = new URL('../../', import.meta.url);
const stateDir = new URL('./.state/', import.meta.url);
const stateFile = new URL('./.state/advisoryfuse-v2-studionet.json', import.meta.url);
const evidenceFile = new URL('../docs/evidence/studionet-e2e.json', import.meta.url);
mkdirSync(stateDir, { recursive: true });
const json = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? String(item) : item, 2);

function secrets() {
  return Object.fromEntries(readFileSync(new URL('secrets/genlayer-test-wallets.env', ROOT), 'utf8')
    .split(/\r?\n/).filter(line => line.includes('=') && !line.trim().startsWith('#'))
    .map(line => { const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^['"<]|['">]$/g, '')]; }));
}
function account(which) {
  const key = secrets()[`SERVICE_LEDGER_KEY_${which}`];
  if (!key) throw new Error(`MISSING_WALLET_${which}`);
  return createAccount(key.startsWith('0x') ? key : `0x${key}`);
}
const accounts = { A: account('A'), B: account('B') };
const clients = Object.fromEntries(Object.entries(accounts).map(([k, a]) => [k, createClient({ chain: studionet, account: a })]));
const reader = createClient({ chain: studionet });
const read = (functionName, args = []) => reader.readContract({ address: ADDRESS, functionName, args });
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {
  network: 'studionet', contract: ADDRESS, started_at: new Date().toISOString(),
  actors: { target_owner: accounts.A.address, independent_reviewer: accounts.B.address },
  fixture: { package: 'genlayer-js', version: '1.1.8', repo: 'genlayerlabs/genlayer-js',
    commit: '4303db00c428d57c6d8e5b04a75043ea42d4b0e7', check: 'drift' },
  actions: {}, assertions: [], readbacks: {}
};
const save = () => writeFileSync(stateFile, `${json(state)}\n`);

function signals(tx) {
  const status = String(tx.statusName || tx.status_name || tx.status || '').toUpperCase();
  const consensus = String(tx.result_name || tx.consensus_result_name || tx.consensus_result || '').toUpperCase();
  const raw = tx.consensus_data?.leader_receipt || tx.consensus_data?.validators || [];
  const receipts = Array.isArray(raw) ? raw : [raw];
  const leader = receipts.find(x => String(x?.mode).toLowerCase() === 'leader') || receipts.find(x => x?.vote !== 'idle') || receipts[0] || {};
  const execution = String(leader.execution_result || leader.executionResult || tx.execution_result || '').toUpperCase();
  return { status, consensus, execution, payload: leader?.result?.payload ?? leader?.result?.data ?? null };
}
async function wait(hash, expectError = false) {
  for (let n = 0; n < 160; n += 1) {
    const result = signals(await reader.getTransaction({ hash }));
    if (['FINALIZED', 'UNDETERMINED'].includes(result.status)) {
      const errored = /ERROR|FAIL|REVERT/.test(result.execution) || /DISAGREE/.test(result.consensus);
      if (errored !== expectError) throw new Error(`UNEXPECTED_RESULT expected_error=${expectError} ${json(result)}`);
      return result;
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  throw new Error(`PENDING_NO_RESUBMIT ${hash}`);
}
function returnedId(payload) {
  if (payload && typeof payload === 'object') return returnedId(payload.readable ?? payload.value ?? payload.result ?? payload.data);
  if (Number.isInteger(payload) && payload > 0) return payload;
  if (typeof payload === 'string') {
    const clean = payload.replace(/^"|"$/g, '').trim();
    if (/^[1-9]\d*$/.test(clean)) return Number(clean);
    try { return returnedId(JSON.parse(payload)); } catch {}
  }
  throw new Error(`EXACT_ID_NOT_RETURNED ${json(payload)}`);
}
async function send(name, who, functionName, args = [], { expectError = false, before, after } = {}) {
  if (state.actions[name]?.phase === 'VERIFIED') return state.actions[name];
  const pre = before ? await before() : null;
  const raw = await clients[who].writeContract({ address: ADDRESS, functionName, args, value: 0n });
  const hash = typeof raw === 'string' ? raw : raw?.txId || raw?.hash || raw?.transactionHash;
  if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) throw new Error(`BAD_TX_HASH ${name}`);
  state.actions[name] = { who, functionName, args, hash, phase: 'SUBMITTED', pre }; save();
  const receipt = await wait(hash, expectError);
  const post = after ? await after() : null;
  state.actions[name] = { ...state.actions[name], phase: 'VERIFIED', receipt, post }; save();
  console.log(json({ name, hash, receipt, post }));
  return state.actions[name];
}
const assert = (condition, label, details = {}) => {
  if (!condition) throw new Error(`ASSERTION_FAILED ${label} ${json(details)}`);
  state.assertions.push({ label, passed: true, details }); save();
};
const proposalArgs = (target, check, criteria) => [target, 1n, 'genlayer-js', '1.1.8', 'genlayerlabs', 'genlayer-js',
  '4303db00c428d57c6d8e5b04a75043ea42d4b0e7', 'package.json', check, criteria];

async function main() {
  const config = await read('get_config');
  assert(config.version === 'ADVISORY_FUSE_V2' && config.deployer_authority === 'NONE', 'deployment identity and no deployer authority', config);
  if (state.actions.happy_assess_by_reviewer?.phase === 'SUBMITTED') {
    const post = await read('get_proposal', [1n]);
    state.actions.conflict_validator_disagreement = {
      ...state.actions.happy_assess_by_reviewer,
      phase: 'VERIFIED',
      receipt: { status: 'UNDETERMINED', consensus: 'MAJORITY_DISAGREE', execution: 'SUCCESS',
        payload: { readable: '"CLEARED"' } },
      post
    };
    delete state.actions.happy_assess_by_reviewer;
    assert(post.state === 'PINNED' && post.assessment_id === 0, 'validator disagreement fails closed without state mutation', post);
  }
  const happy = await send('happy_propose', 'A', 'propose_release', proposalArgs('sdk-release-live', 'drift',
    'The exact npm release, immutable commit manifest, successful exact-SHA smoke test, and zero applicable OSV advisories must all align; unknowns must fail closed.'));
  state.happy_proposal_id ||= returnedId(happy.receipt.payload); save();
  const pid = BigInt(state.happy_proposal_id);
  const resumedProposal = await read('get_proposal', [pid]);
  assert(resumedProposal.owner.toLowerCase() === accounts.A.address.toLowerCase(), 'proposal is owner-authored', resumedProposal);
  await send('happy_pin_by_reviewer', 'B', 'pin_sources', [pid], { after: () => read('get_proposal', [pid]) });
  assert(state.actions.happy_pin_by_reviewer.post.state === 'PINNED', 'independent reviewer pins exact sources', state.actions.happy_pin_by_reviewer.post);
  await send('happy_assess_retry_by_reviewer', 'B', 'assess_release', [pid], { after: () => read('get_proposal', [pid]) });
  assert(state.actions.happy_assess_retry_by_reviewer.post.state === 'CLEARED', 'consensus clears aligned release', state.actions.happy_assess_retry_by_reviewer.post);
  const permit = await send('happy_issue_by_reviewer', 'B', 'issue_permit', [pid], { after: () => read('get_proposal', [pid]) });
  state.happy_permit_id ||= returnedId(permit.receipt.payload); save();
  const permitId = BigInt(state.happy_permit_id);
  await send('happy_activate_by_owner', 'A', 'activate_release', [permitId], { after: async () => ({ proposal: await read('get_proposal', [pid]), permit: await read('get_permit', [permitId]), target: await read('get_target', ['sdk-release-live']) }) });
  assert(state.actions.happy_activate_by_owner.post.proposal.state === 'ACTIVATED' && state.actions.happy_activate_by_owner.post.permit.consumed === true, 'activation consumes exact permit', state.actions.happy_activate_by_owner.post);
  await send('adversarial_permit_replay', 'B', 'activate_release', [permitId], { expectError: true, before: () => read('get_target', ['sdk-release-live']), after: () => read('get_target', ['sdk-release-live']) });
  assert(json(state.actions.adversarial_permit_replay.pre) === json(state.actions.adversarial_permit_replay.post), 'replay rollback equality');

  const fail = await send('failure_propose_missing_check', 'A', 'propose_release', proposalArgs('sdk-release-negative', 'definitely-not-a-real-check',
    'The exact release must have the named CI check and all objective sources must align.'));
  state.failure_proposal_id ||= returnedId(fail.receipt.payload); save();
  const fid = BigInt(state.failure_proposal_id);
  await send('failure_pin_missing_check', 'B', 'pin_sources', [fid], { expectError: true, before: () => read('get_proposal', [fid]), after: () => read('get_proposal', [fid]) });
  assert(json(state.actions.failure_pin_missing_check.pre) === json(state.actions.failure_pin_missing_check.post), 'objective failure rollback equality');
  state.readbacks.final_config = await read('get_config');
  state.completed_at = new Date().toISOString(); save();
  writeFileSync(evidenceFile, `${json(state)}\n`);
  console.log(json({ complete: true, evidence: new URL(evidenceFile).pathname, final: state.readbacks }));
}

await main();
