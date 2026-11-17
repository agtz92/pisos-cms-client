/**
 * Queries for fields added to the backend after lib/cms/graphql.ts was copied
 * from pisos-spc/website (2026-11 · Fase 3). Kept apart so graphql.ts stays a
 * verbatim copy; merge into @pisos/cms-client when it's extracted.
 *
 * ⚠️ Needs the backend with migrations content/0036 + core/0013 deployed.
 */
import { cache } from 'react';
import { gql, TAGS, type Product } from './graphql';

export interface BusinessContact {
  contactEmail: string;
  contactPhones: { label?: string; number?: string }[] | null;
  contactAddress: string;
  socialLinks: Record<string, string> | null;
}

export const getBusinessContact = cache(async (): Promise<BusinessContact | null> => {
  const data = await gql<{ tenant: BusinessContact | null }>(
    `query BusinessContact { tenant { contactEmail contactPhones contactAddress socialLinks } }`,
    undefined,
    [TAGS.tenant],
  );
  return data.tenant;
});

export interface ProductFaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export const getProductFaqs = cache(async (slug: string): Promise<ProductFaqItem[]> => {
  const data = await gql<{ product: { faqItems: ProductFaqItem[] } | null }>(
    `query ProductFaqs($slug: String!) { product(slug: $slug) { faqItems { id question answer order } } }`,
    { slug },
    [TAGS.products],
  );
  return data.product?.faqItems ?? [];
});

/** Hand-picked products of a Landing Page (productsSource='manual'), published only. */
export const getLandingSelectedProducts = cache(async (slug: string): Promise<Product[]> => {
  const data = await gql<{ landingPage: { selectedProducts: Product[] } | null }>(
    `query LandingSelectedProducts($slug: String!) {
      landingPage(slug: $slug) {
        selectedProducts {
          id title slug shortDescription description coverImage
          price compareAtPrice brand sku stock publishedAt createdAt
          category { id name slug }
        }
      }
    }`,
    { slug },
    [TAGS.landing, TAGS.products],
  );
  return data.landingPage?.selectedProducts ?? [];
});

/**
 * Spec tables of every published product, in one request (the product list
 * query doesn't carry them). Used for the size picker of the quote list.
 */
export const getProductSpecsBySlug = cache(async (): Promise<Record<string, SpecGroupLite[]>> => {
  const data = await gql<{ products: { slug: string; specifications: SpecGroupLite[] | null }[] }>(
    `query ProductSpecs { products { slug specifications { name headers rows } } }`,
    undefined,
    [TAGS.products],
  );
  return Object.fromEntries(data.products.map((p) => [p.slug, p.specifications ?? []]));
});

export interface SpecGroupLite {
  name: string;
  headers: string[];
  rows: string[][];
}

/**
 * Catalog filters (CMS → Products → Filters), in one request.
 * ⚠️ Needs the backend with migration content/0038.
 */
export interface CatalogFacet {
  id: number;
  name: string;
  slug: string;
  order: number;
  collapsedOnMobile: boolean;
  options: { id: number; label: string; slug: string; color: string; order: number }[];
}

export const getCatalogFacets = cache(
  async (): Promise<{ facets: CatalogFacet[]; assignments: Record<string, number[]> }> => {
    const data = await gql<{
      productFacets: CatalogFacet[];
      productFacetAssignments: { productSlug: string; optionIds: number[] }[];
    }>(
      `query CatalogFacets {
        productFacets { id name slug order collapsedOnMobile options { id label slug color order } }
        productFacetAssignments { productSlug optionIds }
      }`,
      undefined,
      [TAGS.products],
    );
    return {
      facets: data.productFacets,
      assignments: Object.fromEntries(data.productFacetAssignments.map((a) => [a.productSlug, a.optionIds])),
    };
  },
);

/**
 * Manual catalog position per product slug (CMS → Products → Ordenar catálogo).
 * Products without a position are absent. ⚠️ Needs backend migration content/0039.
 */
export const getCatalogOrder = cache(async (): Promise<Record<string, number>> => {
  const data = await gql<{ products: { slug: string; catalogOrder: number | null }[] }>(
    `query CatalogOrder { products { slug catalogOrder } }`,
    undefined,
    [TAGS.products],
  );
  return Object.fromEntries(
    data.products.filter((p) => p.catalogOrder != null).map((p) => [p.slug, p.catalogOrder as number]),
  );
});
