/* ------------------------------------------------------------------
   Shared product-type metadata & compatibility rules used across
   the catalog, product pages and admin.
------------------------------------------------------------------- */
import type { Addon, Product, ProductType } from "./types";

export const TYPE_META: Record<ProductType, { label: string; plural: string; icon: string }> = {
  website: { label: "Website", plural: "Websites", icon: "globe" },
  system: { label: "Business System", plural: "Systems", icon: "cpu" },
  saas: { label: "SaaS", plural: "SaaS", icon: "layers" },
  digital: { label: "Digital Product", plural: "Digital Products", icon: "package" },
  ebook: { label: "E-book", plural: "E-books", icon: "book" },
  other: { label: "Other", plural: "Other", icon: "box" },
};

/**
 * Compatibility rule — admin-controlled:
 * if the add-on has explicit product links, ONLY those products match.
 * Otherwise it falls back to product-type compatibility.
 */
export function isAddonCompatible(addon: Addon, product: Product): boolean {
  if (addon.productIds.length > 0) return addon.productIds.includes(product.id);
  return addon.compat.includes(product.type);
}
