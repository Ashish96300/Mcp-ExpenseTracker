
import os
import hmac
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import Generator

import jwt
from dotenv import load_dotenv
from fastapi import (
    FastAPI,
    Depends,
    Header,
    HTTPException,
    Query,
    status,
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from DB.get_db import get_db
from DB.models import User
from services.auth_service import provision_workos_user
from services.expense_service import (
    create_expense,
    get_expenses as fetch_expenses,
    get_expenses_paginated as fetch_paginated_expenses,
    update_expense as modify_expense,
    delete_expense as remove_expense,
)


from datetime import datetime

from services.summary_service import (
    get_monthly_summary,
    get_category_summary,
    get_monthly_trend,
)

from starlette.middleware.trustedhost import TrustedHostMiddleware
from fastapi import Request
from services.rate_limiter import rate_limiter
from services.rate_limiter import RateLimitStatus

load_dotenv()

#--------------------------------------------------------------------------------------------
# app = FastAPI(title="Personal Finance API")

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

raw_allowed_hosts = os.getenv("ALLOWED_HOSTS", "")

if raw_allowed_hosts.strip():
    ALLOWED_HOSTS = [
        host.strip()
        for host in raw_allowed_hosts.split(",")
        if host.strip()
    ]
elif ENVIRONMENT == "production":
    raise RuntimeError(
        "ALLOWED_HOSTS must be configured in production."
    )
else:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]

if "*" in ALLOWED_HOSTS:
    raise RuntimeError(
        "Wildcard hosts are not allowed."
    )

app = FastAPI(
    title="Personal Finance API",
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc",
    openapi_url=None if ENVIRONMENT == "production" else "/openapi.json",
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=ALLOWED_HOSTS,
)
@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Cache-Control"] = "no-store"

    return response
#-------------------------------------------------------------------------------------------
# Internal JWT configuration
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET")
INTERNAL_API_ISSUER = "finora-web"
INTERNAL_API_AUDIENCE = os.getenv(
    "INTERNAL_API_AUDIENCE",
    "http://localhost:8001",
)

security = HTTPBearer(auto_error=False)


# --------------------------------------------------
# DATABASE DEPENDENCY
# --------------------------------------------------

def get_db_session() -> Generator[Session, None, None]:
    db = get_db()
    try:
        yield db
    finally:
        db.close()


# --------------------------------------------------
# AUTHENTICATION DEPENDENCY
# --------------------------------------------------

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db_session),
) -> int:

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    if not INTERNAL_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API authentication is not configured.",
        )

    try:
        claims = jwt.decode(
            credentials.credentials,
            INTERNAL_API_SECRET,
            algorithms=["HS256"],
            issuer=INTERNAL_API_ISSUER,
            audience=INTERNAL_API_AUDIENCE,
            options={
                "require": ["exp", "iat", "iss", "aud", "sub"]
            },
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )

    workos_user_id = claims.get("sub")

    if not isinstance(workos_user_id, str) or not workos_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identity.",
        )

    user = (
        db.query(User)
        .filter(User.workos_user_id == workos_user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Finance account not found.",
        )

    return user.id


# --------------------------------------------------
# RATE LIMITING
# --------------------------------------------------

def rate_limit_user(limit: int, action: str):
    def dependency(
        user_id: int = Depends(get_current_user_id),
    ) -> int:
        status, retry_after = rate_limiter.check(
            key=f"api:{action}:user:{user_id}",
            limit=limit,
            window_seconds=60,
        )

        if status == RateLimitStatus.CAPACITY_EXCEEDED:
            raise HTTPException(
                status_code=503,
                detail="Rate limiter capacity temporarily exhausted.",
                headers={"Retry-After": str(retry_after)},
            )

        if status == RateLimitStatus.RATE_LIMITED:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        return user_id

    return dependency

READ_LIMIT = int(os.getenv("RATE_LIMIT_READS_PER_MINUTE", "60"))
WRITE_LIMIT = int(os.getenv("RATE_LIMIT_WRITES_PER_MINUTE", "20"))
PROVISIONING_LIMIT = int(
    os.getenv("RATE_LIMIT_PROVISIONING_PER_MINUTE", "10")
)

get_rate_limited_reader = rate_limit_user(READ_LIMIT, "read")
get_rate_limited_writer = rate_limit_user(WRITE_LIMIT, "write")

# --------------------------------------------------
# REQUEST SCHEMAS
# --------------------------------------------------

class CreateExpenseRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    description: str = Field(min_length=1, max_length=500)
    expense_date: date
    category: str = Field(min_length=1, max_length=100)


class UpdateExpenseRequest(BaseModel):
    amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    description: str | None = Field(
        default=None, min_length=1, max_length=500
    )
    expense_date: date | None = None
    category: str | None = Field(
        default=None, min_length=1, max_length=100
    )


# --------------------------------------------------
# RESPONSE SERIALIZATION
# --------------------------------------------------

def serialize_expense(expense) -> dict:
    return {
        "id": expense.id,
        "amount": str(expense.amount),
        "description": expense.description,
        "date": expense.date.isoformat(),
        "category": expense.category,
    }


# --------------------------------------------------
# USER PROVISIONING
# --------------------------------------------------

class ProvisionUserRequest(BaseModel):
    workos_user_id: str = Field(min_length=1, max_length=255)
    email: str = Field(min_length=3, max_length=320)
    name: str = Field(min_length=1, max_length=255)


@app.post("/internal/users/provision")
def provision_user(
    payload: ProvisionUserRequest,
    x_provisioning_secret: str = Header(
        alias="X-Provisioning-Secret"
    ),
    db: Session = Depends(get_db_session),
):
    expected_secret = os.getenv("PROVISIONING_SECRET")

    status, retry_after = rate_limiter.check(
        key="api:provisioning:global",
        limit=PROVISIONING_LIMIT,
        window_seconds=60,
)

    if status == RateLimitStatus.CAPACITY_EXCEEDED:
        raise HTTPException(
            status_code=503,
            detail="Rate limiter capacity temporarily exhausted.",
            headers={"Retry-After": str(retry_after)},
        )

    if status == RateLimitStatus.RATE_LIMITED:
        raise HTTPException(
            status_code=429,
            detail="Too many provisioning requests. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    if not expected_secret:
        raise HTTPException(
            status_code=503,
            detail="Provisioning is not configured.",
        )

    if not hmac.compare_digest(
        x_provisioning_secret,
        expected_secret,
    ):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized.",
        )

    try:
        user, created = provision_workos_user(
            db=db,
            workos_user_id=payload.workos_user_id,
            email=payload.email,
            name=payload.name,
        )

        return {
            "message": (
                "Finance account created."
                if created
                else "Finance account already exists."
            ),
            "user_id": user.id,
            "created": created,
        }

    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error))


