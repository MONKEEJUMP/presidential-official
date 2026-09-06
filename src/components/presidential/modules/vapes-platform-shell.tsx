import type { SeoRouteRecord } from '@/lib/seo/route-types';
import { VapeShowroom } from '../vapes/vape-showroom';

export function VapesPlatformShell({ route, breadcrumbs }: { readonly route: SeoRouteRecord; readonly breadcrumbs: readonly { name: string; path: string }[] }) {
  return <VapeShowroom route={route} breadcrumbs={breadcrumbs} />;
}
