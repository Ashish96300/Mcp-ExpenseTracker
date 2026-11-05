import { Suspense } from "react";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type React from "react";

async function HomeContent(): Promise<React.ReactNode> {
  await connection();

  const { user } = await withAuth();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/sign-in");
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          Loading Finora...
        </main>
      }
    >
      <HomeContent />
    </Suspense>
  );
}