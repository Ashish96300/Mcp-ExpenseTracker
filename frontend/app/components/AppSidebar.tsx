
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "◫" },
  { label: "Transactions", href: "/transactions", icon: "⇄" },
  { label: "Analytics", href: "/analytics", icon: "▥" },
  { label: "Help & Guides", href: "/help", icon: "?" },
];

export default function AppSidebar({
  children,
}: {
  children?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col bg-[#101B35] text-white md:min-h-screen md:w-64 md:shrink-0">
      {/* Brand */}
      <div className="border-b border-white/10 px-6 py-5 md:px-7 md:py-6">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold tracking-wide">
            Finora<span className="text-blue-400">.</span>
          </h1>
        </Link>

        <p className="mt-1 text-xs text-slate-400">
          Personal Finance Manager
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex gap-2 overflow-x-auto p-3 md:flex-1 md:flex-col md:p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Optional page-specific sidebar content */}
      {children}
    </aside>
  );
}
