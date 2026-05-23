const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a mock user first if needed, or find a user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      }
    });
  }

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      status: 'OUT_FOR_DELIVERY',
      total: 1200,
      paymentStatus: 'PAID',
      address: {
        city: 'Mumbai',
        line1: '123 Test St',
        pincode: '400001',
        state: 'Maharashtra'
      },
      items: {
        create: [
          {
            name: 'Fresh Milk',
            price: 60,
            qty: 2,
            unit: 'L',
            productId: 'temp-prod-1',
            imageUrls: ['https://farmersfactory.in/wp-content/uploads/2021/04/Buffalo-Milk-1.jpg']
          }
        ]
      }
    }
  });
  console.log('Created order ID:', order.id);
  await prisma.$disconnect();
}

main();
