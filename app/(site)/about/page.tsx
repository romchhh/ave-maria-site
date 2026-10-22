import type { Metadata } from "next";
import AboutContent from "@/components/content/AboutContent";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { aboutContent } from "@/lib/content/about";
import { generateWebPageStructuredData } from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: aboutContent.title,
    description: aboutContent.lead,
    path: "about",
  });
}

export default function AboutPage() {
  return (
    <PageShell kind="catalog">
      <JsonLd
        data={generateWebPageStructuredData({
          name: aboutContent.title,
          description: aboutContent.lead,
          path: "about",
        })}
      />
      <AboutContent />
    </PageShell>
  );
}
