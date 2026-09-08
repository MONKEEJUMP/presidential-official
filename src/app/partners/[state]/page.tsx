import { notFound } from 'next/navigation';
import { PARTNER_STATES, type PartnerStateCode } from '@/content/partners-copy';
import { PartnersStateShell, partnersForState } from '@/components/presidential/modules/partners-page-shell';
import { getPartnerRoute } from '@/lib/seo/partners-routes';
import { buildRouteMetadata } from '@/lib/seo/metadata';
import { buildRouteShellJsonLd, buildItemListSchema, JsonLd } from '@/lib/seo/schema';
type Props={params:Promise<{state:string}>};
export const dynamicParams=false;
export function generateStaticParams(){return PARTNER_STATES.map(s=>({state:s.code}))}
function valid(code:string):asserts code is PartnerStateCode{if(!PARTNER_STATES.some(s=>s.code===code))notFound()}
export async function generateMetadata({params}:Props){const {state}=await params;valid(state);return buildRouteMetadata({route:getPartnerRoute(state)})}
export default async function PartnersStatePage({params}:Props){const {state}=await params;valid(state);const route=getPartnerRoute(state);const brands=partnersForState(state);return <>
  {buildRouteShellJsonLd(route).map(e=><JsonLd key={e.id} data={e.data}/>)}
  <JsonLd data={buildItemListSchema(route.h1,brands.map(b=>({name:b.name,areaServed:b.perState[state]!.cities.map(city=>({city,state:state.toUpperCase()}))})))}/>
  <PartnersStateShell code={state}/>
  </>}
