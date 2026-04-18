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
        .filter(CreditCard.user_id == user_id)
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
    db: Session, subscription_user_card_id: int, user_id: int
) -> SubscriptionUserCard:
    db_sub_card = db.get(SubscriptionUserCard, subscription_user_card_id)
    if not db_sub_card:
        raise HTTPException(status_code=404, detail="SubscriptionUserCard not found.")

    # Verifica che la carta appartenga all'utente
    db_card = db.get(CreditCard, db_sub_card.card_id)
    if not db_card or db_card.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized.")

    db.delete(db_sub_card)
    db.commit()
    return db_sub_card


def _get_profit_between(db: Session, start_date: datetime.date, end_date: datetime.date) -> float:
    total = (
        db.query(func.sum(Subscription.cost))
        .join(SubscriptionUserCard, Subscription.id == SubscriptionUserCard.subscription_id)
        .filter(
            SubscriptionUserCard.init_date >= start_date,
            SubscriptionUserCard.init_date <= end_date,
        )
        .scalar()
    )
    return float(total or 0)


def get_profit_by_week(db: Session) -> float:
    today = datetime.date.today()
    start_week = today - datetime.timedelta(days=today.weekday())
    end_week = start_week + datetime.timedelta(days=6)
    return _get_profit_between(db, start_week, end_week)


def get_profit_by_month(db: Session) -> float:
    today = datetime.date.today()
    start_month = today.replace(day=1)
    if today.month == 12:
        next_month = today.replace(year=today.year + 1, month=1, day=1)
    else:
        next_month = today.replace(month=today.month + 1, day=1)
    end_month = next_month - datetime.timedelta(days=1)
    return _get_profit_between(db, start_month, end_month)


def get_profit_by_year(db: Session) -> float:
    today = datetime.date.today()
    start_year = today.replace(month=1, day=1)
    end_year = today.replace(month=12, day=31)
    return _get_profit_between(db, start_year, end_year)