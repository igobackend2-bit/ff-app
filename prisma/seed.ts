// Farmers Factory Seed — Farmers Factory + Valluvam Products
// Run: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Cloudinary demo images by category (replace with real product images in production)
const IMGS: Record<string, string> = {
  veg: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/vegetables.jpg',
  fruit: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/apple.jpg',
  grain: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/wheat.jpg',
  oil: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/oil.jpg',
  dairy: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/milk.jpg',
  spice: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/spices.jpg',
  pickle: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/pickle.jpg',
  sugar: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/sugar.jpg',
  rice: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/rice.jpg',
  honey: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/honey.jpg',
  default: 'https://res.cloudinary.com/demo/image/upload/w_400,h_400,c_fill/sample.jpg',
};

function img(type: keyof typeof IMGS) {
  return JSON.stringify([IMGS[type] ?? IMGS.default]);
}

async function main() {
  console.log('\n🌱 Seeding Farmers Factory + Valluvam Products\n');

  // ── Dark Store ──────────────────────────────────────────────────────────────
  await prisma.darkStore.upsert({
    where: { id: 'default-store' },
    update: {},
    create: {
      id: 'default-store',
      name: 'Farmers Factory Warehouse Chennai',
      city: 'Chennai',
      pincode: '600001',
      lat: 13.0827,
      lng: 80.2707,
      radiusKm: 50,
      isActive: true,
    },
  });
  console.log('✅ Warehouse created');

  // ── Brands ──────────────────────────────────────────────────────────────────
  const ff = await prisma.brand.upsert({
    where: { slug: 'farmers-factory' },
    update: {},
    create: {
      name: 'Farmers Factory',
      slug: 'farmers-factory',
      logoUrl: 'https://res.cloudinary.com/demo/image/upload/w_200/sample.jpg',
    },
  });

  const valluvam = await prisma.brand.upsert({
    where: { slug: 'valluvam' },
    update: {},
    create: {
      name: 'Valluvam Products',
      slug: 'valluvam',
      logoUrl: 'https://res.cloudinary.com/demo/image/upload/w_200/sample.jpg',
    },
  });
  console.log('✅ Brands: Farmers Factory + Valluvam');

  // ── Categories ──────────────────────────────────────────────────────────────
  const CATS = [
    { name: 'Farm Fresh Vegetables', slug: 'farm-fresh', imageUrl: IMGS.veg!, sortOrder: 1 },
    { name: 'Fresh Fruits', slug: 'fruits', imageUrl: IMGS.fruit!, sortOrder: 2 },
    { name: 'Traditional Rice', slug: 'traditional-rice', imageUrl: IMGS.rice!, sortOrder: 3 },
    { name: 'Cold-Pressed Oils', slug: 'cold-pressed-oils', imageUrl: IMGS.oil!, sortOrder: 4 },
    { name: 'Country Sugar & Jaggery', slug: 'sugar-jaggery', imageUrl: IMGS.sugar!, sortOrder: 5 },
    { name: 'Organic Grains & Pulses', slug: 'grains-pulses', imageUrl: IMGS.grain!, sortOrder: 6 },
    { name: 'Dairy & Ghee', slug: 'dairy-ghee', imageUrl: IMGS.dairy!, sortOrder: 7 },
    { name: 'Spices & Masala', slug: 'spices', imageUrl: IMGS.spice!, sortOrder: 8 },
    { name: 'Pickles & Chutneys', slug: 'pickles', imageUrl: IMGS.pickle!, sortOrder: 9 },
    { name: 'Honey & Natural Sweeteners', slug: 'honey', imageUrl: IMGS.honey!, sortOrder: 10 },
    { name: 'Organic', slug: 'organic', imageUrl: IMGS.veg!, sortOrder: 11 },
    { name: 'Traditional', slug: 'traditional', imageUrl: IMGS.rice!, sortOrder: 12 },
  ];

  const catMap: Record<string, string> = {};
  for (const c of CATS) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
        imageUrl: c.imageUrl,
        sortOrder: c.sortOrder,
        isActive: true,
        metaTitle: `${c.name} — Farmers Factory`,
        metaDescription: `Buy ${c.name.toLowerCase()} online. 24-hour delivery across Tamil Nadu & Karnataka.`,
        ogImageUrl: c.imageUrl,
      },
    });
    catMap[c.slug] = cat.id;
  }
  console.log(`✅ Categories: ${CATS.length}`);

  // ── Products ────────────────────────────────────────────────────────────────
  const PRODUCTS = [
    // ── FARMERS FACTORY — VEGETABLES ───────────────────────────────────────
    { brand: ff.id, cat: 'farm-fresh', name: 'Organic Tomatoes (Local)', slug: 'ff-organic-tomatoes-1kg', sku: 'FF-TOM-1KG', mrp: 60, price: 52, unit: '1 kg', img: img('veg'), tags: '["vegetables","organic","fresh"]', featured: true, inStock: true },
    { brand: ff.id, cat: 'farm-fresh', name: 'Baby Spinach (Palak)', slug: 'ff-baby-spinach-250g', sku: 'FF-SPN-250G', mrp: 35, price: 30, unit: '250 g', img: img('veg'), tags: '["vegetables","greens","organic"]', featured: false, inStock: true },
    { brand: ff.id, cat: 'farm-fresh', name: 'Country Brinjal', slug: 'ff-country-brinjal-500g', sku: 'FF-BRJ-500G', mrp: 40, price: 35, unit: '500 g', img: img('veg'), tags: '["vegetables","organic"]', featured: false, inStock: true },
    { brand: ff.id, cat: 'farm-fresh', name: 'Green Chilli (Nattu)', slug: 'ff-green-chilli-100g', sku: 'FF-GCH-100G', mrp: 20, price: 18, unit: '100 g', img: img('veg'), tags: '["vegetables","spicy"]', featured: false, inStock: true },
    { brand: ff.id, cat: 'farm-fresh', name: 'Drumstick (Murungakkai)', slug: 'ff-drumstick-500g', sku: 'FF-DRM-500G', mrp: 45, price: 38, unit: '500 g', img: img('veg'), tags: '["vegetables","organic","superfood"]', featured: true, inStock: true },
    { brand: ff.id, cat: 'farm-fresh', name: 'Organic Carrot', slug: 'ff-organic-carrot-500g', sku: 'FF-CAR-500G', mrp: 50, price: 44, unit: '500 g', img: img('veg'), tags: '["vegetables","organic"]', featured: false, inStock: true },
    { brand: ff.id, cat: 'farm-fresh', name: 'Country Beans (Avarakkai)', slug: 'ff-avarakkai-500g', sku: 'FF-AVR-500G', mrp: 40, price: 35, unit: '500 g', img: img('veg'), tags: '["vegetables","organic"]', featured: false, inStock: false },
    { brand: ff.id, cat: 'farm-fresh', name: 'Bitter Gourd (Pavakkai)', slug: 'ff-pavakkai-500g', sku: 'FF-PVK-500G', mrp: 38, price: 32, unit: '500 g', img: img('veg'), tags: '["vegetables","organic","diabetic-friendly"]', featured: false, inStock: true },

    // ── FARMERS FACTORY — FRUITS ───────────────────────────────────────────
    { brand: ff.id, cat: 'fruits', name: 'Nendran Banana', slug: 'ff-nendran-banana-6pcs', sku: 'FF-BAN-6PC', mrp: 80, price: 70, unit: '6 pcs (~700g)', img: img('fruit'), tags: '["fruits","banana","organic"]', featured: true, inStock: true },
    { brand: ff.id, cat: 'fruits', name: 'Sapota (Chikoo)', slug: 'ff-sapota-500g', sku: 'FF-SAP-500G', mrp: 55, price: 48, unit: '500 g', img: img('fruit'), tags: '["fruits","seasonal"]', featured: false, inStock: true },
    { brand: ff.id, cat: 'fruits', name: 'Country Lime (Nattu Elumichai)', slug: 'ff-country-lime-250g', sku: 'FF-LME-250G', mrp: 30, price: 25, unit: '250 g (~8 pcs)', img: img('fruit'), tags: '["fruits","citrus"]', featured: false, inStock: true },
    { brand: ff.id, cat: 'fruits', name: 'Pomegranate', slug: 'ff-pomegranate-2pcs', sku: 'FF-POM-2PC', mrp: 90, price: 79, unit: '2 pcs (~500g)', img: img('fruit'), tags: '["fruits","superfood"]', featured: true, inStock: true },
    { brand: ff.id, cat: 'fruits', name: 'Coconut (Thengai)', slug: 'ff-coconut-1pc', sku: 'FF-COC-1PC', mrp: 35, price: 30, unit: '1 pc', img: img('fruit'), tags: '["fruits","coconut"]', featured: false, inStock: true },

    // ── FARMERS FACTORY — DAIRY ──────────────────────────────────────────
    { brand: ff.id, cat: 'dairy-ghee', name: 'Farm Cow Milk (A2)', slug: 'ff-a2-cow-milk-1l', sku: 'FF-A2M-1L', mrp: 90, price: 85, unit: '1 L', img: img('dairy'), tags: '["dairy","a2-milk","organic"]', featured: true, inStock: true },
    { brand: ff.id, cat: 'dairy-ghee', name: 'Curd (Set Thayir)', slug: 'ff-set-curd-500g', sku: 'FF-CRD-500G', mrp: 45, price: 40, unit: '500 g', img: img('dairy'), tags: '["dairy","probiotic"]', featured: false, inStock: true },
    { brand: ff.id, cat: 'dairy-ghee', name: 'Farm Fresh Eggs (Country)', slug: 'ff-country-eggs-12pcs', sku: 'FF-EGG-12PC', mrp: 120, price: 108, unit: '12 pcs', img: img('dairy'), tags: '["eggs","country","protein"]', featured: true, inStock: true },

    // ── VALLUVAM — TRADITIONAL RICE ───────────────────────────────────────
    { brand: valluvam.id, cat: 'traditional-rice', name: 'Mappillai Samba Rice', slug: 'vam-mappillai-samba-1kg', sku: 'VAM-MSR-1KG', mrp: 130, price: 115, unit: '1 kg', img: img('rice'), tags: '["rice","traditional","organic","diabetic-friendly"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'traditional-rice', name: 'Kambam Samba Rice', slug: 'vam-kambam-samba-1kg', sku: 'VAM-KSR-1KG', mrp: 120, price: 105, unit: '1 kg', img: img('rice'), tags: '["rice","traditional","organic"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'traditional-rice', name: 'Kuruvakar Rice', slug: 'vam-kuruvakar-rice-1kg', sku: 'VAM-KVR-1KG', mrp: 115, price: 99, unit: '1 kg', img: img('rice'), tags: '["rice","traditional"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'traditional-rice', name: 'Thooyamalli Rice', slug: 'vam-thooyamalli-rice-1kg', sku: 'VAM-TMR-1KG', mrp: 110, price: 95, unit: '1 kg', img: img('rice'), tags: '["rice","traditional","aromatic"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'traditional-rice', name: 'Karuppu Kavuni Rice (Black)', slug: 'vam-black-rice-500g', sku: 'VAM-BKR-500G', mrp: 120, price: 105, unit: '500 g', img: img('rice'), tags: '["rice","traditional","superfood","antioxidant"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'traditional-rice', name: 'Seeragasamba Rice', slug: 'vam-seeragasamba-rice-1kg', sku: 'VAM-SSR-1KG', mrp: 140, price: 125, unit: '1 kg', img: img('rice'), tags: '["rice","traditional","aromatic","biryani"]', featured: false, inStock: false },

    // ── VALLUVAM — COLD-PRESSED OILS ─────────────────────────────────────
    { brand: valluvam.id, cat: 'cold-pressed-oils', name: 'Chekku Groundnut Oil', slug: 'vam-groundnut-oil-1l', sku: 'VAM-GNO-1L', mrp: 280, price: 255, unit: '1 L', img: img('oil'), tags: '["oil","cold-pressed","groundnut"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'cold-pressed-oils', name: 'Chekku Sesame Oil (Gingelly)', slug: 'vam-sesame-oil-500ml', sku: 'VAM-SSO-500ML', mrp: 320, price: 295, unit: '500 ml', img: img('oil'), tags: '["oil","cold-pressed","sesame","traditional"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'cold-pressed-oils', name: 'Chekku Coconut Oil', slug: 'vam-coconut-oil-500ml', sku: 'VAM-CCO-500ML', mrp: 250, price: 225, unit: '500 ml', img: img('oil'), tags: '["oil","cold-pressed","coconut","hair-care"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'cold-pressed-oils', name: 'Castor Oil (Amanakku)', slug: 'vam-castor-oil-200ml', sku: 'VAM-CSO-200ML', mrp: 180, price: 160, unit: '200 ml', img: img('oil'), tags: '["oil","cold-pressed","medicinal"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'cold-pressed-oils', name: 'Mustard Oil (Kadugu)', slug: 'vam-mustard-oil-500ml', sku: 'VAM-MSO-500ML', mrp: 230, price: 210, unit: '500 ml', img: img('oil'), tags: '["oil","cold-pressed","mustard"]', featured: false, inStock: false },

    // ── VALLUVAM — SUGAR & JAGGERY ────────────────────────────────────────
    { brand: valluvam.id, cat: 'sugar-jaggery', name: 'Karupatti (Palm Jaggery)', slug: 'vam-karupatti-500g', sku: 'VAM-KRP-500G', mrp: 150, price: 135, unit: '500 g', img: img('sugar'), tags: '["sugar","jaggery","traditional","diabetic-friendly"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'sugar-jaggery', name: 'Naatu Sakkarai (Country Sugar)', slug: 'vam-naatu-sakkarai-500g', sku: 'VAM-NSK-500G', mrp: 120, price: 108, unit: '500 g', img: img('sugar'), tags: '["sugar","unrefined","traditional"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'sugar-jaggery', name: 'Kollu Jaggery Block', slug: 'vam-jaggery-block-500g', sku: 'VAM-JGB-500G', mrp: 110, price: 98, unit: '500 g', img: img('sugar'), tags: '["jaggery","traditional","iron-rich"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'sugar-jaggery', name: 'Coconut Sugar', slug: 'vam-coconut-sugar-250g', sku: 'VAM-CSS-250G', mrp: 180, price: 160, unit: '250 g', img: img('sugar'), tags: '["sugar","coconut","low-gi"]', featured: true, inStock: true },

    // ── VALLUVAM — GRAINS & PULSES ────────────────────────────────────────
    { brand: valluvam.id, cat: 'grains-pulses', name: 'Kambu (Pearl Millet)', slug: 'vam-kambu-500g', sku: 'VAM-KMB-500G', mrp: 65, price: 58, unit: '500 g', img: img('grain'), tags: '["millet","grains","traditional","iron-rich"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'grains-pulses', name: 'Ragi (Finger Millet)', slug: 'vam-ragi-500g', sku: 'VAM-RGI-500G', mrp: 60, price: 54, unit: '500 g', img: img('grain'), tags: '["millet","calcium","grains"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'grains-pulses', name: 'Thinai (Foxtail Millet)', slug: 'vam-thinai-500g', sku: 'VAM-TNI-500G', mrp: 70, price: 62, unit: '500 g', img: img('grain'), tags: '["millet","diabetic-friendly","grains"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'grains-pulses', name: 'Horse Gram (Kollu)', slug: 'vam-kollu-500g', sku: 'VAM-KLL-500G', mrp: 80, price: 72, unit: '500 g', img: img('grain'), tags: '["pulses","protein","weight-loss"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'grains-pulses', name: 'Organic Toor Dal', slug: 'vam-toor-dal-500g', sku: 'VAM-TRD-500G', mrp: 95, price: 85, unit: '500 g', img: img('grain'), tags: '["dal","pulses","organic","protein"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'grains-pulses', name: 'Chana Dal (Organic)', slug: 'vam-chana-dal-500g', sku: 'VAM-CHD-500G', mrp: 90, price: 80, unit: '500 g', img: img('grain'), tags: '["dal","pulses","organic"]', featured: false, inStock: false },

    // ── VALLUVAM — GHEE ──────────────────────────────────────────────────
    { brand: valluvam.id, cat: 'dairy-ghee', name: 'A2 Cow Ghee (Bilona)', slug: 'vam-a2-ghee-500ml', sku: 'VAM-A2G-500ML', mrp: 750, price: 699, unit: '500 ml', img: img('dairy'), tags: '["ghee","a2","bilona","traditional"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'dairy-ghee', name: 'Buffalo Ghee', slug: 'vam-buffalo-ghee-250ml', sku: 'VAM-BFG-250ML', mrp: 420, price: 390, unit: '250 ml', img: img('dairy'), tags: '["ghee","buffalo","traditional"]', featured: false, inStock: true },

    // ── VALLUVAM — SPICES ─────────────────────────────────────────────────
    { brand: valluvam.id, cat: 'spices', name: 'Whole Black Pepper (Milagu)', slug: 'vam-black-pepper-100g', sku: 'VAM-BPP-100G', mrp: 120, price: 108, unit: '100 g', img: img('spice'), tags: '["spices","pepper","organic"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'spices', name: 'Cumin (Jeera) Organic', slug: 'vam-cumin-100g', sku: 'VAM-CUM-100G', mrp: 90, price: 80, unit: '100 g', img: img('spice'), tags: '["spices","cumin","organic"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'spices', name: 'Fenugreek (Vendhayam)', slug: 'vam-fenugreek-100g', sku: 'VAM-FNG-100G', mrp: 55, price: 48, unit: '100 g', img: img('spice'), tags: '["spices","fenugreek","medicinal"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'spices', name: 'Turmeric Powder (Organic)', slug: 'vam-turmeric-100g', sku: 'VAM-TRM-100G', mrp: 70, price: 62, unit: '100 g', img: img('spice'), tags: '["spices","turmeric","organic","medicinal"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'spices', name: 'Sambar Powder (Home Style)', slug: 'vam-sambar-powder-200g', sku: 'VAM-SBP-200G', mrp: 85, price: 75, unit: '200 g', img: img('spice'), tags: '["spices","masala","traditional"]', featured: false, inStock: true },

    // ── VALLUVAM — PICKLES ────────────────────────────────────────────────
    { brand: valluvam.id, cat: 'pickles', name: 'Avakkai Mango Pickle', slug: 'vam-avakkai-pickle-300g', sku: 'VAM-AVK-300G', mrp: 150, price: 135, unit: '300 g', img: img('pickle'), tags: '["pickle","mango","traditional"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'pickles', name: 'Lemon Pickle (Nattu)', slug: 'vam-lemon-pickle-300g', sku: 'VAM-LMP-300G', mrp: 130, price: 115, unit: '300 g', img: img('pickle'), tags: '["pickle","lemon","traditional"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'pickles', name: 'Garlic Pickle (Poondu)', slug: 'vam-garlic-pickle-200g', sku: 'VAM-GAP-200G', mrp: 140, price: 125, unit: '200 g', img: img('pickle'), tags: '["pickle","garlic","spicy"]', featured: false, inStock: true },

    // ── VALLUVAM — HONEY ──────────────────────────────────────────────────
    { brand: valluvam.id, cat: 'honey', name: 'Forest Honey (Raw Unfiltered)', slug: 'vam-forest-honey-500g', sku: 'VAM-FNH-500G', mrp: 450, price: 410, unit: '500 g', img: img('honey'), tags: '["honey","raw","forest","organic"]', featured: true, inStock: true },
    { brand: valluvam.id, cat: 'honey', name: 'Eucalyptus Honey', slug: 'vam-eucalyptus-honey-250g', sku: 'VAM-ECH-250G', mrp: 260, price: 235, unit: '250 g', img: img('honey'), tags: '["honey","medicinal","cold-relief"]', featured: false, inStock: true },
    { brand: valluvam.id, cat: 'honey', name: 'Wild Berry Honey', slug: 'vam-wild-berry-honey-250g', sku: 'VAM-WBH-250G', mrp: 300, price: 270, unit: '250 g', img: img('honey'), tags: '["honey","wild","antioxidant"]', featured: true, inStock: true },
  ];

  let seeded = 0;
  for (const p of PRODUCTS) {
    const catId = catMap[p.cat];
    if (!catId) { console.warn(`  ⚠ No category found: ${p.cat}`); continue; }
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { inStock: p.inStock, price: p.price, isFeatured: p.featured },
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        imageUrls: p.img,
        blurDataUrls: '[]',
        categoryId: catId,
        brandId: p.brand,
        mrp: p.mrp,
        price: p.price,
        unit: p.unit,
        tags: p.tags,
        isFeatured: p.featured,
        isActive: true,
        inStock: p.inStock,
        averageRating: +(3.8 + Math.random() * 1.2).toFixed(1),
        reviewCount: Math.floor(Math.random() * 800) + 50,
      },
    });
    seeded++;
  }
  console.log(`✅ Products seeded: ${seeded} (${PRODUCTS.filter(p => !p.inStock).length} out-of-stock)`);

  // ── Sample banners ──────────────────────────────────────────────────────────
  await prisma.banner.upsert({
    where: { id: 'banner-ff' },
    update: {},
    create: {
      id: 'banner-ff',
      title: 'Farmers Factory — Direct from Farm',
      imageUrl: IMGS.veg!,
      altText: 'Fresh organic vegetables from Farmers Factory — 24hr delivery',
      linkUrl: '/category/farm-fresh',
      position: 'hero',
      sortOrder: 1,
      isActive: true,
    },
  });
  await prisma.banner.upsert({
    where: { id: 'banner-vam' },
    update: {},
    create: {
      id: 'banner-vam',
      title: 'Valluvam — Traditional Goodness',
      imageUrl: IMGS.oil!,
      altText: 'Traditional cold-pressed oils and organic products from Valluvam',
      linkUrl: '/category/cold-pressed-oils',
      position: 'hero',
      sortOrder: 2,
      isActive: true,
    },
  });
  console.log('✅ Banners created');

  console.log('\n🚀 Database ready!');
  console.log(`   • ${PRODUCTS.length} products from 2 brands`);
  console.log(`   • ${CATS.length} categories`);
  console.log('   Run: npm run dev → http://localhost:3000');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
