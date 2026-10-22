#!/usr/bin/env node
/**
 * Імпорт ELEMIS: PNG з ./elemis → webp у public/assets/products/elemis
 * Файли (за зростанням IMG_*) відповідають рядкам списку з 2-ї позиції:
 *   png[0] → товар #2 (50130), … png[15] → товар #17 (89816)
 *   товар #1 (70132) — перший PNG (4588), якщо 17 фото; інакше лишаємо поточний webp.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const PNG_DIR = path.join(ROOT, "elemis");
const OUT_DIR = path.join(ROOT, "public", "assets", "products", "elemis");
const PRODUCTS_JSON = path.join(ROOT, "data", "products.json");

/** Порядок як у прайсі клієнта */
const ELEMIS_CATALOG = [
  {
    sku: "70132",
    barcode: "641629701320",
    name:
      "Гель-очисник для чутливої шкіри — Sensitive Cleansing Wash 200 мл",
    en: "Sensitive Cleansing Wash",
    size: "200 мл",
    price: 2300,
    stock: 1,
    category: "face",
  },
  {
    sku: "50130",
    barcode: "641628501304",
    name:
      "Маска для проблемної шкіри Розмарин-Лаванда — Herbal Lavender Repair Mask 75 мл",
    en: "Herbal Lavender Repair Mask",
    size: "75 мл",
    price: 2580,
    stock: 3,
    category: "face",
  },
  {
    sku: "40131",
    barcode: "641628401310",
    name:
      "Суперфуд нічний поживний крем з пребіотиками — Superfood Midnight Facial 50 мл",
    en: "Superfood Midnight Facial",
    size: "50 мл",
    price: 2970,
    stock: 3,
    category: "face",
  },
  {
    sku: "60283",
    barcode: "641629602830",
    name:
      "Бальзам для вмивання Про-Колаген з ароматом зеленого інжиру, бергамоту і малини — Pro-Collagen Fig Cleansing Balm 100 г",
    en: "Pro-Collagen Fig Cleansing Balm",
    size: "100 г",
    price: 3270,
    stock: 1,
    category: "face",
  },
  {
    sku: "60102",
    barcode: "641629601020",
    name:
      "Про-Колаген Ексфоліант для розгладження та сяяння шкіри — Pro-Collagen Glow Boost Exfoliator 100 мл",
    en: "Pro-Collagen Glow Boost Exfoliator",
    size: "100 мл",
    price: 2940,
    stock: 2,
    category: "face",
  },
  {
    sku: "60110",
    barcode: "641629601100",
    name:
      "Сонцезахисний крем-флюїд Про-Колаген SPF50 — Pro-Collagen Skin Protection Fluid SPF50 40 мл",
    en: "Pro-Collagen Skin Protection Fluid SPF50",
    size: "40 мл",
    price: 3390,
    stock: 2,
    category: "face",
  },
  {
    sku: "70147",
    barcode: "641629701470",
    name:
      "Про-Колаген крем для пружності та еластичності тіла — Pro-Collagen Marine Body Cream 200 мл",
    en: "Pro-Collagen Marine Body Cream",
    size: "200 мл",
    price: 3600,
    stock: 1,
    category: "body",
  },
  {
    sku: "50765",
    barcode: "641629507650",
    name:
      "Екзотік Сольовий пілінг для тіла Лайм-Імбир — Lime and Ginger Salt Glow 490 г",
    en: "Lime and Ginger Salt Glow",
    size: "490 г",
    price: 2970,
    stock: 1,
    category: "body",
  },
  {
    sku: "70",
    barcode: "641628000070",
    name:
      "Сольовий пілінг для тіла Франжіпані-Моної — Frangipani Monoi Salt Glow 490 г",
    en: "Frangipani Monoi Salt Glow",
    size: "490 г",
    price: 2970,
    stock: 11,
    category: "body",
  },
  {
    sku: "60818",
    barcode: "641629608180",
    name:
      "Крем для душа Франжіпані-Моної — Frangipani Monoi Shower Cream 200 мл",
    en: "Frangipani Monoi Shower Cream",
    size: "200 мл",
    price: 1980,
    stock: 3,
    category: "body",
  },
  {
    sku: "60820",
    barcode: "641629608200",
    name:
      "Крем для тіла Франжіпані-Моної — Frangipani Monoi Body Cream 200 мл",
    en: "Frangipani Monoi Body Cream",
    size: "200 мл",
    price: 1980,
    stock: 5,
    category: "body",
  },
  {
    sku: "60754",
    barcode: "641629607540",
    name: "Масло для тіла Франжіпані-Моної — Frangipani Monoi Body Oil 100 мл",
    en: "Frangipani Monoi Body Oil",
    size: "100 мл",
    price: 2880,
    stock: 2,
    category: "body",
  },
  {
    sku: "40165",
    barcode: "641628401650",
    name:
      "Антицелюлітний крем для тіла — Targeted Toning Body Moisturiser 200 мл",
    en: "Targeted Toning Body Moisturiser",
    size: "200 мл",
    price: 3960,
    stock: 2,
    category: "body",
  },
  {
    sku: "60877",
    barcode: "641629608770",
    name:
      "Антицелюлітне Детокс-масло для тіла — Cellutox Active Body Oil 100 мл",
    en: "Cellutox Active Body Oil",
    size: "100 мл",
    price: 2880,
    stock: 1,
    category: "body",
  },
  {
    sku: "60334",
    barcode: "641629603340",
    name:
      "Молочко для тіла і ванни Протеїни-Минерали — Skin Nourishing Milk Bath 400 мл",
    en: "Skin Nourishing Milk Bath",
    size: "400 мл",
    price: 2970,
    stock: 2,
    category: "body",
  },
  {
    sku: "40800",
    barcode: "641628408000",
    name:
      "Лосьйон для тіла і рук — Mayfair No.9 Hand & Body Lotion 300 мл",
    en: "Mayfair No.9 Hand & Body Lotion",
    size: "300 мл",
    price: 1890,
    stock: 2,
    category: "body",
  },
  {
    sku: "89816",
    barcode: "641629898160",
    name:
      "Дует Екзотична насолода Франжипані — Kit: Body Wonders Frangipani Duo (Shower Cream 200 мл + Body Oil 100 мл)",
    en: "Kit: Body Wonders Frangipani Duo",
    size: "набір",
    price: 3390,
    stock: 2,
    category: "body",
  },
];

