import { revalidatePath, revalidateTag } from "next/cache";
import {
  getPool,
  isMissingRelationError,
  query,
  withTransaction,
} from "@/lib/db";
import { stripMediaQuery } from "@/lib/mediaUrl";
import {
  parseProductDetails,
  serializeProductDetails,
} from "@/lib/productDetails";
import type {
  CheckoutPayload,
  DeliveryMethod,
  PaymentStatus,
  PaymentType,
  Product,
  ProductMedia,
  ProductSwatch,
} from "@/lib/types";

function mapDetailFields(raw: string | null | undefined): Partial<Product> {
  if (!raw) return {};
  const details = parseProductDetails(raw);
  const out: Partial<Product> = { modelParams: raw };
  if (details.characteristics) out.characteristics = details.characteristics;
  if (details.notes) out.notes = details.notes;
  if (details.activeIngredients) {
    out.activeIngredients = details.activeIngredients;
  } else if (details.characteristics) {
    out.activeIngredients = details.characteristics;
  } else if (!raw.trim().startsWith("{")) {
    out.characteristics = raw;
    out.activeIngredients = raw;
  }
  if (details.usage) out.usage = details.usage;
  return out;
}

export type StoredOrder = {
  id: string;
  createdAt: string;
  status: "new" | "processing" | "done" | "cancelled";
  customerName: string;
  phone: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  city: string;
  address: string;
  comment?: string;
  locale: string;
  items: CheckoutPayload["items"];
  total: number;
  notified?: boolean;
  paymentType?: PaymentType;
  paymentStatus?: PaymentStatus;
  invoiceId?: string;
  paymentReference?: string;
  amountPaid?: number | null;
};

type ProductRow = {
  slug: string;
  name: string;
  name_en: string | null;
  sizes_display: string;
  price_num: string | number;
  price_label: string;
  price_eur: string | number | null;
  compare_at_price_num: string | number | null;
  color: string;
  color_hex: string | null;
  material: string;
  description: string;
  description_en: string | null;
  long_description: string;
  long_description_en: string | null;
  short_description: string | null;
  photo_size: string | null;
  model_params: string | null;
  in_stock: boolean;
  is_visible: boolean;
  sku: string;
  category: string | null;
  is_new: boolean;
  is_popular: boolean;
  is_sale: boolean;
  color_group: string | null;
  look_ids: string[] | null;
  size_options: string[] | null;
  media: Array<{
    url: string;
    media_type?: string;
    width?: number | null;
    height?: number | null;
  }> | null;
  swatches: Array<{ img: string; label: string; hex?: string | null }> | null;
};

function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function extractBrand(
  slug: string,
  modelParams: string | null | undefined
): string | undefined {
  const fromParams = modelParams?.match(/Бренд:\s*([^\n\r]+)/i);
  if (fromParams?.[1]) {
    const label = fromParams[1].trim();
    if (label) return label;
  }
  const id = slug.toLowerCase();
  if (id.startsWith("zola")) return "ZOLA";
  if (id.startsWith("elemis")) return "ELEMIS";
  if (id.startsWith("hadat")) return "HADAT";
  return undefined;
}

