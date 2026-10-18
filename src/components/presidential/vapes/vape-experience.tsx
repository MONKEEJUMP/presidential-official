'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { getVapeGallery, getVapeImage, VAPE_FAMILIES, VAPE_FINISHES, VAPE_MODEL_SETS, VAPE_VIEWS, type VapeFamily, type VapeFinish, type VapePage } from '@/lib/vapes/catalog';
import { VapeGalleryDialog } from './vape-gallery-dialog';
import { VapeIcon } from './vape-icon';
import {
  VapeBuiltForOilBand,
  VapeHardwareBand,
  VapeModeSystemSection,
  VapePerformanceBand,
  VapeTechnologyBand,
  VapeUserExperienceBand,
} from './vape-system-sections';
import s from './showroom.module.css';
import { sanityImage } from "@/lib/cms/sanity-image";

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

  const orbitFinishesSection = (
    <section className={`${s.section} ${s.finishes}`} id="orbit" aria-labelledby="orbit-finish-heading">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>Orbit battery finishes</p><h2 id="orbit-finish-heading">Make it<br /><span>your signature.</span></h2></div><p>Four finishes. Front and back.<br />The Presidential details in full view.</p></div>
      <div className={s.finishRail}>
        {VAPE_FINISHES.map(item => {
          const front = getVapeImage(item.id, 'ld', 'home'), back = getVapeImage(item.id, 'ld', 'back');
          return <button className={s.finishCard} key={item.id} type="button" onClick={() => explore(item.id, 'ld', 3)} aria-label={`Explore ${item.name} Orbit finish`}>
            <span className={s.finishPair}><Image {...sanityImage(front.src)} alt={`${item.name} Orbit front, LD pod attached`} width={1200} height={1500} sizes="(min-width: 900px) 200px, 42vw" /><Image {...sanityImage(back.src)} alt={`${item.name} Orbit rear artwork, LD pod attached`} width={1200} height={1500} sizes="(min-width: 900px) 200px, 42vw" /></span>
            <span className={s.finishCaption}><span className={s.swatch} data-finish={item.id} />{item.name}<VapeIcon name="arrow" /></span>
          </button>;
        })}
      </div>
      <p className={s.sectionNote}>Tap a finish to explore its complete gallery. Devices shown with LD Moon Pods attached.</p>
    </section>
  );

  return <>
    {page === 'vapes' ? <><VapeModeSystemSection />{orbitFinishesSection}</> : null}
    {page === 'vapes' ? <VapeBuiltForOilBand /> : null}
    {/* INLINKS-COPY-R36: /vapes H3s placed right after the "Vapes beside the rest of the Presidential lineup" band
        (vape-system-sections.tsx left untouched per chief ruling). Reused anchor "what THC distillate is" replaced;
        state line made neutral (no availability claim). */}
    {page === 'vapes' ? (
      <section className={`${s.section} ${s.systemSection} ${s.cardBand}`} aria-label="From vape oil to infused flower">
        <h3 className={s.smallHeading}>From vape oil to infused flower</h3>
        <p>
          The extract names behind the Moon Pod families also appear in Presidential&apos;s infused flower formats.{' '}
          <Link href="/learn/infusion-science">How Presidential infusion works</Link> covers how concentrate is carried through
          flower, and <Link href="/learn/what-is-thc-distillate">a primer on THC distillate</Link> explains the refined extract that
          none of the pod families is built on.
        </p>
        <h3 className={s.smallHeading}>Checking a state for Orbit and Moon Pods</h3>
        <p>
          To check a specific state, start with its store finder page, such as the{' '}
          <Link href="/find-us/ca">California store finder page</Link>, the <Link href="/find-us/mi">Michigan store finder page</Link>{' '}
          or the <Link href="/find-us/ny">New York store finder page</Link>, and ask the store whether it carries Orbit and the pod
          family you want by name.
        </p>
        {/* INLINKS-COPY-R39: /vapes store-buyer and blunt H3s (reused anchors reworded). */}
        <h3 className={s.smallHeading}>Orbit and Moon Pods for store buyers</h3>
        <p>
          Stores that want to stock Orbit batteries and Moon Pods can start with{' '}
          <Link href="/wholesale">Presidential wholesale for vape buyers</Link> or <Link href="/contact">reach the Presidential team</Link>.
        </p>
        <h3 className={s.smallHeading}>From a vape cartridge to a Moon Rock blunt</h3>
        <p>
          Moon Pods hold liquid diamond, live resin or live rosin oil.{' '}
          <Link href="/blunts">Moon Rock blunts in a hemp wrap</Link> carry extract in a tobacco-free wrap instead, and{' '}
          <Link href="/learn/what-are-moon-rocks">the flower build behind Moon Rocks</Link> explains how they are made.
        </p>
      </section>
    ) : null}

    <section className={`${s.section} ${s.explorer}`} id="explore" ref={explorerRef} aria-labelledby="vape-explorer-heading">
      <div className={s.sectionHeading}>
        <div><p className={s.eyebrow}>The product explorer</p><h2 id="vape-explorer-heading">Your Orbit.<br /><span>Your perspective.</span></h2></div>
        <p>Find your finish. Explore the pod families.<br />See the details from every side.</p>
      </div>
      {/* INLINKS-COPY-R17: /orbit battery H3s (copy as written). */}
      {page === 'orbit' ? (
        <div>
          <h3>What the Orbit battery does</h3>
          <p>
            Orbit is the battery behind Presidential vapes, built to pair with{' '}
            <Link href="/moon-pods">Moon Pods vape cartridges</Link>. Instead of one fixed heat, Orbit has three oil modes, Liquid
            Diamond (LD), Live Resin (LR) and Live Rosin (LRO). To pick one, press the device button three times, then select the oil
            type, and the battery applies the heat set for that oil.{' '}
            <Link href="/learn/different-extracts-need-different-heat">Why different extracts need different heat</Link> explains
            the reasoning.
          </p>
          <h3>Matching the battery mode to the pod family</h3>
          <p>
            Each Moon Pods family has its own mouthpiece and display. Liquid Diamonds has the teal mouthpiece, Live Resin has a clear
            mouthpiece and the LRE display, and Live Rosin has a smoked mouthpiece and the LRO display. Read{' '}
            <Link href="/learn/what-are-liquid-diamonds">what liquid diamonds are</Link>,{' '}
            <Link href="/learn/what-is-live-resin">what live resin is</Link> and{' '}
            <Link href="/learn/what-is-live-rosin">what live rosin is</Link> before you choose a mode.
          </p>
          <h3>Four Orbit battery finishes</h3>
          <p>
            Orbit comes in four finishes, black, silver, teal and white, and each one shows the Presidential details front and back.
            The <Link href="/vapes">full Presidential vape collection</Link> shows each finish. The{' '}
            <Link href="/find-us">Presidential store finder</Link> lists retailers that carry Orbit.
          </p>
          {/* INLINKS-COPY-R19: /orbit finish, mode and where-to-find H3s (copy as written). */}
          <h3>Choosing an Orbit finish</h3>
          <p>
            Orbit comes in black, silver, teal and white, and every finish has the same three oil modes. Pick the finish you like,
            then match the mode to the pod. <Link href="/moon-pods">Moon Pods vape cartridges</Link> and the{' '}
            <Link href="/vapes">Presidential vapes collection</Link> show each pod family.
          </p>
          <h3>Setting the mode before the first draw</h3>
          <p>
            Press the button three times and select Liquid Diamond, Live Resin or Live Rosin to match the pod&apos;s display.{' '}
            <Link href="/learn/different-extracts-need-different-heat">Why different extracts need different heat</Link> explains the
            reason, and <Link href="/learn/flavor-science">how flavor science works</Link> covers why the right mode keeps the
            extract&apos;s character.
          </p>
          <h3>Where to find Orbit</h3>
          <p>
            Use the <Link href="/find-us">Presidential retailer finder</Link> to check a store near you. Retail buyers can start with{' '}
            {/* INLINKS-COPY-R27: "Orbit for retail buyers" repeated this H3, so its partner link is merged here. */}
            <Link href="/wholesale">Presidential wholesale</Link> or <Link href="/partners">the Presidential partner program</Link>.
          </p>
          {/* INLINKS-COPY-R27: /orbit vape lineup H3 (copy as written). */}
          <h3>Orbit inside the Presidential vape lineup</h3>
          <p>
            Orbit is the battery, and the pods carry the extract. See every pod family in{' '}
            <Link href="/moon-pods">Moon Pods vape cartridges</Link>, browse{' '}
            <Link href="/vapes">the full Presidential vapes collection</Link>, and use{' '}
            <Link href="/learn">the Presidential learn hub</Link> to read up on each extract before you pair it with a mode.
          </p>
          {/* INLINKS-COPY-R37: /orbit state-finder and brand H3s ("about Presidential" anchor already used, reworded). */}
          <h3>Checking your state before you look for Orbit</h3>
          <p>
            Presidential keeps a store finder page by state. Start with the{' '}
            <Link href="/find-us/az">Arizona Presidential store finder</Link>, the{' '}
            <Link href="/find-us/nv">Nevada Presidential store finder</Link> or the{' '}
            <Link href="/find-us/ok">Oklahoma Presidential store finder</Link>, and ask the licensed retailer whether Orbit and Moon
            Pods are on its shelf.
          </p>
          <h3>The brand behind the Orbit battery</h3>
          <p>
            Orbit carries the same Presidential crest as the Moon Rocks, blunts and pre-rolls. The{' '}
            <Link href="/our-story">Presidential brand story</Link> and the <Link href="/about">company behind Presidential</Link>{' '}
            pages cover who makes it.
          </p>
          {/* INLINKS-COPY-R41: /orbit state-finder and Moon Rocks H3s (copy as written). */}
          <h3>More state store finders for Orbit</h3>
          <p>
            Presidential keeps a store finder page by state. Check <Link href="/find-us/ca">the California store finder</Link>,{' '}
            <Link href="/find-us/mi">the Michigan store finder</Link> or <Link href="/find-us/ny">the New York store finder</Link>{' '}
            before you look for Orbit.
          </p>
          <h3>Orbit beside the Moon Rocks jar</h3>
          <p>
            Orbit heats the oil in a pod. <Link href="/moon-rocks">The Presidential Moon Rocks platform</Link> carries extract on
            flower instead, and questions about either can go through <Link href="/contact">the Presidential contact page</Link>.
          </p>
        </div>
      ) : null}
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
              <Image key={current.src} {...sanityImage(current.src)} alt={current.alt} width={current.width} height={current.height} sizes="(min-width: 1100px) 680px, (min-width: 760px) 58vw, 95vw" className={s.mainImage} />
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
              <Image {...sanityImage(image.src)} alt="" width={96} height={104} sizes="90px" /><span>{VAPE_VIEWS[index].short}</span>
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

    {page === 'vapes' ? <VapePerformanceBand /> : null}

    <section className={`${s.section} ${s.families}`} id="moon-pods" aria-labelledby="moon-pods-chapters-heading">
      <div className={s.sectionHeading}>
        <div><p className={s.eyebrow}>Moon Pods</p><h2 id="moon-pods-chapters-heading">Every family.<br /><span>One Presidential standard.</span></h2></div>
        <p>Liquid Diamonds. Live Resin. Live Rosin.<br />A closer look at each expression.</p>
      </div>
      {/* INLINKS-COPY-R14: /moon-pods families H3 (copy as written). */}
      {page === 'moon-pods' ? (
        <div>
          <h3>How the Moon Pod families differ</h3>
          <p>
            Moon Pods are the vaporizer side of Presidential, built to run on the Orbit device. They come from{' '}
            <Link href="/about">the same Los Angeles cannabis company behind Moon Rocks</Link>. Each pod family names its extract.{' '}
            <Link href="/learn/what-are-liquid-diamonds">Liquid diamonds</Link> are crystallized cannabinoids paired with terpenes,{' '}
            <Link href="/learn/what-is-live-resin">live resin</Link> is made from fresh-frozen plant material, and{' '}
            <Link href="/learn/what-is-live-rosin">live rosin</Link> is solventless. These are different routes than distillation,
            and each keeps a different share of the plant&apos;s terpenes, which <Link href="/learn/flavor-science">flavor science</Link>{' '}
            explains. <Link href="/learn/different-extracts-need-different-heat">Why different extracts need different heat</Link>{' '}
            covers how each one behaves in a vaporizer. To find a location carrying Moon Pods and Orbit, use the{' '}
            <Link href="/find-us">Presidential store finder</Link>.
          </p>
          {/* INLINKS-COPY-R21: /moon-pods mouthpiece H3 (copy as written; facts from src/lib/vapes/catalog.ts). */}
          <h3>Telling the pod families apart by mouthpiece</h3>
          <p>
            You can tell each Moon Pod family by its mouthpiece. Liquid Diamonds has the teal mouthpiece, Live Resin has the clear one
            and Live Rosin has the smoked one, and each pod runs on the <Link href="/orbit">Orbit vape device</Link>. Read{' '}
            <Link href="/learn/what-are-liquid-diamonds">what liquid diamonds are</Link>,{' '}
            <Link href="/learn/what-is-live-resin">what live resin is</Link> and{' '}
            <Link href="/learn/what-is-live-rosin">what live rosin is</Link> to see what sits behind each color.
          </p>
          {/* INLINKS-COPY-R35: /moon-pods distillate H3 (reused anchors "what THC distillate is" / "what moon rocks are" replaced). */}
          <h3>Moon Pods beside the distillate route</h3>
          <p>
            None of the Moon Pod families is built on distillate. Read{' '}
            <Link href="/learn/what-is-thc-distillate">the THC distillate explainer</Link> to see the refined extract the pod families
            differ from, and the guide to <Link href="/learn/what-are-moon-rocks">the flagship moon rock format</Link> from the same Los
            Angeles company. Stores that want to carry Moon Pods and Orbit can start with the{' '}
            <Link href="/partners">Presidential retail partner program</Link>.
          </p>
          {/* INLINKS-COPY-R38: /moon-pods live resin and retail-buyer H3s (reused anchors reworded). */}
          <h3>Live resin outside the cartridge</h3>
          <p>
            Live resin, one of the Moon Pods extracts, also coats the flower in{' '}
            <Link href="/mini-blunts">hemp-wrapped mini blunt packs</Link>.{' '}
            <Link href="/learn/infusion-science">How an extract is infused into flower</Link> explains how an extract is carried
            through flower instead of sitting in a cartridge.
          </p>
          <h3>Moon Pods for retail buyers</h3>
          <p>
            Stores that want to carry Moon Pods can start with <Link href="/wholesale">the Presidential wholesale program</Link> or{' '}
            <Link href="/contact">contact the Presidential team</Link>.
          </p>
        </div>
      ) : null}
      <div className={s.chapterColors}><span className={s.label}>Orbit finish</span><ColorChoices value={finish} onChange={setFinish} label="Moon Pods chapter finish" /></div>
      <div className={s.familyCards}>
        {VAPE_FAMILIES.map((item, index) => {
          const angle = getVapeImage(finish, item.id, 'front-left');
          const screen = getVapeImage(finish, item.id, 'screen');
          return <article className={s.familyCard} key={item.id}>
            <div className={s.familyCardMedia}>
              <span className={s.familyNumber}>0{index + 1}<span>{item.code}</span></span>
              <button type="button" aria-label={`Explore ${selectedFinish.name} ${item.name}`} onClick={() => explore(finish, item.id, 1)}>
                <Image {...sanityImage(angle.src)} alt={angle.alt} width={1200} height={1500} sizes="(min-width: 1000px) 380px, (min-width: 650px) 46vw, 92vw" />
              </button>
              <button type="button" className={s.screenPeek} aria-label={`Enlarge ${item.code} display`} onClick={() => explore(finish, item.id, 6, true)}>
                <Image {...sanityImage(screen.src)} alt={`${item.code} display on the ${selectedFinish.name.toLowerCase()} Orbit device`} width={180} height={225} sizes="100px" /><span>{item.code} display <VapeIcon name="expand" /></span>
              </button>
            </div>
            <div className={s.familyCardCopy}><h3>{item.name}</h3><p>{item.description}</p>
              <div><button className={s.textLink} type="button" onClick={() => explore(finish, item.id, 0)}>Explore {item.code} <VapeIcon name="arrow" /></button><Link className={s.guideLink} href={item.guide}>Read the guide</Link></div>
            </div>
          </article>;
        })}
      </div>
      <p className={s.sectionNote}>Moon Pods photographed on Orbit.</p>
    </section>

    {page !== 'vapes' ? orbitFinishesSection : null}

    {page === 'vapes' ? <VapeHardwareBand /> : null}

    <section className={`${s.section} ${s.details}`} id="details" aria-labelledby="orbit-detail-heading">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>The closer look</p><h2 id="orbit-detail-heading">Details make<br /><span>the difference.</span></h2></div><div><p>Currently exploring</p><p className={s.detailSelection}>{selectedFinish.name} / {selectedFamily.name}</p><button type="button" className={s.textLink} onClick={() => explore(finish, family)}>Change your selection <VapeIcon name="arrow" /></button></div></div>
      <div className={s.detailGrid}>
        {[
          { view: 'back' as const, index: 3, title: 'The signature.', text: 'The Presidential crest. The palms. Your chosen finish, seen from the other side.', style: s.artworkDetail },
          { view: 'screen' as const, index: 6, title: 'In clear view.', text: `Take a closer look at the ${selectedFamily.code} display and the front of the device.`, style: s.displayDetail },
          { view: 'front-left' as const, index: 1, title: 'The profile.', text: 'A different perspective on the mouthpiece, side control and shape of Orbit.', style: s.profileDetail },
        ].map(item => {
          const image = getVapeImage(finish, family, item.view);
          return <article className={`${s.detailCard} ${item.style}`} key={item.view}><button type="button" onClick={() => openImage(item.index)} aria-label={`Enlarge ${item.title}`}><Image {...sanityImage(image.src)} alt={image.alt} width={1200} height={1500} sizes="(min-width: 900px) 550px, 92vw" /><span><VapeIcon name="expand" /></span></button><div><h3>{item.title}</h3><p>{item.text}</p></div></article>;
        })}
      </div>
      <div className={s.portDetail}><p>Explore the mouthpiece, sides and base together in the matching design overview.</p><button className={s.textLink} type="button" onClick={() => openImage(7)}>View the complete design <VapeIcon name="arrow" /></button></div>
    </section>

    {page === 'vapes' ? <VapeTechnologyBand /> : null}

    <section className={`${s.section} ${s.models}`} id="designs" aria-labelledby="vape-design-heading">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>The design collection</p><h2 id="vape-design-heading">Every angle.<br /><span>Every expression.</span></h2></div><p>Explore all twelve design overviews.<br />Select a finish. Open the full picture.</p></div>
      <div className={s.modelLayout}>
        <div className={s.modelStage}>
          <button type="button" className={s.modelImage} onClick={() => explore(selectedModel.finish, selectedModel.family, 7, true)} aria-label={`Enlarge ${model.alt}`}><Image key={model.src} {...sanityImage(model.src)} alt={model.alt} width={model.width} height={model.height} sizes="(min-width: 1000px) 850px, 94vw" /><span className={s.enlarge}><VapeIcon name="expand" />Open design overview</span></button>
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
            <div>{getVapeGallery(set.finish, set.family).map((image, index) => <button key={image.view} type="button" onClick={() => explore(set.finish, set.family, index, true)} aria-label={`Open ${image.alt}`}><Image {...sanityImage(image.src)} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 1000px) 140px, (min-width: 650px) 22vw, 42vw" loading="lazy" /><span>{image.label}</span></button>)}</div>
          </section>)}
        </div> : null}
      </details>
    </section>
    {page === 'vapes' ? <VapeUserExperienceBand /> : null}
    <VapeGalleryDialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} images={gallery} index={viewIndex} onIndex={setViewIndex} title={`${selectedFinish.name} / ${selectedFamily.name}`} />
  </>;
}
