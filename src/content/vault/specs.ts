import specs from './specs.json';
import type { VaultProduct } from './catalog';

// Spec fields for the Vault format SKU pages (pre-rolls, blunts, mini pre-rolls,
// mini blunts). Every value is read from that product's own copy in
// descriptions.json (weight, build, wrap, pack marking, series, partner mark);
// a field the copy does not state is left out rather than filled in.
export type VaultSpecs = {
  readonly weight: string;
  readonly madeWith: readonly string[];
  readonly wrap?: string;
  readonly packMarking?: string;
  readonly series?: string;
  readonly collaboration?: string;
};

const VAULT_SPECS = specs as Readonly<Record<string, VaultSpecs>>;

export function vaultSpecs(product: Pick<VaultProduct, 'slug'>): VaultSpecs | undefined {
  return VAULT_SPECS[product.slug];
}

export function listMaterials(parts: readonly string[]): string {
  const words = parts.map((part) => part.toLowerCase());
  if (words.length < 2) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')}${words.length > 2 ? ',' : ''} and ${words.at(-1)}`;
}

function countPhrase(product: VaultProduct, spec: VaultSpecs): string {
  const unit = product.format.toLowerCase();
  const pack = /^3 × (\S+) \((\S+) total\)$/.exec(spec.weight);
  return pack ? `three ${pack[1]} ${unit}s (${pack[2]} total)` : `one ${spec.weight} ${unit}`;
}

/** Sitebulb oct06d #1: a meta description of 155 characters or fewer, built only from spec data. */
export function vaultMetaDescription(product: VaultProduct): string | undefined {
  const spec = vaultSpecs(product);
  if (!spec) return undefined;
  const base = `${product.strain} Moon Rock ${product.format} by Presidential: ${countPhrase(product, spec)} of ${listMaterials(spec.madeWith)}${spec.wrap ? ', tobacco-free' : ''}`;
  const candidates = [
    spec.packMarking ? `${base}, marked ${spec.packMarking} on the pack.` : `${base}.`,
    spec.packMarking ? `${base}, marked ${spec.packMarking}.` : `${base}.`,
    `${base}.`,
  ];
  return candidates.find((text) => text.length <= 155) ?? `${base.slice(0, 154).trimEnd()}.`;
}

/** The one-sentence build line shown under the spec block. */
export function vaultMadeWithSentence(product: VaultProduct): string | undefined {
  const spec = vaultSpecs(product);
  if (!spec) return undefined;
  const wrap = spec.wrap ? `, rolled in a ${spec.wrap.toLowerCase()} wrap` : '';
  return `${product.strain} Moon Rock ${product.format} is made with ${listMaterials(spec.madeWith)}${wrap}.`;
}
