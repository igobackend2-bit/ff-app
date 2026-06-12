// Extra products served from the API layer (not in DB yet).
import type { Product, Category } from '@/types';

function makeCategory(
  id: string, name: string, slug: string, imageUrl: string,
  sortOrder: number, desc: string,
): Category & { _count?: { products: number } } {
  return {
    id, name, slug, description: desc, imageUrl, iconUrl: null, parentId: null,
    sortOrder, metaTitle: `${name} — Farmers Factory`,
    metaDescription: `Buy ${name.toLowerCase()} online. Fresh delivery.`,
  };
}

function makeProduct(
  id: string, name: string, slug: string, imageUrl: string,
  price: number, mrp: number, unit: string, description: string,
  cat: { id: string; name: string; slug: string },
  tags: string[], featured = false,
): Product {
  return {
    id, name, slug, description,
    imageUrls: [imageUrl],
    blurDataUrls: [],
    categoryId: cat.id, categoryName: cat.name, categorySlug: cat.slug,
    brandId: null, brandName: 'Farmers Factory',
    sku: `FF-${id.toUpperCase()}`,
    mrp, price, unit, tags,
    isFeatured: featured, inStock: true,
    averageRating: 4.5, reviewCount: 0,
    metaTitle: null, metaDescription: null,
  };
}

// ── Meat & Seafood ──────────────────────────────────────────────────────────
export const MEAT_CATEGORY = makeCategory(
  'cat-meat-seafood', 'Meat & Seafood', 'meat-seafood',
  '/images/products/chicken-whole.png', 4,
  'Fresh chicken, mutton, fish and seafood — cleaned and delivered',
);

const MP = '/images/products';
export const MEAT_PRODUCTS: Product[] = [
  makeProduct('m01','Chicken Breast (Boneless)','chicken-breast-boneless',`${MP}/chicken-breast.png`,220,250,'500 g','Tender boneless chicken breast.',MEAT_CATEGORY,['meat','chicken'],true),
  makeProduct('m02','Whole Chicken (Curry Cut)','whole-chicken-curry-cut',`${MP}/chicken-whole.png`,320,360,'1 kg','Farm-fresh whole chicken, curry cut.',MEAT_CATEGORY,['meat','chicken'],true),
  makeProduct('m03','Country Eggs (Naattu Muttai)','country-eggs',`${MP}/eggs.png`,90,100,'6 pcs','Free-range country hen eggs.',MEAT_CATEGORY,['eggs']),
  makeProduct('m04','Mud Crab','mud-crab',`${MP}/mud-crab.png`,450,500,'500 g','Live mud crab — sweet, succulent.',MEAT_CATEGORY,['seafood','crab']),
  makeProduct('m05','Mutton Curry Cut','mutton-curry-cut',`${MP}/mutton-curry.png`,420,480,'500 g','Fresh goat mutton, curry cut.',MEAT_CATEGORY,['meat','mutton'],true),
  makeProduct('m06','Mutton Keema','mutton-keema',`${MP}/mutton-keema.png`,440,500,'500 g','Freshly minced goat mutton.',MEAT_CATEGORY,['meat','mutton']),
  makeProduct('m07','Naattu Kozhi (Country Chicken)','naattu-kozhi',`${MP}/naattu-kozhi.png`,450,520,'1 kg','Free-range country chicken.',MEAT_CATEGORY,['meat','chicken'],true),
  makeProduct('m08','Quail (Kaadai)','quail-kaadai',`${MP}/quail.png`,280,320,'4 pcs','Farm-raised quail, cleaned whole.',MEAT_CATEGORY,['meat']),
  makeProduct('m09','Salmon Fillet','salmon-fillet',`${MP}/salmon.png`,650,720,'500 g','Premium salmon fillet — Omega-3 rich.',MEAT_CATEGORY,['seafood','fish'],true),
  makeProduct('m10','Seer Fish (Vanjaram)','seer-fish-vanjaram',`${MP}/seer-fish.png`,550,620,'500 g','Fresh seer fish steaks.',MEAT_CATEGORY,['seafood','fish'],true),
  makeProduct('m11','Tiger Prawns','tiger-prawns',`${MP}/tiger-prawns.png`,480,550,'500 g','Large tiger prawns — deveined.',MEAT_CATEGORY,['seafood','prawns']),
];

