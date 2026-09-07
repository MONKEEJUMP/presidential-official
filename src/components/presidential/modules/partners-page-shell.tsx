import Image from 'next/image';
import Link from 'next/link';
import snapshot from '@/content/partners.json';
import { PARTNER_STATES, PARTNERS_COPY, PARTNERS_UI, PARTNERS_LABEL, partnerExplore, partnerLocations, partnerLogoAlt, partnersCountLine, type PartnerStateCode } from '@/content/partners-copy';
import { stateFontClass } from '@/lib/find-us/state-fonts';
import { PageFrame } from '../layout/page-frame';
import { SceneStack } from '../layout/scene-stack';
import styles from './partners-page-shell.module.css';

export type Partner = {id:string;name:string;nationalDoors:number;website:string;logo:string|null;perState:Partial<Record<PartnerStateCode,{count:number;cities:string[]}>>};
const brands: readonly Partner[] = snapshot.brands;
export function partnersForState(code:PartnerStateCode) {
  return brands.filter(b=>b.perState[code]).toSorted((a,b)=>(b.perState[code]!.count-a.perState[code]!.count)||a.name.localeCompare(b.name));
}

// Ported from StatePageShell: PageFrame/SceneStack, existing hero imagery,
// left/top scrims, state display font, shared header/footer and gold seams.
function PartnerHero({code}:{code?:PartnerStateCode}) {
  const state=PARTNER_STATES.find(s=>s.code===code);
  const copy=state?PARTNERS_COPY[state.code]:PARTNERS_COPY.hub;
  return <section aria-labelledby="partners-title" className="relative isolate flex min-h-[70svh] overflow-hidden bg-po-ink po-gold-thread-inlay">
    <Image alt="" aria-hidden="true" className={`absolute inset-0 h-full w-full object-cover ${code==='wa'?'object-[75%_center]':'object-center'}`} fill sizes="100vw" src={`/media/states/${code??'ca'}-hero.webp`} loading="eager" fetchPriority="high" />
    <div aria-hidden="true" className={`absolute inset-0 ${code==='wa'?'bg-[linear-gradient(90deg,rgba(0,0,0,0.85),rgba(0,0,0,0.45))]':'bg-[linear-gradient(180deg,rgba(0,0,0,0.82),rgba(0,0,0,0.55))]'}`} />
    <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center gap-6 px-6 py-20 sm:px-10 lg:px-16">
      <p className="text-xs font-black uppercase tracking-widest text-po-on-dark">{PARTNERS_UI.eyebrow}{state?` / ${state.code.toUpperCase()}`:''}</p>
      <h1 id="partners-title" className={`max-w-5xl text-5xl leading-[1.05] text-po-on-dark sm:text-7xl ${state?stateFontClass(state.code):'font-display'}`}>{copy.h1}</h1>
      {state?<p className="max-w-2xl font-display text-2xl text-po-on-dark">{state.tagline}</p>:null}
      {state?.code!=='wa'?<p className="font-display text-xl text-po-on-dark">{partnerLocations(state?.headlineDoors??1223)}</p>:null}
    </div>
  </section>;
}

function PartnerTile({brand,code}:{brand:Partner;code:PartnerStateCode}) {
  const state=PARTNER_STATES.find(s=>s.code===code)!;const local=brand.perState[code]!;
  const initials=brand.name.split(/[^a-zA-Z0-9]+/).filter(Boolean).slice(0,4).map(s=>s[0]).join('');
  return <li className={styles.partner}>
    <Link href={`/find-us/${code}`} className={styles.tileLink}>
      <div className={styles.square} style={{background:brand.logo?'#fff':state.color,color:code==='ca'||code==='nv'?'var(--po-color-ink)':'#fff'}}>
        {brand.logo?<Image src={brand.logo} alt={partnerLogoAlt(brand.name,local.cities.join(', '),state.name)} width={144} height={144} sizes="144px" loading="lazy" className={styles.logo} unoptimized={brand.logo.endsWith('.svg')} />:<span className={styles.fallback} aria-hidden="true">{brand.name.length<=28?brand.name:initials}</span>}
      </div>
      <span className={styles.name}>{brand.name}</span>
      {local.count>1?<span className={styles.locations}>{partnerLocations(local.count)}</span>:null}
    </Link>
    {brand.website?<a href={brand.website} target="_blank" rel="nofollow noopener noreferrer" className={styles.visit}>{PARTNERS_UI.visit}</a>:null}
  </li>;
}

export function PartnersStateShell({code}:{code:PartnerStateCode}) {
  const state=PARTNER_STATES.find(s=>s.code===code)!; const copy=PARTNERS_COPY[code]; const partners=partnersForState(code);
  const doors=partners.reduce((sum,b)=>sum+b.perState[code]!.count,0);
  const chains=partners.filter(b=>b.perState[code]!.count>1);
  const singles=partners.filter(b=>b.perState[code]!.count===1).toSorted((a,b)=>a.name.localeCompare(b.name));
  return <PageFrame><SceneStack><PartnerHero code={code}/>
    {code==='wa'?<section className={`${styles.section} po-gold-thread-inlay`}><h2 className={styles.heading}>{PARTNERS_UI.landing}</h2></section>:null}
    <section className={`${styles.section} po-gold-thread-inlay`}><div className={styles.copy}>{copy.body.map(p=><p key={p}>{p}</p>)}</div></section>
    {code!=='wa'?<>
      <section className={`${styles.section} po-gold-thread-inlay`}><p className={styles.count}>{partnersCountLine(partners.length,doors,state.name)}</p>
      <h2 className={styles.heading}>{PARTNERS_UI.chains}</h2><ul className={styles.wall}>{chains.map(b=><PartnerTile key={b.id} brand={b} code={code}/>)}</ul></section>
      <section className={`${styles.section} po-gold-thread-inlay`}><h2 className={styles.heading}>{PARTNERS_UI.independents}</h2><ul className={styles.wall}>{singles.map(b=><PartnerTile key={b.id} brand={b} code={code}/>)}</ul></section>
    </>:null}
    <section className={`${styles.section} po-gold-thread-inlay`}><Link className={styles.close} href={code==='wa'?'/contact':`/find-us/${code}`}>{code==='wa'?PARTNERS_UI.contact:PARTNERS_UI.close}</Link></section>
    </SceneStack></PageFrame>;
}

export function PartnersHubShell(){return <PageFrame><SceneStack><PartnerHero/>
  <section className={`${styles.section} po-gold-thread-inlay`}><div className={styles.copy}>{PARTNERS_COPY.hub.body.map(p=><p key={p}>{p}</p>)}</div></section>
  <section className={`${styles.section} po-gold-thread-inlay`} aria-label={PARTNERS_LABEL}><ul className={styles.states}>{PARTNER_STATES.map(s=><li key={s.code}><Link href={`/partners/${s.code}`} className={styles.stateCard}><Image src={`/media/states/${s.code}-hero.webp`} alt="" width={600} height={400} sizes="(min-width: 768px) 33vw, 100vw" loading="lazy"/><div><h2>{s.name}</h2><p>{s.tagline}</p><p>{s.code==='wa'?PARTNERS_UI.landing:partnerLocations(s.headlineDoors)}</p><span>{partnerExplore(s.name)}</span></div></Link></li>)}</ul></section>
  <section className={`${styles.section} po-gold-thread-inlay`}><aside className={styles.callout}><p>{PARTNERS_UI.callout}</p><Link href="/contact" className={styles.close}>{PARTNERS_UI.contact}</Link></aside></section>
  </SceneStack></PageFrame>}
