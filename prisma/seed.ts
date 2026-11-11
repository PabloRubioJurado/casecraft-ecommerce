import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PRODUCTS_DATA = [
  // 1. CLEAR MINIMALIST
  { name: 'PureClear Ultra-Slim Case', category: 'Clear Minimalist', price: 14.99, stock: 35, description: 'Ultra-thin, crystal-clear profile with anti-yellowing tech designed to highlight your phone original color.' },
  { name: 'AirGrip Matte Clear Cover', category: 'Clear Minimalist', price: 16.49, stock: 34, description: 'Frosted translucent finish that repels fingerprints while providing lightweight everyday scratch protection.' },
  { name: 'CrystalFlex Soft TPU Shell', category: 'Clear Minimalist', price: 17.99, stock: 33, description: 'Flexible shock-absorbing TPU bumper engineered with micro-dot texture to prevent internal moisture watermarks.' },
  { name: 'InvisibleShield Hard Back Cover', category: 'Clear Minimalist', price: 19.49, stock: 32, description: 'Scratch-resistant polycarbonate back plate combined with cushioned corners for discreet drop defense.' },
  { name: 'ZeroTone Anti-Yellowing Clear Case', category: 'Clear Minimalist', price: 20.99, stock: 31, description: 'Advanced UV-resistant resin compound ensures your clear case stays transparent month after month.' },
  { name: 'SlimFit Featherlight Transparent Shell', category: 'Clear Minimalist', price: 22.49, stock: 30, description: 'Barely-there design adding under 1mm of thickness, offering precise tactile button responses.' },
  { name: 'LucidArmor Reinforced Edge Cover', category: 'Clear Minimalist', price: 23.99, stock: 29, description: 'Optical-grade clear panel paired with subtle corner air cushions for minimal yet effective protection.' },
  { name: 'PrismPure Glossy Transparent Case', category: 'Clear Minimalist', price: 25.49, stock: 28, description: 'High-gloss acrylic coating that provides extra grip and resists keys and daily pocket abrasion.' },
  { name: 'AirLite Precision Clear Bumper', category: 'Clear Minimalist', price: 26.99, stock: 27, description: 'Minimalist edge protection featuring raised bezels to keep screen and camera lenses off flat surfaces.' },
  { name: 'GlassBack Hybrid Clear Case', category: 'Clear Minimalist', price: 28.49, stock: 26, description: 'Tempered glass back panel offering maximum clarity and zero scratching, surrounded by flexible TPU borders.' },

  // 2. MAGSAFE COMPATIBLE
  { name: 'MagSync Magnetic Clear Case', category: 'MagSafe Compatible', price: 19.99, stock: 30, description: 'Integrated N52 magnetic ring aligned for high-speed wireless charging and instant snap-on mounting.' },
  { name: 'SnapCharge Matte Hybrid Cover', category: 'MagSafe Compatible', price: 21.99, stock: 29, description: 'Smooth matte back with a flush magnetic array compatible with all MagSafe wallets, power banks, and stands.' },
  { name: 'OrbitMag Soft-Touch Silicone Case', category: 'MagSafe Compatible', price: 23.99, stock: 28, description: 'Silky liquid silicone exterior with strong internal magnets and soft microfiber lining to protect against scratches.' },
  { name: 'FluxLock Translucent Magnetic Shell', category: 'MagSafe Compatible', price: 25.99, stock: 27, description: 'Semi-transparent frosted back with a color-accented magnetic ring for seamless magnetic accessory lock.' },
  { name: 'MagCore Armor Hybrid Cover', category: 'MagSafe Compatible', price: 27.99, stock: 26, description: 'Dual-layer protective shell enhanced with ultra-strong magnetic coil for zero-slip car mount attachment.' },
  { name: 'PulseSnap Slim Magnetic Bumper', category: 'MagSafe Compatible', price: 29.99, stock: 25, description: 'Slimline magnetic case with tactical textured side grips to prevent accidental slips while charging on the go.' },
  { name: 'MagShield Clear Tough Case', category: 'MagSafe Compatible', price: 31.99, stock: 24, description: 'Heavy-duty clear casing with reinforced magnetic core delivering 15W peak wireless charging alignment.' },
  { name: 'AeroMag Carbon Fiber Edition', category: 'MagSafe Compatible', price: 33.99, stock: 23, description: 'Real aramid fiber weave overlay featuring embedded MagSafe magnets for ultra-lightweight strength.' },
  { name: 'VeloxMag Ultra-Lock Cover', category: 'MagSafe Compatible', price: 35.99, stock: 22, description: 'Heavy magnetic pull force engineered specifically for high-vibration motorcycle and bicycle mounts.' },
  { name: 'MagVault Pro Magnetic Case', category: 'MagSafe Compatible', price: 37.99, stock: 21, description: 'Premium hybrid construction featuring built-in pop-out magnetic kickstand for hands-free video viewing.' },

  // 3. ECO-FRIENDLY BIODEGRADABLE
  { name: 'BioGrain Plant-Based Case', category: 'Eco-Friendly Biodegradable', price: 27.99, stock: 20, description: '100% compostable case made from wheat straw biomass, leaving zero toxic microplastics behind.' },
  { name: 'TerraEarth Eco Shield', category: 'Eco-Friendly Biodegradable', price: 30.49, stock: 19, description: 'Natural speckled earth texture built from upcycled plant starch, offering eco-conscious drop protection.' },
  { name: 'OceanRenew Recycled Marine Cover', category: 'Eco-Friendly Biodegradable', price: 32.99, stock: 18, description: 'Molded from recycled ocean plastic and bio-polymers to help clean marine ecosystems.' },
  { name: 'FloraFlex Compostable Shell', category: 'Eco-Friendly Biodegradable', price: 35.49, stock: 17, description: 'Soft-touch bio-case engineered to degrade completely in industrial composting facilities within 180 days.' },
  { name: 'BambooCore Organic Case', category: 'Eco-Friendly Biodegradable', price: 37.99, stock: 16, description: 'Infused with natural bamboo fibers for enhanced tensile strength and a unique organic tactile feel.' },
  { name: 'GreenArmor Plant-Polymer Cover', category: 'Eco-Friendly Biodegradable', price: 40.49, stock: 15, description: 'Sturdy eco-composite design providing 6-foot shock resistance while reducing your carbon footprint.' },
  { name: 'EcoWeave Bio-Texture Case', category: 'Eco-Friendly Biodegradable', price: 42.99, stock: 14, description: 'Ergonomic woven pattern made from non-toxic flax seeds, offering non-slip grip and zero synthetic dyes.' },
  { name: 'VerdantShield Biodegradable Bumper', category: 'Eco-Friendly Biodegradable', price: 45.49, stock: 13, description: 'Fully plant-derived shock-absorption inner ribbing combined with a smooth earth-toned exterior.' },
  { name: 'PureLeaf Organic Slim Case', category: 'Eco-Friendly Biodegradable', price: 47.99, stock: 12, description: 'Minimalist bio-friendly profile packaged in 100% recycled unbleached paper with soy-based ink printing.' },
  { name: 'BioTerra Executive Eco Cover', category: 'Eco-Friendly Biodegradable', price: 50.49, stock: 11, description: 'Premium natural finish crafted from hemp composites for eco-conscious professionals seeking durability.' },

  // 4. ULTRA-IMPACT RUGGED
  { name: 'TitanArmor Extreme Drop Case', category: 'Ultra-Impact Rugged', price: 34.99, stock: 15, description: 'Military-grade triple-layer protection certified to survive extreme 12-foot drops onto concrete.' },
  { name: 'IronClad Heavy-Duty Shell', category: 'Ultra-Impact Rugged', price: 37.99, stock: 14, description: 'Reinforced polycarbonate exoskeleton with interior air-cushion geometry for maximum shock dispersion.' },
  { name: 'DefenderX Tactical Rugged Case', category: 'Ultra-Impact Rugged', price: 40.99, stock: 13, description: 'Rugged rubberized side grips, dust-proof port covers, and raised armor corners for tough environments.' },
  { name: 'BunkerShield 360 Full Body Protection', category: 'Ultra-Impact Rugged', price: 43.99, stock: 12, description: 'Complete front-to-back coverage including a built-in screen protector frame and heavy-duty locking clips.' },
  { name: 'KevlarTough Armor Cover', category: 'Ultra-Impact Rugged', price: 46.99, stock: 11, description: 'Constructed with genuine Kevlar fibers to resist punctures, high impacts, and harsh abrasion.' },
  { name: 'ShockForce Rugged Holster Case', category: 'Ultra-Impact Rugged', price: 49.99, stock: 10, description: 'Includes a detachable 360-degree rotating belt clip holster that doubles as a sturdy kickstand.' },
  { name: 'MagmaTough Industrial Shield', category: 'Ultra-Impact Rugged', price: 52.99, stock: 9, description: 'Dual-injection TPU armor with deep tread patterns designed for active outdoor and job-site use.' },
  { name: 'ApexGuard Extreme Survivor Edition', category: 'Ultra-Impact Rugged', price: 55.99, stock: 8, description: 'Tested against extreme thermal shock, vibration, and repeated high-velocity drops.' },
  { name: 'VortexArmor Heavy-Duty Bumper', category: 'Ultra-Impact Rugged', price: 58.99, stock: 7, description: 'Thick perimeter bumper system engineered with kinetic energy dissipation zones.' },
  { name: 'FortressPro Ultimate Rugged Case', category: 'Ultra-Impact Rugged', price: 61.99, stock: 6, description: 'Ultra-rugged case featuring an integrated camera shield cover and multi-angle zinc alloy kickstand.' },

  // 5. LEATHER WALLET CASES
  { name: 'Heritage Genuine Leather Folio', category: 'Leather Wallet Cases', price: 59.99, stock: 5, description: 'Handcrafted top-grain cowhide leather that develops a rich, unique patina over time. Includes 3 card slots.' },
  { name: 'Executive Leather Wallet Case', category: 'Leather Wallet Cases', price: 64.99, stock: 5, description: 'Sleek executive folio featuring RFID-blocking technology to protect your credit card data.' },
  { name: 'SaddleCraft Premium Leather Cover', category: 'Leather Wallet Cases', price: 69.99, stock: 4, description: 'Full-grain saddle leather with hand-stitched detailing, cash pocket, and magnetic latch closure.' },
  { name: 'VintageStitch Leather Book Cover', category: 'Leather Wallet Cases', price: 74.99, stock: 4, description: 'Classic book-bound styling made from Italian distressed leather with horizontal viewing stand functionality.' },
  { name: 'RoyalNappa Detachable Wallet Case', category: 'Leather Wallet Cases', price: 79.99, stock: 4, description: 'Ultra-soft Nappa leather 2-in-1 design: magnetic inner shell detaches effortlessly from the outer wallet.' },
  { name: 'ArtisanGrain Slim Leather Wallet', category: 'Leather Wallet Cases', price: 84.99, stock: 3, description: 'Slimline real leather wallet case maintaining a thin profile while carrying essential ID and credit cards.' },
  { name: 'Monarch Executive RFID Leather Folio', category: 'Leather Wallet Cases', price: 89.99, stock: 3, description: 'Luxurious pebbled leather exterior paired with a micro-suede interior lining for ultimate screen care.' },
  { name: 'TuscanCraft Handcrafted Leather Suite', category: 'Leather Wallet Cases', price: 94.99, stock: 3, description: 'Imported Florentine leather, hand-dyed and finished with custom brass accent hardware.' },
  { name: 'Prestige Edition Leather Wallet', category: 'Leather Wallet Cases', price: 99.99, stock: 2, description: 'Limited production run of hand-selected calfskin leather with integrated MagSafe magnetic alignment.' },
  { name: 'Bespoke Sovereign Leather Portfolio', category: 'Leather Wallet Cases', price: 104.99, stock: 2, description: 'Flagship luxury leather case with dedicated coin pocket, cash sleeve, 5 card slots, and gift box packaging.' }
];

async function main() {
  console.log('Clearing existing data...');
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log('Seeding categories and products...');

  const categoryNames = Array.from(new Set(PRODUCTS_DATA.map((p) => p.category)));
  const categoryMap: Record<string, string> = {};

  for (const catName of categoryNames) {
    const createdCat = await prisma.category.create({
      data: { name: catName },
    });
    categoryMap[catName] = createdCat.id;
  }

  for (const item of PRODUCTS_DATA) {
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        stock: item.stock,
        image: '/placeholder.png',
        categoryId: categoryMap[item.category],
      },
    });
  }

  console.log('Seed completed successfully! 50 products loaded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });