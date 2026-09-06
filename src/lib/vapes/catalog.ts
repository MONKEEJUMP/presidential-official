export const VAPE_FINISHES = [
  { id: 'black', name: 'Black', color: '#24272a' },
  { id: 'silver', name: 'Silver', color: '#b9bdc3' },
  { id: 'teal', name: 'Teal', color: '#58c3b6' },
  { id: 'white', name: 'White', color: '#fafafa' },
] as const;

export const VAPE_FAMILIES = [
  { id: 'ld', code: 'LD', name: 'Liquid Diamonds', guide: '/learn/what-are-liquid-diamonds', description: 'The signature teal mouthpiece. Your choice of four Orbit finishes. Get closer to the LD family, from its illuminated front to every angle of the device.' },
  { id: 'lre', code: 'LRE', name: 'Live Resin', guide: '/learn/what-is-live-resin', description: 'A clear mouthpiece meets the Presidential silhouette. Explore the LRE display, turn to the rear artwork, and find the Orbit finish that feels like you.' },
  { id: 'lro', code: 'LRO', name: 'Live Rosin', guide: '/learn/what-is-live-rosin', description: 'The smoked mouthpiece. The LRO display. The finish you make your own. Take a closer look at the Live Rosin presentation, then discover its extract story.' },
] as const;

export const VAPE_VIEWS = [
  { id: 'home', name: 'Front · Home', short: 'Front' },
  { id: 'front-left', name: 'Front · left angle', short: 'Left' },
  { id: 'back-right', name: 'Back · right angle', short: 'Rear right' },
  { id: 'back', name: 'Back · artwork', short: 'Back' },
  { id: 'back-left', name: 'Back · left angle', short: 'Rear left' },
  { id: 'front-right', name: 'Front · right angle', short: 'Right' },
  { id: 'screen', name: 'Family display', short: 'Display' },
  { id: 'model', name: 'Design overview', short: 'Overview' },
] as const;

export type VapeFinish = typeof VAPE_FINISHES[number]['id'];
export type VapeFamily = typeof VAPE_FAMILIES[number]['id'];
export type VapeView = typeof VAPE_VIEWS[number]['id'];
export type VapePage = 'vapes' | 'moon-pods' | 'orbit';
export type VapeImage = { src: string; alt: string; width: number; height: number; view: VapeView; label: string };

export function getVapeImage(finish: VapeFinish, family: VapeFamily, view: VapeView): VapeImage {
  const color = VAPE_FINISHES.find(item => item.id === finish)!;
  const type = VAPE_FAMILIES.find(item => item.id === family)!;
  const angle = VAPE_VIEWS.find(item => item.id === view)!;
  const model = view === 'model';
  const portraitModel = model && finish === 'black' && family === 'lre';
  return {
    src: `/media/vapes/showroom/${finish}-${family}-${view}.webp`,
    alt: model
      ? `${color.name} Presidential Orbit and Moon Pods, ${type.code} design overview`
      : `${color.name} Presidential Orbit with ${type.code} Moon Pod, ${angle.name.toLowerCase()}`,
    width: model ? (portraitModel ? 1224 : 1536) : 1200,
    height: model ? (portraitModel ? 1285 : 1024) : 1500,
    view,
    label: model ? 'Design overview' : view === 'screen' ? `${type.code} display` : angle.name,
  };
}

export function getVapeGallery(finish: VapeFinish, family: VapeFamily): VapeImage[] {
  return VAPE_VIEWS.map(view => getVapeImage(finish, family, view.id));
}

export const VAPE_MODEL_SETS = VAPE_FAMILIES.flatMap(family => VAPE_FINISHES.map(finish => ({ finish: finish.id, family: family.id })));
