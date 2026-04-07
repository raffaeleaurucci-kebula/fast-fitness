from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from starlette.status import HTTP_401_UNAUTHORIZED

from database import get_db
from models import UserCreateORM, UserOutORM, CurrentUser, UserRole
from services.users import pwd_context
from services import users as user_service

from routers.auth import get_current_user

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.post("/", response_model=UserOutORM, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreateORM, db: Session = Depends(get_db)):
    return user_service.create_user(db, user_in)


@router.get("/{user_id}", response_model=UserOutORM)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return user_service.get_user_or_404(db, user_id)


@router.get("/", response_model=list[UserOutORM])
def list_users(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        from fastapi import HTTPException
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return user_service.list_users(db, limit)


@router.put("/{user_id}", response_model=UserOutORM, status_code=status.HTTP_200_OK)
def update_user(
    user_id: int,
    user_in: UserCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return user_service.update_user(
        db, user_id, user_in,
        current_user_id=current_user.id,
        is_admin=(current_user.role == UserRole.ADMIN),
    )


@router.delete("/{user_id}", response_model=UserOutORM, status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return user_service.delete_user(
        db, user_id,
        current_user_id=current_user.id,
        is_admin=(current_user.role == UserRole.ADMIN),
    )