import type { Metadata } from "next";
import FinalCheckout from "@/components/checkout/FinalCheckout";
import PageShell from "@/components/shared/PageShell";
import { getMessages } from "@/lib/i18n/messages";
import { pageAlternates } from "@/lib/i18n/seo";
import { getFeaturedProducts } from "@/lib/products";

export async function generateMetadata(): Promise<Metadata> {
  const t = getMessages();
  return {
    title: t.checkout.title,
    description: t.checkout.subtitle,
    robots: { index: false, follow: false },
    alternates: pageAlternates("final"),
  };
}

export default async function FinalPage() {
  const suggested = await getFeaturedProducts(8);

  return (
    <PageShell kind="catalog">
      <FinalCheckout suggested={suggested} />
    </PageShell>
  );
}
