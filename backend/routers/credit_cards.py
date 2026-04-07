from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from database import get_db
from models import CreditCardCreateORM, CreditCardOutORM, CurrentUser
from routers.auth import get_current_user
from services import credit_cards as card_service
from fastapi import HTTPException

router = APIRouter(
    prefix="/credit_cards",
    tags=["credit_cards"],
)


@router.post("/", response_model=CreditCardOutORM, status_code=status.HTTP_201_CREATED)
def create_credit_card(
    card_in: CreditCardCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Users can only create cards for themselves
    if card_in.user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return card_service.create_credit_card(db, card_in)


@router.get("/{card_id}", response_model=CreditCardOutORM)
def get_credit_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    db_card = card_service.get_card_or_404(db, card_id)
    card_service.assert_card_belongs_to_user(db_card, current_user.id)
    return db_card


@router.get("/list/{user_id}", response_model=list[CreditCardOutORM])
def list_credit_cards_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return card_service.list_cards_by_user(db, user_id)


@router.put("/{card_id}", response_model=CreditCardOutORM, status_code=status.HTTP_200_OK)
def update_credit_card(
    card_id: int,
    card_in: CreditCardCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if card_in.user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return card_service.update_credit_card(db, card_id, card_in)


@router.delete("/{card_id}", response_model=CreditCardOutORM, status_code=status.HTTP_200_OK)
def delete_credit_card(
    user_id: int,
    card_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return card_service.delete_credit_card(db, card_id, user_id)