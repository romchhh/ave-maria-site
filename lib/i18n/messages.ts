export type Messages = {
  nav: {
    catalog: string;
    collections: string;
    concept: string;
    about: string;
    new: string;
    stores: string;
    menu: string;
  };
  home: {
    cta: string;
    eyebrow: string;
    lead: string;
    categories: string;
    categoriesScroll: string;
    featured: string;
    newArrivals: string;
    sale: string;
    aboutTitle: string;
    aboutText: string;
    aboutReadMore: string;
  };
  notFound: {
    code: string;
    title: string;
    lead: string;
    home: string;
    catalog: string;
  };
  catalog: {
    title: string;
    count: (n: number) => string;
    sort: string;
    filter: string;
    filters: string;
    empty: string;
    category: string;
    sortNewest: string;
    sortAsc: string;
    sortDesc: string;
    size: string;
    color: string;
    brand: string;
    price: string;
    minPrice: string;
    maxPrice: string;
    reset: string;
    showMore: string;
  };
  product: {
    home: string;
    catalog: string;
    inStock: string;
    outOfStock: string;
    preorder: string;
    size: string;
    sizeGuide: string;
    sizeCustom: string;
    color: string;
    checkStores: string;
    addToCart: string;
    cardAdd: string;
    addWish: string;
    inWish: string;
    contactSupport: string;
    description: string;
    fabric: string;
    characteristics: string;
    related: string;
    lookTitle: string;
    pickSize: string;
    model: string;
    modelOnPhoto: string;
    sizeChartTitle: string;
    sizeChartSubtitle: string;
    sizeChartAlso: string;
    sizeChartCustom: string;
    sizeCol: string;
    bust: string;
    waist: string;
    hips: string;
    deliveryTitle: string;
    deliveryText: string[];
    paymentTitle: string;
    paymentText: string[];
  };
  basket: {
    title: string;
    empty: string;
    total: string;
    checkout: string;
    thanks: string;
    remove: string;
    size: string;
  };
  checkout: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyCta: string;
    contact: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    email: string;
    emailOptional: string;
    delivery: string;
    deliveryMethod: string;
    city: string;
    cityPlaceholder: string;
    cityLoading: string;
    warehouse: string;
    warehousePlaceholder: string;
    warehouseLoading: string;
    courierAddress: string;
    courierAddressPlaceholder: string;
    address: string;
    addressHint: string;
    comment: string;
    commentPlaceholder: string;
    orderSummary: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successText: string;
    successContact: string;
    successOrderId: string;
    successItems: string;
    successDelivery: string;
    successTotal: string;
    successCta: string;
    backToShop: string;
    alsoLike: string;
    methods: {
      nova_poshta_branch: string;
      nova_poshta_locker: string;
      nova_poshta_courier: string;
      pickup: string;
      international: string;
    };
    errors: {
      name: string;
      phone: string;
      city: string;
      address: string;
      empty: string;
      generic: string;
      np: string;
    };
  };
  wish: {
    title: string;
    lead: string;
    empty: string;
    emptyCta: string;
    toCart: string;
    remove: string;
  };
  search: {
    title: string;
    placeholder: string;
    empty: string;
    close: string;
  };
  footer: {
    brand: string;
    slogan: string;
    sloganAccent: string;
    newsletterLabel: string;
    newsletterPlaceholder: string;
    region: string;
    address: string;
    contacts: string;
    clients: string;
    howToBuy: string;
    cart: string;
    order: string;
    legal: string;
    privacy: string;
    offer: string;
    cookies: string;
    shipping: string;
    returns: string;
    contactsPage: string;
    payment: string;
    about: string;
    instagram: string;
    developedBy: string;
    developedByName: string;
  };
  a11y: {
    search: string;
    account: string;
    wishlist: string;
    cart: string;
    menu: string;
    close: string;
    chat: string;
    wishAdd: string;
    prevPhoto: string;
    nextPhoto: string;
  };
};

