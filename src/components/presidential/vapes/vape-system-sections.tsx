import Image from 'next/image';
import { VAPES_ADDITIONS } from '@/content/vapes-additions';
import { TierIcon } from '../primitives/tier-icon';
import { VapeIcon, type VapeIconName } from './vape-icon';
import s from './showroom.module.css';

function DotList({ items }: { readonly items: readonly string[] }) {
  return <span className={s.dotList}>{items.map(item => <span key={item}>{item}</span>)}</span>;
}

function BenefitRow({ items, className = '' }: { readonly items: readonly string[]; className?: string }) {
  return <ul className={`${s.systemBenefits} ${className}`}>{items.map(item => <li key={item}><VapeIcon name="check" />{item}</li>)}</ul>;
}

export function VapeModeSystemSection() {
  const content = VAPES_ADDITIONS.modeSystem;
  const comma = content.howTo.indexOf(',');
  const howToSteps = [content.howTo.slice(0, comma + 1), content.howTo.slice(comma + 2)];

  return <section className={`${s.section} ${s.systemSection} ${s.modeSystem}`} id="orbit-system" aria-labelledby="orbit-system-heading">
    <div className={s.modeShowpiece}>
      <div className={s.modeDevice}>
        <div className={s.modeDeviceGlow} aria-hidden="true" />
        <Image src="/media/vapes/showroom/teal-ld-home.webp" alt="Presidential Orbit vape battery with three oil modes" width={1200} height={1500} sizes="(min-width: 1024px) 43vw, 78vw" loading="lazy" />
        <div className={s.modeLights} aria-hidden="true"><i data-tier="silver" /><i data-tier="gold" /><i data-tier="rose-gold" /></div>
      </div>
      <div className={s.modeStory}>
        <p className={s.eyebrow}><DotList items={content.eyebrow} /></p>
        <h2 id="orbit-system-heading">{content.title}</h2>
        <p className={s.modeLead}>{content.lead}</p>
        <div className={s.modeRows}>
          {content.modes.map(mode => <article className={s.modeRow} data-tier={mode.tier} key={mode.code}>
            <div className={s.modeIcon}><TierIcon tier={mode.tier} size={40} /></div>
            <div><h3>{mode.title} <span>({mode.code})</span></h3><p>{mode.description}</p></div>
          </article>)}
        </div>
        <ol className={s.howToSteps}>{howToSteps.map((step, index) => <li key={step}><span aria-hidden="true">0{index + 1}</span><p>{step}</p></li>)}</ol>
        <BenefitRow items={content.benefits} className={s.modeBenefits} />
      </div>
    </div>
  </section>;
}

export function VapeAdvantageSections() {
  const { advantage, ceramic, standards, value } = VAPES_ADDITIONS;
  const leftFeatures = advantage.features.slice(0, 3);
  const rightFeatures = advantage.features.slice(3);
  const [batteryValue, podValue, smartValue] = value.title.split(/ \+ | = /);
  const renderCallout = (item: (typeof advantage.features)[number], side: 'left' | 'right') => <article className={s.advantageCallout} data-side={side} key={item.title}>
    <VapeIcon name={item.icon} />
    <div><h3>{item.title}</h3>{'parts' in item ? <p><DotList items={item.parts} /></p> : <p>{item.description}</p>}</div>
    <span className={s.leaderLine} aria-hidden="true" />
  </article>;

  return <>
    <section className={`${s.section} ${s.systemSection} ${s.advantage}`} aria-labelledby="orbit-advantage-heading">
      <p className={s.eyebrow}>{advantage.eyebrow}</p>
      <h2 id="orbit-advantage-heading">{advantage.title}</h2>
      <div className={s.advantageDiagram}>
        <div className={s.advantageSide}>{leftFeatures.map(item => renderCallout(item, 'left'))}</div>
        <div className={s.advantageDevice}><Image src="/media/vapes/showroom/black-ld-front-left.webp" alt="Presidential Orbit smart heating vape battery" width={1200} height={1500} sizes="(min-width: 1024px) 30vw, 72vw" loading="lazy" /></div>
        <div className={s.advantageSide}>{rightFeatures.map(item => renderCallout(item, 'right'))}</div>
      </div>
    </section>

    <section className={`${s.section} ${s.systemSection} ${s.ceramic}`} aria-labelledby="ceramic-system-heading">
      <h2 id="ceramic-system-heading">{ceramic.title}</h2>
      <div className={s.ceramicGrid}>
        {ceramic.items.map((item, index) => <article key={item.title}>
          <VapeIcon name={(['ceramic-platform', 'ceramic-coils', 'ceramic-cotton-free', 'ceramic-tube-free'] as VapeIconName[])[index]} />
          <h3>{item.title}</h3><p>{item.description}</p>
        </article>)}
      </div>
      <BenefitRow items={ceramic.benefits} className={s.ceramicBenefits} />
    </section>

    <section className={`${s.section} ${s.systemSection} ${s.standards}`} aria-label={standards.ariaLabel}>
      <div className={s.standardsColumn}>
        <h2>{standards.orbit.title}</h2>
        <div className={s.whyOrbitList}>{standards.orbit.items.map((item, index) => <article key={item.title}><span aria-hidden="true">0{index + 1}</span><div><h3>{item.title}</h3><p>{item.description}</p></div></article>)}</div>
      </div>
      <div className={s.standardsColumn}>
        <h2>{standards.safety.title}</h2>
        <div className={s.safetyGroups}>{standards.safety.groups.map((group, index) => <article key={group.title} className={index === 0 ? s.materialStandard : s.overheatStandard}>
          {index === 0 ? <h3 className={s.safetyStamp}>{group.title}</h3> : (() => {
            const [timing, protection] = group.title.split(' OVERHEAT ');
            const [count, unit] = timing.split('-');
            return <h3 className={s.overheatHeading}><span>{count}</span><small>-{unit}</small><strong>OVERHEAT {protection}</strong></h3>;
          })()}
          {'body' in group ? <p>{group.body}</p> : null}
          <ul>{group.checks.map(item => <li key={item}><VapeIcon name="check" />{item}</li>)}</ul>
        </article>)}</div>
      </div>
    </section>

    <section className={`${s.section} ${s.systemSection} ${s.value}`} aria-labelledby="smarter-value-heading">
      <div className={s.valueHeading}>
        <h2 id="smarter-value-heading"><span>{batteryValue}</span><span><b>+</b> {podValue}</span><span><b>=</b> {smartValue}</span></h2>
        <p>{value.body}</p>
      </div>
      <div className={s.pillarGrid}>{value.pillars.map(item => <article key={item.title}><VapeIcon name={item.icon} /><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
    </section>
  </>;
}
