import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactsContent from "@/components/content/ContactsContent";
import LegalContent from "@/components/content/LegalContent";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { getLegalPage, getLegalSlugs } from "@/lib/content/legal";
import { generateWebPageStructuredData } from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export function generateStaticParams() {
  return getLegalSlugs().map((legalSlug) => ({ legalSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ legalSlug: string }>;
}): Promise<Metadata> {
  const { legalSlug } = await params;
  const page = getLegalPage(legalSlug);
  if (!page) return { title: "Not found" };
  return buildPageMetadata({
    title: page.title,
    description: page.intro,
    path: legalSlug,
  });
}

export default async function LegalSlugPage({
  params,
}: {
  params: Promise<{ legalSlug: string }>;
}) {
  const { legalSlug } = await params;
  const page = getLegalPage(legalSlug);
  if (!page) notFound();

  return (
    <PageShell kind="catalog">
      <JsonLd
        data={generateWebPageStructuredData({
          name: page.title,
          description: page.intro,
          path: legalSlug,
        })}
      />
      {legalSlug === "contacts" ? (
        <ContactsContent />
      ) : (
        <LegalContent page={page} />
      )}
    </PageShell>
  );
}
