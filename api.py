
import os
import hmac

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from DB.get_db import get_db
from services.auth_service import provision_workos_user


app = FastAPI(title="Personal Finance API")


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
):
    expected_secret = os.getenv("PROVISIONING_SECRET")

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

    db = get_db()

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

    finally:
        db.close()
