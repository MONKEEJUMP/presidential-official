'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { getVapeGallery, getVapeImage, VAPE_FAMILIES, VAPE_FINISHES, VAPE_MODEL_SETS, VAPE_VIEWS, type VapeFamily, type VapeFinish, type VapePage } from '@/lib/vapes/catalog';
import { VapeGalleryDialog } from './vape-gallery-dialog';
import { VapeIcon } from './vape-icon';
import { VapeAdvantageSections, VapeModeSystemSection } from './vape-system-sections';
import s from './showroom.module.css';

function ColorChoices({ value, onChange, label }: { value: VapeFinish; onChange: (value: VapeFinish) => void; label: string }) {
  return <div className={s.colorChoices} role="group" aria-label={label}>
    {VAPE_FINISHES.map(finish => <button type="button" key={finish.id} aria-label={finish.name} aria-pressed={value === finish.id} onClick={() => onChange(finish.id)}>
      <span className={s.swatch} data-finish={finish.id} /><span>{finish.name}</span>
    </button>)}
  </div>;
}

export function VapeExperience({ page }: { page: VapePage }) {
  const [finish, setFinish] = useState<VapeFinish>(page === 'orbit' ? 'black' : 'teal');
  const [family, setFamily] = useState<VapeFamily>('ld');
  const [viewIndex, setViewIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [modelIndex, setModelIndex] = useState(2);
  const [archiveOpened, setArchiveOpened] = useState(false);
  const explorerRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const gallery = getVapeGallery(finish, family);
  const current = gallery[viewIndex];
  const selectedFinish = VAPE_FINISHES.find(item => item.id === finish)!;
  const selectedFamily = VAPE_FAMILIES.find(item => item.id === family)!;
  const selectedModel = VAPE_MODEL_SETS[modelIndex];
  const model = getVapeImage(selectedModel.finish, selectedModel.family, 'model');

  function moveView(delta: number) { setViewIndex(value => (value + delta + 8) % 8); }
  function explore(color: VapeFinish, type: VapeFamily, index = viewIndex, open = false) {
    setFinish(color); setFamily(type); setViewIndex(index);
    if (open) setLightboxOpen(true);
    else explorerRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  function openImage(index: number) { setViewIndex(index); setLightboxOpen(true); }

  return <>
    <section className={`${s.section} ${s.explorer}`} id="vape-explorer" ref={explorerRef} aria-labelledby="vape-explorer-heading">
      <div className={s.sectionHeading}>
        <div><p className={s.eyebrow}>The product explorer</p><h2 id="vape-explorer-heading">Your Orbit.<br /><span>Your perspective.</span></h2></div>
        <p>Find your finish. Explore the pod families.<br />See the details from every side.</p>
      </div>
      <div className={s.explorerGrid}>
        <div className={s.gallery}>
          <div className={s.galleryStage} data-view={current.view}>
            <span className={s.stageName}>{selectedFinish.name} / {selectedFamily.code}</span>
            <button type="button" className={s.stageImage} aria-label={`Enlarge ${current.alt}`}
              onTouchStart={event => { swiped.current = false; touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
              onTouchEnd={event => {
                const start = touchStart.current;
                if (!start) return;
                const dx = event.changedTouches[0].clientX - start.x, dy = event.changedTouches[0].clientY - start.y;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; moveView(dx < 0 ? 1 : -1); }
                touchStart.current = null;
              }}
              onClick={() => { if (swiped.current) { swiped.current = false; return; } setLightboxOpen(true); }}>
              <Image key={current.src} src={current.src} alt={current.alt} width={current.width} height={current.height} sizes="(min-width: 1100px) 680px, (min-width: 760px) 58vw, 95vw" className={s.mainImage} />
              <span className={s.enlarge}><VapeIcon name="expand" /><span>Take a closer look</span></span>
            </button>
            <div className={s.galleryArrows}>
              <button type="button" aria-label="Previous product view" onClick={() => moveView(-1)}><VapeIcon name="left" /></button>
              <p aria-live="polite">{current.label}<span>{String(viewIndex + 1).padStart(2, '0')} / 08</span></p>
              <button type="button" aria-label="Next product view" onClick={() => moveView(1)}><VapeIcon name="right" /></button>
            </div>
          </div>
          <div className={s.thumbnails} role="group" aria-label="Product image views">
            {gallery.map((image, index) => <button key={image.view} type="button" aria-label={`Show ${image.label}`} aria-pressed={index === viewIndex} onClick={() => setViewIndex(index)}>
              <Image src={image.src} alt="" width={96} height={104} sizes="90px" /><span>{VAPE_VIEWS[index].short}</span>
            </button>)}
          </div>
        </div>
        <div className={s.controls}>
          <p className={s.eyebrow}>Moon Pods + Orbit</p>
          <h3>Meet your<br /><span>next Orbit.</span></h3>
          <p className={s.selectionSummary}>{selectedFinish.name} <span>/</span> {selectedFamily.name}</p>
          <fieldset><legend>01 <span>Choose your battery finish</span></legend><ColorChoices value={finish} onChange={setFinish} label="Battery finish" /></fieldset>
          <fieldset><legend>02 <span>Explore a pod family</span></legend>
            <div className={s.familyChoices}>
              {VAPE_FAMILIES.map(item => <button type="button" key={item.id} aria-pressed={family === item.id} onClick={() => setFamily(item.id)}><span>{item.name}</span><small>{item.code}</small></button>)}
            </div>
          </fieldset>
          <p className={s.productNote}>Moon Pods shown with the Orbit device. Explore the front, back, side angles, display and complete design overview.</p>
          <Link href="/find-us" className={s.primaryButton}>Find a licensed retailer <VapeIcon name="arrow" /></Link>
          <Link href={selectedFamily.guide} className={s.textLink}>Get to know {selectedFamily.name.toLowerCase()} <VapeIcon name="arrow" /></Link>
        </div>
      </div>
    </section>

    <section className={`${s.section} ${s.families}`} id="moon-pods" aria-labelledby="moon-pods-chapters-heading">
      <div className={s.sectionHeading}>
        <div><p className={s.eyebrow}>Moon Pods</p><h2 id="moon-pods-chapters-heading">Three families.<br /><span>One Presidential standard.</span></h2></div>
        <p>Liquid Diamonds. Live Resin. Live Rosin.<br />A closer look at each expression.</p>
      </div>
      <div className={s.chapterColors}><span className={s.label}>Orbit finish</span><ColorChoices value={finish} onChange={setFinish} label="Moon Pods chapter finish" /></div>
      <div className={s.familyCards}>
        {VAPE_FAMILIES.map((item, index) => {
          const angle = getVapeImage(finish, item.id, 'front-left');
          const screen = getVapeImage(finish, item.id, 'screen');
          return <article className={s.familyCard} key={item.id}>
            <div className={s.familyCardMedia}>
              <span className={s.familyNumber}>0{index + 1}<span>{item.code}</span></span>
              <button type="button" aria-label={`Explore ${selectedFinish.name} ${item.name}`} onClick={() => explore(finish, item.id, 1)}>
                <Image src={angle.src} alt={angle.alt} width={1200} height={1500} sizes="(min-width: 1000px) 380px, (min-width: 650px) 46vw, 92vw" />
              </button>
              <button type="button" className={s.screenPeek} aria-label={`Enlarge ${item.code} display`} onClick={() => explore(finish, item.id, 6, true)}>
                <Image src={screen.src} alt={`${item.code} display on the ${selectedFinish.name.toLowerCase()} Orbit device`} width={180} height={225} sizes="100px" /><span>{item.code} display <VapeIcon name="expand" /></span>
              </button>
            </div>
            <div className={s.familyCardCopy}><h3>{item.name}</h3><p>{item.description}</p>
              <div><button className={s.textLink} type="button" onClick={() => explore(finish, item.id, 0)}>Explore {item.code} <VapeIcon name="arrow" /></button><Link className={s.guideLink} href={item.guide}>Read the guide</Link></div>
            </div>
          </article>;
        })}
      </div>
      <p className={s.sectionNote}>Moon Pods photographed on Orbit. Explore the device separately on the <Link href="/orbit">Orbit page</Link>.</p>
    </section>

    {page === 'vapes' ? <VapeModeSystemSection /> : null}

    <section className={`${s.section} ${s.finishes}`} id="orbit" aria-labelledby="orbit-finish-heading">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>Orbit battery finishes</p><h2 id="orbit-finish-heading">Make it<br /><span>your signature.</span></h2></div><p>Four finishes. Front and back.<br />The Presidential details in full view.</p></div>
      <div className={s.finishRail}>
        {VAPE_FINISHES.map(item => {
          const front = getVapeImage(item.id, 'ld', 'home'), back = getVapeImage(item.id, 'ld', 'back');
          return <button className={s.finishCard} key={item.id} type="button" onClick={() => explore(item.id, 'ld', 3)} aria-label={`Explore ${item.name} Orbit finish`}>
            <span className={s.finishPair}><Image src={front.src} alt={`${item.name} Orbit front, LD pod attached`} width={1200} height={1500} sizes="(min-width: 900px) 200px, 42vw" /><Image src={back.src} alt={`${item.name} Orbit rear artwork, LD pod attached`} width={1200} height={1500} sizes="(min-width: 900px) 200px, 42vw" /></span>
            <span className={s.finishCaption}><span className={s.swatch} data-finish={item.id} />{item.name}<VapeIcon name="arrow" /></span>
          </button>;
        })}
      </div>
      <p className={s.sectionNote}>Tap a finish to explore its complete gallery. Devices shown with LD Moon Pods attached.</p>
    </section>

    <section className={`${s.section} ${s.details}`} id="details" aria-labelledby="orbit-detail-heading">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>The closer look</p><h2 id="orbit-detail-heading">Details make<br /><span>the difference.</span></h2></div><div><p>Currently exploring</p><p className={s.detailSelection}>{selectedFinish.name} / {selectedFamily.name}</p><button type="button" className={s.textLink} onClick={() => explore(finish, family)}>Change your selection <VapeIcon name="arrow" /></button></div></div>
      <div className={s.detailGrid}>
        {[
          { view: 'back' as const, index: 3, title: 'The signature.', text: 'The Presidential crest. The palms. Your chosen finish, seen from the other side.', style: s.artworkDetail },
          { view: 'screen' as const, index: 6, title: 'In clear view.', text: `Take a closer look at the ${selectedFamily.code} display and the front of the device.`, style: s.displayDetail },
          { view: 'front-left' as const, index: 1, title: 'The profile.', text: 'A different perspective on the mouthpiece, side control and shape of Orbit.', style: s.profileDetail },
        ].map(item => {
          const image = getVapeImage(finish, family, item.view);
          return <article className={`${s.detailCard} ${item.style}`} key={item.view}><button type="button" onClick={() => openImage(item.index)} aria-label={`Enlarge ${item.title}`}><Image src={image.src} alt={image.alt} width={1200} height={1500} sizes="(min-width: 900px) 550px, 92vw" /><span><VapeIcon name="expand" /></span></button><div><h3>{item.title}</h3><p>{item.text}</p></div></article>;
        })}
      </div>
      <div className={s.portDetail}><p>Explore the mouthpiece, sides and base together in the matching design overview.</p><button className={s.textLink} type="button" onClick={() => openImage(7)}>View the complete design <VapeIcon name="arrow" /></button></div>
    </section>

    {page === 'vapes' ? <VapeAdvantageSections /> : null}

    <section className={`${s.section} ${s.models}`} id="designs" aria-labelledby="vape-design-heading">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>The design collection</p><h2 id="vape-design-heading">Every angle.<br /><span>Every expression.</span></h2></div><p>Explore all twelve design overviews.<br />Select a finish. Open the full picture.</p></div>
      <div className={s.modelLayout}>
        <div className={s.modelStage}>
          <button type="button" className={s.modelImage} onClick={() => explore(selectedModel.finish, selectedModel.family, 7, true)} aria-label={`Enlarge ${model.alt}`}><Image key={model.src} src={model.src} alt={model.alt} width={model.width} height={model.height} sizes="(min-width: 1000px) 850px, 94vw" /><span className={s.enlarge}><VapeIcon name="expand" />Open design overview</span></button>
          <div className={s.modelCaption}><button type="button" aria-label="Previous design overview" onClick={() => setModelIndex(value => (value + 11) % 12)}><VapeIcon name="left" /></button><p>{VAPE_FINISHES.find(item => item.id === selectedModel.finish)!.name} / {VAPE_FAMILIES.find(item => item.id === selectedModel.family)!.name}<span>{String(modelIndex + 1).padStart(2, '0')} / 12</span></p><button type="button" aria-label="Next design overview" onClick={() => setModelIndex(value => (value + 1) % 12)}><VapeIcon name="right" /></button></div>
        </div>
        <div className={s.modelMenu}>
          {VAPE_FAMILIES.map((item, familyIndex) => <fieldset key={item.id}><legend>{item.name}<small>{item.code}</small></legend><div>{VAPE_FINISHES.map((color, colorIndex) => <button type="button" key={color.id} aria-label={`${color.name} ${item.name} design`} aria-pressed={modelIndex === familyIndex * 4 + colorIndex} onClick={() => setModelIndex(familyIndex * 4 + colorIndex)}><span className={s.swatch} data-finish={color.id} /><span>{color.name}</span></button>)}</div></fieldset>)}
          <p>Design renderings show the product from multiple viewpoints. Explore the studio photography above for a closer look at the photographed devices.</p>
        </div>
      </div>
      <details className={s.archive} onToggle={(event) => {
        if (event.currentTarget.open) setArchiveOpened(true);
      }}>
        <summary>Browse the complete photo library <span>96 views <VapeIcon name="plus" /></span></summary>
        {archiveOpened ? <div className={s.archiveContents}>
          {VAPE_MODEL_SETS.map(set => <section key={`${set.finish}-${set.family}`} aria-label={`${set.finish} ${set.family.toUpperCase()} photo collection`}>
            <h3>{VAPE_FINISHES.find(item => item.id === set.finish)!.name} <span>/ {VAPE_FAMILIES.find(item => item.id === set.family)!.name}</span></h3>
            <div>{getVapeGallery(set.finish, set.family).map((image, index) => <button key={image.view} type="button" onClick={() => explore(set.finish, set.family, index, true)} aria-label={`Open ${image.alt}`}><Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1000px) 140px, (min-width: 650px) 22vw, 42vw" loading="lazy" /><span>{image.label}</span></button>)}</div>
          </section>)}
        </div> : null}
      </details>
    </section>
    <VapeGalleryDialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} images={gallery} index={viewIndex} onIndex={setViewIndex} title={`${selectedFinish.name} / ${selectedFamily.name}`} />
  </>;
}
