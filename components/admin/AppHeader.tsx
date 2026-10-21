"use client";

import { ThemeToggleButton } from "@/components/admin/ThemeToggleButton";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const AppHeader: React.FC = () => {
  const router = useRouter();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-[99999] flex w-full border-b border-gray-200/80 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-[#141414]/90">
      <div className="flex grow items-center justify-between px-3 py-2.5 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path
                  d="M1 1h14M1 6h14M1 11h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <Link
            href="/admin"
            className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white lg:hidden"
          >
            Ave Maria Beauty Lab
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="hidden h-9 items-center rounded-lg border border-gray-200 px-3.5 text-[13px] font-medium text-gray-700 transition hover:bg-gray-50 sm:inline-flex dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
          >
            Відкрити сайт
          </Link>
          <ThemeToggleButton />
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            title="Вийти"
            aria-label="Вийти"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path
                d="M13.333 14.167L17.5 10m0 0l-4.167-4.167M17.5 10H7.5M7.5 2.5H6.5c-1.4 0-2.1 0-2.635.272a2.5 2.5 0 00-1.093 1.093C2.5 4.4 2.5 5.1 2.5 6.5v7c0 1.4 0 2.1.272 2.635a2.5 2.5 0 001.093 1.093C4.4 17.5 5.1 17.5 6.5 17.5h1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
