import Link from "next/link";
import React from "react";

type Crumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
};

export default function AdminPageHeader({
  title,
  description,
  crumbs,
  actions,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-2" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
              <li>
                <Link
                  href="/admin"
                  className="transition-colors hover:text-gray-900 dark:hover:text-white"
                >
                  Огляд
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <span aria-hidden className="text-gray-300 dark:text-gray-600">
                    /
                  </span>
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="transition-colors hover:text-gray-900 dark:hover:text-white"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-gray-800 dark:text-gray-200">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-[22px] font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
