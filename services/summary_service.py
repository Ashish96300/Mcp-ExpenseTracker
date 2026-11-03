
from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from DB.models import Expense


def get_monthly_summary(
    db: Session,
    user_id: int,
    month: date,
):
    """
    Returns spending total, transaction count,
    and comparison with the previous month.
    """

    current_start = month.replace(day=1)

    if current_start.month == 12:
        next_start = current_start.replace(
            year=current_start.year + 1,
            month=1,
        )
    else:
        next_start = current_start.replace(
            month=current_start.month + 1,
        )

    previous_start = (
        current_start.replace(day=1)
        if current_start.month > 1
        else current_start.replace(year=current_start.year - 1, month=12)
    )

    if current_start.month == 1:
        previous_start = current_start.replace(
            year=current_start.year - 1,
            month=12,
        )
    else:
        previous_start = current_start.replace(
            month=current_start.month - 1,
        )

    current_total, current_count = (
        db.query(
            func.coalesce(func.sum(Expense.amount), 0),
            func.count(Expense.id),
        )
        .filter(
            Expense.user_id == user_id,
            Expense.date >= current_start,
            Expense.date < next_start,
        )
        .one()
    )

    previous_total = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(
            Expense.user_id == user_id,
            Expense.date >= previous_start,
            Expense.date < current_start,
        )
        .scalar()
    )

    percentage_change = None

    if previous_total > 0:
        percentage_change = (
            (current_total - previous_total) / previous_total
        ) * 100

    return {
        "month": current_start.strftime("%Y-%m"),
        "total_spent": current_total,
        "transaction_count": current_count,
        "previous_month_total": previous_total,
        "percentage_change": percentage_change,
    }


def get_category_summary(
    db: Session,
    user_id: int,
    month: date,
):
    """Returns spending totals grouped by category."""

    month_start = month.replace(day=1)

    if month_start.month == 12:
        next_month = month_start.replace(
            year=month_start.year + 1,
            month=1,
        )
    else:
        next_month = month_start.replace(
            month=month_start.month + 1,
        )

    results = (
        db.query(
            Expense.category,
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("transaction_count"),
        )
        .filter(
            Expense.user_id == user_id,
            Expense.date >= month_start,
            Expense.date < next_month,
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    return [
        {
            "category": category,
            "total": total,
            "transaction_count": count,
        }
        for category, total, count in results
    ]


def get_monthly_trend(
    db: Session,
    user_id: int,
    months: int = 6,
):
    """Returns monthly spending totals for the last N months."""

    today = date.today()
    current_month = today.replace(day=1)

    # Include the current month and the preceding months.
    month_index = current_month.year * 12 + current_month.month - 1
    first_index = month_index - months + 1

    start_year, start_month_index = divmod(first_index, 12)
    start_date = date(start_year, start_month_index + 1, 1)

    results = (
        db.query(
            func.extract("year", Expense.date).label("year"),
            func.extract("month", Expense.date).label("month"),
            func.sum(Expense.amount).label("total"),
            func.count(Expense.id).label("transaction_count"),
        )
        .filter(
            Expense.user_id == user_id,
            Expense.date >= start_date,
            Expense.date < (
                date(current_month.year + 1, 1, 1)
                if current_month.month == 12
                else current_month.replace(month=current_month.month + 1)
            ),
        )
        .group_by(
            func.extract("year", Expense.date),
            func.extract("month", Expense.date),
        )
        .order_by(
            func.extract("year", Expense.date),
            func.extract("month", Expense.date),
        )
        .all()
    )

    # Convert database results into a lookup.
    totals = {
        (int(year), int(month)): {
            "total": total,
            "transaction_count": count,
        }
        for year, month, total, count in results
    }

    # Include months with zero spending.
    trend = []

    for offset in range(months):
        index = first_index + offset
        year, month_index = divmod(index, 12)
        month_number = month_index + 1

        data = totals.get((year, month_number), {})

        trend.append({
            "month": f"{year}-{month_number:02d}",
            "total_spent": data.get("total", 0),
            "transaction_count": data.get("transaction_count", 0),
        })

    return trend
