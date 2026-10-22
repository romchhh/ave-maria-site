"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { adminProductsListHref } from "@/lib/adminProductsListState";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? decodeURIComponent(String(params.id)) : "";
  const [listHref, setListHref] = useState("/admin/products");

  useEffect(() => {
    setListHref(adminProductsListHref());
  }, []);

  return (
    <div>
      <AdminPageHeader
        title="Редагувати товар"
        crumbs={[
          { label: "Товари", href: listHref },
          { label: id || "…" },
        ]}
      />
      {id ? <ProductForm key={id} productId={id} /> : null}
    </div>
  );
}
