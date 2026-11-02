
from datetime import date
from decimal import Decimal

from fastmcp import FastMCP
from fastmcp.server.dependencies import get_access_token

from DB.get_db import get_db
from services.expense_service import (
    create_expense,
    get_expenses as fetch_expenses,
    update_expense as modify_expense,
    delete_expense as remove_expense,
)

mcp = FastMCP(name="Expense-Tracker")


def get_authenticated_user_id() -> int:
    """Get the user ID from the verified MCP access token."""

    token = get_access_token()

    if token is None:
        raise PermissionError("Authentication required.")

    user_id = token.claims.get("user_id")

    if user_id is None:
        raise PermissionError("User identity missing from access token.")

    try:
        return int(user_id)
    except (TypeError, ValueError):
        raise PermissionError("Invalid user identity.")


def serialize_expense(expense) -> dict:
    """Convert an Expense model into a JSON-friendly dictionary."""

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
    """Add a new expense for the authenticated user."""

    user_id = get_authenticated_user_id()
    db = get_db()

    try:
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
    """Get expenses belonging to the authenticated user."""

    user_id = get_authenticated_user_id()
    db = get_db()

    try:
        expenses = fetch_expenses(
            db=db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            category=category,
        )

        return [serialize_expense(exp) for exp in expenses]
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

    user_id = get_authenticated_user_id()
    db = get_db()

    try:
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

    user_id = get_authenticated_user_id()
    db = get_db()

    try:
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


if __name__ == "__main__":
    mcp.run()
