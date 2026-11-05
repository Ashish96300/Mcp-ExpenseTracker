// import { withAuth } from "@workos-inc/authkit-nextjs";
// import { redirect } from "next/navigation";
// import { connection } from "next/server";

// export default async function Home() {
//   await connection();

//   const { user } = await withAuth();

//   if (user) {
//     redirect("/dashboard");
//   }

//   redirect("/sign-in");
// }
import { withAuth } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const instant = false;

export default async function Home() {
  await connection();

  const { user } = await withAuth();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/sign-in");
}