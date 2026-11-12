import { NextRequest, NextResponse } from "next/server";
import {
  getFinanceApiHeaders,
  getFinanceApiUrl,
} from "@/lib/finance-api";
import { forwardApiResponse } from "@/lib/forward-api-response";

// export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const headers = await getFinanceApiHeaders();

    const query = request.nextUrl.searchParams.toString();
    const url = `${getFinanceApiUrl()}/expenses${query ? `?${query}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.text();

    // return new NextResponse(data, {
    //   status: response.status,
    //   headers: {
    //     "Content-Type":
    //       response.headers.get("Content-Type") ?? "application/json",
    //   },
    // });
    return forwardApiResponse(response, data);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        { detail: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("GET /api/expenses failed:", error);

    return NextResponse.json(
      { detail: "Could not retrieve expenses." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const headers = await getFinanceApiHeaders();
    const body = await request.json();

    const response = await fetch(`${getFinanceApiUrl()}/expenses`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.text();

    // return new NextResponse(data, {
    //   status: response.status,
    //   headers: {
    //     "Content-Type":
    //       response.headers.get("Content-Type") ?? "application/json",
    //   },
    // });
    return forwardApiResponse(response, data);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        { detail: "Authentication required." },
        { status: 401 }
      );
    }

    console.error("POST /api/expenses failed:", error);

    return NextResponse.json(
      { detail: "Could not create expense." },
      { status: 500 }
    );
  }
}