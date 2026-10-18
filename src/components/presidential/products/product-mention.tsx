import Link from 'next/link';
import { Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { vaultProducts } from '@/content/vault/catalog';
import { vaultProductForImage, vaultProductForName, vaultProductForAlt } from '@/lib/products/vault-links';

export const productInlineClass = 'font-semibold text-po-brand underline decoration-po-brand/50 underline-offset-4 hover:decoration-po-brand';
// Sitebulb R40 B9: these legacy product pages are noindex, so a name mention points at the indexable jar page,
// or stays plain text when the jar is a different product (XJ13 vs XJ-13).
const NOINDEX_MENTION_TARGETS: Readonly<Record<string, string | null>> = {
  '/blunts/skywalker': '/moon-rocks/skywalker',
  '/pre-rolls/skywalker': '/moon-rocks/skywalker',
  '/blunts/cherry-gelato': '/moon-rocks/cherry-gelato',
  '/blunts/gorilla-goo': '/moon-rocks/gorilla-goo',
  '/pre-rolls/gorilla-goo': '/moon-rocks/gorilla-goo',
  '/blunts/waui': '/moon-rocks/waui',
  '/blunts/xj-13': null,
};
export function ProductNameLink({ name, format, children, className = productInlineClass, currentPath }: { name: string; format: string; children: ReactNode; className?: string; currentPath?: string }) {
  const p = vaultProductForName(name, format);
  const href = p ? (p.productUrl in NOINDEX_MENTION_TARGETS ? NOINDEX_MENTION_TARGETS[p.productUrl] : p.productUrl) : null;
  return href && href !== currentPath ? <Link className={className} href={href}>{children}</Link> : <>{children}</>;
}
export function ProductImageLink({ src, alt, children, className, currentPath, disabled = false, fallbackContainer = false }: { src: string; alt?: string; children: ReactNode; className?: string; currentPath?: string; disabled?: boolean; fallbackContainer?: boolean }) {
  const p = vaultProductForImage(src) ?? (alt ? vaultProductForAlt(alt) : undefined);
  return !disabled && p && p.productUrl !== currentPath ? <Link href={p.productUrl} className={className} aria-label={`${p.strain} Moon Rock ${p.format}`}>{children}</Link> : fallbackContainer ? <div className={className}>{children}</div> : <>{children}</>;
}
export function ProductMentions({ children, format, currentPath }: { children: ReactNode; format: string; currentPath?: string }) {
  const names = vaultProducts.filter(p => p.format === format).flatMap(p => p.strain === 'XJ13' ? ['XJ13', 'XJ-13'] : [p.strain]);
  const pattern = new RegExp(`\\b(${names.sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&').replace(/'/g,"['’]")).join('|')})\\b`, 'gi');
  function render(node: ReactNode): ReactNode {
    if (typeof node === 'string') return node.split(pattern).map((text,i) => i%2 ? <ProductNameLink name={text} format={format} currentPath={currentPath} key={i}>{text}</ProductNameLink> : text);
    if (Array.isArray(node)) return node.map((child,i)=><Fragment key={i}>{render(child)}</Fragment>);
    if (isValidElement(node)) {
      if (node.type === Link || node.type === 'a') return node;
      const element = node as ReactElement<{children?: ReactNode}>;
      return element.props.children !== undefined ? cloneElement(element, undefined, render(element.props.children)) : element;
    }
    return node;
  }
  return <>{render(children)}</>;
}
