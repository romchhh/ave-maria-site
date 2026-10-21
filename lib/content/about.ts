import type { Locale } from "@/lib/i18n/config";

export type AboutContent = {
  title: string;
  lead: string;
  sectionTitle: string;
  points: string[];
  closingTitle: string;
  closing: string[];
};

export const aboutContent: Record<Locale, AboutContent> = {
  uk: {
    title: "Про нас",
    lead: "Ave Maria Beauty Lab — мультибрендовий магазин косметики. Ми збираємо догляд і аромати, які хочеться повертати щодня: hair, skin, body, face.",
    sectionTitle: "Чому ми",
    points: [
      "Кураторський підбір — лише те, що пасує до щоденної розкоші.",
      "Hair, skin, body, face — повний ритуал догляду в одному місці.",
      "Аромати для тіла й дому: від кремів для рук до дифузорів.",
      "Новинки й бестселери поруч — легко знайти свій фаворит.",
      "Швидка доставка по Україні та зручне оформлення онлайн.",
      "Ми раді підказати об’єм, аромат і формат під ваш ритуал.",
    ],
    closingTitle: "Твоя щоденна розкіш",
    closing: [
      "Ми віримо, що догляд має бути приємним і зрозумілим.",
      "Кожен товар у каталозі — про настрій, відчуття й комфорт шкіри.",
      "Слідкуйте за новинками в Instagram @ave.maria_beautylab.",
    ],
  },
};