function mapProduct(row: ProductRow): Product {
  const sizeOptions = Array.isArray(row.size_options)
    ? row.size_options.filter(Boolean)
    : [];

  const media: ProductMedia[] = Array.isArray(row.media)
    ? row.media
        .filter((m) => m?.url)
        .map((m) => ({
          url: m.url,
          type: m.media_type === "video" ? "video" : "image",
          ...(m.width != null ? { width: Number(m.width) } : {}),
          ...(m.height != null ? { height: Number(m.height) } : {}),
        }))
    : [];

  const imageUrls = media.filter((m) => m.type === "image").map((m) => m.url);
  const images =
    imageUrls.length > 0 ? imageUrls : media.map((m) => m.url);

  const swatches: ProductSwatch[] = Array.isArray(row.swatches)
    ? row.swatches.map((s) => ({
        img: s.img,
        label: s.label,
        ...(s.hex ? { hex: s.hex } : {}),
      }))
    : [];

  const lookProductIds = Array.isArray(row.look_ids)
    ? row.look_ids.filter(Boolean)
    : [];

  const priceEur = row.price_eur != null ? num(row.price_eur) : null;
  const compareAt =
    row.compare_at_price_num != null ? num(row.compare_at_price_num) : null;
  const brand = extractBrand(row.slug, row.model_params);

  return {
    id: row.slug,
    name: row.name,
    ...(row.name_en ? { nameEn: row.name_en } : {}),
    sizes: row.sizes_display || sizeOptions.join(" · "),
    sizeOptions,
    price: row.price_label,
    priceNum: num(row.price_num),
    ...(priceEur != null && priceEur > 0 ? { priceEur } : {}),
    ...(compareAt != null && compareAt > 0 ? { compareAtPriceNum: compareAt } : {}),
    color: row.color || "",
    ...(row.color_hex ? { colorHex: row.color_hex } : {}),
    material: row.material || "",
    description: row.description || "",
    ...(row.description_en ? { descriptionEn: row.description_en } : {}),
    longDescription: row.long_description || "",
    ...(row.long_description_en
      ? { longDescriptionEn: row.long_description_en }
      : {}),
    ...(row.short_description
      ? { shortDescription: row.short_description }
      : {}),
    ...mapDetailFields(row.model_params),
    ...(row.photo_size ? { photoSize: row.photo_size } : {}),
    images,
    media,
    swatches,
    inStock: Boolean(row.in_stock),
    isVisible: row.is_visible !== false,
    sku: row.sku,
    ...(row.category ? { category: row.category } : {}),
    ...(brand ? { brand } : {}),
    ...(row.is_new ? { isNew: true } : {}),
    ...(row.is_popular ? { isPopular: true } : {}),
    ...(row.is_sale ? { isSale: true } : {}),
    colorGroup: row.color_group || null,
    ...(lookProductIds.length ? { lookProductIds } : {}),
  };
}

const PRODUCT_SELECT = `
  SELECT
    p.slug,
    p.name,
    p.name_en,
    p.sizes_display,
    p.price_num,
    p.price_label,
    p.price_eur,
    p.compare_at_price_num,
    p.color,
    p.color_hex,
    p.material,
    p.description,
    p.description_en,
    p.long_description,
    p.long_description_en,
    p.short_description,
    p.photo_size,
    p.model_params,
    p.in_stock,
    COALESCE((to_jsonb(p)->>'is_visible')::boolean, TRUE) AS is_visible,
    p.sku,
    p.category,
    p.is_new,
    p.is_popular,
    p.is_sale,
    p.color_group,
    COALESCE(
      (
        SELECT array_agg(l.related_slug ORDER BY l.sort_order, l.related_slug)
        FROM product_look_items l
        WHERE l.product_slug = p.slug
      ),
      '{}'::text[]
    ) AS look_ids,
    COALESCE(
      (
        SELECT array_agg(s.size ORDER BY s.sort_order, s.size)
        FROM product_size_options s
        WHERE s.product_slug = p.slug
      ),
      '{}'::text[]
    ) AS size_options,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'url', i.url,
            'media_type', i.media_type,
            'width', i.width,
            'height', i.height
          )
          ORDER BY i.sort_order, i.id
        )
        FROM product_images i
        WHERE i.product_slug = p.slug
      ),
      '[]'::json
    ) AS media,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'img', sw.img,
            'label', sw.label,
            'hex', sw.hex
          )
          ORDER BY sw.sort_order, sw.id
        )
        FROM product_swatches sw
        WHERE sw.product_slug = p.slug
      ),
      '[]'::json
    ) AS swatches
  FROM products p
`;

function bustProductCache(slug?: string) {
  try {
    revalidateTag("products");
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/uk");
    revalidatePath("/catalog");
    revalidatePath("/catalog");
    revalidatePath("/product", "layout");
    if (slug) revalidatePath(`/product/${slug}`, "page");
    revalidatePath("/api/products");
  } catch (err) {
    // Outside Next request context (scripts / migrate) revalidate* can throw
    console.warn("[bustProductCache]", err);
  }
}

/** Auto-heal prod DBs that deployed code before migrate ran. */
let ensureIsVisiblePromise: Promise<void> | null = null;

