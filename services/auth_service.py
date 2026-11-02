
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from argon2 import PasswordHasher
from argon2.exceptions import HashingError

from DB.models import User

from argon2.exceptions import (
    VerifyMismatchError,
    VerificationError,
)

password_hasher = PasswordHasher()


def register_user(
    db: Session,
    name: str,
    email: str,
    password: str,
):
    name = name.strip()
    email = email.strip().lower()

    if not name:
        raise ValueError("Name is required.")

    if not email:
        raise ValueError("Email is required.")

    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters.")

    existing_user = db.query(User).filter(
        User.email == email
    ).first()

    if existing_user:
        raise ValueError("Email is already registered.")

    password_hash = password_hasher.hash(password)

    new_user = User(
        name=name,
        email=email,
        password_hash=password_hash,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    except IntegrityError:
        db.rollback()
        raise ValueError("Email is already registered.")

    except Exception:
        db.rollback()
        raise


def authenticate_user(
    db: Session,
    email: str,
    password: str,
):
    email = email.strip().lower()

    user = db.query(User).filter(
        User.email == email
    ).first()

    if user is None:
        return None

    try:
        password_hasher.verify(
            user.password_hash,
            password,
        )
    except (VerifyMismatchError, VerificationError):
        return None

    return user
