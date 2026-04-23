from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from database import get_db
from database_models import CreditCard
from models import (
    CourseOutORM, CourseCreateORM,
    CourseUserCardCreateORM, CourseUserCardOutORM,
    CurrentUser, UserRole,
)
from routers.auth import get_current_user
from services import courses as course_service
from services.courses import (get_course_profit_by_week_daily,
                              get_course_profit_by_month_daily, get_course_profit_by_year_month)

router = APIRouter(
    prefix="/courses",
    tags=["courses"],
)

# -------------------------------------------------------------------------
# ADMIN OPERATIONS
# -------------------------------------------------------------------------

@router.post("/", response_model=CourseOutORM, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return course_service.create_course(db, course_in)


@router.put("/{course_id}", response_model=CourseOutORM, status_code=status.HTTP_200_OK)
def update_course(
    course_id: int,
    course_in: CourseCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return course_service.update_course(db, course_id, course_in)


@router.delete("/{course_id}", response_model=CourseOutORM)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return course_service.delete_course(db, course_id)


@router.get("/profit/week")
def profit_week(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return {"profit_week": get_course_profit_by_week_daily(db)}


@router.get("/profit/month")
def profit_month(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return {"profit_month": get_course_profit_by_month_daily(db)}


@router.get("/profit/year")
def profit_year(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return {"profit_year": get_course_profit_by_year_month(db)}


# -------------------------------------------------------------------------
# USER OPERATIONS
# -------------------------------------------------------------------------

@router.get("/list/{user_id}", response_model=list[CourseUserCardOutORM])
def list_courses_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return course_service.list_courses_by_user(db, user_id)


@router.post("/create_by_user", response_model=CourseUserCardOutORM, status_code=status.HTTP_201_CREATED)
def create_course_by_user(
    course_user_card_in: CourseUserCardCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    db_card = db.get(CreditCard, course_user_card_in.card_id)
    if not db_card or db_card.user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return course_service.create_course_by_user(db, course_user_card_in)


@router.get("/list", response_model=list[CourseOutORM])
def list_courses(
    cost_sup: float = 0,
    db: Session = Depends(get_db),
):
    return course_service.list_courses(db, cost_sup)


@router.delete("/user/{course_user_card_id}", response_model=CourseUserCardOutORM)
def delete_course_by_user(
    course_user_card_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return course_service.delete_course_by_user(db, course_user_card_id, current_user.id)


@router.get("/{course_id}", response_model=CourseOutORM)
def get_course(course_id: int, db: Session = Depends(get_db)):
    return course_service.get_course_or_404(db, course_id)