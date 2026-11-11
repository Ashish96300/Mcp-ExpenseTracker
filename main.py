
import os
from datetime import date
from decimal import Decimal

from dotenv import load_dotenv
from fastmcp import FastMCP
from fastmcp.server.auth.providers.jwt import JWTVerifier
from fastmcp.server.auth.providers.workos import AuthKitProvider
from fastmcp.server.dependencies import get_access_token

from DB.get_db import get_db
from DB.models import User

from services.expense_service import (
    create_expense,
    get_expenses as fetch_expenses,
    update_expense as modify_expense,
    delete_expense as remove_expense,
)
from services.summary_service import (
    get_monthly_summary as fetch_monthly_summary,
    get_category_summary as fetch_category_summary,
    get_monthly_trend as fetch_monthly_trend,
)

load_dotenv()

# WorkOS configuration
AUTHKIT_DOMAIN = os.getenv(
    "AUTHKIT_DOMAIN",
    "https://inspiring-smile-02-staging.authkit.app"
)

# Local default for development.
# Replace this with your Render service URL after deployment.
MCP_BASE_URL = os.getenv(
    "MCP_BASE_URL",
    "http://localhost:8000"
).rstrip("/")


MCP_RESOURCE_URL = f"{MCP_BASE_URL}/mcp"


# Verify WorkOS-issued JWTs.
token_verifier = JWTVerifier(
    jwks_uri=f"{AUTHKIT_DOMAIN}/oauth2/jwks",
    issuer=AUTHKIT_DOMAIN,
    audience=MCP_RESOURCE_URL,
    algorithm="RS256",
)

# Connect AuthKit to FastMCP.
auth_provider = AuthKitProvider(
    authkit_domain=AUTHKIT_DOMAIN,
    base_url=MCP_BASE_URL,
    token_verifier=token_verifier,
)

mcp = FastMCP(
    name="Personal Finance Manager",
    auth=auth_provider,
)


def get_authenticated_user_id(db) -> int:
    """
    Resolve the verified WorkOS identity to our local database user.

    Never accept a user ID supplied by an MCP client or an LLM.
    """

    access_token = get_access_token()

    if access_token is None:
        raise PermissionError("Authentication required.")

    workos_user_id = access_token.claims.get("sub")

    if not isinstance(workos_user_id, str) or not workos_user_id.strip():
        raise PermissionError("Invalid authenticated identity.")
    
    user = (
        db.query(User)
        .filter(User.workos_user_id == workos_user_id)
        .first()
    )

    if user is None:
        raise PermissionError(
            "Your WorkOS account is not linked to a finance account."
        )
    return user.id
    

def serialize_expense(expense) -> dict:
    return {
        "id": expense.id,
        "amount": str(expense.amount),
        "description": expense.description,
        "date": expense.date.isoformat(),
        "category": expense.category,
    }


@mcp.tool()
def add_expenses(
    amount: Decimal,
    description: str,
    expense_date: date,
    category: str,
) -> dict:
    """Add an expense to the authenticated user's account."""

    db = get_db()

    try:
        user_id = get_authenticated_user_id(db)

        expense = create_expense(
            db=db,
            user_id=user_id,
            amount=amount,
            description=description,
            expense_date=expense_date,
            category=category,
        )

        return {
            "message": "Expense added successfully.",
            "expense": serialize_expense(expense),
        }

    finally:
        db.close()


@mcp.tool()
def get_expenses(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
) -> list:
    """Retrieve expenses belonging to the authenticated user."""

    db = get_db()

    try:
        user_id = get_authenticated_user_id(db)

        expenses = fetch_expenses(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            category=category,
        )

        return [serialize_expense(expense) for expense in expenses]

    finally:
        db.close()


@mcp.tool()
def update_expense(
    expense_id: int,
    amount: Decimal | None = None,
    description: str | None = None,
    expense_date: date | None = None,
    category: str | None = None,
) -> dict:
    """Update an expense belonging to the authenticated user."""

    db = get_db()

    try:
        user_id = get_authenticated_user_id(db)

        expense = modify_expense(
            db=db,
            user_id=user_id,
            expense_id=expense_id,
            amount=amount,
            description=description,
            expense_date=expense_date,
            category=category,
        )

        if expense is None:
            return {"message": "Expense not found."}

        return {
            "message": "Expense updated successfully.",
            "expense": serialize_expense(expense),
        }

    finally:
        db.close()


@mcp.tool()
def delete_expense(expense_id: int) -> dict:
    """Delete an expense belonging to the authenticated user."""

    db = get_db()

    try:
        user_id = get_authenticated_user_id(db)

        deleted = remove_expense(
            db=db,
            user_id=user_id,
            expense_id=expense_id,
        )

        if not deleted:
            return {"message": "Expense not found."}

        return {"message": "Expense deleted successfully."}

    finally:
        db.close()


@mcp.tool()
def get_monthly_summary(month: date) -> dict:
    """
    Get the authenticated user's monthly spending summary,
    including comparison with the previous month.

    Provide any date within the requested month.
    """
    db = get_db()

    try:
        user_id = get_authenticated_user_id(db)

        result = fetch_monthly_summary(
            db=db,
            user_id=user_id,
            month=month,
        )

        return {
            "month": result["month"],
            "total_spent": str(result["total_spent"]),
            "transaction_count": result["transaction_count"],
            "previous_month_total": str(
                result["previous_month_total"]
            ),
            "percentage_change": (
                str(result["percentage_change"])
                if result["percentage_change"] is not None
                else None
            ),
        }

    finally:
        db.close()


@mcp.tool()
def get_category_summary(month: date) -> list:
    """
    Get the authenticated user's spending breakdown
    by category for a particular month.
    """
    db = get_db()

    try:
        user_id = get_authenticated_user_id(db)

        results = fetch_category_summary(
            db=db,
            user_id=user_id,
            month=month,
        )

        return [
            {
                "category": item["category"],
                "total": str(item["total"]),
                "transaction_count": item["transaction_count"],
            }
            for item in results
        ]

    finally:
        db.close()


@mcp.tool()
def get_monthly_trend(months: int = 6) -> list:
    """
    Get the authenticated user's monthly spending trend.

    Includes the current month and preceding months.
    Maximum supported range is 24 months.
    """
    if not 1 <= months <= 24:
        raise ValueError("Months must be between 1 and 24.")

    db = get_db()

    try:
        user_id = get_authenticated_user_id(db)

        results = fetch_monthly_trend(
            db=db,
            user_id=user_id,
            months=months,
        )

        return [
            {
                "month": item["month"],
                "total_spent": str(item["total_spent"]),
                "transaction_count": item["transaction_count"],
            }
            for item in results
        ]

    finally:
        db.close()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))

    mcp.run(
        transport="http",
        host="0.0.0.0",
        port=port,
        path="/mcp",
    )




# fetch("/api/expenses", {
#   method: "POST",
#   headers: {
#     "Content-Type": "application/json"
#   },
#   body: JSON.stringify({
#     amount: 250,
#     description: "Dinner",
#     expense_date: "2026-11-03",
#     category: "Food"
#   })
# })
# .then(res => res.json())
# .then(console.log);