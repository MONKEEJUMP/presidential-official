import type { Metadata } from 'next';
import { VaultEntrance } from '@/components/vault/entrance';

export const metadata: Metadata = {
  title: 'The Presidential Vault — Presidential Art',
  description: 'Explore the complete Presidential art collection. Step into four gallery rooms of Moon Rock Blunts, Pre-rolls, Mini Blunts and Mini Pre-rolls.',
  alternates: { canonical: 'https://presidentialmoonrocks.com/presidential-art' },
  robots: { index: true, follow: true },
};
export default function VaultPage() { return <VaultEntrance />; }