// ── Nuts & Seeds ────────────────────────────────────────────────────────────
export const NUTS_CATEGORY = makeCategory(
  'cat-nuts', 'Nuts & Seeds', 'nuts',
  '/images/nuts/CashewNutsWhole.jpg', 9,
  'Premium cashews, walnuts, almonds, seeds and more',
);

const NP = '/images/nuts';
export const NUTS_PRODUCTS: Product[] = [
  makeProduct('n01','Cashew Nuts (Whole)','cashew-nuts-whole',`${NP}/CashewNutsWhole.jpg`,380,420,'250 g','Premium whole cashews — crunchy and rich.',NUTS_CATEGORY,['nuts','cashew'],true),
  makeProduct('n02','Cashew Split','cashew-split',`${NP}/CashewSplit.jpg`,340,380,'250 g','Broken cashew pieces — perfect for cooking.',NUTS_CATEGORY,['nuts','cashew']),
  makeProduct('n03','Walnut (Akhrot)','walnut',`${NP}/walnut.jpg`,320,380,'200 g','Brain-shaped wonder nut — rich in Omega-3.',NUTS_CATEGORY,['nuts','walnut'],true),
  makeProduct('n04','Pista (Pistachio)','pista',`${NP}/pista.jpg`,290,340,'200 g','Green pistachios — naturally shelled.',NUTS_CATEGORY,['nuts','pista']),
  makeProduct('n05','Chia Seeds','chia-seeds',`${NP}/chiaseeds.jpg`,180,210,'200 g','Tiny superseeds loaded with fibre and protein.',NUTS_CATEGORY,['seeds','chia'],true),
  makeProduct('n06','Flax Seeds (Alsi)','flax-seeds',`${NP}/flaxseeds.jpg`,120,150,'200 g','Cold-pressed flax seeds — rich in Omega-3.',NUTS_CATEGORY,['seeds','flax']),
  makeProduct('n07','Pumpkin Seeds','pumpkin-seeds',`${NP}/PumpkinSeeds.jpg`,160,190,'200 g','Raw pumpkin seeds — high in zinc and magnesium.',NUTS_CATEGORY,['seeds','pumpkin']),
  makeProduct('n08','Sunflower Seeds','sunflower-seeds',`${NP}/sunflowerseeds.jpg`,110,140,'200 g','Hulled sunflower seeds — great for snacking.',NUTS_CATEGORY,['seeds','sunflower']),
  makeProduct('n09','Cucumber Seeds','cucumber-seeds',`${NP}/CucumberSeeds.jpg`,90,110,'100 g','Dried cucumber seeds — traditional superfood.',NUTS_CATEGORY,['seeds']),
];

// ── Dry Fruits ──────────────────────────────────────────────────────────────
export const DRYFRUITS_CATEGORY = makeCategory(
  'cat-dry-fruits', 'Dry Fruits', 'dry-fruits',
  '/images/dryfruits/date.jpg', 8,
  'Premium dates, figs, raisins, dried kiwi and more',
);

