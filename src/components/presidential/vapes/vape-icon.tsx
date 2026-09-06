import type { SVGProps } from 'react';

export function VapeIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: 'arrow' | 'left' | 'right' | 'expand' | 'close' | 'plus' | 'minus' }) {
  const paths = {
    arrow: 'M5 12h14M13 6l6 6-6 6',
    left: 'M14 6l-6 6 6 6',
    right: 'M10 6l6 6-6 6',
    expand: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
    close: 'M6 6l12 12M18 6 6 18',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
  };
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}><path d={paths[name]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