async function ensureProductIsVisibleColumn(): Promise<void> {
  if (!ensureIsVisiblePromise) {
    ensureIsVisiblePromise = (async () => {
      try {
        await query(`
          ALTER TABLE products
            ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE
        `);
      } catch (error) {
        ensureIsVisiblePromise = null;
        if (isMissingRelationError(error)) return;
        console.warn("[ensureProductIsVisibleColumn]", error);
      }
    })();
  }
  await ensureIsVisiblePromise;
}

export async function sqlGetAllProducts(): Promise<Product[]> {
  try {
    await ensureProductIsVisibleColumn();
    const rows = await query<ProductRow>(
      `${PRODUCT_SELECT} ORDER BY p.sort_order ASC, p.created_at DESC, p.slug ASC`
    );
    return rows.map(mapProduct);
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        "[sqlGetAllProducts] table missing — run `npm run db:setup` before production."
      );
      return [];
    }
    throw error;
  }
}

type AdminListRow = {
  slug: string;
  name: string;
  price_num: string | number;
  price_label: string;
  category: string | null;
  in_stock: boolean;
  is_visible: boolean;
  is_new: boolean;
  is_popular: boolean;
  is_sale: boolean;
  thumb: string | null;
};

/**
 * Lean catalog for admin table / pickers — avoids heavy media/swatch aggregates
 * that can fail or time out on cold DB connections.
 */
export async function sqlListProductsAdmin(): Promise<Product[]> {
  try {
    await ensureProductIsVisibleColumn();
    const rows = await query<AdminListRow>(
      `
      SELECT
        p.slug,
        p.name,
        p.price_num,
        p.price_label,
        p.category,
        p.in_stock,
        COALESCE((to_jsonb(p)->>'is_visible')::boolean, TRUE) AS is_visible,
        p.is_new,
        p.is_popular,
        p.is_sale,
        (
          SELECT i.url
          FROM product_images i
          WHERE i.product_slug = p.slug
          ORDER BY i.sort_order ASC, i.id ASC
          LIMIT 1
        ) AS thumb
      FROM products p
      ORDER BY p.sort_order ASC, p.created_at DESC, p.slug ASC
      `
    );
    return rows.map((row) => {
      const thumb = row.thumb ? stripMediaQuery(row.thumb) : "";
      return {
        id: row.slug,
        name: row.name,
        sizes: "",
        sizeOptions: [],
        price: row.price_label,
        priceNum: num(row.price_num),
        color: "",
        material: "",
        description: "",
        longDescription: "",
        images: thumb ? [thumb] : [],
        swatches: [],
        inStock: Boolean(row.in_stock),
        isVisible: row.is_visible !== false,
        sku: row.slug,
        ...(row.category ? { category: row.category } : {}),
        ...(row.is_new ? { isNew: true } : {}),
        ...(row.is_popular ? { isPopular: true } : {}),
        ...(row.is_sale ? { isSale: true } : {}),
      } satisfies Product;
    });
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        "[sqlListProductsAdmin] table missing — run `npm run db:setup` before production."
      );
      return [];
    }
    throw error;
  }
}

/** Quick flags update from admin list (stock / catalog visibility). */
export async function sqlPatchProductFlags(
  slug: string,
  patch: { inStock?: boolean; isVisible?: boolean }
): Promise<Product | null> {
  await ensureProductIsVisibleColumn();
  const sets: string[] = ["updated_at = NOW()"];
  const params: unknown[] = [];
  let i = 1;

  if (patch.inStock !== undefined) {
    sets.push(`in_stock = $${i++}`);
    params.push(Boolean(patch.inStock));
  }
  if (patch.isVisible !== undefined) {
    sets.push(`is_visible = $${i++}`);
    params.push(Boolean(patch.isVisible));
  }
  if (params.length === 0) {
    return sqlGetProduct(slug);
  }

  params.push(slug);
  const result = await query(
    `UPDATE products SET ${sets.join(", ")} WHERE slug = $${i} RETURNING slug`,
    params
  );
  if (!result.length) return null;
  bustProductCache(slug);
  return sqlGetProduct(slug);
}

export async function sqlGetProduct(slug: string): Promise<Product | null> {
  await ensureProductIsVisibleColumn();
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} WHERE p.slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ? mapProduct(rows[0]) : null;
}

