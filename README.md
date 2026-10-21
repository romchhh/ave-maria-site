# Ave Maria Beauty Lab

Мультибрендовий магазин косметики на **Next.js 15 + React**.

Твоя щоденна розкіш — hair, skin, body, face.

## Стек

- Next.js 15 (App Router, Turbopack)
- React 18 + TypeScript
- Локаль `uk`
- Каталог у Postgres: правка `data/products.json` → `npm run db:seed`
- Кошик і вішлист у клієнті, чекаут через API

## Медіа

Усе в `public/assets/`:

| Папка | Що всередині |
|--------|----------------|
| `brand/` | логотип |
| `hero/` | головне фото |
| `categories/` | обкладинки категорій |
| `products/` | фото товарів |
| `icons/` | іконки хедера |
| `decor/` | декор футера |

Шляхи в коді — через `lib/media.ts`.

## Запуск

```bash
cp .env.example .env.local   # або .env на сервері
# заповни DATABASE_URL
npm install
npm run db:setup             # обовʼязково: migrate + seed (таблиці products/categories)
npm run build                # production
npm run start                # http://localhost:3001
```

Локальна розробка:

```bash
npm run db:setup
npm run dev                  # http://localhost:3001
```

Наповнити / оновити товари з JSON:

```bash
npm run db:seed
```

> Без `npm run db:setup` білд пройде (порожній каталог), але вітрина буде без товарів.
