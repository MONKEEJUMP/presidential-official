import { PARTNER_STATES, PARTNERS_COPY } from '@/content/partners-copy';
import type { SeoRouteRecord } from './route-types';

// Keyword ownership and publication approval: 0907-PRES-KVRT-0010 + owner ruling.
export const PARTNER_ROUTES: readonly SeoRouteRecord[] = ['hub', ...PARTNER_STATES.map(s=>s.code)].map(code=>{
  const state=PARTNER_STATES.find(s=>s.code===code);
  const copy=PARTNERS_COPY[code as keyof typeof PARTNERS_COPY];
  const path=state ? `/partners/${state.code}` as const : '/partners';
  return {id:state?`partners-${state.code}`:'partners',path,canonicalPath:path,kind:'brand_story',status:'approved',indexability:'index_follow',sitemap:'include',priority:3,changeFrequency:'monthly',title:copy.title,description:copy.description,h1:copy.h1,
    keywords:state?[`where to buy presidential in ${state.name.toLowerCase()}`,`dispensaries carrying presidential ${state.name.toLowerCase()}`,`presidential retailers ${state.name.toLowerCase()}`]:['presidential authorized retailers'],
    schema:['Organization','WebPage','BreadcrumbList',...(state?['ItemList' as const]:[])],requiredData:['committed partners snapshot'],requiredApprovals:[],blocks:[],linksTo:state?['/partners',`/find-us/${state.code}`]:PARTNER_STATES.map(s=>`/partners/${s.code}` as const),sourceArtifact:'0907-PRES-KVRT-0010; owner ruling; src/content/partners.json; src/content/partners-copy.ts'};
});
export function getPartnerRoute(code='hub') {
  const route=PARTNER_ROUTES.find(r=>r.id===(code==='hub'?'partners':`partners-${code}`));
  if(!route)throw new Error('Unknown partner route');
  return route;
}
