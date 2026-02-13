import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'CivicGuard',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'civicguard-demo',
  chains: [polygonAmoy, polygon],
  ssr: true,
});
