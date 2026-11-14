
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import ExpenseOverview from "./ExpenseOverview";
import { logout } from "../actions/auth";
import AppSidebar from "../components/AppSidebar";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "◫" },
  { label: "Transactions", href: "/transactions", icon: "⇄" },
  { label: "Analytics", href: "/analytics", icon: "▥" },
];

async function DashboardContent() {
    await connection();

  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  const firstName = user.firstName || "there";

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      {/* Sidebar */}
    <AppSidebar>
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

            {/* Keep your existing Sign out form and button here */}
            <form action={logout}>
              <button
                type="submit"
                className="..."
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppSidebar>

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
