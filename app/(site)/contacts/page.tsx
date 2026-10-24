import type { Metadata } from "next";
import ContactsContent from "@/components/content/ContactsContent";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { contactsContent } from "@/lib/content/contacts";
import {
  generateLocalBusinessStructuredData,
  generateWebPageStructuredData,
} from "@/lib/seo";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: contactsContent.title,
    description: contactsContent.lead,
    path: "contacts",
  });
}

export default function ContactsPage() {
  return (
    <PageShell kind="catalog">
      <JsonLd
        data={generateWebPageStructuredData({
          name: contactsContent.title,
          description: contactsContent.lead,
          path: "contacts",
        })}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...generateLocalBusinessStructuredData(),
        }}
      />
      <ContactsContent />
    </PageShell>
  );
}
