export const FRUIT_CATEGORY_SLUG = 'fruits';
export const FRUIT_IMAGE_BASE = '/images/fruits';

export const FRUIT_PRODUCTS = [
  { name: 'Mango Banganapalli', unit: '1 Kg', price: 185, imageFile: 'MangoBanganapalli.jfif', featured: true },
  { name: 'Senthoora Mango', unit: '1 Kg', price: 155, imageFile: 'SenthooraMango.webp', featured: false },
  { name: 'Amla', unit: '1 Kg', price: 110, imageFile: 'amla.jfif', featured: false },
  { name: 'Banana Elakki', unit: '1 Kg', price: 70, imageFile: 'BananaElakki.jfif', featured: false },
  { name: 'Banana Karpooravalli', unit: '1 Kg', price: 50, imageFile: 'BananaKarpooravalli.jfif', featured: false },
  { name: 'Banana Nendhiram', unit: '1 Kg', price: 50, imageFile: 'BananaNendhiram.jfif', featured: true },
  { name: 'Banana Poovan', unit: '1 Kg', price: 50, imageFile: 'BananaPoovan.jfif', featured: false },
  { name: 'Banana Red', unit: '1 Kg', price: 80, imageFile: 'redbanana.jfif', featured: false },
  { name: 'Dragon Fruit', unit: '1 Pc', price: 60, imageFile: 'droganfruit.jfif', featured: true },
  { name: 'Guava White', unit: '1 Kg', price: 90, imageFile: 'GuavaWhite.jfif', featured: false },
  { name: 'Imported Orange', unit: '1 Kg', price: 140, imageFile: 'orange.jfif', featured: false },
  { name: 'Kiwi Box', unit: '1 Box', price: 120, imageFile: 'kiwi.jfif', featured: false },
  { name: 'Musk Melon', unit: '1 Kg', price: 60, imageFile: 'MuskMelon.jfif', featured: false },
  { name: 'Papaya', unit: '1 Kg', price: 40, imageFile: 'papaya.jfif', featured: false },
  { name: 'Pineapple', unit: '1 Pc', price: 80, imageFile: 'pineapple.jfif', featured: false },
  { name: 'Pomegranate', unit: '1 Kg', price: 250, imageFile: 'Pomegranate.jfif', featured: true },
  { name: 'Sapota', unit: '1 Kg', price: 60, imageFile: 'Sapota.jfif', featured: false },
  { name: 'Apple', unit: '1 Kg', price: 250, imageFile: 'apple.jfif', featured: false },
  { name: 'Strawberry', unit: '250 g', price: 80, imageFile: 'Strawberry.jfif', featured: false },
  { name: 'Sweet Lime', unit: '1 Kg', price: 95, imageFile: 'SweetLime.jfif', featured: false },
  { name: 'Watermelon Kiran', unit: '1 Pc', price: 120, imageFile: 'WatermelonKiran.jfif', featured: false },
  { name: 'Watermelon Stripes', unit: '1 Pc', price: 100, imageFile: 'WatermelonStrips.jfif', featured: false },
] as const;

export function fruitSlug(name: string, unit: string) {
  return `${name}-${unit}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function fruitImage(imageFile: string) {
  return `${FRUIT_IMAGE_BASE}/${encodeURIComponent(imageFile)}`;
}
