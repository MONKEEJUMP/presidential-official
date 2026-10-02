import Link from 'next/link';
import { Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { vaultProducts } from '@/content/vault/catalog';
import { vaultProductForImage, vaultProductForName, vaultProductForAlt } from '@/lib/products/vault-links';

export const productInlineClass = 'font-semibold text-po-brand underline decoration-po-brand/50 underline-offset-4 hover:decoration-po-brand';
export function ProductNameLink({ name, format, children, className = productInlineClass, currentPath }: { name: string; format: string; children: ReactNode; className?: string; currentPath?: string }) {
  const p = vaultProductForName(name, format);
  return p && p.productUrl !== currentPath ? <Link className={className} href={p.productUrl}>{children}</Link> : <>{children}</>;
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
