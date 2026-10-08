import { createClient } from '../frontend/node_modules/genlayer-js/dist/index.js';
import { studionet } from '../frontend/node_modules/genlayer-js/dist/chains/index.js';
import { mkdirSync, writeFileSync } from 'node:fs';

const address = '0xA85b5871CeDb87cAe063d54A455DC6c9873D0b73';
const client = createClient({ chain: studionet });
const result = await client.readContract({ address, functionName: 'get_config', args: [] });
if (result.version !== 'ADVISORY_FUSE_V2') throw new Error(`VERSION_MISMATCH:${result.version}`);
if (result.deployer_authority !== 'NONE') throw new Error('DEPLOYER_AUTHORITY_PRESENT');
const record = { network: 'studionet', contract: address, read_method: 'get_config', result,
  checked_at: new Date().toISOString(),
  scope: 'Unauthenticated RPC readback; proves interface/configuration, not deployed-source identity or write-path E2E.' };
mkdirSync(new URL('../docs/evidence/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/evidence/deployment-readback.json', import.meta.url), `${JSON.stringify(record, null, 2)}\n`);
console.log(JSON.stringify(record, null, 2));
