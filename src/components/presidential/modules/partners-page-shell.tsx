import Image from 'next/image';
import Link from 'next/link';
import snapshot from '@/content/partners.json';
import { PARTNER_STATES, PARTNERS_COPY, PARTNERS_UI, PARTNERS_LABEL, PARTNERS_STATE_NAV_LABELS, partnerExplore, partnerLocations, partnerLogoAlt, partnersCountLine, type PartnerStateCode } from '@/content/partners-copy';
import { PresidentialSrosSection } from '@/components/sros/presidential-sros-section';
import { PageFrame } from '../layout/page-frame';
import { SceneStack } from '../layout/scene-stack';
import styles from './partners-page-shell.module.css';

export type Partner = {id:string;name:string;nationalDoors:number;website:string;logo:string|null;logoOnDark?:boolean;perState:Partial<Record<PartnerStateCode,{count:number;cities:string[]}>>};
const brands: readonly Partner[] = snapshot.brands;
export function partnersForState(code:PartnerStateCode) {
  return brands.filter(b=>b.perState[code]).toSorted((a,b)=>(b.perState[code]!.count-a.perState[code]!.count)||a.name.localeCompare(b.name));
}

function PartnerStateNavigation({code,position}:{code?:PartnerStateCode;position:'top'|'bottom'}) {
  return <nav aria-label={PARTNERS_STATE_NAV_LABELS[position]} className={styles.stateNavigation}>
    <ul>{PARTNER_STATES.map(state=><li key={state.code}><Link href={`/partners/${state.code}`} aria-current={state.code===code?'page':undefined}>{state.name}</Link></li>)}</ul>
  </nav>;
}

function PartnerClosingNavigation({code}:{code?:PartnerStateCode}) {
  return <section className={`${styles.section} po-gold-thread-inlay`}><div className={styles.closingNavigation}>
    <Link className={styles.close} href={code==='wa'?'/contact':code?`/find-us/${code}`:'/find-us'}>{code==='wa'?PARTNERS_UI.contact:PARTNERS_UI.close}</Link>
    <PartnerStateNavigation code={code} position="bottom"/>
  </div></section>;
}

// Homepage-aligned dark canvas, Presidential crest and teal pinstripe.
function PartnerHero({code}:{code?:PartnerStateCode}) {
  const state=PARTNER_STATES.find(s=>s.code===code);
  const copy=state?PARTNERS_COPY[state.code]:PARTNERS_COPY.hub;
  return <section aria-labelledby="partners-title" className={`${styles.hero} po-home-canvas-surface`}>
    <PartnerStateNavigation code={code} position="top"/>
    <div className={`${styles.crestFrame} po-teal-pinstripe`}>
      <Image alt={PARTNERS_UI.eyebrow} src="/brand/presidential-logo.webp" width={1200} height={929} sizes="(min-width: 768px) 520px, 80vw" loading="eager" fetchPriority="high" className={styles.crest}/>
    </div>
    <div className={styles.heroCopy}>
      <p className={styles.eyebrow}>{PARTNERS_UI.eyebrow}{state?` / ${state.code.toUpperCase()}`:''}</p>
      <h1 id="partners-title" className={styles.heroHeading}>{copy.h1}</h1>
      {state?<p className={styles.tagline}>{state.tagline}</p>:null}
      {state?.code!=='wa'?<p className={styles.heroCount}>{partnerLocations(state?.headlineDoors??1223)}</p>:null}
    </div>
  </section>;
}

