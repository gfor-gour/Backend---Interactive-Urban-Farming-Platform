import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function logProgress(step, message) {
  console.log(`\n✓ [${step}] ${message}`);
}

function getRandomCategory() {
  const categories = ['VEGETABLES', 'FRUITS', 'HERBS', 'SEEDS', 'TOOLS'];
  return categories[Math.floor(Math.random() * categories.length)];
}

function getRandomCertStatus(index) {
  // 8 approved, 2 pending for vendors
  return index > 7 ? 'PENDING' : 'APPROVED';
}

async function main() {
  try {
    console.log('\n🌱 Starting Urban Farming Platform seeder...\n');

    await prisma.$transaction(async (tx) => {
      logProgress('STEP 1', 'Creating Admin User');
      const adminPassword = await hashPassword('admin@123');
      const adminUser = await tx.user.create({
        data: {
          id: faker.string.uuid(),
          name: 'Admin Manager',
          email: 'admin@farm.com',
          password: adminPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });
      console.log(`   Admin user created: ${adminUser.email}`);

      logProgress('STEP 2', 'Creating 10 Vendor Users with Profiles & Sustainability Certs');
      const vendorUsers = [];
      const vendorProfiles = [];
      const sustainabilityCerts = [];

      for (let i = 0; i < 10; i++) {
        const vendorPassword = await hashPassword(`vendor${i + 1}@123`);
        const vendorUser = await tx.user.create({
          data: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: vendorPassword,
            role: 'VENDOR',
            status: 'ACTIVE',
          },
        });
        vendorUsers.push(vendorUser);

        const vendorProfile = await tx.vendorProfile.create({
          data: {
            id: faker.string.uuid(),
            userId: vendorUser.id,
            farmName: faker.company.name() + ' Farm',
            certificationStatus: getRandomCertStatus(i),
            farmLocation: faker.location.city() + ', ' + faker.location.state(),
            lat: parseFloat(faker.location.latitude()),
            lng: parseFloat(faker.location.longitude()),
          },
        });
        vendorProfiles.push(vendorProfile);

        const cert = await tx.sustainabilityCert.create({
          data: {
            id: faker.string.uuid(),
            vendorId: vendorProfile.id,
            certifyingAgency: faker.company.name(),
            certificationDate: faker.date.past({ years: 2 }),
            expiryDate: faker.date.future({ years: 2 }),
            documentUrl: faker.internet.url(),
          },
        });
        sustainabilityCerts.push(cert);
      }
      console.log(`   Created 10 vendor users with profiles and certifications`);

      logProgress('STEP 3', 'Creating 25 Customer Users');
      const customerUsers = [];

      for (let i = 0; i < 25; i++) {
        const customerPassword = await hashPassword(`customer${i + 1}@123`);
        const customerUser = await tx.user.create({
          data: {
            id: faker.string.uuid(),
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: customerPassword,
            role: 'CUSTOMER',
            status: 'ACTIVE',
          },
        });
        customerUsers.push(customerUser);
      }
      console.log(`   Created 25 customer users`);

      logProgress('STEP 4', 'Creating 100 Produce Items');
      const produceItems = [];

      for (let i = 0; i < 100; i++) {
        const produce = await tx.produce.create({
          data: {
            id: faker.string.uuid(),
            vendorId: vendorProfiles[i % 10].id, // Distribute across 10 vendors
            name: faker.word.noun() + ' ' + getRandomCategory(),
            description: faker.lorem.sentence(),
            price: (Math.random() * 45 + 5).toFixed(2),
            category: getRandomCategory(),
            certificationStatus:
              Math.random() > 0.3 ? 'APPROVED' : 'PENDING',
            availableQuantity: faker.number.int({ min: 10, max: 500 }),
            isActive: Math.random() > 0.1, // 90% active
          },
        });
        produceItems.push(produce);
      }
      console.log(`   Created 100 produce items across vendors`);

      logProgress('STEP 5', 'Creating 20 Rental Spaces');
      const rentalSpaces = [];

      for (let i = 0; i < 20; i++) {
        const rentalSpace = await tx.rentalSpace.create({
          data: {
            id: faker.string.uuid(),
            vendorId: vendorProfiles[i % 10].id, // Distribute across vendors
            location: faker.location.streetAddress(),
            size: faker.number.int({ min: 100, max: 5000 }) + ' sqft',
            pricePerMonth: (Math.random() * 1900 + 100).toFixed(2),
            isAvailable: Math.random() > 0.2, // 80% available
          },
        });
        rentalSpaces.push(rentalSpace);
      }
      console.log(`Created 20 rental spaces`);

      logProgress('STEP 6', 'Creating 15 Rental Bookings with Plant Tracking');
      const rentalBookings = [];

      for (let i = 0; i < 15; i++) {
        const startDate = faker.date.past({ years: 1 });
        const endDate = new Date(
          startDate.getTime() + 90 * 24 * 60 * 60 * 1000
        ); // 90 days later

        const booking = await tx.rentalBooking.create({
          data: {
            id: faker.string.uuid(),
            customerId: customerUsers[i % 25].id,
            rentalSpaceId: rentalSpaces[i % 20].id,
            startDate: startDate,
            endDate: endDate,
            status: ['PENDING', 'CONFIRMED', 'COMPLETED'][
              Math.floor(Math.random() * 3)
            ],
          },
        });
        rentalBookings.push(booking);

        // Create 1-3 plant tracking records per booking
        const plantCount = faker.number.int({ min: 1, max: 3 });
        for (let j = 0; j < plantCount; j++) {
          await tx.plantTracking.create({
            data: {
              id: faker.string.uuid(),
              rentalBookingId: booking.id,
              plantName: faker.word.noun(),
              healthStatus: ['HEALTHY', 'NEEDS_ATTENTION', 'CRITICAL'][
                Math.floor(Math.random() * 3)
              ],
              lastUpdatedAt: faker.date.recent(),
            },
          });
        }
      }
      console.log(`   Created 15 rental bookings with plant tracking`);

      logProgress('STEP 7', 'Creating 30 Orders');

      for (let i = 0; i < 30; i++) {
        const produce = produceItems[i % 100];
        const quantity = faker.number.int({ min: 1, max: 20 });
        const totalPrice = parseFloat(produce.price) * quantity;

        await tx.order.create({
          data: {
            id: faker.string.uuid(),
            customerId: customerUsers[i % 25].id,
            produceId: produce.id,
            quantity: quantity,
            totalPrice: totalPrice,
            status: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'][
              Math.floor(Math.random() * 4)
            ],
            orderDate: faker.date.past({ years: 1 }),
          },
        });
      }
      console.log(`Created 30 orders`);

      logProgress('STEP 8', 'Creating 15 Community Posts');
      const allUsers = [adminUser, ...vendorUsers, ...customerUsers];

      for (let i = 0; i < 15; i++) {
        await tx.communityPost.create({
          data: {
            id: faker.string.uuid(),
            userId: allUsers[i % allUsers.length].id,
            title: faker.lorem.sentence(),
            postContent: faker.lorem.paragraphs(2),
            postDate: faker.date.past({ years: 1 }),
          },
        });
      }
      console.log(`   Created 15 community posts`);
    });

    console.log('\n✅ Seeding completed successfully!\n');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
