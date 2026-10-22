import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  listProductsAdmin,
  readProducts,
  slugifyId,
  syncColorVariants,
  upsertProduct,
} from "@/lib/adminStore";
import { productFromBody } from "@/lib/productPayload";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    // Lean list for admin table / pickers (full payload via GET /:id)
    const products = await listProductsAdmin();
    return NextResponse.json(products);
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json(
      {
        error: "server_error",
        message: error instanceof Error ? error.message : "unknown",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "name_required" }, { status: 400 });
    }

    let id = String(body.id || "").trim() || slugifyId(name);
    const existing = await readProducts();
    if (existing.some((p) => p.id === id)) {
      id = `${id}-${Date.now().toString(36)}`;
    }

    const product = productFromBody(body, { id, colorGroup: null });
    await upsertProduct(product);

    if (Array.isArray(body.colorVariantIds) && body.colorVariantIds.length) {
      await syncColorVariants(
        id,
        (body.colorVariantIds as unknown[]).map(String)
      );
    }

    const fresh = (await readProducts()).find((p) => p.id === id) ?? product;
    return NextResponse.json(fresh, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
