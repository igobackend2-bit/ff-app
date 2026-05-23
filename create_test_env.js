const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create/Find User
  let user = await prisma.user.upsert({
    where: { email: 'tester@farmersfactory.in' },
    update: {},
    create: {
      email: 'tester@farmersfactory.in',
      name: 'Alpha Tester',
      phone: '9876543210'
    }
  });

  // 2. Create Address
  const address = await prisma.address.create({
    data: {
      userId: user.id,
      label: 'Home',
      line1: 'B-402, Sunshine Apts',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      lat: 19.0760,
      lng: 72.8777
    }
  });

  // 3. Create Dark Store
  const store = await prisma.darkStore.upsert({
    where: { id: 'default-store' },
    update: {},
    create: {
      id: 'default-store',
      name: 'Mumbai Central Hub',
      city: 'Mumbai',
      pincode: '400001',
      lat: 19.0700,
      lng: 72.8700
    }
  });

  // 4. Create Category & Product
  const category = await prisma.category.upsert({
    where: { slug: 'essentials' },
    update: {},
    create: {
      name: 'Daily Essentials',
      slug: 'essentials',
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/3081/3081822.png'
    }
  });

  const product = await prisma.product.upsert({
    where: { slug: 'fresh-cow-milk' },
    update: {},
    create: {
      name: 'Fresh Cow Milk',
      slug: 'fresh-cow-milk',
      sku: 'MILK-001',
      price: 65,
      mrp: 70,
      unit: '1L',
      imageUrls: '["https://farmersfactory.in/wp-content/uploads/2021/04/Buffalo-Milk-1.jpg"]',
      categoryId: category.id
    }
  });

  // 5. Create Order
  const order = await prisma.order.create({
    data: {
      orderNumber: 'FF-' + Date.now(),
      userId: user.id,
      addressId: address.id,
      darkStoreId: store.id,
      status: 'OUT_FOR_DELIVERY',
      subtotal: 130,
      deliveryFee: 20,
      total: 150,
      paymentStatus: 'PAID',
      items: {
        create: [
          {
            productId: product.id,
            quantity: 2,
            unitPrice: 65,
            total: 130
          }
        ]
      }
    }
  });

  console.log('--- TEST DATA CREATED ---');
  console.log('Order ID:', order.id);
  console.log('Order Number:', order.orderNumber);
  console.log('--- USE THIS ID IN BROWSER ---');

  await prisma.$disconnect();
}

main();
