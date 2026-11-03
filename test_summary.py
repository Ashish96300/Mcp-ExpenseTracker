
from datetime import date

from DB.get_db import get_db
from services.summary_service import (
    get_monthly_summary,
    get_category_summary,
    get_monthly_trend,
)

db = get_db()

try:
    user_id = 1  # Your local test user
    month = date.today().replace(day=1)

    print("\nMONTHLY SUMMARY")
    print(get_monthly_summary(db, user_id, month))

    print("\nCATEGORY SUMMARY")
    print(get_category_summary(db, user_id, month))

    print("\nMONTHLY TREND")
    print(get_monthly_trend(db, user_id, months=6))

finally:
    db.close()
