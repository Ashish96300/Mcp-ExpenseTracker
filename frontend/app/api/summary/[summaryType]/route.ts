
import { NextRequest, NextResponse } from "next/server";
import {
  getFinanceApiHeaders,
  getFinanceApiUrl,
} from "@/lib/finance-api";

const allowedTypes = ["monthly", "categories", "trend"];

type RouteContext = {
  params: Promise<{ summaryType: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { summaryType } = await params;

  if (!allowedTypes.includes(summaryType)) {
    return NextResponse.json(
      { detail: "Summary endpoint not found." },
      { status: 404 }
    );
  }

  try {
    const headers = await getFinanceApiHeaders();

    const query = request.nextUrl.searchParams.toString();

    const url = `${getFinanceApiUrl()}/summary/${summaryType}${
      query ? `?${query}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
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

    console.error("Summary API error:", error);

    return NextResponse.json(
      { detail: "Could not fetch financial summary." },
      { status: 500 }
    );
  }
}
