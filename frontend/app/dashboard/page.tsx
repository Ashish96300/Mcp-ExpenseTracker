
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import ExpenseOverview from "./ExpenseOverview";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "◫" },
  { label: "Transactions", href: "/transactions", icon: "⇄" },
  { label: "Analytics", href: "/analytics", icon: "▥" },
];

async function DashboardContent() {
    await connection();

  const { user } = await withAuth();

  if (!user) {
    redirect("/login");
  }

  const firstName = user.firstName || "there";

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      {/* Sidebar */}
      <aside className="flex w-full flex-col bg-[#101B35] text-white md:min-h-screen md:w-64 md:shrink-0">
        {/* Brand */}
        <div className="border-b border-white/10 px-7 py-6">
          <h1 className="text-2xl font-bold tracking-wide">
            Finora<span className="text-blue-400">.</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Personal Finance Manager
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex gap-2 overflow-x-auto p-4 md:flex-1 md:flex-col">
          <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-slate-500 md:block">
            Workspace
          </p>

          {navigation.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                index === 0
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="hidden border-t border-white/10 p-5 md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.firstName || user.email}
              </p>
              <p className="truncate text-xs text-slate-400">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5 md:px-9">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Overview
            </h2>
            <p className="text-sm text-slate-500">
              Your financial snapshot
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Dashboard body */}
        <div className="mx-auto max-w-7xl space-y-7 p-5 md:p-9">
          {/* Welcome */}
          <section>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Good to see you, {firstName}!
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Heres whats happening with your finances.
            </p>
          </section>
          {/* Recent transactions */}
            <ExpenseOverview />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <div className="text-sm text-slate-500">
            Loading your dashboard...
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
