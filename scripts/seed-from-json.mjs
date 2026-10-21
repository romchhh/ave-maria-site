#!/usr/bin/env node
/**
 * npm run db:seed
 *
 * Наповнює Postgres каталогом Ave Maria з data/products.json
 * (+ категорії Волосся / Обличчя / Тіло, демо-замовлення з data/orders.json).
 *
 * Перед цим: npm run migrate
 * Або одразу: npm run db:setup
 */
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (.env.local)");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

function readJson(rel, fallback) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function seedCategories(client) {
  await client.query(`
    UPDATE categories
    SET is_visible = FALSE, updated_at = NOW()
    WHERE id IN (
      'dresses', 'bottoms', 'outerwear', 'tops', 'accessories',
      'perfumes', 'home', 'sale'
    )
  `);
  await client.query(`
    INSERT INTO categories (
      id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_system, is_visible
    ) VALUES
      ('all', '/assets/categories/pop-all-v4.webp', 'Усі товари', 'All', 'До категорії', 'Shop now', 'collection', 0, TRUE, TRUE),
      ('new', '/assets/categories/pop-new-v4.webp', 'Новинки', 'New in', 'До категорії', 'Shop now', 'collection', 1, TRUE, TRUE),
      ('hair', '/assets/categories/pop-hair-v4.webp', 'Волосся', 'Hair', 'До категорії', 'Shop now', 'category', 2, FALSE, TRUE),
      ('face', '/assets/categories/pop-face-v4.webp', 'Обличчя', 'Face', 'До категорії', 'Shop now', 'category', 3, FALSE, TRUE),
      ('body', '/assets/categories/pop-body-v4.webp', 'Тіло', 'Body', 'До категорії', 'Shop now', 'category', 4, FALSE, TRUE)
    ON CONFLICT (id) DO UPDATE SET
      image = EXCLUDED.image,
      label_uk = EXCLUDED.label_uk,
      label_en = EXCLUDED.label_en,
      cta_uk = EXCLUDED.cta_uk,
      cta_en = EXCLUDED.cta_en,
      kind = EXCLUDED.kind,
      sort_order = EXCLUDED.sort_order,
      is_visible = EXCLUDED.is_visible,
      updated_at = NOW()
  `);
}

async function seedProducts(client, products) {
  await client.query(`DELETE FROM products`);
  let i = 0;
  for (const product of products) {
    await client.query(
      `
      INSERT INTO products (
        slug, name, sizes_display, price_num, price_label,
        color, material, description, long_description, short_description,
        model_params, in_stock, sku, category, is_new, sort_order,
        compare_at_price_num, is_popular, is_sale
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,
        $17,$18,$19
      )
      `,
      [
        product.id,
        product.name,
        product.sizes || (product.sizeOptions || []).join(" · "),
        product.priceNum,
        product.price,
        product.color || "",
        product.material || "",
        product.description || "",
        product.longDescription || "",
        product.shortDescription ?? null,
        product.characteristics || product.modelParams || "",
        product.inStock !== false,
        String(product.sku ?? product.id),
        product.category ?? null,
        Boolean(product.isNew),
        i++,
        product.compareAtPriceNum ?? null,
        Boolean(product.isPopular),
        Boolean(product.isSale),
      ]
    );

    const sizes = product.sizeOptions || [];
    for (let s = 0; s < sizes.length; s++) {
      await client.query(
        `INSERT INTO product_size_options (product_slug, size, sort_order) VALUES ($1,$2,$3)`,
        [product.id, sizes[s], s]
      );
    }

    const images = product.images || [];
    for (let img = 0; img < images.length; img++) {
      await client.query(
        `INSERT INTO product_images (product_slug, url, sort_order) VALUES ($1,$2,$3)`,
        [product.id, images[img], img]
      );
    }

    const swatches = product.swatches || [];
    for (let sw = 0; sw < swatches.length; sw++) {
      await client.query(
        `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          product.id,
          swatches[sw].img,
          swatches[sw].label,
          swatches[sw].hex ?? null,
          sw,
        ]
      );
    }
  }
}

async function seedOrders(client, orders) {
  await client.query(`DELETE FROM orders`);
  for (const order of orders) {
    await client.query(
      `
      INSERT INTO orders (
        id, created_at, status, customer_name, phone, email,
        delivery_method, city, address, comment, locale, total, notified
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,$13
      )
      `,
      [
        order.id,
        order.createdAt || new Date().toISOString(),
        order.status || "new",
        order.customerName,
        order.phone,
        order.email ?? null,
        order.deliveryMethod,
        order.city,
        order.address,
        order.comment ?? null,
        order.locale || "uk",
        order.total ?? 0,
        Boolean(order.notified),
      ]
    );

    for (const item of order.items || []) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, size, quantity, price_num)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          order.id,
          item.productId,
          item.name,
          item.size,
          item.quantity,
          item.priceNum,
        ]
      );
    }
  }
}

async function main() {
  const products = readJson("data/products.json", []);
  const orders = readJson("data/orders.json", []);

  if (!products.length) {
    console.error("data/products.json порожній або відсутній");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await seedCategories(client);
    await seedProducts(client, products);
    await seedOrders(client, orders);
    await client.query("COMMIT");
    console.log(
      `OK: категорії + ${products.length} товарів` +
        (orders.length ? ` + ${orders.length} замовлень` : "")
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