const DP = '/images/dryfruits';
export const DRYFRUITS_PRODUCTS: Product[] = [
  makeProduct('d01','Medjool Dates (Khajoor)','dates-khajoor',`${DP}/date.jpg`,280,320,'250 g','Soft, caramel-sweet dates from Arabia.',DRYFRUITS_CATEGORY,['dry-fruits','dates'],true),
  makeProduct('d02','Black Raisins (Kali Kishmish)','black-raisins',`${DP}/DryGrapesBlack.jpg`,160,190,'200 g','Sun-dried black raisins — naturally sweet.',DRYFRUITS_CATEGORY,['dry-fruits','raisins'],true),
  makeProduct('d03','Green Raisins (Hari Kishmish)','green-raisins',`${DP}/drygrapesgreen.jpg`,150,180,'200 g','Golden green raisins — tangy and sweet.',DRYFRUITS_CATEGORY,['dry-fruits','raisins']),
  makeProduct('d04','Dried Kiwi','dried-kiwi',`${DP}/drykiwi.jpg`,220,260,'150 g','Chewy dried kiwi slices — tropical flavour.',DRYFRUITS_CATEGORY,['dry-fruits','kiwi']),
  makeProduct('d05','Dried Figs (Anjeer)','dried-figs',`${DP}/fig.jpg`,260,300,'200 g','Naturally dried figs — rich in fibre.',DRYFRUITS_CATEGORY,['dry-fruits','figs'],true),
  makeProduct('d06','Honey Amla','honey-amla',`${DP}/honeyamla.jpg`,180,220,'200 g','Amla pieces soaked in raw honey — immunity booster.',DRYFRUITS_CATEGORY,['dry-fruits','amla']),
  makeProduct('d07','Padam Pisin (Badam Pisin)','padam-pisin',`${DP}/PadamPisin.jpg`,120,150,'100 g','Traditional almond gum — cooling superfood.',DRYFRUITS_CATEGORY,['dry-fruits']),
];

// ── Seeds / Seeds & Health Mix ──────────────────────────────────────────────
export const SEEDS_CATEGORY = makeCategory(
  'cat-seeds', 'Seeds & Health Mix', 'seeds-health-mix',
  '/images/nuts/chiaseeds.jpg', 10,
  'Chia seeds, flax seeds, pumpkin seeds and health mixes',
);

export const SEEDS_PRODUCTS: Product[] = [
  makeProduct('s01','Chia Seeds','chia-seeds-hm',`${NP}/chiaseeds.jpg`,180,210,'200 g','Tiny superseeds loaded with fibre and protein.',SEEDS_CATEGORY,['seeds','chia'],true),
  makeProduct('s02','Flax Seeds','flax-seeds-hm',`${NP}/flaxseeds.jpg`,120,150,'200 g','Cold-pressed flax seeds — rich in Omega-3.',SEEDS_CATEGORY,['seeds','flax'],true),
  makeProduct('s03','Pumpkin Seeds','pumpkin-seeds-hm',`${NP}/PumpkinSeeds.jpg`,160,190,'200 g','Raw pumpkin seeds — high in zinc.',SEEDS_CATEGORY,['seeds','pumpkin']),
  makeProduct('s04','Sunflower Seeds','sunflower-seeds-hm',`${NP}/sunflowerseeds.jpg`,110,140,'200 g','Hulled sunflower seeds — great for snacking.',SEEDS_CATEGORY,['seeds','sunflower']),
  makeProduct('s05','Cucumber Seeds','cucumber-seeds-hm',`${NP}/CucumberSeeds.jpg`,90,110,'100 g','Dried cucumber seeds — traditional superfood.',SEEDS_CATEGORY,['seeds']),
];

// ── All extra products lookup ───────────────────────────────────────────────
const ALL_EXTRAS: { cat: Category & { _count?: { products: number } }; products: Product[] }[] = [
  { cat: MEAT_CATEGORY,     products: MEAT_PRODUCTS },
  { cat: NUTS_CATEGORY,     products: NUTS_PRODUCTS },
  { cat: DRYFRUITS_CATEGORY, products: DRYFRUITS_PRODUCTS },
  { cat: SEEDS_CATEGORY,    products: SEEDS_PRODUCTS },
];

/** Filter extra products the same way the main API filters DB products. */
export function filterExtraProducts(opts: {
  category?: string; search?: string; featured?: boolean;
}): Product[] {
  // Without a category, only include featured veg/fruit extras (never meat)
  if (!opts.category) {
    if (opts.featured) {
      // Don't include meat in homepage featured listings
      return [];
    }
    return [];
  }

  const entry = ALL_EXTRAS.find((e) => e.cat.slug === opts.category);
  if (!entry) return [];

  let list = entry.products;
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

/** All extra categories to inject into /api/categories */
export function getExtraCategories(): (Category & { _count?: { products: number } })[] {
  return ALL_EXTRAS.map((e) => ({ ...e.cat, _count: { products: e.products.length } }));
}
