import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { listClients } from "@/lib/clients";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const clients = await listClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error("[GET /api/admin/clients]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
