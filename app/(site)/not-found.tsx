import type { Metadata } from "next";
import NotFoundView from "@/components/shared/NotFoundView";
import JsonLd from "@/components/shared/JsonLd";
import { getMessages } from "@/lib/i18n/messages";
import { getSiteUrl } from "@/lib/i18n/seo";
import { generateWebPageStructuredData } from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

const t = getMessages();

export const metadata: Metadata = buildPageMetadata({
  title: `${t.notFound.title} (404)`,
  description: t.notFound.lead,
  noIndex: true,
});

export default function NotFound() {
  return (
    <>
      <JsonLd
        data={generateWebPageStructuredData({
          name: t.notFound.title,
          description: t.notFound.lead,
          baseUrl: getSiteUrl(),
        })}
      />
      <NotFoundView />
    </>
  );
}
