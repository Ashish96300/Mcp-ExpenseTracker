import { Suspense } from "react";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { connection } from "next/server";

async function ProfileContent() {
  await connection();

  const { user } = await withAuth();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Authenticated User</h1>
      <pre className="mt-4 rounded-lg bg-gray-100 p-4 text-black">
        {JSON.stringify(
          {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="p-10">Loading profile...</main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}