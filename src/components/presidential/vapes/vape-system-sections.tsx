'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  BatteryFull,
  Cloud,
  CloudArrowDown,
  Fire,
  Lightning,
  Monitor,
  Prohibit,
  SlidersHorizontal,
  Timer,
  Wind,
} from '@phosphor-icons/react/ssr';
import { VAPES_ADDITIONS } from '@/content/vapes-additions';
import { getVapeImage, type VapeView } from '@/lib/vapes/catalog';
import { TierIcon } from '../primitives/tier-icon';
import { VapeIcon, type VapeIconName } from './vape-icon';
import s from './showroom.module.css';

const CARD_ICONS = {
  BatteryFull,
  Cloud,
  CloudArrowDown,
  Fire,
  Lightning,
  Monitor,
  Prohibit,
  SlidersHorizontal,
  Timer,
  Wind,
} as const;

const ORBIT_SPIN_VIEWS = [
  'home',
  'front-left',
  'back-right',
  'back',
  'back-left',
  'front-right',
] as const satisfies readonly VapeView[];

function OrbitSpin() {
  return <div className={s.orbitSpin} role="img" aria-label="Teal Presidential Orbit rotating through its front, side, and rear views">
    {ORBIT_SPIN_VIEWS.map((view, index) => {
      const image = getVapeImage('teal', 'ld', view);
      return <Image
        alt=""
        aria-hidden="true"
        className={s.orbitSpinFrame}
        data-frame={index}
        height={image.height}
        key={view}
        loading="eager"
        sizes="(min-width: 1024px) 43vw, 78vw"
        src={image.src}
        width={image.width}
      />;
    })}
  </div>;
}

function DotList({ items }: { readonly items: readonly string[] }) {
  return <span className={s.dotList}>{items.map(item => <span key={item}>{item}</span>)}</span>;
}

function BenefitRow({ items, className = '' }: { readonly items: readonly string[]; className?: string }) {
  return <ul className={`${s.systemBenefits} ${className}`}>{items.map(item => <li key={item}><VapeIcon name="check" />{item}</li>)}</ul>;
}

function Checklist({ items }: { readonly items: readonly string[] }) {
  return <ul className={s.bandChecklist}>{items.map(item => <li key={item}><VapeIcon name="check" />{item}</li>)}</ul>;
}

function BandIcon({ name }: { name: keyof typeof CARD_ICONS }) {
  const Icon = CARD_ICONS[name];
  return <span className={s.bandIcon}><Icon aria-hidden="true" size={28} weight="regular" /></span>;
}

function PanelHeading({ number, title }: { number: string; title: string }) {
  return <div className={s.panelHeading}><span aria-hidden="true">{number}</span><h2>{title}</h2></div>;
}

function FlavorChart() {
  const chart = VAPES_ADDITIONS.performance.panels[0].chart;
  const chartRef = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const chartNode = chartRef.current;
    if (!chartNode) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDrawn(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setDrawn(true);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(chartNode);
    return () => observer.disconnect();
  }, []);

  return <div className={s.chartBlock}>
    <h3>{chart.title}</h3>
    <svg ref={chartRef} className={`${s.flavorChart} ${drawn ? s.chartDrawn : ''}`} viewBox="0 0 520 250" role="img" aria-labelledby="flavor-chart-title flavor-chart-description">
      <title id="flavor-chart-title">{chart.title}</title>
      <desc id="flavor-chart-description">{chart.lines[0]}. {chart.lines[1]}. {chart.axes[0]}. {chart.axes[1]}.</desc>
      <rect x="1.5" y="1.5" width="517" height="247" rx="8" />
      <text x="34" y="42" className={s.orbitLabel}>{chart.lines[0]}</text>
      <text x="34" y="67" className={s.otherLabel}>{chart.lines[1]}</text>
      <path className={`${s.chartLine} ${s.orbitLine}`} pathLength="1" d="M36 88 C 180 84 340 82 484 86" />
      <path className={`${s.chartLine} ${s.otherLine}`} pathLength="1" d="M36 88 C 170 104 332 145 484 198" />
      <circle className={s.orbitDot} cx="36" cy="88" r="5" /><circle className={s.orbitDot} cx="484" cy="86" r="5" />
      <circle className={s.otherDot} cx="36" cy="88" r="4.5" /><circle className={s.otherDot} cx="484" cy="198" r="4.5" />
      <text x="34" y="230" className={s.axisLabel}>{chart.axes[0]}</text>
      <text x="486" y="230" textAnchor="end" className={s.axisLabel}>{chart.axes[1]}</text>
    </svg>
  </div>;
}

function FeatureList({ items }: { items: readonly { readonly icon: string; readonly title: string; readonly description?: string }[] }) {
  return <div className={s.bandFeatureList}>{items.map(item => <article key={item.title}>
    <BandIcon name={item.icon as keyof typeof CARD_ICONS} />
    <p><strong>{item.title}{item.description ? ':' : ''}</strong>{item.description ? ` ${item.description}` : ''}</p>
  </article>)}</div>;
}