async function replaceProductChildren(
  client: import("pg").PoolClient,
  product: Product
) {
  await client.query(`DELETE FROM product_size_options WHERE product_slug = $1`, [
    product.id,
  ]);
  await client.query(`DELETE FROM product_images WHERE product_slug = $1`, [
    product.id,
  ]);
  await client.query(`DELETE FROM product_swatches WHERE product_slug = $1`, [
    product.id,
  ]);

  for (let i = 0; i < product.sizeOptions.length; i++) {
    await client.query(
      `INSERT INTO product_size_options (product_slug, size, sort_order)
       VALUES ($1, $2, $3)`,
      [product.id, product.sizeOptions[i], i]
    );
  }

  const mediaList: ProductMedia[] =
    product.media?.length
      ? product.media
      : product.images.map((url) => ({ url, type: "image" as const }));

  for (let i = 0; i < mediaList.length; i++) {
    const m = mediaList[i];
    await client.query(
      `INSERT INTO product_images (product_slug, url, sort_order, media_type, width, height)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        product.id,
        stripMediaQuery(m.url),
        i,
        m.type === "video" ? "video" : "image",
        m.width ?? null,
        m.height ?? null,
      ]
    );
  }

  for (let i = 0; i < product.swatches.length; i++) {
    const sw = product.swatches[i];
    await client.query(
      `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [product.id, sw.img, sw.label, sw.hex ?? null, i]
    );
  }
}