function slugify(name) {
  const base = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 55);
  return `elemis-${base}`;
}

function formatPrice(n) {
  return `${n.toLocaleString("uk-UA")} ₴`;
}

function listPngs() {
  if (!fs.existsSync(PNG_DIR)) return [];
  return fs
    .readdirSync(PNG_DIR)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || "0", 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || "0", 10);
      return na - nb;
    });
}

/** png[i] → товар i (1:1 за порядком у списку). Якщо PNG менше — лише перші позиції. */
function pngIndexForProduct(productIndex, pngCount) {
  if (productIndex < 0 || productIndex >= pngCount) return -1;
  return productIndex;
}

/**
 * Повне фото без обрізки + білі поля, щоб товар не торкався країв кадру
 * (у каталозі/PDP з overflow це виглядало як «обрізане»).
 */
async function convertToWebp(srcPath, destPath) {
  const base = sharp(srcPath).rotate();
  const meta = await base.metadata();
  const w = meta.width || 1000;
  const h = meta.height || 1000;
  const pad = Math.max(32, Math.round(Math.max(w, h) * 0.12));

  await base
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .resize(2000, 2000, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    })
    .webp({ quality: 92 })
    .toFile(destPath);
}

function buildProduct(row, imagePath, existingId) {
  const id = existingId || slugify(row.name);
  const catLabel =
    row.category === "hair"
      ? "волосся"
      : row.category === "body"
        ? "тіло"
        : "обличчя";
  const priceStr = formatPrice(row.price);
  return {
    id,
    name: row.name,
    nameEn: row.name,
    sizes: row.size,
    sizeOptions: [row.size],
    price: priceStr,
    priceNum: row.price,
    compareAtPriceNum: null,
    color: row.size,
    material: "Формула ELEMIS (marine / botanical complex)",
    description: `ELEMIS: ${row.name}.`,
    longDescription: `${row.name}. Професійний британський догляд ELEMIS. Обʼєм: ${row.size}.`,
    shortDescription: `ELEMIS: ${row.en}.`,
    images: [imagePath],
    swatches: [
      {
        img: imagePath,
        label: row.size,
        hex: "#C9B59A",
      },
    ],
    inStock: row.stock > 0,
    sku: row.sku,
    category: row.category,
    isNew: true,
    isPopular: row.stock >= 3,
    isSale: false,
    characteristics: `Бренд: ELEMIS\nКатегорія: ${catLabel}\nОбʼєм: ${row.size}\nАртикул: ${row.sku}\nШтрихкод: ${row.barcode}`,
    brand: "ELEMIS",
  };
}

async function main() {
  const pngs = listPngs();
  if (!pngs.length) {
    console.error("Немає фото в ./elemis");
    process.exit(1);
  }
  await fs.promises.mkdir(OUT_DIR, { recursive: true });

  const all = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf8"));
  const existingElemis = all.filter((p) => p.brand === "ELEMIS");
  const bySku = new Map(existingElemis.map((p) => [String(p.sku), p]));

  const updatedElemis = [];

  for (let i = 0; i < ELEMIS_CATALOG.length; i++) {
    const row = ELEMIS_CATALOG[i];
    const prev = bySku.get(row.sku);
    const id = prev?.id || slugify(row.name);
    const outFile = `${id}.webp`;
    const outPath = path.join(OUT_DIR, outFile);
    const bust = Date.now().toString(36);
    const imagePath = `/assets/products/elemis/${outFile}?v=${bust}`;

    const pngIdx = pngIndexForProduct(i, pngs.length);
    let finalImage = prev?.images?.[0] || imagePath;

    if (pngIdx >= 0 && pngs[pngIdx]) {
      const pngPath = path.join(PNG_DIR, pngs[pngIdx]);
      if (fs.existsSync(pngPath)) {
        await convertToWebp(pngPath, outPath);
        finalImage = imagePath;
        console.log(
          `[${i + 1}/${ELEMIS_CATALOG.length}] ${row.sku} ← ${pngs[pngIdx]}`
        );
      } else {
        console.warn(`Skip image ${row.sku}: no png`);
      }
    } else {
      console.log(`[${i + 1}/${ELEMIS_CATALOG.length}] ${row.sku} — фото без змін`);
    }

    updatedElemis.push(buildProduct(row, finalImage, id));
  }

  const nonElemis = all.filter((p) => p.brand !== "ELEMIS");
  const merged = [...nonElemis, ...updatedElemis];
  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Оновлено ${updatedElemis.length} товарів ELEMIS у data/products.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
