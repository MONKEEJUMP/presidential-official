import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { VaultRoomPage } from '@/components/vault/room';
import { productsInRoom, vaultRooms } from '@/content/vault/catalog';

// Sitebulb oct06d #3: short factual intros for the two mini rooms. Weights and the
// build are the ones every mini pack states in src/content/vault/specs.json.
const ROOM_INTROS: Readonly<Record<string, (count: number) => string>> = {
  'mini-blunts': count => `Room III of the Presidential Vault holds the art for Presidential Moon Rock Mini Blunts: ${count} works, one per strain, each shown with its pack. Every pack holds three 0.7g Moon Rock mini blunts, 2.1g in total, made with flower, live resin, and diamonds in a tobacco-free wrap. Select a work to open it, or its name to see the product.`,
  'mini-pre-rolls': count => `Room IV of the Presidential Vault holds the art for Presidential Moon Rock Mini Pre-rolls: ${count} works, one per strain, each shown with its pack. Every pack holds three 0.5g Moon Rock mini pre-rolls, 1.5g in total, made with flower, live resin, and diamonds. Select a work to open it, or its name to see the product.`,
};

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
  const intro = ROOM_INTROS[room.slug]?.(productsInRoom(room.slug).length);
  // The intro is also in the fallback so it is in the server HTML before the client room hydrates.
  return <Suspense fallback={<><div className="vault-room-heading"><p className="vault-room-title">{room.name.toUpperCase()}</p></div>{intro ? <p className="vault-room-intro">{intro}</p> : null}</>}><VaultRoomPage room={room} intro={intro} /></Suspense>;
}
