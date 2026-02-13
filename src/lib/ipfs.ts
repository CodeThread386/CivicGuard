/**
 * IPFS/Filecoin persistence - credentials stored decentralized
 * Uses NFT.Storage (free) or Pinata for pinning
 */

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const BACKEND_IPFS = '/api/ipfs'; // Proxy through our backend

export async function pinToIPFS(
  data: string,
  apiUrl: string
): Promise<{ cid: string; uri: string }> {
  const res = await fetch(`${apiUrl}${BACKEND_IPFS}/pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error('Failed to pin to IPFS');
  const { cid } = await res.json();
  return { cid, uri: `ipfs://${cid}` };
}

export async function fetchFromIPFS(
  cid: string,
  apiUrl?: string
): Promise<string> {
  const url = apiUrl
    ? `${apiUrl}${BACKEND_IPFS}/fetch?cid=${encodeURIComponent(cid)}`
    : `${IPFS_GATEWAY}${cid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch from IPFS');
  return res.text();
}

export function resolveIPFSUrl(cid: string): string {
  return `${IPFS_GATEWAY}${cid}`;
}
