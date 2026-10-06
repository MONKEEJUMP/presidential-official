import type { Metadata } from 'next';
import { PageFrame } from '@/components/presidential/layout/page-frame';
import { VaultFormatHub, vaultFormatHubMetadata } from '@/components/vault/format-hub';
import { vaultRooms } from '@/content/vault/catalog';

const room = vaultRooms.find((r) => r.slug === 'mini-blunts')!;

export function generateMetadata(): Metadata {
  return vaultFormatHubMetadata(room);
}

export default function Page() {
  return <PageFrame className="bg-[#06100f]"><VaultFormatHub room={room} /></PageFrame>;
}
