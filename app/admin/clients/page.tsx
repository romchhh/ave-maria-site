import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ClientsTable from "@/components/admin/tables/ClientsTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Клієнти — Ave Maria Beauty Lab Admin",
};

export default function ClientsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Клієнти"
        description="База клієнтів з контактами та історією замовлень."
        crumbs={[{ label: "Клієнти" }]}
      />
      <ClientsTable />
    </div>
  );
}
