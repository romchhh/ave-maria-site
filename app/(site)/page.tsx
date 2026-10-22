import { Suspense } from "react";
import type { Metadata } from "next";
import About from "@/components/main-page/About";
import CategoriesCarousel from "@/components/main-page/CategoriesCarousel";
import FeaturedServer from "@/components/main-page/FeaturedServer";
import Hero from "@/components/main-page/Hero";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { getCategories } from "@/lib/categories";
import { siteSeo } from "@/lib/i18n/seo";
import { generateWebPageStructuredData } from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...buildPageMetadata({
      title: siteSeo.siteTitle,
      description: siteSeo.homeDescription,
      path: "",
    }),
    keywords: siteSeo.homeKeywords,
  };
}

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <PageShell kind="home">
      <JsonLd
        data={generateWebPageStructuredData({
          name: siteSeo.siteTitle,
          description: siteSeo.homeDescription,
          path: "",
        })}
      />
      <div className="home-shell">
        <Hero />
        <CategoriesCarousel categories={categories} />
        <Suspense fallback={<div className="home-section" />}>
          <FeaturedServer />
        </Suspense>
        <About />
      </div>
    </PageShell>
  );
}
