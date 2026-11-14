
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { logout } from "../actions/auth";
import AppSidebar from "../components/AppSidebar";
import HelpGuide from "../components/HelpGuide";

async function HelpContent() {
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold">
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
                <button type="submit" className="...">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </AppSidebar>

      <main className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5 md:px-9">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Help & Guides
            </h2>
            <p className="text-sm text-slate-500">
              Get started with Finora in your AI client
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl space-y-7 p-5 md:p-9">
          <HelpGuide/>
        </div>
      </main>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-sm text-slate-500">
            Loading Help & Guides...
          </p>
        </div>
      }
    >
      <HelpContent />
    </Suspense>
  );
}
