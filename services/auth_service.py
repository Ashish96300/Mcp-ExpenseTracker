
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from DB.models import User


def provision_workos_user(
    db: Session,
    workos_user_id: str,
    email: str,
    name: str,
):
    email = email.strip().lower()
    name = name.strip() or email

    # Check whether this WorkOS identity already exists.
    user = (
        db.query(User)
        .filter(User.workos_user_id == workos_user_id)
        .first()
    )

    if user:
        # Never allow an email already linked to another identity.
        email_owner = (
            db.query(User)
            .filter(User.email == email, User.id != user.id)
            .first()
        )

        if email_owner:
            raise ValueError("This email is linked to another account.")

        user.email = email
        user.name = name
        db.commit()
        db.refresh(user)

        return user, False

    # Prevent silently linking an existing account by email.
    email_owner = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if email_owner:
        raise ValueError("This email is already linked to another account.")

    user = User(
        workos_user_id=workos_user_id,
        email=email,
        name=name,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
        return user, True

    except IntegrityError:
        db.rollback()

        # Handle a concurrent request for the same WorkOS identity.
        user = (
            db.query(User)
            .filter(User.workos_user_id == workos_user_id)
            .first()
        )

        if user:
            return user, False

        raise ValueError("Could not create the finance account.")
