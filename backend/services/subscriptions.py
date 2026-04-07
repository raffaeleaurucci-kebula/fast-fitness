from fastapi import HTTPException, status
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


def list_subscriptions_by_user(db: Session, user_id: int) -> list[Subscription]:
    return (
        db.query(Subscription)
        .join(SubscriptionUserCard, SubscriptionUserCard.subscription_id == Subscription.id)
        .filter(SubscriptionUserCard.user_id == user_id)
        .all()
    )


def list_subscriptions(db: Session, cost_sup: float) -> list[Subscription]:
    return db.query(Subscription).filter(Subscription.cost >= cost_sup).all()


def create_subscription_by_user(
    db: Session, sub_card_in: SubscriptionUserCardCreateORM
) -> SubscriptionUserCard:
    # Validate referenced entities exist
    if not db.get(User, sub_card_in.user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if not db.get(CreditCard, sub_card_in.card_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card not found.")
    if not db.get(Subscription, sub_card_in.subscription_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")

    # Prevent duplicate active subscription for the same plan
    existing = db.query(SubscriptionUserCard).filter(
        SubscriptionUserCard.user_id == sub_card_in.user_id,
        SubscriptionUserCard.subscription_id == sub_card_in.subscription_id,
        SubscriptionUserCard.expiry_date >= sub_card_in.init_date,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already has an active subscription for this plan.",
        )

    db_sub_card = SubscriptionUserCard(**sub_card_in.model_dump())
    db.add(db_sub_card)
    db.commit()
    db.refresh(db_sub_card)
    return db_sub_card