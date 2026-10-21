"use client";

import { use } from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ClientDetail from "@/components/admin/ClientDetail";

export default function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const decoded = decodeURIComponent(id);

  return (
    <div>
      <AdminPageHeader
        title="Картка клієнта"
        description="Контакти та всі замовлення цього клієнта."
        crumbs={[
          { label: "Клієнти", href: "/admin/clients" },
          { label: decoded },
        ]}
      />
      <ClientDetail id={decoded} />
    </div>
  );
}