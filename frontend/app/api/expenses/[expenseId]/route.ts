import { NextRequest, NextResponse } from "next/server";
import {
  getFinanceApiHeaders,
  getFinanceApiUrl,
} from "@/lib/finance-api";

// export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ expenseId: string }>;
};

function validateExpenseId(id: string): boolean {
  const parsed = Number(id);
  return Number.isSafeInteger(parsed) && parsed > 0;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { expenseId } = await params;

    if (!validateExpenseId(expenseId)) {
      return NextResponse.json(
        { detail: "Invalid expense ID." },
        { status: 400 }
      );
    }

    const headers = await getFinanceApiHeaders();
    const body = await request.json();

    const response = await fetch(
      `${getFinanceApiUrl()}/expenses/${expenseId}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
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

    console.error("PATCH /api/expenses failed:", error);

    return NextResponse.json(
      { detail: "Could not update expense." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { expenseId } = await params;

    if (!validateExpenseId(expenseId)) {
      return NextResponse.json(
        { detail: "Invalid expense ID." },
        { status: 400 }
      );
    }

    const headers = await getFinanceApiHeaders();

    const response = await fetch(
      `${getFinanceApiUrl()}/expenses/${expenseId}`,
      {
        method: "DELETE",
        headers,
        cache: "no-store",
      }
    );

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
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

    console.error("DELETE /api/expenses failed:", error);

    return NextResponse.json(
      { detail: "Could not delete expense." },
      { status: 500 }
    );
  }
}