const uk: Messages = {
  nav: {
    catalog: "Каталог",
    collections: "Колекції",
    concept: "Concept store",
    about: "Про бренд",
    new: "Новинки",
    stores: "Магазини",
    menu: "Меню",
  },
  home: {
    cta: "Каталог",
    eyebrow: "Мультибренд · beauty lab",
    lead: "Твоя щоденна розкіш. Hair, skin, body, face — догляд і аромати для кожного дня.",
    categories: "Популярні категорії",
    categoriesScroll: "Гортайте вбік, щоб побачити більше",
    featured: "Популярне",
    newArrivals: "Новинки",
    sale: "Sale",
    aboutTitle: "Твоя щоденна розкіш",
    aboutText:
      "Ave Maria Beauty Lab — мультибрендовий магазин косметики. Ми збираємо догляд і аромати, які хочеться повертати щодня: hair, skin, body, face.",
    aboutReadMore: "Читати далі",
  },
  notFound: {
    code: "404",
    title: "Сторінку загублено",
    lead: "Ця адреса більше не веде сюди — або ще ніколи не існувала. Поверніться до каталогу чи на головну.",
    home: "На головну",
    catalog: "До каталогу",
  },
  catalog: {
    title: "Каталог",
    count: (n: number) => `Показано ${n} товарів`,
    sort: "Сортувати",
    filter: "Фільтр",
    filters: "Фільтри",
    empty: "Товарів не знайдено",
    category: "Категорія",
    sortNewest: "Спочатку новіші",
    sortAsc: "Ціна: від низької",
    sortDesc: "Ціна: від високої",
    size: "Об’єм",
    color: "Формат",
    brand: "Бренд",
    price: "Ціна",
    minPrice: "Від",
    maxPrice: "До",
    reset: "Скинути",
    showMore: "Показати ще",
  },
  product: {
    home: "Головна",
    catalog: "Каталог",
    inStock: "В наявності",
    outOfStock: "Немає в наявності",
    preorder: "Під замовлення",
    size: "Об’єм",
    sizeGuide: "Об’єми",
    sizeCustom: "Інший об’єм",
    color: "Формат",
    checkStores: "Запитати наявність",
    addToCart: "Додати до кошика",
    cardAdd: "До кошика",
    addWish: "Додати у вішлист",
    inWish: "У вішлисті",
    contactSupport: "Зв’язатися з підтримкою",
    description: "Опис",
    fabric: "Склад",
    characteristics: "Характеристики",
    related: "Схожі пропозиції",
    lookTitle: "Схожі пропозиції",
    pickSize: "Оберіть об’єм",
    model: "Характеристики",
    modelOnPhoto: "",
    sizeChartTitle: "Об’єми",
    sizeChartSubtitle: "",
    sizeChartAlso: "",
    sizeChartCustom: "",
    sizeCol: "Об’єм",
    bust: "",
    waist: "",
    hips: "",
    deliveryTitle: "Умови доставки",
    deliveryText: [
      "1–2 дні по Україні — Нова Пошта / інші перевізники.",
      "Безкоштовна доставка від 1 500 ₴.",
      "Міжнародна доставка — узгоджується перед відправкою.",
    ],
    paymentTitle: "Умови оплати",
    paymentText: [
      "Картка, Apple Pay — онлайн після підтвердження.",
      "Банківський переказ — за домовленістю з менеджером.",
    ],
  },
  basket: {
    title: "Кошик",
    empty: "Кошик порожній",
    total: "Разом",
    checkout: "Оформити замовлення",
    thanks: "Дякуємо! Замовлення надіслано — менеджер зв’яжеться з вами.",
    remove: "Видалити",
    size: "Об’єм",
  },
  checkout: {
    title: "Оформлення замовлення",
    subtitle: "Залиште контакти та зручний спосіб отримання — менеджер підтвердить деталі.",
    emptyTitle: "У кошику поки порожньо",
    emptyCta: "До каталогу",
    contact: "Контакти",
    name: "Ім’я та прізвище",
    namePlaceholder: "Анна Коваленко",
    phone: "Телефон",
    email: "Email",
    emailOptional: "не обов’язково",
    delivery: "Доставка",
    deliveryMethod: "Спосіб отримання",
    city: "Місто",
    cityPlaceholder: "Почніть вводити місто…",
    cityLoading: "Шукаємо міста…",
    warehouse: "Відділення / поштомат",
    warehousePlaceholder: "Оберіть зі списку…",
    warehouseLoading: "Шукаємо відділення…",
    courierAddress: "Адреса доставки",
    courierAddressPlaceholder: "Вулиця, будинок, квартира",
    address: "Відділення / адреса",
    addressHint: "Оберіть місто зі списку Нової Пошти, потім відділення",
    comment: "Коментар",
    commentPlaceholder: "Колір / принт / кастом — якщо потрібно",
    orderSummary: "Ваше замовлення",
    submit: "Підтвердити замовлення",
    submitting: "Надсилаємо…",
    successTitle: "Дякуємо за замовлення",
    successText:
      "Заявку прийнято. Найближчим часом менеджер Ave Maria зв’яжеться з вами, щоб підтвердити деталі та оплату.",
    successContact:
      "Очікуйте дзвінок або повідомлення на вказаний телефон. Якщо питання термінові — пишіть нам у Instagram.",
    successOrderId: "Номер замовлення",
    successItems: "Склад замовлення",
    successDelivery: "Доставка",
    successTotal: "Разом",
    successCta: "На головну",
    backToShop: "Продовжити покупки",
    alsoLike: "Вам може сподобатися",
    methods: {
      nova_poshta_branch: "Нова Пошта · відділення",
      nova_poshta_locker: "Нова Пошта · поштомат",
      nova_poshta_courier: "Нова Пошта · кур’єр",
      pickup: "Самовивіз",
      international: "Міжнародна доставка",
    },
    errors: {
      name: "Вкажіть ім’я та прізвище",
      phone: "Вкажіть коректний телефон",
      city: "Оберіть місто зі списку",
      address: "Оберіть відділення або вкажіть адресу",
      empty: "Кошик порожній",
      generic: "Не вдалося надіслати замовлення. Спробуйте ще раз або напишіть нам в Instagram.",
      np: "Не вдалося завантажити дані Нової Пошти. Перевірте ключ API або введіть адресу вручну.",
    },
  },
  wish: {
    title: "Вішлист",
    lead: "Збережені товари — повертайтесь, коли будете готові.",
    empty: "Вішлист порожній",
    emptyCta: "До каталогу",
    toCart: "У кошик",
    remove: "Прибрати",
  },
  search: {
    title: "Пошук",
    placeholder: "Назва або артикул…",
    empty: "Нічого не знайдено",
    close: "Закрити",
  },
  footer: {
    brand:
      "Мультибрендовий магазин косметики. Твоя щоденна розкіш — hair, skin, body, face.",
    slogan: "Твоя щоденна розкіш — hair, skin, body,",
    sloganAccent: "face",
    newsletterLabel: "Приєднуйся до Ave Maria",
    newsletterPlaceholder: "E-mail",
    region: "Україна | Українська",
    address: "Адреса",
    contacts: "Контакти",
    clients: "Клієнтам",
    howToBuy: "Як купити",
    cart: "Корзина",
    order: "Оформити замовлення",
    legal: "Документи",
    privacy: "Політика конфіденційності",
    offer: "Публічна оферта",
    cookies: "Cookies",
    shipping: "Доставка",
    returns: "Повернення та обмін",
    contactsPage: "Контакти",
    payment: "Оплата",
    about: "Про нас",
    instagram: "Instagram",
    developedBy: "Сайт розроблений",
    developedByName: "Telebots",
  },
  a11y: {
    search: "Пошук",
    account: "Акаунт",
    wishlist: "Вішлист",
    cart: "Кошик",
    menu: "Меню",
    close: "Закрити",
    chat: "Чат",
    wishAdd: "У вішлист",
    prevPhoto: "Попереднє фото",
    nextPhoto: "Наступне фото",
  },
};

export const ukMessages = uk;

export function getMessages(): Messages {
  return uk;
}
