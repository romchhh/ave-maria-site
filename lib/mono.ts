type MonoBasketItem = {
  name: string;
  qty: number;
  sum: number;
  total: number;
  unit: string;
  code: string;
};

export type MonoInvoiceRequest = {
  amountInMinorUnits: number;
  /** UAH = 980 */
  currencyCode?: 980;
  reference: string;
  destination: string;
  comment: string;
  basketOrder: MonoBasketItem[];
};

export type MonoInvoiceResult = {
  invoiceId: string;
  pageUrl: string;
};

export async function getMonoToken(): Promise<string | undefined> {
  const { resolveSetting } = await import("@/lib/settings");
  const token = await resolveSetting("mono_token", [
    process.env.MONO_TOKEN,
    process.env.NEXT_PUBLIC_MONO_TOKEN,
  ]);
  return token || undefined;
}

/** Public site URL — same as «URL сайту» in admin settings (no separate Mono field). */
export async function getPublicUrl(): Promise<string> {
  const { resolveSetting } = await import("@/lib/settings");
  const fromSettings = await resolveSetting("site_url", [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.PUBLIC_URL,
  ]);
  return (fromSettings || "https://avemariabeautylab.com").replace(/\/$/, "");
}

export async function getPrepayAmountUah(): Promise<number> {
  const { resolveSetting } = await import("@/lib/settings");
  const raw = await resolveSetting("prepay_amount_uah", [
    process.env.PREPAY_AMOUNT_UAH,
    process.env.NEXT_PUBLIC_PREPAY_AMOUNT_UAH,
  ]);
  const n = Number(String(raw || "300").replace(/\D/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 300;
}

export async function createMonobankInvoice(
  request: MonoInvoiceRequest
): Promise<MonoInvoiceResult> {
  const token = await getMonoToken();
  if (!token) {
    throw new Error("MONO_TOKEN_MISSING");
  }

  const publicUrl = await getPublicUrl();
  const returnSuffix = `/payment/status?ref=${encodeURIComponent(request.reference)}`;

  const invoicePayload = {
    amount: request.amountInMinorUnits,
    ccy: request.currencyCode ?? 980,
    merchantPaymInfo: {
      reference: request.reference,
      destination: request.destination,
      comment: request.comment,
      basketOrder: request.basketOrder,
    },
    redirectUrl: `${publicUrl}${returnSuffix}`,
    successUrl: `${publicUrl}${returnSuffix}&payment=success`,
    failUrl: `${publicUrl}${returnSuffix}&payment=failed`,
    webHookUrl: `${publicUrl}/api/mono-webhook`,
    validity: 3600,
    paymentType: "debit",
  };

  const monoRes = await fetch(
    "https://api.monobank.ua/api/merchant/invoice/create",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": token,
      },
      body: JSON.stringify(invoicePayload),
    }
  );

  const invoiceData = (await monoRes.json()) as {
    invoiceId?: string;
    pageUrl?: string;
    errCode?: string;
  };

  if (!monoRes.ok) {
    const errCode =
      typeof invoiceData?.errCode === "string" ? invoiceData.errCode : "UNKNOWN";
    throw new Error(`MONO_INVOICE_FAILED:${errCode}`);
  }

  const { invoiceId, pageUrl } = invoiceData;
  if (!invoiceId || !pageUrl) {
    throw new Error("MONO_INVOICE_INCOMPLETE");
  }

  return { invoiceId, pageUrl };
}

export function buildMonoFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message === "MONO_TOKEN_MISSING") {
    return "Оплата наразі недоступна: додайте токен Monobank у Налаштуваннях (Оплата).";
  }
  if (message.startsWith("MONO_INVOICE_FAILED:FORBIDDEN")) {
    return "Monobank відхилив запит. Перевірте токен і що webhook відкритий на URL сайту з налаштувань.";
  }
  return "На жаль, не вдалося створити рахунок. Спробуйте ще раз або зв’яжіться з нами.";
}
