import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database_models import Course, CourseUserCard, CreditCard, User, SubscriptionUserCard
from models import CourseCreateORM, CourseUserCardCreateORM
from routers import subscriptions
from routers.subscriptions import list_subscriptions_by_user


def get_course_or_404(db: Session, course_id: int) -> Course:
    db_course = db.get(Course, course_id)
    if not db_course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found.")
    return db_course


def create_course(db: Session, course_in: CourseCreateORM) -> Course:
    db_course = Course(**course_in.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def update_course(db: Session, course_id: int, course_in: CourseCreateORM) -> Course:
    db_course = get_course_or_404(db, course_id)
    for attr, value in course_in.model_dump().items():
        setattr(db_course, attr, value)
    db.commit()
    db.refresh(db_course)
    return db_course


def delete_course(db: Session, course_id: int) -> Course:
    db_course = get_course_or_404(db, course_id)
    db.delete(db_course)
    db.commit()
    return db_course


# FIX: user_id rimosso da CourseUserCard — join tramite CreditCard per filtrare per utente
def list_courses_by_user(db: Session, user_id: int) -> list[CourseUserCard]:
    return (
        db.query(CourseUserCard)
        .join(CreditCard, CourseUserCard.card_id == CreditCard.id)
        .filter(CourseUserCard.course_id != None,
                CourseUserCard.cancelled == False)
        .all()
    )


def list_courses(db: Session, cost_sup: float) -> list[Course]:
    return db.query(Course).filter(Course.cost >= cost_sup).all()


def create_course_by_user(db: Session, course_card_in: CourseUserCardCreateORM) -> CourseUserCard:
    db_card = db.get(CreditCard, course_card_in.card_id)
    db_course = db.get(Course, course_card_in.course_id)
    if not db_card:
        raise HTTPException(status_code=404, detail="Credit card not found.")
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found.")

    # Prevenire doppia iscrizione attiva allo stesso corso per lo stesso utente
    # (via join su CreditCard per risalire all'utente)
    existing = (
        db.query(CourseUserCard)
        .join(CreditCard, CourseUserCard.card_id == CreditCard.id)
        .filter(
            CreditCard.user_id == db_card.user_id,
            CourseUserCard.expiry_date >= course_card_in.init_date,
            CourseUserCard.course_id == course_card_in.course_id,
            CourseUserCard.cancelled == False,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="User already has an active enrollment for this course.",
        )

    if db_course.require_subscription:
        # check if user has an active subscription
        exist_subscription = (db.query(SubscriptionUserCard)
        .join(CreditCard, SubscriptionUserCard.card_id == CreditCard.id)
        .filter(CreditCard.user_id == db_card.user_id,
                SubscriptionUserCard.subscription_id != None,
                SubscriptionUserCard.cancelled == False)
        .all())

        if not exist_subscription:
            raise HTTPException(status_code=409, detail="Subscription required for this course.")

    db_course_card = CourseUserCard(**course_card_in.model_dump())
    db.add(db_course_card)
    db.commit()
    db.refresh(db_course_card)
    return db_course_card


def delete_course_by_user(db: Session, course_user_card_id: int, user_id: int) -> CourseUserCard:
    db_course_card = db.get(CourseUserCard, course_user_card_id)
    if not db_course_card:
        raise HTTPException(status_code=404, detail="CourseUserCard not found.")

    db_card = db.get(CreditCard, db_course_card.card_id)
    if not db_card or db_card.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized.")

    # cancellazione logica
    db_course_card.automatic_renewal = False
    db_course_card.cancelled = True

    db.commit()
    db.refresh(db_course_card)

    return db_course_card


def _get_course_profit_between(db: Session, start_date: datetime.date, end_date: datetime.date) -> float:
    total = (
        db.query(func.sum(CourseUserCard.paid_amount))
        .filter(
            CourseUserCard.init_date >= start_date,
            CourseUserCard.init_date <= end_date,
        )
        .scalar()
    )
    return float(total or 0)


def get_course_profit_by_week(db: Session) -> float:
    today = datetime.date.today()
    start_week = today - datetime.timedelta(days=today.weekday())
    end_week = start_week + datetime.timedelta(days=6)
    return _get_course_profit_between(db, start_week, end_week)


def get_course_profit_by_month(db: Session) -> float:
    today = datetime.date.today()
    start_month = today.replace(day=1)
    if today.month == 12:
        next_month = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month = today.replace(month=today.month + 1, day=1)
    end_month = next_month - datetime.timedelta(days=1)
    return _get_course_profit_between(db, start_month, end_month)


def get_course_profit_by_year(db: Session) -> float:
    today = datetime.date.today()
    start_year = today.replace(month=1, day=1)
    end_year = today.replace(month=12, day=31)
    return _get_course_profit_between(db, start_year, end_year)