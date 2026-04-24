import datetime

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from database_models import Subscription, SubscriptionUserCard, CreditCard, User
from models import SubscriptionCreateORM, SubscriptionUserCardCreateORM


def get_subscription_or_404(db: Session, subscription_id: int) -> Subscription:
    db_sub = db.get(Subscription, subscription_id)
    if not db_sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
    return db_sub


def create_subscription(db: Session, subscription_in: SubscriptionCreateORM) -> Subscription:
    db_sub = Subscription(**subscription_in.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub


def update_subscription(db: Session, subscription_id: int, subscription_in: SubscriptionCreateORM) -> Subscription:
    db_sub = get_subscription_or_404(db, subscription_id)
    db_sub.cost = subscription_in.cost
    db_sub.title = subscription_in.title
    db_sub.description = subscription_in.description
    db_sub.duration_month = subscription_in.duration_month
    db_sub.weekly_accesses = subscription_in.weekly_accesses
    db.commit()
    db.refresh(db_sub)
    return db_sub


def delete_subscription(db: Session, subscription_id: int) -> Subscription:
    db_sub = get_subscription_or_404(db, subscription_id)
    db.delete(db_sub)
    db.commit()
    return db_sub


def list_subscriptions_by_user(db: Session, user_id: int) -> list[SubscriptionUserCard]:
    return (
        db.query(SubscriptionUserCard)
        .join(CreditCard, SubscriptionUserCard.card_id == CreditCard.id)
        .filter(CreditCard.user_id == user_id,
                SubscriptionUserCard.subscription_id != None,
                SubscriptionUserCard.cancelled == False)
        .all()
    )


def list_subscriptions(db: Session, cost_sup: float) -> list[Subscription]:
    return db.query(Subscription).filter(Subscription.cost >= cost_sup).all()


def create_subscription_by_user(
    db: Session, sub_card_in: SubscriptionUserCardCreateORM
) -> SubscriptionUserCard:
    # Valida carta e subscription
    db_card = db.get(CreditCard, sub_card_in.card_id)
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card not found.")
    if not db.get(Subscription, sub_card_in.subscription_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

    # Prevenire doppio abbonamento attivo allo stesso piano per lo stesso utente
    # (via join su CreditCard per risalire all'utente)
    existing = (
        db.query(SubscriptionUserCard)
        .join(CreditCard, SubscriptionUserCard.card_id == CreditCard.id)
        .filter(
            CreditCard.user_id == db_card.user_id,
            SubscriptionUserCard.expiry_date >= sub_card_in.init_date,
            SubscriptionUserCard.cancelled == False,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Hai già un abbonamento attivo. Attendi la scadenza oppure annulla quello corrente.",
        )

    db_sub_card = SubscriptionUserCard(**sub_card_in.model_dump())
    db.add(db_sub_card)
    db.commit()
    db.refresh(db_sub_card)
    return db_sub_card


def delete_subscription_by_user(
    db: Session,
    subscription_user_card_id: int,
    user_id: int
) -> SubscriptionUserCard:

    db_sub_card = db.get(SubscriptionUserCard, subscription_user_card_id)

    if not db_sub_card:
        raise HTTPException(status_code=404, detail="Subscription not found.")

    db_card = db.get(CreditCard, db_sub_card.card_id)

    if not db_card or db_card.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized.")

    # cancellazione logica
    db_sub_card.automatic_renewal = False
    db_sub_card.cancelled = True

    db.commit()
    db.refresh(db_sub_card)

    return db_sub_card


def get_subscriptions_profit_by_week_daily(db: Session):
    today = datetime.date.today()
    start_week = today - datetime.timedelta(days=today.weekday())
    end_week = start_week + datetime.timedelta(days=6)

    results = (
        db.query(
            func.date(SubscriptionUserCard.init_date).label("day"),
            func.sum(SubscriptionUserCard.paid_amount).label("profit"),
        )
        .filter(
            SubscriptionUserCard.init_date >= start_week,
            SubscriptionUserCard.init_date <= end_week,
        )
        .group_by(func.date(SubscriptionUserCard.init_date))
        .order_by(func.date(SubscriptionUserCard.init_date))
        .all()
    )

    data_map = {day: float(profit or 0) for day, profit in results}

    return [
        {
            "date": str(start_week + datetime.timedelta(days=i)),
            "profit": data_map.get(start_week + datetime.timedelta(days=i), 0.0),
        }
        for i in range(7)
    ]


def get_subscriptions_profit_by_month_daily(db: Session):
    today = datetime.date.today()

    start_month = today.replace(day=1)

    if today.month == 12:
        next_month = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month = today.replace(month=today.month + 1, day=1)

    end_month = next_month - datetime.timedelta(days=1)

    results = (
        db.query(
            func.date(SubscriptionUserCard.init_date).label("day"),
            func.sum(SubscriptionUserCard.paid_amount).label("profit"),
        )
        .filter(
            SubscriptionUserCard.init_date >= start_month,
            SubscriptionUserCard.init_date <= end_month,
        )
        .group_by(func.date(SubscriptionUserCard.init_date))
        .order_by(func.date(SubscriptionUserCard.init_date))
        .all()
    )

    data_map = {day: float(profit or 0) for day, profit in results}

    full_month = []
    current = start_month

    while current <= end_month:
        full_month.append({
            "date": str(current),
            "profit": data_map.get(current, 0.0),
        })
        current += datetime.timedelta(days=1)

    return full_month


def get_subscriptions_profit_by_year_month(db: Session):
    today = datetime.date.today()

    start_year = datetime.date(today.year, 1, 1)
    end_year = datetime.date(today.year, 12, 31)

    results = (
        db.query(
            func.to_char(SubscriptionUserCard.init_date, "YYYY-MM").label("month"),
            func.sum(SubscriptionUserCard.paid_amount).label("profit"),
        )
        .filter(
            SubscriptionUserCard.init_date >= start_year,
            SubscriptionUserCard.init_date <= end_year,
        )
        .group_by("month")
        .order_by("month")
        .all()
    )

    data_map = {month: float(profit or 0) for month, profit in results}

    return [
        {
            "month": f"{today.year}-{m:02d}",
            "profit": data_map.get(f"{today.year}-{m:02d}", 0.0),
        }
        for m in range(1, 13)
    ]