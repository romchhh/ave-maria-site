import type { Metadata } from "next";
import CatalogServer from "@/components/catalog/CatalogServer";
import PageShell from "@/components/shared/PageShell";
import { parseLangParam, pageAlternates, seoCopy } from "@/lib/i18n/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);
  const copy = seoCopy[lang];
  return {
    title: copy.catalogTitle,
    description: copy.catalogDescription,
    alternates: pageAlternates(lang, "catalog"),
  };
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);

  return (
    <PageShell kind="catalog">
      <CatalogServer lang={lang} />
    </PageShell>
  );
}
