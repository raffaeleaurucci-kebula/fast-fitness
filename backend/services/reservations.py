from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database_models import ReservationCourse, User, Course
from models import ReservationCourseCreateORM


def get_reservation_or_404(db: Session, reservation_id: int) -> ReservationCourse:
    res = db.get(ReservationCourse, reservation_id)
    if not res:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found.")
    return res


def list_all_reservations(db: Session) -> list[ReservationCourse]:
    return db.query(ReservationCourse).all()


def list_reservations_by_user(db: Session, user_id: int) -> list[ReservationCourse]:
    return db.query(ReservationCourse).filter(ReservationCourse.user_id == user_id).all()


def create_reservation(db: Session, reservation_in: ReservationCourseCreateORM) -> ReservationCourse:
    # Validate entities exist
    if not db.get(User, reservation_in.user_id):
        raise HTTPException(status_code=404, detail="User not found.")
    if not db.get(Course, reservation_in.course_id):
        raise HTTPException(status_code=404, detail="Course not found.")

    # Prevent overlapping reservations for same user/course
    overlapping = db.query(ReservationCourse).filter(
        ReservationCourse.user_id == reservation_in.user_id,
        ReservationCourse.course_id == reservation_in.course_id,
        ReservationCourse.date == reservation_in.date,
        ReservationCourse.from_hour < reservation_in.to_hour,
        ReservationCourse.to_hour > reservation_in.from_hour
    ).first()
    if overlapping:
        raise HTTPException(status_code=409, detail="Overlapping reservation exists.")

    db_res = ReservationCourse(**reservation_in.model_dump())
    db.add(db_res)
    db.commit()
    db.refresh(db_res)
    return db_res


def delete_reservation(db: Session, reservation_id: int) -> ReservationCourse:
    db_res = get_reservation_or_404(db, reservation_id)
    db.delete(db_res)
    db.commit()
    return db_res


def delete_reservation_by_user(db: Session, reservation_id: int, user_id: int) -> ReservationCourse:
    db_res = get_reservation_or_404(db, reservation_id)
    if db_res.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized.")
    db.delete(db_res)
    db.commit()
    return db_res