export async function sqlUpsertProduct(product: Product): Promise<Product> {
  await ensureProductIsVisibleColumn();
  await withTransaction(async (client) => {
    await client.query(
      `
      INSERT INTO products (
        slug, name, name_en, sizes_display, price_num, price_label,
        price_eur, compare_at_price_num,
        color, color_hex, material,
        description, description_en, long_description, long_description_en,
        short_description, photo_size, model_params,
        in_stock, is_visible, sku, category, is_new, is_popular, is_sale, color_group, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,
        $9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26, NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        sizes_display = EXCLUDED.sizes_display,
        price_num = EXCLUDED.price_num,
        price_label = EXCLUDED.price_label,
        price_eur = EXCLUDED.price_eur,
        compare_at_price_num = EXCLUDED.compare_at_price_num,
        color = EXCLUDED.color,
        color_hex = EXCLUDED.color_hex,
        material = EXCLUDED.material,
        description = EXCLUDED.description,
        description_en = EXCLUDED.description_en,
        long_description = EXCLUDED.long_description,
        long_description_en = EXCLUDED.long_description_en,
        short_description = EXCLUDED.short_description,
        photo_size = EXCLUDED.photo_size,
        model_params = EXCLUDED.model_params,
        in_stock = EXCLUDED.in_stock,
        is_visible = EXCLUDED.is_visible,
        sku = EXCLUDED.sku,
        category = EXCLUDED.category,
        is_new = EXCLUDED.is_new,
        is_popular = EXCLUDED.is_popular,
        is_sale = EXCLUDED.is_sale,
        color_group = EXCLUDED.color_group,
        updated_at = NOW()
      `,
      [
        product.id,
        product.name,
        product.nameEn || "",
        product.sizes || product.sizeOptions.join(" · "),
        product.priceNum,
        product.price,
        product.priceEur ?? null,
        product.compareAtPriceNum ?? null,
        product.color || "",
        product.colorHex || "",
        product.material || "",
        product.description || "",
        product.descriptionEn || "",
        product.longDescription || "",
        product.longDescriptionEn || "",
        product.shortDescription ?? null,
        product.photoSize || "",
        serializeProductDetails({
          characteristics: product.characteristics,
          notes: product.notes,
          activeIngredients: product.activeIngredients,
          usage: product.usage,
        }) ||
          product.modelParams ||
          "",
        product.inStock,
        product.isVisible !== false,
        String(product.sku ?? product.id),
        product.category ?? null,
        Boolean(product.isNew),
        Boolean(product.isPopular),
        Boolean(product.isSale),
        product.colorGroup ?? null,
      ]
    );

    await replaceProductChildren(client, product);

    if (product.lookProductIds) {
      await client.query(
        `DELETE FROM product_look_items WHERE product_slug = $1`,
        [product.id]
      );
      for (let i = 0; i < product.lookProductIds.length; i++) {
        const related = product.lookProductIds[i];
        if (!related || related === product.id) continue;
        await client.query(
          `INSERT INTO product_look_items (product_slug, related_slug, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [product.id, related, i]
        );
      }
    }
  });

  bustProductCache(product.id);
  return product;
}

export async function sqlDeleteProduct(slug: string): Promise<boolean> {
  const result = await getPool().query(
    `DELETE FROM products WHERE slug = $1`,
    [slug]
  );
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) bustProductCache(slug);
  return deleted;
}

export async function sqlReplaceAllProducts(products: Product[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM products`);
    for (let index = 0; index < products.length; index++) {
      const product = products[index];
      await client.query(
        `
        INSERT INTO products (
          slug, name, sizes_display, price_num, price_label,
          color, material, description, long_description, short_description,
          in_stock, sku, category, is_new, sort_order, updated_at
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15, NOW()
        )
        `,
        [
          product.id,
          product.name,
          product.sizes || product.sizeOptions.join(" · "),
          product.priceNum,
          product.price,
          product.color || "",
          product.material || "",
          product.description || "",
          product.longDescription || "",
          product.shortDescription ?? null,
          product.inStock,
          String(product.sku ?? product.id),
          product.category ?? null,
          Boolean(product.isNew),
          index,
        ]
      );
      await replaceProductChildren(client, product);
    }
  });
  bustProductCache();
}

type OrderRow = {
  id: string;
  created_at: Date | string;
  status: StoredOrder["status"];
  customer_name: string;
  phone: string;
  email: string | null;
  delivery_method: DeliveryMethod;
  city: string;
  address: string;
  comment: string | null;
  locale: string;
  total: string | number;
  notified: boolean;
  payment_type: string | null;
  payment_status: string | null;
  invoice_id: string | null;
  payment_reference: string | null;
  amount_paid: string | number | null;
  items: CheckoutPayload["items"] | null;
};

function asPaymentType(v: string | null | undefined): PaymentType | undefined {
  if (v === "full" || v === "prepay" || v === "postpay") return v;
  return undefined;
}

function asPaymentStatus(v: string | null | undefined): PaymentStatus {
  if (v === "paid" || v === "canceled" || v === "cod" || v === "pending") {
    return v;
  }
  return "pending";
}

function mapOrder(row: OrderRow): StoredOrder {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();

  const paymentType = asPaymentType(row.payment_type);
  const amountPaid =
    row.amount_paid != null ? num(row.amount_paid) : null;

  return {
    id: row.id,
    createdAt,
    status: row.status,
    customerName: row.customer_name,
    phone: row.phone,
    ...(row.email ? { email: row.email } : {}),
    deliveryMethod: row.delivery_method,
    city: row.city,
    address: row.address,
    ...(row.comment ? { comment: row.comment } : {}),
    locale: row.locale || "uk",
    items: Array.isArray(row.items) ? row.items : [],
    total: num(row.total),
    notified: Boolean(row.notified),
    ...(paymentType ? { paymentType } : {}),
    paymentStatus: asPaymentStatus(row.payment_status),
    ...(row.invoice_id ? { invoiceId: row.invoice_id } : {}),
    ...(row.payment_reference
      ? { paymentReference: row.payment_reference }
      : {}),
    ...(amountPaid != null ? { amountPaid } : {}),
  };
}

/** Auto-heal payment columns if migrate not yet run on this DB. */
let ensureOrderPaymentPromise: Promise<void> | null = null;

async function ensureOrderPaymentColumns(): Promise<void> {
  if (!ensureOrderPaymentPromise) {
    ensureOrderPaymentPromise = (async () => {
      try {
        await query(`
          ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS payment_type TEXT,
            ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS invoice_id TEXT,
            ADD COLUMN IF NOT EXISTS payment_reference TEXT,
            ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12, 2)
        `);
      } catch (error) {
        ensureOrderPaymentPromise = null;
        if (isMissingRelationError(error)) return;
        console.warn("[ensureOrderPaymentColumns]", error);
      }
    })();
  }
  await ensureOrderPaymentPromise;
}

const ORDER_SELECT = `
  SELECT
    o.id,
    o.created_at,
    o.status,
    o.customer_name,
    o.phone,
    o.email,
    o.delivery_method,
    o.city,
    o.address,
    o.comment,
    o.locale,
    o.total,
    o.notified,
    o.payment_type,
    COALESCE(o.payment_status, 'pending') AS payment_status,
    o.invoice_id,
    o.payment_reference,
    o.amount_paid,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'productId', oi.product_id,
            'name', oi.name,
            'size', oi.size,
            'quantity', oi.quantity,
            'priceNum', oi.price_num,
            'image', (
              SELECT pi.url
              FROM product_images pi
              WHERE pi.product_slug = oi.product_id
              ORDER BY pi.sort_order ASC, pi.id ASC
              LIMIT 1
            )
          )
          ORDER BY oi.id
        )
        FROM order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::json
    ) AS items
  FROM orders o
`;

export async function sqlGetAllOrders(): Promise<StoredOrder[]> {
  try {
    await ensureOrderPaymentColumns();
    const rows = await query<OrderRow>(
      `${ORDER_SELECT} ORDER BY o.created_at DESC`
    );
    return rows.map(mapOrder);
  } catch (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        "[sqlGetAllOrders] table missing — run `npm run db:setup` before production."
      );
      return [];
    }
    throw error;
  }
}

