import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/presidential/layout/site-header';
import { SiteFooter } from '@/components/presidential/layout/site-footer';
import './vault.css';

export default function VaultLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main className="vault" id="presidential-main" tabIndex={-1}>{children}</main><SiteFooter /></>;
}
