import { sameChainId } from './transactions.js';

export async function connectInjected(injected, chain, createClient) {
  const providers = injected?.providers?.length ? injected.providers : [injected];
  const available = providers.filter(p => typeof p?.request === 'function');
  if (!available.length) throw new Error('Install an EIP-1193 browser wallet.');
  // Never call SDK connect(): v1.1.8 uses global window.ethereum and requires Snaps.
  const provider = available.find(p => p.isMetaMask) || available[0];
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!/^0x[0-9a-f]{40}$/i.test(accounts?.[0] || '')) throw new Error('Wallet returned no valid account.');
  const chainId = `0x${chain.id.toString(16)}`;
  if (!sameChainId(await provider.request({ method: 'eth_chainId' }), chain.id)) {
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    } catch (error) {
      if (Number(error.code ?? error.data?.originalError?.code) !== 4902) throw error;
      await provider.request({ method: 'wallet_addEthereumChain', params: [{
        chainId, chainName: chain.name, nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls.default.http,
        ...(chain.blockExplorers?.default?.url ? { blockExplorerUrls: [chain.blockExplorers.default.url] } : {}),
      }] });
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    }
  }
  if (!sameChainId(await provider.request({ method: 'eth_chainId' }), chain.id)) {
    throw new Error('Wallet is not on GenLayer StudioNet. Switch network and reconnect.');
  }
  const current = await provider.request({ method: 'eth_accounts' });
  if (current?.[0]?.toLowerCase() !== accounts[0].toLowerCase()) throw new Error('Wallet changed during connection. Reconnect.');
  return { account: accounts[0], provider, client: createClient({ chain, account: accounts[0], provider }) };
}
