import { getLegalSlugs } from "@/lib/content/legal";
import { sitePath, siteUrl } from "@/lib/i18n/paths";
import { getSiteUrl, siteSeo } from "@/lib/i18n/seo";
import {
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_NAME,
  SITE_PHONE_DISPLAY,
  SITE_STUDIO_NAME,
} from "@/lib/siteContact";

/**
 * llms.txt — короткий довідник для LLM / AI-агентів (llmstxt.org).
 * @see https://llmstxt.org/
 */
export function buildLlmsTxt(base = getSiteUrl()): string {
  const copy = siteSeo;
  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${copy.homeDescription}`,
    "",
    "Мова сайту: українська (uk-UA). Валюта: UAH (₴).",
    `Контакти: ${SITE_PHONE_DISPLAY}, ${SITE_EMAIL}, ${SITE_INSTAGRAM}`,
    `Студія: ${SITE_STUDIO_NAME}, Київ, Дніпровська Набережна 18А`,
    "",
    "## Основні сторінки",
    "",
    `- [Головна](${siteUrl(base)}): бренд, hero, категорії, хіти`,
    `- [Каталог](${siteUrl(base, "catalog")}): усі товари, фільтри за категорією`,
    `- [Про нас](${siteUrl(base, "about")}): історія та цінності`,
    `- [Контакти](${siteUrl(base, "contacts")}): адреса, карта, зв'язок`,
    "",
    "## Клієнтам",
    "",
    `- [Доставка та оплата](${siteUrl(base, "shipping-payment")})`,
    `- [Повернення та обмін](${siteUrl(base, "returns")})`,
    `- [Політика конфіденційності](${siteUrl(base, "privacy-policy")})`,
    `- [Публічна оферта](${siteUrl(base, "terms-of-service")})`,
    "",
    "## Технічне",
    "",
    `- Sitemap: ${base}/sitemap.xml`,
    `- Robots: ${base}/robots.txt`,
    `- Товари: ${sitePath("product")}/<id> — картка товару з ціною та наявністю`,
    "",
    "## Не індексувати / не пропонувати клієнтам як контент",
    "",
    "- /admin — адмін-панель",
    "- /final — оформлення замовлення (особисті дані)",
    "- /wishlist — локальний вішлист користувача",
    "- /api/* — API",
    "",
  ];

  const slugs = getLegalSlugs().filter(
    (s) =>
      ![
        "contacts",
        "shipping-payment",
        "returns",
        "privacy-policy",
        "terms-of-service",
      ].includes(s)
  );
  if (slugs.length) {
    lines.push("## Інші документи", "");
    for (const slug of slugs) {
      lines.push(`- ${siteUrl(base, slug)}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
