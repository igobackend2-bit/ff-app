// Meat & Seafood products — added from products.zip (June 2026).
// Served from the API layer so they appear even while the DB migration is pending.
import type { Product, Category } from '@/types';

const IMG = '/images/products';

export const MEAT_CATEGORY: Category & { _count?: { products: number } } = {
  id:              'cat-meat-seafood',
  name:            'Meat & Seafood',
  slug:            'meat-seafood',
  description:     'Fresh chicken, mutton, fish and seafood — cleaned and delivered',
  imageUrl:        `${IMG}/chicken-whole.png`,
  iconUrl:         null,
  parentId:        null,
  sortOrder:       4,
  metaTitle:       'Meat & Seafood — Farmers Factory',
  metaDescription: 'Order fresh chicken, mutton, fish and seafood online. 24-hour delivery.',
  _count:          { products: 11 },
};

function p(
  id: string, name: string, slug: string, img: string,
  price: number, mrp: number, unit: string, description: string,
  featured = false,
): Product {
  return {
    id, name, slug,
    description,
    imageUrls:    [`${IMG}/${img}`],
    blurDataUrls: [],
    categoryId:   MEAT_CATEGORY.id,
    categoryName: MEAT_CATEGORY.name,
    categorySlug: MEAT_CATEGORY.slug,
    brandId: null, brandName: 'Farmers Factory',
    sku: `FF-MEAT-${id.toUpperCase()}`,
    mrp, price, unit,
    tags: ['meat', 'seafood', 'fresh'],
    isFeatured: featured, inStock: true,
    averageRating: 4.6, reviewCount: 0,
    metaTitle: null, metaDescription: null,
  };
}

export const MEAT_PRODUCTS: Product[] = [
  p('m01', 'Chicken Breast (Boneless)', 'chicken-breast-boneless', 'chicken-breast.png', 220, 250, '500 g', 'Tender boneless chicken breast — skinless, antibiotic-free. Perfect for grills, curries and salads.', true),
  p('m02', 'Whole Chicken (Curry Cut)', 'whole-chicken-curry-cut', 'chicken-whole.png', 320, 360, '1 kg', 'Farm-fresh whole chicken, cleaned and curry cut. Ready to cook.', true),
  p('m03', 'Country Eggs (Naattu Muttai)', 'country-eggs', 'eggs.png', 90, 100, '6 pcs', 'Free-range country hen eggs — rich yolk, naturally laid.'),
  p('m04', 'Mud Crab', 'mud-crab', 'mud-crab.png', 450, 500, '500 g', 'Live mud crab from the backwaters — sweet, succulent meat.'),
  p('m05', 'Mutton Curry Cut', 'mutton-curry-cut', 'mutton-curry.png', 420, 480, '500 g', 'Fresh goat mutton, curry cut with bone. Tender and flavourful.', true),
  p('m06', 'Mutton Keema', 'mutton-keema', 'mutton-keema.png', 440, 500, '500 g', 'Freshly minced goat mutton — ideal for keema curry, cutlets and parathas.'),
  p('m07', 'Naattu Kozhi (Country Chicken)', 'naattu-kozhi', 'naattu-kozhi.png', 450, 520, '1 kg', 'Free-range country chicken — firm texture, traditional taste. Curry cut.', true),
  p('m08', 'Quail (Kaadai)', 'quail-kaadai', 'quail.png', 280, 320, '4 pcs', 'Farm-raised quail, cleaned whole. A protein-rich delicacy.'),
  p('m09', 'Salmon Fillet', 'salmon-fillet', 'salmon.png', 650, 720, '500 g', 'Premium salmon fillet — rich in Omega-3. Skin-on, boneless.'),
  p('m10', 'Seer Fish (Vanjaram) Steaks', 'seer-fish-vanjaram', 'seer-fish.png', 550, 620, '500 g', 'Fresh seer fish steaks — the king of fish. Cleaned and sliced.', true),
  p('m11', 'Tiger Prawns', 'tiger-prawns', 'tiger-prawns.png', 480, 550, '500 g', 'Large tiger prawns — deveined and cleaned. Perfect for fry and curry.'),
];

/** Filter extra products the same way the main API filters DB products. */
export function filterExtraProducts(opts: {
  category?: string; search?: string; featured?: boolean;
}): Product[] {
  let list = MEAT_PRODUCTS;
  if (opts.category) {
    if (opts.category !== MEAT_CATEGORY.slug) return [];
  }
  if (opts.search) {
    const q = opts.search.toLowerCase();
    list = list.filter((x) =>
      x.name.toLowerCase().includes(q) ||
      (x.description ?? '').toLowerCase().includes(q) ||
      x.tags.some((t) => t.includes(q)),
    );
  }
  if (opts.featured) list = list.filter((x) => x.isFeatured);
  return list;
}
