
import { NextResponse } from "next/server";

const FORWARDED_HEADERS = [
  "content-type",
  "cache-control",
  "retry-after",
  "x-content-type-options",
  "x-frame-options",
  "www-authenticate",
] as const;

export function forwardApiResponse(
  response: Response,
  body: string
): NextResponse {
  const headers = new Headers();

  for (const name of FORWARDED_HEADERS) {
    const value = response.headers.get(name);

    if (value !== null) {
      headers.set(name, value);
    }
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new NextResponse(body, {
    status: response.status,
    headers,
  });
}
