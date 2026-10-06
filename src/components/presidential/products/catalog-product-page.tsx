import Image from "next/image";
import Link from "next/link";
import { ProductMentions } from "./product-mention";

import {
  productDetailPath,
  type ProductCategoryPath,
} from "@/lib/products/product-paths";

import styles from "./catalog-product-page.module.css";
import type { VaultProduct } from '@/content/vault/catalog';
import { imageAlt } from '@/content/vault/catalog';

type CatalogProduct = {
  readonly id: string;
  readonly name: string;
  readonly edition: string;
  readonly description: string;
  readonly src: string;
  readonly alt: string;
};

type CatalogProductPageProps = {
  readonly categoryLabel: string;
  readonly categoryPath: ProductCategoryPath;
  readonly collection?: string;
  readonly formatLabel: string;
  readonly product: CatalogProduct;
  readonly products: readonly CatalogProduct[];
  readonly vaultProduct?: VaultProduct;
  readonly backPath?: string;
  readonly headingFormat?: string;
};

function ArrowIcon({ direction }: { readonly direction: "left" | "right" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d={direction === "right" ? "M5 12h14M13 6l6 6-6 6" : "M19 12H5m6 6-6-6 6-6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function CatalogProductPage({
  categoryLabel,
  categoryPath,
  collection,
  formatLabel,
  product,
  products,
  vaultProduct,
  backPath = categoryPath,
  headingFormat,
}: CatalogProductPageProps) {
  const productIndex = products.findIndex((candidate) => candidate.id === product.id);
  const previous = products[(productIndex - 1 + products.length) % products.length];
  const next = products[(productIndex + 1) % products.length];
  const [format, ...ingredients] = product.edition.split(" · ");

  return (
    <div className={styles.page}>
      <section aria-labelledby="product-title" className={styles.hero}>
        <div aria-hidden="true" className={styles.atmosphere} />
        <div className={styles.shell}>
          <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
            <Link href={backPath}>{categoryLabel}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.name}</span>
          </nav>

          <div className={styles.heroGrid}>
            {vaultProduct ? <div className={styles.artworkStack}>
              {(vaultProduct.scenes.length ? [...vaultProduct.scenes, vaultProduct.pack] : [vaultProduct.pack]).map((image, index) => <div key={image.full} className={`${styles.media} ${styles.wholeMedia}`}>
                <Image alt={imageAlt(vaultProduct, image)} src={image.full} width={image.fullWidth} height={image.fullHeight} priority={index === 0} sizes="(max-width: 1000px) 100vw, 52vw" unoptimized />
              </div>)}
            </div> : <div className={styles.media}>
              <Image
                alt={product.alt}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 52vw"
                src={product.src}
              />
            </div>}

            <div className={styles.copy}>
              <p className={styles.kicker}>{formatLabel}</p>
              <h1 id="product-title">{headingFormat ? `${product.name} ${headingFormat}` : product.name}</h1>
              {collection ? <p className={styles.collection}>{collection}</p> : null}
              <p className={styles.edition}>{product.edition}</p>
              <p className={styles.description}><ProductMentions format={categoryPath === "/blunts" ? "Blunt" : categoryPath === "/pre-rolls" ? "Pre-roll" : categoryPath === "/mini-blunts" ? "Mini Blunt" : "Mini Pre-roll"} currentPath={productDetailPath(categoryPath, product.id)}>{product.description}</ProductMentions></p>

              {vaultProduct ? <dl className={styles.facts}><div><dt>Format</dt><dd>{vaultProduct.format}</dd></div>{vaultProduct.tier && <div><dt>Tier</dt><dd>{vaultProduct.tier}</dd></div>}</dl> : <dl className={styles.facts}>
                <div><dt>Format</dt><dd>{format}</dd></div>
                <div><dt>Made with</dt><dd>{ingredients.join(" · ")}</dd></div>
                <div><dt>Availability</dt><dd>Licensed retailers</dd></div>
              </dl>}

              <div className={styles.actions}>
                {!vaultProduct && <Link className={styles.primaryAction} href="/find-us">
                  Find this product <ArrowIcon direction="right" />
                </Link>}
                <Link className={styles.textAction} href={backPath}>
                  Back to all {categoryLabel}
                </Link>
              </div>
              {!vaultProduct && <small>For adults 21+ where legal. Availability varies by retailer.</small>}
            </div>
          </div>
        </div>
      </section>

      {!vaultProduct && <nav aria-label={`${categoryLabel} product navigation`} className={styles.productNavigation}>
        <Link href={productDetailPath(categoryPath, previous.id)}>
          <ArrowIcon direction="left" />
          <span><small>Previous</small><strong>{previous.name}</strong></span>
        </Link>
        <p>{String(productIndex + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}</p>
        <Link href={productDetailPath(categoryPath, next.id)}>
          <span><small>Next</small><strong>{next.name}</strong></span>
          <ArrowIcon direction="right" />
        </Link>
      </nav>}

      {!vaultProduct && <section className={styles.findSection}>
        <p>Find this product</p>
        <h2>Start with the official retailer locator.</h2>
        <div>
          <p>Choose a licensed retailer near you, then confirm its current selection directly with the store.</p>
          <Link className={styles.primaryAction} href="/find-us">
            Find a licensed retailer <ArrowIcon direction="right" />
          </Link>
        </div>
      </section>}
    </div>
  );
}
