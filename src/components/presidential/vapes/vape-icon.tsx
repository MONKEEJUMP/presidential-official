import type { SVGProps } from 'react';

export type VapeIconName = 'arrow' | 'left' | 'right' | 'expand' | 'close' | 'plus' | 'minus' | 'check' | 'modes' | 'heat' | 'precision' | 'display' | 'battery' | 'flavor' | 'cloud' | 'smart' | 'shield' | 'user' | 'value';

export function VapeIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: VapeIconName }) {
  const paths = {
    arrow: 'M5 12h14M13 6l6 6-6 6',
    left: 'M14 6l-6 6 6 6',
    right: 'M10 6l6 6-6 6',
    expand: 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5',
    close: 'M6 6l12 12M18 6 6 18',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    check: 'm5 12 4 4L19 6',
    modes: 'M5 5h14M5 12h14M5 19h14M8 3v4M16 10v4M11 17v4',
    heat: 'M12 3C9 7 7 10 7 14a5 5 0 0 0 10 0c0-4-2-7-5-11Zm0 8c-1.2 1.7-2 3-2 4.4a2 2 0 0 0 4 0c0-1.4-.8-2.7-2-4.4Z',
    precision: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l7-7M16 5h3v3',
    display: 'M4 5h16v11H4zM8 20h8M12 16v4M8 9h8M8 12h5',
    battery: 'M5 7h14v10H5zM21 10v4M8 10h5v4H8z',
    flavor: 'M12 20c4-3 6-6.2 6-10a6 6 0 0 0-12 0c0 3.8 2 7 6 10Zm0-13v10M9 11h6',
    cloud: 'M7 18h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 11.5 3.3 3.3 0 0 0 7 18Z',
    smart: 'M9 18h6M10 21h4M8.5 15.5A7 7 0 1 1 15.5 15.5C14.5 16.3 14 17 14 18h-4c0-1-.5-1.7-1.5-2.5Z',
    shield: 'M12 3 19 6v5c0 4.6-2.6 7.7-7 10-4.4-2.3-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-5',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9c.6-4 3-6 7-6s6.4 2 7 6',
    value: 'M12 3v18M16 7.5C15.2 6.5 13.8 6 12 6c-2.2 0-4 1.1-4 3s1.8 3 4 3 4 1.1 4 3-1.8 3-4 3c-1.8 0-3.2-.5-4-1.5',
  };
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}><path d={paths[name]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
