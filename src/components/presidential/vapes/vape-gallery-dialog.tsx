'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { VapeImage } from '@/lib/vapes/catalog';
import { VapeIcon } from './vape-icon';
import s from './showroom.module.css';

type Props = {
  open: boolean;
  images: readonly VapeImage[];
  index: number;
  title: string;
  onIndex: (index: number) => void;
  onClose: () => void;
};

export function VapeGalleryDialog({ open, images, index, title, onIndex, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const current = images[index];
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    dialog.showModal();
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = oldOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);
  function move(delta: number) {
    setZoomed(false);
    onIndex((index + delta + images.length) % images.length);
  }
  function close() { setZoomed(false); onClose(); }
  return (
    <dialog ref={ref} className={s.dialog} aria-label={`${title} image gallery`}
      onCancel={close}
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
      }}>
      {open && current ? <div className={s.lightbox}>
        <header className={s.lightboxHeader}>
          <div><p className={s.label}>{title}</p><p>{current.label}</p></div>
          <div className={s.lightboxActions}>
            <button type="button" onClick={() => setZoomed(value => !value)} aria-pressed={zoomed} aria-label={zoomed ? 'Fit image to screen' : 'Zoom image'}><VapeIcon name={zoomed ? 'minus' : 'plus'} /></button>
            <button type="button" ref={closeButtonRef} onClick={close} aria-label="Close gallery"><VapeIcon name="close" /></button>
          </div>
        </header>
        <div className={`${s.lightboxImage} ${zoomed ? s.zoomed : ''}`}>
          <Image key={current.src} src={current.src} alt={current.alt} width={current.width} height={current.height} sizes={zoomed ? '1536px' : '90vw'} loading="eager" />
        </div>
        <footer className={s.lightboxFooter}>
          <button type="button" onClick={() => move(-1)} aria-label="Previous gallery image"><VapeIcon name="left" /><span>Previous</span></button>
          <span aria-live="polite">{index + 1} / {images.length}</span>
          <button type="button" onClick={() => move(1)} aria-label="Next gallery image"><span>Next</span><VapeIcon name="right" /></button>
        </footer>
      </div> : null}
    </dialog>
  );
}
