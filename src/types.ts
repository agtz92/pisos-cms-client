/**
 * Copied from website/components/landingpage/sections (ModuleData).
 * Kept here so lib/cms/ has no dependency on visual components.
 */
import type { Listing, Post, Product, Recipe, Review } from './graphql';

export interface ModuleData {
  posts: Post[];
  recipes: Recipe[];
  products: Product[];
  listings: Listing[];
  reviews: Review[];
  activeModules: string[];
}
