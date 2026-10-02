export type ProductCategoryPath = "/pre-rolls" | "/blunts" | "/mini-blunts" | "/mini-pre-rolls";

export function productSlug(id: string): string {
  return id.endsWith("-title") ? id.slice(0, -"-title".length) : id;
}

export function productDetailPath(
  categoryPath: ProductCategoryPath,
  id: string,
): string {
  return `${categoryPath}/${productSlug(id)}`;
}

export function findProductBySlug<T extends { readonly id: string }>(
  products: readonly T[],
  slug: string,
): T | undefined {
  return products.find((product) => productSlug(product.id) === slug);
}
