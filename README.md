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
npm install
npm run db:setup   # migrate + seed каталогу
npm run dev
```

Наповнити / оновити товари з JSON:

```bash
npm run db:seed
```

Відкрий [http://localhost:3000/uk](http://localhost:3000/uk).
