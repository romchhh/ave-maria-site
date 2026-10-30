import {
  getChildCategories,
  isTopLevelCategory,
  type Category,
} from "@/lib/categoryModel";
import { sitePath } from "@/lib/i18n/paths";

export type NavCategoryChild = {
  id: string;
  label: string;
  href: string;
};

export type NavCategoryItem = {
  id: string;
  label: string;
  href: string;
  children: NavCategoryChild[];
};

/** Top-level shop categories for header / mobile menu (with optional concerns). */
export function buildNavCategories(categories: Category[]): NavCategoryItem[] {
  return categories.filter(isTopLevelCategory).map((cat) => ({
    id: cat.id,
    label: cat.label.uk,
    href: sitePath(`catalog?category=${cat.id}`),
    children: getChildCategories(categories, cat.id).map((sub) => ({
      id: sub.id,
      label: sub.label.uk,
      href: sitePath(`catalog?category=${sub.id}`),
    })),
  }));
}