function PartnerTile({brand,code}:{brand:Partner;code:PartnerStateCode}) {
  const state=PARTNER_STATES.find(s=>s.code===code)!;const local=brand.perState[code]!;
  const initials=brand.name.split(/[^a-zA-Z0-9]+/).filter(Boolean).slice(0,4).map(s=>s[0]).join('');
  const tile = <>
      <div className={styles.square} style={{background:brand.logo?(brand.logoOnDark?'#18181b':'#fff'):state.color,color:code==='ca'||code==='nv'?'var(--po-color-ink)':'#fff'}}>
        {brand.logo?<Image src={brand.logo} alt={partnerLogoAlt(brand.name,local.cities.join(', '),state.name)} width={144} height={144} sizes="144px" loading="lazy" className={styles.logo} unoptimized={brand.logo.endsWith('.svg')} />:<span className={styles.fallback} aria-hidden="true">{brand.name.length<=28?brand.name:initials}</span>}
      </div>
      <span className={styles.name}>{brand.name}</span>
      {local.count>1?<span className={styles.locations}>{partnerLocations(local.count)}</span>:null}
    </>;
  return <li className={styles.partner}>
    {brand.website ? <a href={brand.website} target="_blank" rel="nofollow noopener noreferrer" className={styles.tileLink}>{tile}</a> : <div className={styles.tileLink}>{tile}</div>}
    {brand.website?<a href={brand.website} target="_blank" rel="nofollow noopener noreferrer" className={styles.visit} aria-label={`Visit ${brand.name} site`}>{PARTNERS_UI.visit}</a>:null}
  </li>;
}

export function PartnersStateShell({code}:{code:PartnerStateCode}) {
  const state=PARTNER_STATES.find(s=>s.code===code)!; const copy=PARTNERS_COPY[code]; const partners=partnersForState(code);
  const doors=partners.reduce((sum,b)=>sum+b.perState[code]!.count,0);
  const chains=partners.filter(b=>b.perState[code]!.count>1);
  const singles=partners.filter(b=>b.perState[code]!.count===1).toSorted((a,b)=>a.name.localeCompare(b.name));
  return <PageFrame className={`po-home-canvas-dark ${styles.page}`}><SceneStack><PartnerHero code={code}/>
    {code==='wa'?<section className={`${styles.section} po-gold-thread-inlay`}><h2 className={styles.heading}>{PARTNERS_UI.landing}</h2></section>:null}
    <section className={`${styles.section} po-gold-thread-inlay`}><div className={styles.copy}>{copy.body.map(p=><p key={p}>{p}</p>)}</div></section>
    {code!=='wa'?<>
      <section className={`${styles.section} po-gold-thread-inlay`}><p className={styles.count}>{partnersCountLine(partners.length,doors,state.name)}</p>
      <h2 className={styles.heading}>{PARTNERS_UI.chains}</h2><ul className={styles.wall}>{chains.map(b=><PartnerTile key={b.id} brand={b} code={code}/>)}</ul></section>
      <section className={`${styles.section} po-gold-thread-inlay`}><h2 className={styles.heading}>{PARTNERS_UI.independents}</h2><ul className={styles.wall}>{singles.map(b=><PartnerTile key={b.id} brand={b} code={code}/>)}</ul></section>
    </>:null}
    <PartnerClosingNavigation code={code}/>
    </SceneStack></PageFrame>;
}

export function PartnersHubShell(){return <PageFrame className={`po-home-canvas-dark ${styles.page}`}><SceneStack><PartnerHero/>
  <section className={`${styles.section} po-gold-thread-inlay`}><div className={styles.copy}>{PARTNERS_COPY.hub.body.map(p=><p key={p}>{p}</p>)}</div></section>
  <section className={`${styles.section} po-gold-thread-inlay`} aria-label={PARTNERS_LABEL}><ul className={styles.states}>{PARTNER_STATES.map(s=><li key={s.code}><Link href={`/partners/${s.code}`} className={styles.stateCard}><div><span className={styles.stateCode} aria-hidden="true">{s.code.toUpperCase()}</span><h2>{s.name}</h2><p>{s.tagline}</p><p className={styles.stateCount}>{s.code==='wa'?PARTNERS_UI.landing:partnerLocations(s.headlineDoors)}</p><span className={styles.explore}>{partnerExplore(s.name)}</span></div></Link></li>)}</ul></section>
  <section className={`${styles.section} po-gold-thread-inlay`}><aside className={styles.callout}><p>{PARTNERS_UI.callout}</p><Link href="/contact" className={styles.close}>{PARTNERS_UI.contact}</Link></aside></section>
  <PresidentialSrosSection/>
  <PartnerClosingNavigation/>
  </SceneStack></PageFrame>}
