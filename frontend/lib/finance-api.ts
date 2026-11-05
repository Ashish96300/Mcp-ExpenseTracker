
import { withAuth } from "@workos-inc/authkit-nextjs";
import { SignJWT } from "jose";

const API_URL = process.env.FINANCE_API_URL;
const API_SECRET = process.env.INTERNAL_API_SECRET;

const API_AUDIENCE =
  process.env.INTERNAL_API_AUDIENCE ?? "http://localhost:8001";

export async function getFinanceApiHeaders() {
  const { user } = await withAuth();

  if (!user) {
    throw new Error("Authentication required.");
  }

  if (!API_SECRET) {
    throw new Error("Internal API secret is not configured.");
  }

  const secret = new TextEncoder().encode(API_SECRET);

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer("finora-web")
    .setAudience(API_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function getFinanceApiUrl() {
  if (!API_URL) {
    throw new Error("Finance API URL is not configured.");
  }

  return API_URL;
}

