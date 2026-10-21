# Дані для seed

| Файл | Призначення |
|------|-------------|
| `products.json` | Каталог товарів (HADAT / ZOLA / ELEMIS) → `npm run db:seed` |
| `orders.json` | Демо-замовлення для адмінки (опційно) |
| `pricelists/` | Архів прайсів Excel (джерело цін, не runtime) |

Runtime сайту читає лише Postgres. Після змін у `products.json`:

```bash
npm run db:seed
# або з нуля:
npm run db:setup
```
