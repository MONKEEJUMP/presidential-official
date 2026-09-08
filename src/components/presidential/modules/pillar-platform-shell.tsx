import type { SeoRouteRecord } from '@/lib/seo/route-types';
import type { SanityHomepageModule } from '@/lib/cms/homepage';
import { VapeShowroom } from '../vapes/vape-showroom';

export function PillarPlatformShell({ route, breadcrumbs, cmsModules }: { readonly route: SeoRouteRecord; readonly breadcrumbs: readonly { name: string; path: string }[]; readonly cmsModules?: readonly SanityHomepageModule[] }) {
  return <VapeShowroom route={route} breadcrumbs={breadcrumbs} cmsModules={cmsModules} />;
}
