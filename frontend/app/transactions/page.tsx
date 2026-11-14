
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

import AppSidebar from "../components/AppSidebar";
import TransactionContent from "./TransactionContent";
import { logout } from "../actions/auth";

async function TransactionPageContent() {
  await connection();

  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  const firstName = user.firstName || "there";

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <AppSidebar>
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

              <form action={logout}>
                <button
                  type="submit"
                  className="mt-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </AppSidebar>

      <TransactionContent/>
    </div>
  );
}

export default function TransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          Loading analytics...
        </div>
      }
    >
      <TransactionPageContent/>
    </Suspense>
  );
}
