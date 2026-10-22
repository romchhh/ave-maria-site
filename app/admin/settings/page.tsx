import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Налаштування — Ave Maria Beauty Lab Admin",
};

export default function SettingsPage() {
  return (
    <div data-tour="tour-settings-page">
      <AdminPageHeader
        title="Налаштування"
        description="Hero на головній, Telegram, Нова Пошта та публічний URL сайту."
        crumbs={[{ label: "Налаштування" }]}
      />
      <SettingsForm />
    </div>
  );
}
