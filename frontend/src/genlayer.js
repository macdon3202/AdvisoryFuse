import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { connectInjected } from './wallet.js';
import { CONTRACT_VERSION, normalizeHash, receiptState, sameAddress, sameChainId } from './transactions.js';
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
export const EXPLORER = 'https://explorer-studio.genlayer.com';
export const isConfigured = /^0x[0-9a-f]{40}$/i.test(CONTRACT_ADDRESS);
const reader = () => createClient({ chain: studionet });
export async function readContract(functionName, args = []) {
  if (!isConfigured) throw new Error('Deploy first, then set VITE_CONTRACT_ADDRESS.');
  return reader().readContract({ address: CONTRACT_ADDRESS, functionName, args });
}
export async function connectWallet() {
  return connectInjected(window.ethereum, studionet, createClient);
}
export async function writeContract(wallet, functionName, args = []) {
  const accounts = await wallet.provider.request({ method: 'eth_accounts' });
  if (!sameAddress(accounts?.[0], wallet.account)) throw new Error('Wallet changed. Reconnect before signing.');
  const chainId = await wallet.provider.request({ method: 'eth_chainId' });
  if (!sameChainId(chainId, studionet.id)) throw new Error('Switch the wallet to GenLayer StudioNet.');
  const config = await readContract('get_config');
  if (config.version !== CONTRACT_VERSION) throw new Error('Contract version mismatch. No transaction was sent.');
  return normalizeHash(await wallet.client.writeContract({ address: CONTRACT_ADDRESS, functionName, args, value: 0n }));
}
export async function waitFinalized(hash, onStatus = () => {}) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const receipt = await reader().getTransaction({ hash });
    const state = receiptState(receipt); onStatus(state);
    if (state.failed) throw new Error(`Transaction failed: ${state.consensus} / ${state.execution}`);
    if (state.finalized) return receipt;
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error('Transaction remains pending. Reconcile by hash before resubmitting.');
}