export function VapeBuiltForOilBand() {
  const { builtForOil, value } = VAPES_ADDITIONS;
  return <section className={`${s.section} ${s.systemSection} ${s.cardBand} ${s.builtForOil}`} aria-labelledby="built-for-oil-heading">
    <h2 id="built-for-oil-heading">{builtForOil.title}</h2>
    <div className={s.pillarGrid}>{value.pillars.map(item => <article key={item.title}><VapeIcon name={item.icon} /><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
  </section>;
}

export function VapePerformanceBand() {
  const [flavor, clouds] = VAPES_ADDITIONS.performance.panels;
  return <section className={`${s.section} ${s.systemSection} ${s.cardBand} ${s.dualPanelBand}`} aria-label={`${flavor.title}. ${clouds.title}.`}>
    <article className={s.bandPanel}>
      <PanelHeading number={flavor.number} title={flavor.title} />
      <p className={s.panelIntro}>{flavor.intro}</p>
      <FlavorChart />
      <Checklist items={flavor.checks} />
    </article>
    <article className={`${s.bandPanel} ${s.cloudPanel}`}>
      <PanelHeading number={clouds.number} title={clouds.title} />
      <p className={s.panelIntro}>{clouds.intro}</p>
      <div className={s.cloudPanelBody}>
        <FeatureList items={clouds.callouts} />
        <Image src={clouds.image.src} alt={clouds.image.alt} width={1200} height={1500} sizes="(min-width: 1024px) 24vw, 82vw" />
      </div>
    </article>
  </section>;
}

export function VapeModeSystemSection() {
  const content = VAPES_ADDITIONS.modeSystem;
  const comma = content.howTo.indexOf(',');
  const howToSteps = [content.howTo.slice(0, comma + 1), content.howTo.slice(comma + 2)];

  return <section className={`${s.section} ${s.systemSection} ${s.cardBand} ${s.modeSystem}`} id="orbit-system" aria-labelledby="orbit-system-heading">
    <div className={s.modeShowpiece}>
      <div className={s.modeDevice}>
        <div className={s.modeDeviceGlow} aria-hidden="true" />
        <OrbitSpin />
        <div className={s.modeLights} aria-hidden="true"><i data-tier="silver" /><i data-tier="gold" /><i data-tier="rose-gold" /></div>
      </div>
      <div className={s.modeStory}>
        <p className={s.eyebrow}><DotList items={content.eyebrow} /></p>
        <h2 id="orbit-system-heading">{content.title}</h2>
        <p className={s.modeLead}>{content.lead}</p>
        <h3 className={s.smallHeading}>{content.modesHeading}</h3>
        <div className={s.modeRows}>
          {content.modes.map(mode => <article className={s.modeRow} data-tier={mode.tier} key={mode.code}>
            <div className={s.modeIcon}><TierIcon tier={mode.tier} size={40} /></div>
            <div><h3>{mode.title} <span>({mode.code})</span></h3><p>{mode.description}</p></div>
          </article>)}
        </div>
        <div className={s.modeInstructions}>
          <ol className={s.howToSteps}>{howToSteps.map((step, index) => <li key={step}><span aria-hidden="true">0{index + 1}</span><p>{step}</p></li>)}</ol>
          <div className={s.modeDots} aria-label="LD, LR, LRO"><span data-mode="ld"><i />LD</span><span data-mode="lr"><i />LR</span><span data-mode="lro"><i />LRO</span></div>
        </div>
        <h3 className={s.smallHeading}>{content.benefitsHeading}</h3>
        <BenefitRow items={content.benefits} className={s.modeBenefits} />
        <p className={s.modeClosing}>{content.closing}</p>
      </div>
    </div>
  </section>;
}

export function VapeHardwareBand() {
  const [hardware, benefits] = VAPES_ADDITIONS.hardware.panels;
  return <section className={`${s.section} ${s.systemSection} ${s.cardBand} ${s.dualPanelBand}`} aria-label={`${hardware.title}. ${benefits.title}.`}>
    <article className={`${s.bandPanel} ${s.hardwarePanel}`}>
      <PanelHeading number={hardware.number} title={hardware.title} />
      <p className={s.panelIntro}>{hardware.intro}</p>
      <div className={s.hardwarePanelBody}>
        <FeatureList items={hardware.features} />
        <Image src={hardware.image.src} alt={hardware.image.alt} width={1200} height={1500} sizes="(min-width: 1024px) 23vw, 82vw" />
      </div>
    </article>
    <article className={s.bandPanel}>
      <PanelHeading number={benefits.number} title={benefits.title} />
      <FeatureList items={benefits.features} />
    </article>
  </section>;
}

export function VapeTechnologyBand() {
  const { advantage, ceramic, standards } = VAPES_ADDITIONS;
  const leftFeatures = advantage.features.slice(0, 3);
  const rightFeatures = advantage.features.slice(3);
  const renderCallout = (item: (typeof advantage.features)[number], side: 'left' | 'right') => <article className={s.advantageCallout} data-side={side} key={item.title}>
    <VapeIcon name={item.icon} />
    <div><h3>{item.title}</h3>{'parts' in item ? <p><DotList items={item.parts} /></p> : <p>{item.description}</p>}</div>
    <span className={s.leaderLine} aria-hidden="true" />
  </article>;

  return <section className={`${s.section} ${s.systemSection} ${s.cardBand} ${s.technologyBand}`} aria-label={standards.ariaLabel}>
    <div className={s.whyOrbitBlock}>
      <div className={s.panelHeading}><span aria-hidden="true">{standards.orbit.number}</span><h2>{standards.orbit.title}</h2></div>
      <div className={s.whyOrbitList}>{standards.orbit.items.map(item => <article key={item.title}><VapeIcon name="check" /><div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div>
      <div className={s.oilTierRow}>
        <h3>{standards.orbit.oils.title}</h3>
        <div>{standards.orbit.oils.items.map(item => <article key={item.name}><strong>{item.name}</strong><span>{item.tier}</span></article>)}</div>
      </div>
    </div>

    <div className={s.advantage}>
      <p className={s.eyebrow}>{advantage.eyebrow}</p>
      <h2 id="orbit-advantage-heading">{advantage.title}</h2>
      <div className={s.advantageDiagram}>
        <div className={s.advantageSide}>{leftFeatures.map(item => renderCallout(item, 'left'))}</div>
        <div className={s.advantageDevice}><Image src="/media/vapes/showroom/black-ld-front-left.webp" alt="Presidential Orbit smart heating vape battery" width={1200} height={1500} sizes="(min-width: 1024px) 30vw, 72vw" loading="lazy" /></div>
        <div className={s.advantageSide}>{rightFeatures.map(item => renderCallout(item, 'right'))}</div>
      </div>
    </div>

    <div className={s.ceramic}>
      <h2 id="ceramic-system-heading">{ceramic.title}</h2>
      <div className={s.ceramicGrid}>
        {ceramic.items.map((item, index) => <article key={item.title}>
          <VapeIcon name={(['ceramic-platform', 'ceramic-coils', 'ceramic-cotton-free', 'ceramic-tube-free'] as VapeIconName[])[index]} />
          <h3>{item.title}</h3><p>{item.description}</p>
        </article>)}
      </div>
      <BenefitRow items={ceramic.benefits} className={s.ceramicBenefits} />
    </div>
  </section>;
}

function HeavyMetalBadge() {
  const [brand, tested] = VAPES_ADDITIONS.userExperience.badge;
  return <svg className={s.heavyMetalBadge} viewBox="0 0 120 140" role="img" aria-labelledby="heavy-metal-badge-title">
    <title id="heavy-metal-badge-title">{brand} {tested}</title>
    <path d="M60 5 108 23v43c0 32-18 55-48 69C30 121 12 98 12 66V23L60 5Z" />
    <text x="60" y="52" textAnchor="middle">{brand}</text>
    <text x="60" y="75" textAnchor="middle">{tested}</text>
    <path className={s.badgeCheck} d="m47 106 8 8 19-23" />
  </svg>;
}

export function VapeUserExperienceBand() {
  const { standards, userExperience } = VAPES_ADDITIONS;
  const material = standards.safety.groups[0];
  const overheat = standards.safety.groups[1];
  const [timing, protection] = overheat.title.split(' OVERHEAT ');
  const [count, unit] = timing.split('-');

  return <section className={`${s.section} ${s.systemSection} ${s.cardBand} ${s.userExperienceBand}`} aria-labelledby="user-experience-heading">
    <h2 id="user-experience-heading">{userExperience.title}</h2>
    <div className={s.experiencePair}>
      <article className={s.experienceCard}>
        <BandIcon name="Timer" />
        <h3>{userExperience.blinker.title}</h3>
        <Checklist items={userExperience.blinker.checks} />
      </article>
      <article className={s.experienceCard}>
        <h3 className={s.overheatHeading}><span>{count}</span><small>-{unit}</small><strong>OVERHEAT {protection}</strong></h3>
        <Checklist items={overheat.checks} />
      </article>
    </div>
    <article className={s.materialBand}>
      <HeavyMetalBadge />
      <div><h2>{standards.safety.title}</h2><h3>{material.title}</h3>{'body' in material ? <p>{material.body}</p> : null}<Checklist items={material.checks} /></div>
    </article>
  </section>;
}

export function VapeValueBand() {
  const { value } = VAPES_ADDITIONS;
  const [batteryValue, podValue, smartValue] = value.title.split(/ \+ | = /);

  return <section className={`${s.section} ${s.systemSection} ${s.cardBand} ${s.value}`} aria-labelledby="commercial-advantages-heading">
    <h2 id="commercial-advantages-heading" className={s.bandTitle}>{value.bandTitle}</h2>
    <p className={s.smallHeading}>{value.subhead}</p>
    <div className={s.valueHeading}>
      <h2 id="smarter-value-heading"><span>{batteryValue}</span><span><b>+</b> {podValue}</span><span><b>=</b> {smartValue}</span></h2>
      <div><p>{value.body}</p><Checklist items={value.benefits} /></div>
    </div>
    <div className={s.taglineStrip}>{value.taglines.map(([strong, light]) => <p key={strong}><strong>{strong}</strong><span>{light}</span></p>)}</div>
  </section>;
}
