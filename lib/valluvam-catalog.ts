export const VALLUVAM_IMAGE_BASE = '/images/valluvam';

export interface CatalogProduct {
  name: string;
  unit: string;
  price: number;
  imageFile: string;
  featured: boolean;
}

export interface CatalogCategory {
  name: string;
  slug: string;
  imageFile: string;
  sortOrder: number;
  products: CatalogProduct[];
}

export const VALLUVAM_CATALOG: CatalogCategory[] = [
  {
    name: 'Valluvam Products',
    slug: 'valluvam-products',
    imageFile: 'honey.jpeg',
    sortOrder: 10,
    products: [
      { name: 'Valluvam Honey', unit: '250ML', price: 230, imageFile: 'honey.jpeg', featured: true },
      { name: 'Valluvam Honey', unit: '500ML', price: 440, imageFile: 'honey.jpeg', featured: false },
      { name: 'Palm Jaggery (Karupatti)', unit: '250GM', price: 170, imageFile: 'palm-jaggery.jpeg', featured: true },
      { name: 'Palm Jaggery (Karupatti)', unit: '500GM', price: 330, imageFile: 'palm-jaggery(500).jpeg', featured: false },
      { name: 'Palm Candy', unit: '200GM', price: 160, imageFile: 'products-54.jpg', featured: false },
      { name: 'Nattu Sakkarai', unit: '200GM', price: 160, imageFile: 'products-54.jpg', featured: false },
    ],
  },
  {
    name: 'Healthy Oils & Ghee',
    slug: 'healthy-oils-ghee',
    imageFile: 'Ghee.jpg',
    sortOrder: 11,
    products: [
      { name: 'Buffalo Ghee', unit: '250GM', price: 220, imageFile: 'buffalo(250).jpg', featured: false },
      { name: 'Buffalo Ghee', unit: '500GM', price: 430, imageFile: 'buffalo(500).jpg', featured: true },
      { name: 'Cow Ghee', unit: '500GM', price: 450, imageFile: 'Ghee.jpg', featured: true },
      { name: 'Coconut Oil', unit: '1000ML', price: 340, imageFile: 'coconut-1L.jpg', featured: false },
      { name: 'Coconut Oil', unit: '500ML', price: 180, imageFile: 'coconutoil250.jpg', featured: false },
      { name: 'Groundnut Oil', unit: '1LTR', price: 290, imageFile: 'ground-1L.jpg', featured: false },
      { name: 'Groundnut Oil', unit: '500ML', price: 155, imageFile: 'groundnutoil250.jpg', featured: false },
      { name: 'Sesame Oil', unit: '1LTR', price: 420, imageFile: 'sesame-1L.jpg', featured: false },
      { name: 'Sesame Oil', unit: '500ML', price: 220, imageFile: 'sesame500.jpg', featured: false },
      { name: 'Sesame Oil + Coconut Oil Combo', unit: '1LTR + 500ML', price: 580, imageFile: 'sesame-1L.jpg', featured: false },
    ],
  },
  {
    name: 'Nuts & Dry Fruits',
    slug: 'nuts-dry-fruits',
    imageFile: 'CashewNutsWhole.jpg',
    sortOrder: 12,
    products: [
      { name: 'Almond', unit: '100GM', price: 110, imageFile: 'CashewNutsWhole.jpg', featured: false },
      { name: 'Almond', unit: '200GM', price: 210, imageFile: 'CashewNutsWhole.jpg', featured: false },
      { name: 'Cashew Nuts Whole', unit: '200GM', price: 240, imageFile: 'CashewNutsWhole.jpg', featured: true },
      { name: 'Cashew Split', unit: '100GM', price: 90, imageFile: 'CashewSplit.jpg', featured: false },
      { name: 'Cashew W-240', unit: '100GM', price: 125, imageFile: 'CashewNutsWhole.jpg', featured: false },
      { name: 'Pista', unit: '100GM', price: 140, imageFile: 'pista.jpg', featured: false },
      { name: 'Pista', unit: '200GM', price: 270, imageFile: 'pista.jpg', featured: false },
      { name: 'Walnut', unit: '200GM', price: 320, imageFile: 'walnut.jpg', featured: false },
      { name: 'Dates', unit: '200GM', price: 120, imageFile: 'date.jpg', featured: false },
      { name: 'Dry Fig', unit: '100GM', price: 160, imageFile: 'fig.jpg', featured: false },
      { name: 'Dry Grapes Black', unit: '200GM', price: 110, imageFile: 'DryGrapesBlack.jpg', featured: false },
      { name: 'Dry Grapes Green', unit: '100GM', price: 60, imageFile: 'drygrapesgreen.jpg', featured: false },
      { name: 'Dry Grapes Green', unit: '200GM', price: 110, imageFile: 'drygrapesgreen.jpg', featured: false },
      { name: 'Dry Kiwi', unit: '200GM', price: 180, imageFile: 'drykiwi.jpg', featured: false },
    ],
  },
  {
    name: 'Seeds & Health Mix',
    slug: 'seeds-health-mix',
    imageFile: 'chiaseeds.jpg',
    sortOrder: 13,
    products: [
      { name: 'Chia Seed', unit: '200GM', price: 140, imageFile: 'chiaseeds.jpg', featured: false },
      { name: 'Flax Seed', unit: '200GM', price: 80, imageFile: 'flaxseeds.jpg', featured: false },
      { name: 'Pumpkin Seeds', unit: '200GM', price: 180, imageFile: 'PumpkinSeeds.jpg', featured: false },
      { name: 'Sunflower Seeds', unit: '200GM', price: 150, imageFile: 'sunflowerseeds.jpg', featured: false },
      { name: 'Cucumber Seeds', unit: '200GM', price: 160, imageFile: 'CucumberSeeds.jpg', featured: false },
      { name: 'Dry Honey Amla', unit: '200GM', price: 190, imageFile: 'honeyamla.jpg', featured: false },
      { name: 'Padam Pisin', unit: '200GM', price: 130, imageFile: 'PadamPisin.jpg', featured: false },
    ],
  },
  {
    name: 'Spices & Herbs',
    slug: 'spices-herbs',
    imageFile: 'Cardamom.jpg',
    sortOrder: 14,
    products: [
      { name: 'Bay Leaves', unit: '50GM', price: 45, imageFile: 'bayleaves.jpg', featured: false },
      { name: 'Cardamom', unit: '50GM', price: 180, imageFile: 'Cardamom.jpg', featured: false },
      { name: 'Cardamom', unit: '100GM', price: 350, imageFile: 'Cardamom.jpg', featured: true },
      { name: 'Cardamom', unit: '200GM', price: 680, imageFile: 'Cardamom.jpg', featured: false },
      { name: 'Cinnamon', unit: '50GM', price: 60, imageFile: 'Cinnamon.jpg', featured: false },
      { name: 'Clove', unit: '50GM', price: 90, imageFile: 'clove.jpg', featured: false },
      { name: 'Clove', unit: '100GM', price: 175, imageFile: 'clove.jpg', featured: false },
      { name: 'Fennel Seeds', unit: '200GM', price: 75, imageFile: 'FennelSeeds.jpg', featured: false },
      { name: 'Jeera', unit: '200GM', price: 140, imageFile: 'jeera.jpg', featured: false },
      { name: 'Methi', unit: '200GM', price: 60, imageFile: 'Methi.jpg', featured: false },
      { name: 'Mustard Seeds', unit: '200GM', price: 55, imageFile: 'MustardSeeds.jpg', featured: false },
      { name: 'Pepper Black', unit: '200GM', price: 190, imageFile: 'PepperBlack.jpg', featured: false },
      { name: 'Star Anise', unit: '50GM', price: 85, imageFile: 'staranise.jpg', featured: false },
      { name: 'Star Anise', unit: '100GM', price: 160, imageFile: 'staranise.jpg', featured: false },
    ],
  },
  {
    name: 'Nutritious Millets',
    slug: 'nutritious-millets',
    imageFile: 'FoxtailMillet.jpg',
    sortOrder: 15,
    products: [
      { name: 'Barnyard Millet', unit: '1KG', price: 140, imageFile: 'BarnyardMillet.jpg', featured: false },
      { name: 'Barnyard Millet', unit: '500GM', price: 75, imageFile: 'BarnyardMillet.jpg', featured: false },
      { name: 'Browntop Millet', unit: '1KG', price: 160, imageFile: 'BrowntopMillet.jpg', featured: false },
      { name: 'Browntop Millet', unit: '500GM', price: 85, imageFile: 'BrowntopMillet.jpg', featured: false },
      { name: 'Foxtail Millet', unit: '1KG', price: 130, imageFile: 'FoxtailMillet.jpg', featured: false },
      { name: 'Foxtail Millet', unit: '500GM', price: 70, imageFile: 'FoxtailMillet.jpg', featured: false },
      { name: 'Kodo Millet', unit: '1KG', price: 135, imageFile: 'kodo-varagu.jpg', featured: false },
      { name: 'Kodo Millet', unit: '500GM', price: 75, imageFile: 'kodo-varagu.jpg', featured: false },
      { name: 'Little Millet', unit: '1KG', price: 145, imageFile: 'LittleMillet.jpg', featured: false },
      { name: 'Little Millet', unit: '500GM', price: 80, imageFile: 'LittleMillet.jpg', featured: false },
      { name: 'Pearl Millet', unit: '1KG', price: 110, imageFile: 'PearlMillet.jpg', featured: false },
      { name: 'Pearl Millet', unit: '500GM', price: 60, imageFile: 'PearlMillet.jpg', featured: false },
      { name: 'Sorghum Red', unit: '1KG', price: 120, imageFile: 'Sorghum-Cholam(WHITE).jpg', featured: false },
      { name: 'Sorghum Red', unit: '500GM', price: 65, imageFile: 'Sorghum-Cholam(WHITE).jpg', featured: false },
      { name: 'Sorghum White', unit: '1KG', price: 110, imageFile: 'Sorghum-Cholam(WHITE).jpg', featured: false },
      { name: 'Sorghum White', unit: '500GM', price: 60, imageFile: 'Sorghum-Cholam(WHITE).jpg', featured: false },
    ],
  },
];

export function valluvamSlug(name: string, unit: string) {
  return `${name}-${unit}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function valluvamImage(imageFile: string) {
  return `${VALLUVAM_IMAGE_BASE}/${encodeURIComponent(imageFile)}`;
}
