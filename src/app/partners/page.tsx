import { PartnersHubShell } from '@/components/presidential/modules/partners-page-shell';
import { getPartnerRoute } from '@/lib/seo/partners-routes';
import { buildRouteMetadata } from '@/lib/seo/metadata';
import { buildRouteShellJsonLd, JsonLd } from '@/lib/seo/schema';
export const metadata=buildRouteMetadata({route:getPartnerRoute()});
export default function PartnersPage(){const route=getPartnerRoute();return <>{buildRouteShellJsonLd(route).map(e=><JsonLd key={e.id} data={e.data}/>)}<PartnersHubShell/></>}
