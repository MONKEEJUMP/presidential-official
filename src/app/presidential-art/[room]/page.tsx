import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { VaultRoomPage } from '@/components/vault/room';
import { vaultRooms } from '@/content/vault/catalog';

export function generateStaticParams() { return vaultRooms.map(room => ({ room: room.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ room: string }> }): Promise<Metadata> {
  const { room: slug } = await params;
  const room = vaultRooms.find(r => r.slug === slug);
  if (!room) notFound();
  return { title: `${room.name} — The Presidential Vault`, description: `Explore the Presidential ${room.name} art collection in Room ${room.numeral} of The Presidential Vault. View original artwork and whole pack portraits.`, alternates: { canonical: `https://presidentialmoonrocks.com/presidential-art/${room.slug}` }, robots: { index: true, follow: true } };
}
export default async function RoomPage({ params }: { params: Promise<{ room: string }> }) {
  const { room: slug } = await params;
  const room = vaultRooms.find(r => r.slug === slug);
  if (!room) notFound();
  return <Suspense fallback={<div className="vault-room-heading"><p className="vault-room-title">{room.name.toUpperCase()}</p></div>}><VaultRoomPage room={room} /></Suspense>;
}
