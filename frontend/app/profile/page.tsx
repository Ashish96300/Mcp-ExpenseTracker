
import { withAuth } from "@workos-inc/authkit-nextjs";

export default async function ProfilePage() {
  const { user } = await withAuth();

  if (!user) {
    return <p>Not authenticated</p>;
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
