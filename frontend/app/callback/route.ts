
import { handleAuth } from "@workos-inc/authkit-nextjs";

export const GET = handleAuth({
  returnPathname: "/",

  onSuccess: async ({ user }) => {
    const apiUrl = process.env.FINANCE_API_URL;
    const secret = process.env.PROVISIONING_SECRET;

    if (!apiUrl || !secret) {
      throw new Error("Finance API configuration is missing.");
    }

    const name = [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const response = await fetch(
      `${apiUrl}/internal/users/provision`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Provisioning-Secret": secret,
        },
        body: JSON.stringify({
          workos_user_id: user.id,
          email: user.email,
          name: name || user.email,
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Account provisioning failed:", error);

      throw new Error("Could not provision your finance account.");
    }
  },
});
