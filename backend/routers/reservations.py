import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from database import get_db
from models import (
    ReservationCourseCreateORM, ReservationCourseOutORM,
    CurrentUser, UserRole,
)
from routers.auth import get_current_user
from services import reservations as reservation_service

router = APIRouter(
    prefix="/reservations",
    tags=["reservations"],
)

# -------------------------------------------------------------------------
# ADMIN OPERATIONS
# -------------------------------------------------------------------------

@router.get("/list", response_model=list[ReservationCourseOutORM])
def list_all_reservations(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return reservation_service.list_all_reservations(db)


@router.delete("/{reservation_id}", response_model=ReservationCourseOutORM)
def delete_reservation_admin(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return reservation_service.delete_reservation(db, reservation_id)


@router.get("/{course_id}/participants")
def get_course_participant_count(
    course_id: int,
    start_date: datetime.date,
    end_date: datetime.date,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return {
        "course_id": course_id,
        "participants": count_participants_by_course(db, course_id, start_date, end_date)
    }


# -------------------------------------------------------------------------
# USER OPERATIONS
# -------------------------------------------------------------------------

@router.get("/list/{user_id}", response_model=list[ReservationCourseOutORM])
def list_reservations_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return reservation_service.list_reservations_by_user(db, user_id)


@router.post("/create", response_model=ReservationCourseOutORM, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation_in: ReservationCourseCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if reservation_in.user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return reservation_service.create_reservation(db, reservation_in)


@router.delete("/delete/{reservation_id}", response_model=ReservationCourseOutORM)
def delete_reservation_by_user(
    reservation_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return reservation_service.delete_reservation_by_user(db, reservation_id, user_id)