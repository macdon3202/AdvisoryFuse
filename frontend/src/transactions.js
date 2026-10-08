export const CONTRACT_VERSION = 'ADVISORY_FUSE_V2';
export function normalizeHash(value) {
  const hash = typeof value === 'string' ? value : value?.txId || value?.hash;
  if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) throw new Error('Wallet returned an invalid transaction hash.');
  return hash;
}
export function receiptState(value) {
  const status = String(value?.statusName || value?.status_name || value?.status || '').toUpperCase();
  const raw = value?.consensus_data?.leader_receipt ?? value?.consensus_data?.validators ?? [];
  const rows = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  const leader = rows.find((row) => String(row?.mode).toLowerCase() === 'leader') || rows[0] || {};
  const execution = String(leader.execution_result || value?.execution_result || '').toUpperCase();
  const consensus = String(value?.result_name || value?.consensus_result_name || value?.consensus_result || '').toUpperCase();
  const agreed = ['MAJORITY_AGREE', 'AGREE', 'ACCEPTED'].includes(consensus);
  const failed = ['FAILED', 'REJECTED', 'CANCELLED', 'UNDETERMINED'].includes(status)
    || execution.includes('ERROR') || consensus.includes('DISAGREE')
    || (status === 'FINALIZED' && (!agreed || execution !== 'SUCCESS'));
  return { label: status || 'PENDING', finalized: status === 'FINALIZED' && agreed && execution === 'SUCCESS' && !failed, failed, consensus, execution };
}
export function sameAddress(a, b) { return Boolean(a && b && a.toLowerCase() === b.toLowerCase()); }
export function sameChainId(a, b) { try { return BigInt(a) === BigInt(b); } catch { return false; } }
