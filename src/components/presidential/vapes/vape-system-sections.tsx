import { VAPES_ADDITIONS } from '@/content/vapes-additions';
import { TierIcon } from '../primitives/tier-icon';
import { VapeIcon } from './vape-icon';
import s from './showroom.module.css';

function DotList({ items }: { readonly items: readonly string[] }) {
  return <span className={s.dotList}>{items.map(item => <span key={item}>{item}</span>)}</span>;
}

function BenefitRow({ items }: { readonly items: readonly string[] }) {
  return <ul className={s.systemBenefits}>{items.map(item => <li key={item}><VapeIcon name="check" />{item}</li>)}</ul>;
}

export function VapeModeSystemSection() {
  const content = VAPES_ADDITIONS.modeSystem;
  return <section className={`${s.section} ${s.systemSection} ${s.modeSystem}`} id="orbit-system" aria-labelledby="orbit-system-heading">
    <div className={s.systemHeading}>
      <div>
        <p className={s.eyebrow}><DotList items={content.eyebrow} /></p>
        <h2 id="orbit-system-heading">{content.title}</h2>
      </div>
      <div className={s.systemLead}><p>{content.lead}</p><p>{content.howTo}</p></div>
    </div>
    <div className={s.modeCards}>
      {content.modes.map(mode => <article className={s.modeCard} data-tier={mode.tier} key={mode.code}>
        <div className={s.modeIcon}><TierIcon tier={mode.tier} size={48} /></div>
        <p className={s.modeCode}>{mode.code}</p>
        <h3>{mode.title}</h3>
        <p>{mode.description}</p>
      </article>)}
    </div>
    <BenefitRow items={content.benefits} />
  </section>;
}

export function VapeAdvantageSections() {
  const { advantage, ceramic, standards, value } = VAPES_ADDITIONS;
  return <>
    <section className={`${s.section} ${s.systemSection} ${s.advantage}`} aria-labelledby="orbit-advantage-heading">
      <p className={s.eyebrow}>{advantage.eyebrow}</p>
      <h2 id="orbit-advantage-heading">{advantage.title}</h2>
      <div className={s.advantageGrid}>
        {advantage.features.map(item => <article key={item.title}>
          <VapeIcon name={item.icon} />
          <div><h3>{item.title}</h3>{'parts' in item ? <p><DotList items={item.parts} /></p> : <p>{item.description}</p>}</div>
        </article>)}
      </div>
    </section>

    <section className={`${s.section} ${s.systemSection} ${s.ceramic}`} aria-labelledby="ceramic-system-heading">
      <h2 id="ceramic-system-heading">{ceramic.title}</h2>
      <div className={s.ceramicGrid}>
        {ceramic.items.map((item, index) => <article key={item.title}><span aria-hidden="true">0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
      </div>
      <BenefitRow items={ceramic.benefits} />
    </section>

    <section className={`${s.section} ${s.systemSection} ${s.standards}`} aria-label="Why Orbit and safety and material standards">
      <div className={s.standardsColumn}>
        <h2>{standards.orbit.title}</h2>
        <div className={s.whyOrbitList}>{standards.orbit.items.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
      </div>
      <div className={s.standardsColumn}>
        <h2>{standards.safety.title}</h2>
        <div className={s.safetyGroups}>{standards.safety.groups.map(group => <article key={group.title}><h3>{group.title}</h3>{'body' in group ? <p>{group.body}</p> : null}<ul>{group.checks.map(item => <li key={item}><VapeIcon name="check" />{item}</li>)}</ul></article>)}</div>
      </div>
    </section>

    <section className={`${s.section} ${s.systemSection} ${s.value}`} aria-labelledby="smarter-value-heading">
      <div className={s.valueHeading}><h2 id="smarter-value-heading">{value.title}</h2><p>{value.body}</p></div>
      <div className={s.pillarGrid}>{value.pillars.map(item => <article key={item.title}><VapeIcon name={item.icon} /><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
    </section>
  </>;
}