# --------------------------------------------------
# CREATE EXPENSE
# --------------------------------------------------

@app.post("/expenses", status_code=status.HTTP_201_CREATED)
def add_expense(
    payload: CreateExpenseRequest,
    # user_id: int = Depends(get_current_user_id),
    user_id: int = Depends(get_rate_limited_writer),
    db: Session = Depends(get_db_session),
):

    expense = create_expense(
        db=db,
        user_id=user_id,
        amount=payload.amount,
        description=payload.description,
        expense_date=payload.expense_date,
        category=payload.category,
    )

    return {
        "message": "Expense created successfully.",
        "expense": serialize_expense(expense),
    }


# --------------------------------------------------
# GET EXPENSES
# --------------------------------------------------


@app.get("/expenses")
def get_user_expenses(
    start_date: date | None = None,
    end_date: date | None = None,
    category: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    # user_id: int = Depends(get_current_user_id),
    user_id: int = Depends(get_rate_limited_reader),
    db: Session = Depends(get_db_session),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=422,
            detail="Start date cannot be after end date.",
        )

    result = fetch_paginated_expenses(
        db=db,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        category=category,
        page=page,
        limit=limit,
    )

    return {
        "items": [
            serialize_expense(expense)
            for expense in result["items"]
        ],
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "total_pages": result["total_pages"],
    }

from datetime import datetime


@app.get("/summary/monthly")
def monthly_summary(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    #user_id: int = Depends(get_current_user_id),
     user_id: int = Depends(get_rate_limited_reader),
    db: Session = Depends(get_db_session),
):
    try:
        month_date = datetime.strptime(month, "%Y-%m").date()
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid month. Use YYYY-MM format.",
        )

    result = get_monthly_summary(db, user_id, month_date)

    return {
        "month": result["month"],
        "total_spent": str(result["total_spent"]),
        "transaction_count": result["transaction_count"],
        "previous_month_total": str(result["previous_month_total"]),
        "percentage_change": (
            float(result["percentage_change"])
            if result["percentage_change"] is not None
            else None
        ),
    }


@app.get("/summary/categories")
def category_summary(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    # user_id: int = Depends(get_current_user_id),
    user_id: int = Depends(get_rate_limited_reader),
    db: Session = Depends(get_db_session),
):
    try:
        month_date = datetime.strptime(month, "%Y-%m").date()
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid month. Use YYYY-MM format.",
        )

    results = get_category_summary(db, user_id, month_date)

    return [
        {
            "category": item["category"],
            "total": str(item["total"]),
            "transaction_count": item["transaction_count"],
        }
        for item in results
    ]


@app.get("/summary/trend")
def monthly_trend(
    months: int = Query(default=6, ge=1, le=24),
    # user_id: int = Depends(get_current_user_id),
    user_id: int = Depends(get_rate_limited_reader),
    db: Session = Depends(get_db_session),
):
    results = get_monthly_trend(db, user_id, months)

    return [
        {
            "month": item["month"],
            "total_spent": str(item["total_spent"]),
            "transaction_count": item["transaction_count"],
        }
        for item in results
    ]

# --------------------------------------------------
# UPDATE EXPENSE
# --------------------------------------------------

@app.patch("/expenses/{expense_id}")
def update_user_expense(
    expense_id: int,
    payload: UpdateExpenseRequest,
    # user_id: int = Depends(get_current_user_id),
    user_id: int = Depends( get_rate_limited_writer),
    db: Session = Depends(get_db_session),
):

    updates = payload.model_dump(exclude_unset=True)

    if not updates or all(value is None for value in updates.values()):
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update.",
        )

    expense = modify_expense(
        db=db,
        user_id=user_id,
        expense_id=expense_id,
        **updates,
    )

    if expense is None:
        raise HTTPException(
            status_code=404,
            detail="Expense not found.",
        )

    return {
        "message": "Expense updated successfully.",
        "expense": serialize_expense(expense),
    }


# --------------------------------------------------
# DELETE EXPENSE
# --------------------------------------------------

@app.delete("/expenses/{expense_id}")
def delete_user_expense(
    expense_id: int,
    # user_id: int = Depends(get_current_user_id),
    user_id: int = Depends(get_rate_limited_writer),
    db: Session = Depends(get_db_session),
):

    deleted = remove_expense(
        db=db,
        user_id=user_id,
        expense_id=expense_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Expense not found.",
        )

    return {"message": "Expense deleted successfully."}
