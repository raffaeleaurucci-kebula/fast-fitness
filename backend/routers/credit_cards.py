from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from database_models import CreditCard
from models import CreditCardOutORM, CreditCardCreateORM

router = APIRouter(
    prefix="/credit_cards",
    tags=["credit_cards"],
)


@router.post("/", response_model=CreditCardOutORM, status_code=status.HTTP_201_CREATED)
def create_credit_card(card_in: CreditCardCreateORM, db: Session = Depends(get_db)):

    if db.query(CreditCard).filter(CreditCard.number == card_in.number and CreditCard.user_id == card_in.user_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Credit Card already taken",
        )

    db_card = CreditCard(**card_in.model_dump(),)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)  # reloads the object with the DB-assigned ID

    return db_card


@router.get("/{card_id}", response_model=CreditCardOutORM)
def get_credit_card(card_id: int, db: Session = Depends(get_db)):

    db_card = db.get(CreditCard, card_id)
    if not db_card:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Card id not found",
        )
    return db_card


@router.get("/list/{user_id}", response_model=list[CreditCardOutORM])
def list_credit_cards_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(CreditCard).filter(CreditCard.user_id == user_id).all()


@router.put("/{card_id}", response_model=CreditCardOutORM, status_code=status.HTTP_200_OK)
def update_credit_card(card_id: int, card_in: CreditCardCreateORM, db: Session = Depends(get_db)):
    db_card = db.query(CreditCard).filter(CreditCard.id == card_id and CreditCard.user_id == card_in.user_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Credit card not found.")

    db_card.number = card_in.number
    db_card.expiry_date = card_in.expiry_date
    db_card.brand = card_in.brand

    db.commit()
    db.refresh(db_card)
    return db_card


@router.delete("/{user_id}/{card_id}", response_model=CreditCardOutORM, status_code=status.HTTP_200_OK)
def delete_credit_card(user_id: int, card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(CreditCard).filter(CreditCard.id == card_id and CreditCard.user_id == user_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Credit card not found.")
    db.delete(db_card)
    db.commit()
    return db_card
