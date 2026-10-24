export type ContactsContentData = {
  title: string;
  lead: string;
  studioHeading: string;
  pickupNote: string;
  labels: {
    address: string;
    instagram: string;
    phone: string;
    email: string;
  };
  mapLink: string;
  replyHeading: string;
  replyPoints: string[];
};

export const contactsContent: ContactsContentData = {
  title: "Контакти",
  lead:
    "Питання щодо замовлення чи наявності — пишіть в Instagram, телефонуйте або заходьте в студію.",
  studioHeading: "Ave Maria Private Studio",
  pickupNote:
    "Самовивіз · перед візитом запишіться онлайн або зателефонуйте.",
  labels: {
    address: "Адреса",
    instagram: "Instagram",
    phone: "Телефон",
    email: "Email",
  },
  mapLink: "Відкрити на карті",
  replyHeading: "Як ми відповідаємо",
  replyPoints: [
    "Замовлення та наявність — протягом робочого дня.",
    "Доставка Новою Поштою по Україні після підтвердження менеджером.",
    "В Instagram @ave.maria_beautylab — новинки та підбірки догляду.",
  ],
};
