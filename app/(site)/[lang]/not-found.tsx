import NotFoundView from "@/components/shared/NotFoundView";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

export default function NotFound() {
  return <NotFoundView lang={DEFAULT_LOCALE} />;
}
