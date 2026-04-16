from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database_models import User
from models import UserCreateORM, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user_or_404(db: Session, user_id: int) -> User:
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User {user_id} not found")
    return db_user


def assert_username_unique(db: Session, username: str, exclude_user_id: int = None):
    q = db.query(User).filter(User.username == username)
    if exclude_user_id:
        q = q.filter(User.id != exclude_user_id)
    if q.first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username già in uso.")


def assert_email_unique(db: Session, email: str, exclude_user_id: int = None):
    q = db.query(User).filter(User.email == email)
    if exclude_user_id:
        q = q.filter(User.id != exclude_user_id)
    if q.first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email già registrata.")


def create_user(db: Session, user_in: UserCreateORM) -> User:
    assert_username_unique(db, user_in.username)
    assert_email_unique(db, user_in.email)

    hashed_pw = pwd_context.hash(user_in.password)
    db_user = User(
        **user_in.model_dump(exclude={"password", "new_password"}),
        password=hashed_pw,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_in: UserCreateORM, current_user_id: int, is_admin: bool) -> User:
    # Only the owner or an admin can update
    if current_user_id != user_id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    db_user = get_user_or_404(db, user_id)

    # Check uniqueness only if value changed
    if user_in.username != db_user.username:
        assert_username_unique(db, user_in.username, exclude_user_id=user_id)
    if user_in.email != db_user.email:
        assert_email_unique(db, user_in.email, exclude_user_id=user_id)

    if not pwd_context.verify(user_in.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password inserita differente da quella corrente.",
        )

    # Update scalar fields
    db_user.name = user_in.name
    db_user.surname = user_in.surname
    db_user.date_of_birth = user_in.date_of_birth
    db_user.location_of_birth = user_in.location_of_birth
    db_user.country = user_in.country
    db_user.street_address = user_in.street_address
    db_user.street_number = user_in.street_number
    db_user.city = user_in.city
    db_user.zip_code = user_in.zip_code
    db_user.phone_number = user_in.phone_number
    db_user.username = user_in.username
    db_user.email = user_in.email

    # Change password only if a new one is provided
    if user_in.new_password:
        if pwd_context.verify(user_in.new_password, db_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must differ from the current one.",
            )
        db_user.password = pwd_context.hash(user_in.new_password)

    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int, current_user_id: int, is_admin: bool) -> User:
    # Only the owner or an admin can delete
    if current_user_id != user_id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")

    db_user = get_user_or_404(db, user_id)
    db.delete(db_user)
    db.commit()
    return db_user


def list_users(db: Session, limit: int) -> list[User]:
    return db.query(User).limit(limit).all()