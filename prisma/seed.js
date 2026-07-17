const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding NovaMart database...');

  // ─── Create Categories ──────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        description: 'Latest gadgets, smartphones, laptops and tech accessories',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Trendy clothing, shoes and accessories for all styles',
        image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=300&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home-kitchen' },
      update: {},
      create: {
        name: 'Home & Kitchen',
        slug: 'home-kitchen',
        description: 'Everything for your home, kitchen appliances and decor',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'books' },
      update: {},
      create: {
        name: 'Books',
        slug: 'books',
        description: 'Bestsellers, classics, textbooks and digital reading',
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        name: 'Sports & Fitness',
        slug: 'sports',
        description: 'Sports equipment, workout gear and outdoor adventure',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'beauty' },
      update: {},
      create: {
        name: 'Beauty',
        slug: 'beauty',
        description: 'Skincare, makeup, fragrances and personal care products',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
      },
    }),
  ]);

  const [electronics, fashion, homeKitchen, books, sports, beauty] = categories;
  console.log(`✅ Created ${categories.length} categories`);

  // ─── Create Admin User ──────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@novamart.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@novamart.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  // ─── Create Test User ───────────────────────────────────────────────────────
  const userPassword = await bcrypt.hash('user123', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      name: 'John Smith',
      email: 'user@test.com',
      passwordHash: userPassword,
      role: 'USER',
    },
  });

  // Add a saved address for the test user
  await prisma.address.upsert({
    where: { id: 'test-address-1' },
    update: {},
    create: {
      id: 'test-address-1',
      fullName: 'John Smith',
      phone: '555-0100',
      street: '123 Main Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'US',
      isDefault: true,
      userId: testUser.id,
    },
  });

  console.log(`✅ Created admin (admin@novamart.com / admin123) and test user (user@test.com / user123)`);

  // ─── Create Products ────────────────────────────────────────────────────────
  const productData = [
    // Electronics
    {
      name: 'ProMax Wireless Earbuds',
      slug: 'promax-wireless-earbuds',
      description: 'Experience crystal-clear audio with our flagship wireless earbuds. Features active noise cancellation, 30-hour battery life, and premium sound drivers. IPX5 water-resistant for workouts and outdoor use. Includes wireless charging case.',
      price: 79.99,
      comparePrice: 129.99,
      stock: 145,
      featured: true,
      rating: 4.7,
      reviewCount: 2341,
      brand: 'AudioTech',
      tags: 'wireless,earbuds,audio,bluetooth,noise-cancellation',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1590658165737-15a047b7c0b5?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'UltraSlim Laptop 15"',
      slug: 'ultraslim-laptop-15',
      description: 'Powerful performance in an ultra-thin design. Features a 12th Gen Intel Core i7 processor, 16GB RAM, 512GB NVMe SSD, and a stunning 4K OLED display. All-day battery life of up to 14 hours. Perfect for professionals and creatives.',
      price: 1299.99,
      comparePrice: 1599.99,
      stock: 38,
      featured: true,
      rating: 4.8,
      reviewCount: 876,
      brand: 'TechVision',
      tags: 'laptop,computer,ultrabook,intel,portable',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'SmartWatch Pro X',
      slug: 'smartwatch-pro-x',
      description: 'Your ultimate fitness and lifestyle companion. Tracks heart rate, sleep, blood oxygen, and over 100 workout modes. Built-in GPS, always-on display, and 7-day battery. Compatible with iOS and Android. Swim-proof design.',
      price: 249.99,
      comparePrice: 349.99,
      stock: 92,
      featured: true,
      rating: 4.6,
      reviewCount: 1523,
      brand: 'ChronoTech',
      tags: 'smartwatch,fitness,health,wearable,gps',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop',
      ],
    },
    {
      name: '4K Action Camera',
      slug: '4k-action-camera',
      description: 'Capture every adventure in stunning 4K/60fps. Features built-in image stabilization, waterproof to 30m without case, 170° wide-angle lens, and voice control. Includes mounting accessories kit. Live stream directly to social media.',
      price: 189.99,
      comparePrice: 249.99,
      stock: 67,
      featured: false,
      rating: 4.5,
      reviewCount: 934,
      brand: 'ActionPro',
      tags: 'camera,action,4k,waterproof,gopro',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Portable Bluetooth Speaker',
      slug: 'portable-bluetooth-speaker',
      description: '360° surround sound in a rugged, waterproof design. 24-hour playtime, built-in powerbank to charge your devices, and dual stereo pairing mode. Drop-proof and dustproof for any environment.',
      price: 59.99,
      comparePrice: 89.99,
      stock: 203,
      featured: false,
      rating: 4.4,
      reviewCount: 1876,
      brand: 'SoundWave',
      tags: 'speaker,bluetooth,portable,waterproof,outdoor',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Mechanical Gaming Keyboard',
      slug: 'mechanical-gaming-keyboard',
      description: 'Dominate every game with tactile Cherry MX switches, per-key RGB lighting with 16M colors, N-key rollover, and a durable aluminum frame. Programmable macros and dedicated media controls.',
      price: 129.99,
      comparePrice: 179.99,
      stock: 55,
      featured: false,
      rating: 4.7,
      reviewCount: 654,
      brand: 'HexGear',
      tags: 'keyboard,gaming,mechanical,rgb,cherry-mx',
      categoryId: electronics.id,
      images: [
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop',
      ],
    },

    // Fashion
    {
      name: 'Premium Leather Jacket',
      slug: 'premium-leather-jacket',
      description: 'Crafted from genuine full-grain leather, this timeless jacket features a classic moto design with zip closures, inside pockets, and a quilted satin lining. Ages beautifully with wear. Available in black and brown.',
      price: 249.99,
      comparePrice: 399.99,
      stock: 34,
      featured: true,
      rating: 4.8,
      reviewCount: 412,
      brand: 'UrbanLeather',
      tags: 'leather,jacket,fashion,mens,womens',
      categoryId: fashion.id,
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Classic White Sneakers',
      slug: 'classic-white-sneakers',
      description: 'Minimalist design meets maximum comfort. Premium canvas upper, cushioned memory foam insole, and durable rubber outsole. Goes with literally everything. Unisex sizing available.',
      price: 69.99,
      comparePrice: 99.99,
      stock: 180,
      featured: true,
      rating: 4.5,
      reviewCount: 2156,
      brand: 'StepStyle',
      tags: 'sneakers,shoes,casual,unisex,white',
      categoryId: fashion.id,
      images: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Slim Fit Chinos',
      slug: 'slim-fit-chinos',
      description: 'Versatile chinos that take you from office to weekend. Made from stretch-cotton blend for all-day comfort. Features a modern slim fit, hidden stretch waistband, and wrinkle-resistant fabric.',
      price: 49.99,
      comparePrice: 75.00,
      stock: 220,
      featured: false,
      rating: 4.3,
      reviewCount: 876,
      brand: 'FitCo',
      tags: 'chinos,pants,mens,slim-fit,office',
      categoryId: fashion.id,
      images: [
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Floral Summer Dress',
      slug: 'floral-summer-dress',
      description: 'Effortlessly chic floral midi dress in lightweight chiffon. Features adjustable spaghetti straps, a flutter hem, and a flattering A-line silhouette. Perfect for brunches, beach days, and garden parties.',
      price: 44.99,
      comparePrice: 69.99,
      stock: 95,
      featured: false,
      rating: 4.6,
      reviewCount: 543,
      brand: 'Bloom & Co',
      tags: 'dress,summer,floral,womens,chiffon',
      categoryId: fashion.id,
      images: [
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop',
      ],
    },

    // Home & Kitchen
    {
      name: 'Smart Air Fryer 5.8QT',
      slug: 'smart-air-fryer-5-8qt',
      description: 'Cook crispy, healthy meals with 85% less oil. Wi-Fi connected with 100+ preset recipes in the app. 5.8-quart family-size basket, 1700W rapid air circulation, and dishwasher-safe parts.',
      price: 99.99,
      comparePrice: 149.99,
      stock: 78,
      featured: true,
      rating: 4.7,
      reviewCount: 3241,
      brand: 'ChefSmart',
      tags: 'airfryer,kitchen,cooking,healthy,smart',
      categoryId: homeKitchen.id,
      images: [
        'https://images.unsplash.com/photo-1648645861456-9c8a7b0d2e7d?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Ergonomic Office Chair',
      slug: 'ergonomic-office-chair',
      description: 'Designed for all-day comfort with lumbar support, adjustable armrests, seat height, and tilt tension. Breathable mesh back promotes airflow. Supports up to 300 lbs. BIFMA certified for commercial use.',
      price: 299.99,
      comparePrice: 449.99,
      stock: 29,
      featured: true,
      rating: 4.6,
      reviewCount: 987,
      brand: 'ErgoPlus',
      tags: 'chair,office,ergonomic,desk,home-office',
      categoryId: homeKitchen.id,
      images: [
        'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Premium Coffee Maker',
      slug: 'premium-coffee-maker',
      description: 'Brew barista-quality coffee at home. 12-cup capacity, built-in grinder for freshest flavor, thermal carafe keeps coffee hot for 4 hours, programmable 24-hour timer, and strength control settings.',
      price: 149.99,
      comparePrice: 199.99,
      stock: 56,
      featured: false,
      rating: 4.8,
      reviewCount: 1432,
      brand: 'BrewMaster',
      tags: 'coffee,kitchen,appliance,espresso,brewer',
      categoryId: homeKitchen.id,
      images: [
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Luxury Bedding Set Queen',
      slug: 'luxury-bedding-set-queen',
      description: '100% Egyptian cotton 600-thread-count luxury bedding set. Includes duvet cover, 2 pillowcases, and fitted sheet. Temperature-regulating fabric keeps you cool in summer and warm in winter. Machine washable.',
      price: 89.99,
      comparePrice: 139.99,
      stock: 112,
      featured: false,
      rating: 4.7,
      reviewCount: 723,
      brand: 'DreamHome',
      tags: 'bedding,sheets,bedroom,cotton,luxury',
      categoryId: homeKitchen.id,
      images: [
        'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=600&fit=crop',
      ],
    },

    // Books
    {
      name: 'Atomic Habits',
      slug: 'atomic-habits-james-clear',
      description: 'An easy and proven way to build good habits and break bad ones. James Clear, one of the world\'s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.',
      price: 16.99,
      comparePrice: 27.99,
      stock: 500,
      featured: true,
      rating: 4.9,
      reviewCount: 87543,
      brand: 'Penguin Random House',
      tags: 'self-help,habits,productivity,bestseller,nonfiction',
      categoryId: books.id,
      images: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'The Psychology of Money',
      slug: 'psychology-of-money',
      description: 'Timeless lessons on wealth, greed, and happiness. Morgan Housel shares 19 short stories exploring the strange ways people think about money and teaches you how to make better sense of one of life\'s most important topics.',
      price: 14.99,
      comparePrice: 22.99,
      stock: 300,
      featured: false,
      rating: 4.8,
      reviewCount: 34521,
      brand: 'Harriman House',
      tags: 'finance,money,psychology,investing,bestseller',
      categoryId: books.id,
      images: [
        'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Clean Code: A Handbook',
      slug: 'clean-code-handbook',
      description: 'A Handbook of Agile Software Craftsmanship by Robert C. Martin. Learn to write clean, readable, maintainable code. Covers principles, patterns, and practices with case studies from real-world projects.',
      price: 39.99,
      comparePrice: 54.99,
      stock: 150,
      featured: false,
      rating: 4.7,
      reviewCount: 12430,
      brand: 'Prentice Hall',
      tags: 'programming,software,coding,technical,computer-science',
      categoryId: books.id,
      images: [
        'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=600&h=600&fit=crop',
      ],
    },

    // Sports
    {
      name: 'Adjustable Dumbbell Set',
      slug: 'adjustable-dumbbell-set',
      description: 'Replace 15 sets of weights with one compact pair. Adjusts from 5 to 52.5 lbs per dumbbell in 2.5 lb increments. Select weight with the turn of a dial. Space-saving design with storage trays included.',
      price: 349.99,
      comparePrice: 499.99,
      stock: 42,
      featured: true,
      rating: 4.8,
      reviewCount: 4321,
      brand: 'IronFlex',
      tags: 'dumbbells,weights,fitness,gym,strength',
      categoryId: sports.id,
      images: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Professional Yoga Mat',
      slug: 'professional-yoga-mat',
      description: 'Eco-friendly natural rubber mat with perfect grip, even during hot yoga. 6mm thick for joint support, alignment lines for correct positioning, and moisture-wicking top surface. Includes carrying strap.',
      price: 69.99,
      comparePrice: 99.99,
      stock: 198,
      featured: false,
      rating: 4.6,
      reviewCount: 3214,
      brand: 'ZenFlow',
      tags: 'yoga,mat,fitness,pilates,exercise',
      categoryId: sports.id,
      images: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Running Shoes Pro Elite',
      slug: 'running-shoes-pro-elite',
      description: 'Engineered for speed and distance. Carbon fiber plate technology, responsive foam midsole, and breathable knit upper. Outsole designed to minimize ground contact time. Used by professional marathon runners.',
      price: 159.99,
      comparePrice: 219.99,
      stock: 76,
      featured: false,
      rating: 4.7,
      reviewCount: 1876,
      brand: 'SpeedRun',
      tags: 'running,shoes,marathon,athletic,carbon',
      categoryId: sports.id,
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
      ],
    },

    // Beauty
    {
      name: 'Vitamin C Serum 20%',
      slug: 'vitamin-c-serum-20-percent',
      description: 'Brighten and even skin tone with our professional-strength Vitamin C serum. 20% L-ascorbic acid with Vitamin E and Ferulic Acid for maximum effectiveness. Reduces dark spots, boosts collagen, and protects against UV damage.',
      price: 34.99,
      comparePrice: 54.99,
      stock: 245,
      featured: true,
      rating: 4.8,
      reviewCount: 6543,
      brand: 'GlowLab',
      tags: 'serum,vitamin-c,skincare,brightening,anti-aging',
      categoryId: beauty.id,
      images: [
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Luxury Perfume - Midnight Rose',
      slug: 'luxury-perfume-midnight-rose',
      description: 'A captivating floral-oriental fragrance for women. Top notes of bergamot and pink pepper, heart of Damascus rose and jasmine, base of sandalwood and musk. Long-lasting 8-10 hour projection. 100ml Eau de Parfum.',
      price: 89.99,
      comparePrice: 129.99,
      stock: 67,
      featured: false,
      rating: 4.7,
      reviewCount: 892,
      brand: 'Parfumerie Élite',
      tags: 'perfume,fragrance,womens,floral,luxury',
      categoryId: beauty.id,
      images: [
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&h=600&fit=crop',
      ],
    },
    {
      name: 'Hydrating Face Cream SPF 30',
      slug: 'hydrating-face-cream-spf-30',
      description: 'Daily moisturizer with broad-spectrum SPF 30 protection. Non-greasy formula with hyaluronic acid for 72-hour hydration, niacinamide to minimize pores, and antioxidants to fight environmental damage. Suitable for all skin types.',
      price: 28.99,
      comparePrice: 42.99,
      stock: 312,
      featured: false,
      rating: 4.5,
      reviewCount: 2341,
      brand: 'DermaClear',
      tags: 'moisturizer,spf,sunscreen,skincare,daily',
      categoryId: beauty.id,
      images: [
        'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=600&fit=crop',
      ],
    },
  ];

  let productCount = 0;
  for (const data of productData) {
    const { images, ...productFields } = data;
    const product = await prisma.product.upsert({
      where: { slug: productFields.slug },
      update: {},
      create: {
        ...productFields,
        images: {
          create: images.map((url, index) => ({
            url,
            alt: productFields.name,
            order: index,
          })),
        },
      },
    });
    productCount++;
  }

  console.log(`✅ Created ${productCount} products`);

  // ─── Create Sample Orders ───────────────────────────────────────────────────
  const firstProduct = await prisma.product.findFirst({ where: { slug: 'promax-wireless-earbuds' } });
  const secondProduct = await prisma.product.findFirst({ where: { slug: 'smartwatch-pro-x' } });

  if (firstProduct && secondProduct) {
    const existingOrder = await prisma.order.findFirst({ where: { userId: testUser.id } });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          orderNumber: 'NM-2024-0001',
          status: 'DELIVERED',
          subtotal: 329.98,
          shippingCost: 0,
          tax: 26.40,
          total: 356.38,
          paymentStatus: 'paid',
          userId: testUser.id,
          shippingName: 'John Smith',
          shippingPhone: '555-0100',
          shippingStreet: '123 Main Street, Apt 4B',
          shippingCity: 'New York',
          shippingState: 'NY',
          shippingZip: '10001',
          shippingCountry: 'US',
          items: {
            create: [
              { quantity: 1, price: firstProduct.price, name: firstProduct.name, productId: firstProduct.id },
              { quantity: 1, price: secondProduct.price, name: secondProduct.name, productId: secondProduct.id },
            ],
          },
        },
      });

      await prisma.order.create({
        data: {
          orderNumber: 'NM-2024-0002',
          status: 'SHIPPED',
          subtotal: 79.99,
          shippingCost: 4.99,
          tax: 6.40,
          total: 91.38,
          paymentStatus: 'paid',
          userId: testUser.id,
          shippingName: 'John Smith',
          shippingPhone: '555-0100',
          shippingStreet: '123 Main Street, Apt 4B',
          shippingCity: 'New York',
          shippingState: 'NY',
          shippingZip: '10001',
          shippingCountry: 'US',
          items: {
            create: [
              { quantity: 1, price: firstProduct.price, name: firstProduct.name, productId: firstProduct.id },
            ],
          },
        },
      });

      console.log('✅ Created 2 sample orders for test user');
    }
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('─────────────────────────────────────');
  console.log('  Admin:     admin@novamart.com / admin123');
  console.log('  Test User: user@test.com / user123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
