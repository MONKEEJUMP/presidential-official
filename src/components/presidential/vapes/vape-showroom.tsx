import Image from 'next/image';
import Link from 'next/link';
import type { SeoRouteRecord } from '@/lib/seo/route-types';
import type { VapePage } from '@/lib/vapes/catalog';
import type { SanityHomepageModule } from '@/lib/cms/homepage';
import { PageFrame } from '../layout/page-frame';
import { VapeExperienceLoader } from './vape-experience-loader';
import { VapeIcon } from './vape-icon';
import { OrbitHeroFilm } from './orbit-hero-film';
import { CmsHomepageModuleRenderer } from '../modules/cms-homepage-module-renderer';
import s from './showroom.module.css';

const introductions = {
  vapes: { line: 'Designed for flavor.', text: 'Different Oils Need Different Heat. Every Oil Has a Sweet Spot.', title: <>VAPES<span>DESIGNED FOR FLAVOR.</span></> },
  'moon-pods': { line: 'Meet Moon Pods.', text: 'Liquid Diamonds, Live Resin and Live Rosin. Explore the Moon Pods family, photographed with Orbit.', title: <>PRESIDENTIAL MOON PODS</> },
  orbit: { line: 'Make it your Orbit.', text: 'Black. Silver. Teal. White. Get to know the device behind the Presidential vape experience.', title: <>PRESIDENTIAL ORBIT</> },
} as const;

export function VapeShowroom({ route, breadcrumbs, cmsModules }: { route: SeoRouteRecord; breadcrumbs: readonly { name: string; path: string }[]; cmsModules?: readonly SanityHomepageModule[] }) {
  const page = route.id as VapePage;
  const content = introductions[page];
  return <PageFrame className={s.showroom}>
    <section className={s.hero} aria-labelledby="vape-page-heading">
      <div className={s.heroInner}>
        <nav className={s.breadcrumb} aria-label="Breadcrumb"><ol>{breadcrumbs.map((item, index) => <li key={item.path}>{index > 0 ? <span aria-hidden="true">/</span> : null}{index === breadcrumbs.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}</li>)}</ol></nav>
        <div className={s.heroCopy}><p className={s.eyebrow}>{page === 'vapes' ? 'Presidential / Moon Pods + Orbit' : 'Presidential / Vape collection'}</p><h1 id="vape-page-heading" aria-label={route.h1}>{content.title}</h1><p className={s.heroIntro}>{content.text}</p><div className={s.heroCtas}><a href="#explore" className={s.primaryButton}>Explore the system <VapeIcon name="arrow" /></a><Link href="/find-us" className={s.heroRetail}>Find a retailer</Link></div></div>
        {page === 'vapes' ? <div className={s.blueprintHeroArt}><OrbitHeroFilm variant="blueprint" /></div> : <div className={s.heroArt}><span className={s.orbitRing} aria-hidden="true" /><span className={s.heroWord} aria-hidden="true">ORBIT</span><Image src="/media/vapes/showroom/hero-teal.webp" alt="Teal Presidential Orbit device with LD Moon Pod, angled product rendering" width={395} height={657} sizes="(min-width: 1100px) 420px, (min-width: 700px) 40vw, 64vw" loading="eager" fetchPriority="high" /><p>THE PRESIDENTIAL VAPE EXPERIENCE</p></div>}
        <div className={s.heroFooter}><span>One system. Every perspective.</span><a href="#explore">Discover the collection <VapeIcon name="arrow" /></a></div>
      </div>
    </section>
    <nav className={s.sectionNav} aria-label="Vape collection sections"><a href="#explore">Explore</a><a href="#moon-pods">Moon Pods</a>{page === 'vapes' ? <a href="#orbit-system">Orbit system</a> : null}<a href="#orbit">Orbit finishes</a><a href="#details">The details</a><a href="#designs">Design collection</a></nav>
    <VapeExperienceLoader page={page} />
    {cmsModules?.length ? <CmsHomepageModuleRenderer heroHeadingLevel="h2" modules={cmsModules} productRoute={page === 'moon-pods' || page === 'orbit' ? page : undefined} /> : null}
    <section className={`${s.section} ${s.education}`} aria-labelledby="vape-education-heading">
      <p className={s.eyebrow}>Get to know the system</p><div className={s.educationGrid}><div><h2 id="vape-education-heading">Good design.<br /><span>Clear understanding.</span></h2><OrbitHeroFilm /></div><div><p>Moon Pods and Orbit have distinct roles in the Presidential vape family. Explore the pod presentations, then examine the Orbit finish, front display, rear artwork and side profile. The photographs show them together as an assembled device.</p><p>Extract names describe different materials and processes. A photograph shows the product’s appearance; its package and accompanying product information identify the exact contents. Use the guides to understand the vocabulary, and confirm the product with your licensed retailer.</p><div className={s.educationLinks}><Link href="/learn/flavor-science">Flavor science <VapeIcon name="arrow" /></Link><Link href="/learn/different-extracts-need-different-heat">Different extracts, different heat <VapeIcon name="arrow" /></Link><Link href={page === 'moon-pods' ? '/orbit' : '/moon-pods'}>{page === 'moon-pods' ? 'Explore Orbit' : 'Explore Moon Pods'} <VapeIcon name="arrow" /></Link>{page !== 'vapes' ? <Link href="/vapes">The complete vape collection <VapeIcon name="arrow" /></Link> : null}</div></div></div>
    </section>
    <section className={s.retail} aria-labelledby="vape-retail-heading"><div className={s.retailInner}><div><p className={s.eyebrow}>Find your Presidential</p><h2 id="vape-retail-heading">Your next stop.<br /><span>The right retailer.</span></h2><p>Explore the official retailer locator, then check the store’s current Presidential selection. Availability varies by licensed retailer.</p><Link href="/find-us" className={s.primaryButton}>Find a licensed retailer <VapeIcon name="arrow" /></Link><p className={s.adultNote}>For adults 21+ where legal.</p></div><div className={s.retailArt} aria-hidden="true"><Image src="/media/vapes/showroom/teal-ld-back.webp" alt="" aria-hidden="true" width={1200} height={1500} sizes="(min-width: 900px) 440px, 80vw" /></div></div><p className={s.signoff}>EXPECT MORE.</p></section>
  </PageFrame>;
}