export async function sqlGetOrder(id: string): Promise<StoredOrder | null> {
  await ensureOrderPaymentColumns();
  const rows = await query<OrderRow>(
    `${ORDER_SELECT} WHERE o.id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function sqlGetOrderByInvoiceId(
  invoiceId: string
): Promise<StoredOrder | null> {
  await ensureOrderPaymentColumns();
  const rows = await query<OrderRow>(
    `${ORDER_SELECT} WHERE o.invoice_id = $1 LIMIT 1`,
    [invoiceId]
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function sqlGetOrderByPaymentRef(
  reference: string
): Promise<StoredOrder | null> {
  await ensureOrderPaymentColumns();
  const rows = await query<OrderRow>(
    `${ORDER_SELECT} WHERE o.payment_reference = $1 LIMIT 1`,
    [reference]
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function sqlUpdatePaymentStatus(
  invoiceId: string,
  status: PaymentStatus,
  amountPaid?: number
): Promise<StoredOrder | null> {
  await ensureOrderPaymentColumns();
  await query(
    `
    UPDATE orders SET
      payment_status = $2,
      amount_paid = COALESCE($3, amount_paid)
    WHERE invoice_id = $1
    `,
    [invoiceId, status, amountPaid ?? null]
  );
  return sqlGetOrderByInvoiceId(invoiceId);
}

async function insertOrderItems(
  client: import("pg").PoolClient,
  orderId: string,
  items: CheckoutPayload["items"]
) {
  for (const item of items) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, name, size, quantity, price_num)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        orderId,
        item.productId,
        item.name,
        item.size,
        item.quantity,
        item.priceNum,
      ]
    );
  }
}

export async function sqlAppendOrder(order: StoredOrder): Promise<StoredOrder> {
  await ensureOrderPaymentColumns();
  await withTransaction(async (client) => {
    await client.query(
      `
      INSERT INTO orders (
        id, created_at, status, customer_name, phone, email,
        delivery_method, city, address, comment, locale, total, notified,
        payment_type, payment_status, invoice_id, payment_reference, amount_paid
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18
      )
      `,
      [
        order.id,
        order.createdAt,
        order.status,
        order.customerName,
        order.phone,
        order.email ?? null,
        order.deliveryMethod,
        order.city,
        order.address,
        order.comment ?? null,
        order.locale,
        order.total,
        Boolean(order.notified),
        order.paymentType ?? null,
        order.paymentStatus ?? "pending",
        order.invoiceId ?? null,
        order.paymentReference ?? null,
        order.amountPaid ?? null,
      ]
    );
    await insertOrderItems(client, order.id, order.items);
  });
  return order;
}

export async function sqlUpdateOrder(
  id: string,
  patch: Partial<StoredOrder>
): Promise<StoredOrder | null> {
  const current = await sqlGetOrder(id);
  if (!current) return null;

  const next: StoredOrder = {
    ...current,
    ...patch,
    id: current.id,
    items: patch.items ?? current.items,
  };

  await ensureOrderPaymentColumns();
  await withTransaction(async (client) => {
    await client.query(
      `
      UPDATE orders SET
        status = $2,
        customer_name = $3,
        phone = $4,
        email = $5,
        delivery_method = $6,
        city = $7,
        address = $8,
        comment = $9,
        locale = $10,
        total = $11,
        notified = $12,
        payment_type = $13,
        payment_status = $14,
        invoice_id = $15,
        payment_reference = $16,
        amount_paid = $17
      WHERE id = $1
      `,
      [
        id,
        next.status,
        next.customerName,
        next.phone,
        next.email ?? null,
        next.deliveryMethod,
        next.city,
        next.address,
        next.comment ?? null,
        next.locale,
        next.total,
        Boolean(next.notified),
        next.paymentType ?? null,
        next.paymentStatus ?? "pending",
        next.invoiceId ?? null,
        next.paymentReference ?? null,
        next.amountPaid ?? null,
      ]
    );

    if (patch.items) {
      await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);
      await insertOrderItems(client, id, next.items);
    }
  });

  return next;
}

export async function sqlDeleteOrder(id: string): Promise<boolean> {
  const result = await getPool().query(`DELETE FROM orders WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Link `slug` with `otherIds` into one color group (13pm-style).
 * Pass empty array to unlink this product from any group.
 */
export async function sqlSyncColorVariants(
  slug: string,
  otherIds: string[]
): Promise<string | null> {
  const siblings = [
    ...new Set(otherIds.map(String).filter((id) => id && id !== slug)),
  ];

  await withTransaction(async (client) => {
    const { rows: me } = await client.query<{ color_group: string | null }>(
      `SELECT color_group FROM products WHERE slug = $1`,
      [slug]
    );
    if (!me.length) throw new Error("Product not found");
    const oldGroup = me[0].color_group;

    if (siblings.length === 0) {
      await client.query(
        `UPDATE products SET color_group = NULL, updated_at = NOW() WHERE slug = $1`,
        [slug]
      );
      if (oldGroup) {
        const { rows: left } = await client.query<{ c: string }>(
          `SELECT COUNT(*)::text AS c FROM products WHERE color_group = $1`,
          [oldGroup]
        );
        if (Number(left[0]?.c || 0) <= 1) {
          await client.query(
            `UPDATE products SET color_group = NULL, updated_at = NOW()
             WHERE color_group = $1`,
            [oldGroup]
          );
        }
      }
      return;
    }

    const { rows: groupRows } = await client.query<{ color_group: string | null }>(
      `SELECT color_group FROM products
       WHERE slug = ANY($1::text[]) AND color_group IS NOT NULL
       LIMIT 1`,
      [[slug, ...siblings]]
    );
    const groupId =
      groupRows[0]?.color_group ||
      `cg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    if (oldGroup && oldGroup !== groupId) {
      const keep = new Set([slug, ...siblings]);
      const { rows: oldMembers } = await client.query<{ slug: string }>(
        `SELECT slug FROM products WHERE color_group = $1`,
        [oldGroup]
      );
      for (const row of oldMembers) {
        if (!keep.has(row.slug)) {
          await client.query(
            `UPDATE products SET color_group = NULL, updated_at = NOW() WHERE slug = $1`,
            [row.slug]
          );
        }
      }
    }

    await client.query(
      `UPDATE products SET color_group = $2, updated_at = NOW()
       WHERE slug = ANY($1::text[])`,
      [[slug, ...siblings], groupId]
    );
  });

  bustProductCache(slug);

  const updated = await sqlGetProduct(slug);
  return updated?.colorGroup ?? null;
}

/** Deep-copy a product (new slug). Does not join color group / look. */
export async function sqlDuplicateProduct(
  sourceSlug: string
): Promise<Product | null> {
  const source = await sqlGetProduct(sourceSlug);
  if (!source) return null;

  const { slugifyId } = await import("@/lib/slug");
  let id = slugifyId(`${source.name}-copy`);
  const all = await sqlGetAllProducts();
  if (all.some((p) => p.id === id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const copy: Product = {
    ...source,
    id,
    name: `${source.name} (копія)`,
    sku: id,
    colorGroup: null,
    colorVariants: undefined,
    lookProductIds: [],
    isNew: true,
  };

  await sqlUpsertProduct(copy);
  return sqlGetProduct(id);
}

export { slugifyId } from "@/lib/slug";

export function formatPriceLabel(priceNum: number): string {
  return `${priceNum.toLocaleString("uk-UA")} ₴`;
}
