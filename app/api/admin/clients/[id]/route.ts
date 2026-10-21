import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getClientById } from "@/lib/clients";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const client = await getClientById(decodeURIComponent(id));
    if (!client) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    console.error("[GET /api/admin/clients/:id]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
