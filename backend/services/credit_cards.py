from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from database_models import CreditCard
from models import CreditCardCreateORM


def get_card_or_404(db: Session, card_id: int) -> CreditCard:
    db_card = db.get(CreditCard, card_id)
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found.")
    return db_card


def assert_card_belongs_to_user(card: CreditCard, user_id: int):
    if card.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")


def create_credit_card(db: Session, card_in: CreditCardCreateORM) -> CreditCard:
    existing = db.query(CreditCard).filter(
        CreditCard.number == card_in.number,
        CreditCard.user_id == card_in.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Credit card already registered.")

    db_card = CreditCard(**card_in.model_dump())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


def update_credit_card(db: Session, card_id: int, card_in: CreditCardCreateORM) -> CreditCard:
    db_card = db.query(CreditCard).filter(
        CreditCard.id == card_id,
        CreditCard.user_id == card_in.user_id,
    ).first()
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card not found.")

    db_card.number = card_in.number
    db_card.expiry_date = card_in.expiry_date
    db_card.brand = card_in.brand
    db.commit()
    db.refresh(db_card)
    return db_card


def delete_credit_card(db: Session, card_id: int, user_id: int) -> CreditCard:
    db_card = db.query(CreditCard).filter(
        CreditCard.id == card_id,
        CreditCard.user_id == user_id,
    ).first()
    if not db_card:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit card not found.")

    db.delete(db_card)
    db.commit()
    return db_card


def list_cards_by_user(db: Session, user_id: int) -> list[CreditCard]:
    return db.query(CreditCard).filter(CreditCard.user_id == user_id).all()