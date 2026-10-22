import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  deleteProduct,
  getProductById,
  patchProductFlags,
  syncColorVariants,
  upsertProduct,
} from "@/lib/adminStore";
import { productFromBody } from "@/lib/productPayload";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

/** Quick flag updates from catalog list (inStock / isVisible). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const patch: { inStock?: boolean; isVisible?: boolean } = {};
    if (typeof body.inStock === "boolean") patch.inStock = body.inStock;
    if (typeof body.isVisible === "boolean") patch.isVisible = body.isVisible;
    if (patch.inStock === undefined && patch.isVisible === undefined) {
      return NextResponse.json({ error: "empty_patch" }, { status: 400 });
    }

    const updated = await patchProductFlags(decodeURIComponent(id), patch);
    if (!updated) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/admin/products/:id]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const current = await getProductById(id);
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const product = productFromBody(body, {
      ...current,
      id,
      colorVariants: undefined,
    });
    await upsertProduct(product);

    if (Array.isArray(body.colorVariantIds)) {
      await syncColorVariants(
        id,
        (body.colorVariantIds as unknown[]).map(String)
      );
    }

    const fresh = await getProductById(id);
    return NextResponse.json(fresh ?? product);
  } catch (error) {
    console.error("[PUT /api/admin/products/:id]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
