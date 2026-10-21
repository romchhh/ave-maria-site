import { readOrders, type StoredOrder } from "@/lib/adminStore";

export type ClientSummary = {
  id: string;
  phone: string;
  customerName: string;
  email?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  cities: string[];
};

export type ClientDetail = ClientSummary & {
  orders: StoredOrder[];
};

export function normalizePhone(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("380")) {
    return digits.slice(-12);
  }
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function displayPhone(raw: string, id: string): string {
  const trimmed = String(raw || "").trim();
  if (trimmed) return trimmed;
  if (id.length === 12 && id.startsWith("380")) {
    return `+${id.slice(0, 3)} ${id.slice(3, 5)} ${id.slice(5, 8)} ${id.slice(8)}`;
  }
  if (id.length === 10) {
    return `+38 ${id.slice(0, 3)} ${id.slice(3, 6)} ${id.slice(6)}`;
  }
  return id || "—";
}

function buildClients(orders: StoredOrder[]): Map<string, ClientDetail> {
  const map = new Map<string, ClientDetail>();

  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const order of sorted) {
    const id = normalizePhone(order.phone);
    if (!id) continue;

    const existing = map.get(id);
    if (!existing) {
      map.set(id, {
        id,
        phone: displayPhone(order.phone, id),
        customerName: order.customerName?.trim() || "Без імені",
        ...(order.email ? { email: order.email } : {}),
        orderCount: 1,
        totalSpent: order.status === "cancelled" ? 0 : order.total || 0,
        lastOrderAt: order.createdAt,
        cities: order.city?.trim() ? [order.city.trim()] : [],
        orders: [order],
      });
      continue;
    }

    existing.orders.push(order);
    existing.orderCount += 1;
    if (order.status !== "cancelled") {
      existing.totalSpent += order.total || 0;
    }
    // Keep newest contact fields (orders are newest-first); fill gaps only.
    if (
      existing.customerName === "Без імені" &&
      order.customerName?.trim()
    ) {
      existing.customerName = order.customerName.trim();
    }
    if (!existing.email && order.email?.trim()) {
      existing.email = order.email.trim();
    }
    const city = order.city?.trim();
    if (city && !existing.cities.includes(city)) {
      existing.cities.push(city);
    }
  }

  return map;
}

export async function listClients(): Promise<ClientSummary[]> {
  const orders = await readOrders();
  const map = buildClients(orders);
  return [...map.values()]
    .map(
      (client): ClientSummary => ({
        id: client.id,
        phone: client.phone,
        customerName: client.customerName,
        ...(client.email ? { email: client.email } : {}),
        orderCount: client.orderCount,
        totalSpent: client.totalSpent,
        lastOrderAt: client.lastOrderAt,
        cities: client.cities,
      })
    )
    .sort(
      (a, b) =>
        new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    );
}

export async function getClientById(id: string): Promise<ClientDetail | null> {
  const key = normalizePhone(id);
  if (!key) return null;
  const orders = await readOrders();
  return buildClients(orders).get(key) ?? null;
}
