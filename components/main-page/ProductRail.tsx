import ProductCard from "@/components/catalog/ProductCard";
import type { Product } from "@/lib/types";

export default function ProductRail({
  id,
  title,
  products,
  priorityCount = 0,
}: {
  id: string;
  title: string;
  products: Product[];
  priorityCount?: number;
}) {
  if (!products.length) return null;

  return (
    <section className="home-section home-rail" aria-labelledby={id}>
      <div className="section-head">
        <h2 id={id}>{title}</h2>
      </div>
      <div className="home-products-rail">
        {products.map((p, index) => (
          <ProductCard
            key={p.id}
            product={p}
            priority={index < priorityCount}
          />
        ))}
      </div>
    </section>
  );
}
