import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import shared from '@/components/presidential/prerolls/preroll-experience.module.css';
import { productsInRoom, type VaultRoom } from '@/content/vault/catalog';
import { canonicalUrl } from '@/lib/seo/schema/constants';
import { VaultFormatCard } from './format-cards';

function hubLabel(room: VaultRoom): string {
  return room.name.replace('Pre-rolls', 'Pre-Rolls');
}

export function vaultFormatHubMetadata(room: VaultRoom): Metadata {
  const label = hubLabel(room);
  const names = productsInRoom(room.slug).map((p) => p.strain);
  const title = `Presidential ${label} | Infused ${label}`;
  const description = `Explore Presidential Moon Rock ${label}: ${names.join(', ')}. Availability varies by licensed retailer.`;
  const canonical = canonicalUrl(`/${room.slug}`);
  return { title, description, alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { title, description, url: canonical, type: 'website' } };
}

export function VaultFormatHub({ room }: { room: VaultRoom }) {
  const products = productsInRoom(room.slug);
  const label = hubLabel(room);
  return (
    <div className={shared.page}>
      <section aria-labelledby={`${room.slug}-heading`} className={shared.hero}>
        <div className={shared.heroAtmosphere} />
        <div className={shared.heroInner}>
          <div className={shared.heroCopy}>
            <nav aria-label="Breadcrumb" className={shared.breadcrumbs}>
              <Link href="/">Presidential</Link>
              <span aria-hidden="true">/</span>
              <span>{label}</span>
            </nav>
            <h1 id={`${room.slug}-heading`}>{`Presidential ${label}`}</h1>
            <p className={shared.heroLead}>Flower. Concentrate. A Presidential finish.</p>
            <div className={shared.heroActions}>
              <a className={shared.primaryAction} href="#collection">{`Explore the ${label.toLowerCase()}`}</a>
              <Link className={shared.textAction} href="/find-us">Find a retailer</Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label={`Presidential ${label}`} className={shared.artIndex} id="collection">
        <div className={shared.tierSections}>
          <section className={shared.tierSection}>
            <div className={`${shared.artGrid} ${shared.tierGrid}`}>
              {products.map((product) => <VaultFormatCard key={product.slug} product={product} />)}
            </div>
          </section>
        </div>
      </section>

      <section aria-labelledby={`${room.slug}-find-heading`} className={shared.find} id="find">
        <div>
          <p>Find your Presidential</p>
          <h2 id={`${room.slug}-find-heading`}>Your next stop.<br /><span>The right retailer.</span></h2>
          <p className={shared.findCopy}>Explore the official retailer locator, then check the store&apos;s current Presidential selection. Availability varies by licensed retailer.</p>
          <Link className={shared.primaryAction} href="/find-us">Find a licensed retailer</Link>
          <small>For adults 21+ where legal.</small>
        </div>
        <div className={shared.findMark}>
          <span>Find your<br />Presidential.</span>
          <Image alt="Presidential logo" height={291} src="/media/brand/presidential-crest-master.png" width={376} />
        </div>
      </section>
    </div>
  );
}
