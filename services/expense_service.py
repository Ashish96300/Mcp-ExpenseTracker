from sqlalchemy.orm import Session
from DB.models import Expense
from datetime import date
from decimal import Decimal


def create_expense(
    db: Session,
    user_id: int,
    amount: Decimal,
    description: str,
    expense_date: date,
    category: str,
):
    new_expense = Expense(
        amount=amount,
        description=description,
        date=expense_date,
        category=category,
        user_id=user_id,
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


def get_expenses(
    db: Session,
    user_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
):
    query = db.query(Expense).filter(
        Expense.user_id == user_id
    )

    if start_date:
        query = query.filter(Expense.date >= start_date)

    if end_date:
        query = query.filter(Expense.date <= end_date)

    if category:
        query = query.filter(Expense.category == category)

    return query.order_by(Expense.date.desc()).all()


def get_expenses_paginated(
    db: Session,
    user_id: int,
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = None,
    page: int = 1,
    limit: int = 10,
):
    query = db.query(Expense).filter(
        Expense.user_id == user_id
    )

    if start_date:
        query = query.filter(Expense.date >= start_date)

    if end_date:
        query = query.filter(Expense.date <= end_date)

    if category:
        query = query.filter(Expense.category == category)

    # Count matching records before applying pagination.
    total = query.count()

    # Fetch only the requested page.
    offset = (page - 1) * limit

    items = (
        query
        .order_by(Expense.date.desc(), Expense.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (total + limit - 1) // limit

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages,
    }


def update_expense(
    db: Session,
    user_id: int,
    expense_id: int,
    amount: Decimal | None = None,
    description: str | None = None,
    expense_date: date | None = None,
    category: str | None = None,
):
    expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
        .first()
    )

    if expense is None:
        return None

    if amount is not None:
        expense.amount = amount

    if description is not None:
        expense.description = description

    if expense_date is not None:
        expense.date = expense_date

    if category is not None:
        expense.category = category

    db.commit()
    db.refresh(expense)

    return expense



def delete_expense(
    db: Session,
    user_id: int,
    expense_id: int,
):
    expense = (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
        .first()
    )

    if expense is None:
        return False

    db.delete(expense)
    db.commit()

    return True
