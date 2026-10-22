import type { Metadata } from "next";
import PageShell from "@/components/shared/PageShell";
import WishlistClient from "@/components/wishlist/WishlistClient";
import { getMessages } from "@/lib/i18n/messages";
import { pageAlternates } from "@/lib/i18n/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = getMessages();
  return {
    title: t.wish.title,
    description: t.wish.lead,
    robots: { index: false, follow: false },
    alternates: pageAlternates("wishlist"),
  };
}

export default function WishlistPage() {
  return (
    <PageShell kind="catalog">
      <WishlistClient />
    </PageShell>
  );
}
