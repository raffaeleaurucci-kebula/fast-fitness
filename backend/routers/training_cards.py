from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN

from database import get_db
from models import (
    ExerciseCreateORM, ExerciseOutORM,
    TrainingCardCreateORM, TrainingCardOutORM,
    TrainingCardExerciseCreateORM, TrainingCardExerciseOutORM,
    CurrentUser, UserRole,
)
from routers.auth import get_current_user
from services import training_cards as tc_service

router = APIRouter(
    prefix="/training-cards",
    tags=["training-cards"],
)

# FLOW:
#   1. ADMIN CREATE EXERCISES
#   2. ADMIN CREATE A TRAINING CARD FOR SPECIFIC USER
#   3. ADMIN CREATE A TRAINING EXERCISES FOR SPECIFIC TRAINING CARD

# -------------------------------------------------------------------------
# EXERCISES
# -------------------------------------------------------------------------

# ADMIN OPERATIONS

@router.post(
    "/exercises",
    response_model=ExerciseOutORM,
    status_code=status.HTTP_201_CREATED,
)
def create_exercise(
    exercise_in: ExerciseCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return tc_service.create_exercise(db, exercise_in)


@router.put(
    "/exercises/{exercise_id}",
    response_model=ExerciseOutORM,
)
def update_exercise(
    exercise_id: int,
    exercise_in: ExerciseCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return tc_service.update_exercise(db, exercise_id, exercise_in)


@router.delete(
    "/exercises/{exercise_id}",
    response_model=ExerciseOutORM,
)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return tc_service.delete_exercise(db, exercise_id)


# USERS OPERATIONS

@router.get(
    "/exercises",
    response_model=list[ExerciseOutORM],
)
def list_exercises(
    db: Session = Depends(get_db),
):
    return tc_service.list_all_exercises(db)


@router.get(
    "/exercises/{exercise_id}",
    response_model=ExerciseOutORM,
)
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
):
    return tc_service.get_exercise(db, exercise_id)


# -------------------------------------------------------------------------
# TRAINING CARDS
# -------------------------------------------------------------------------

# ADMIN OPERATIONS

@router.get(
    "/list",
    response_model=list[TrainingCardOutORM],
)
def list_all_training_cards(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return tc_service.list_all_training_cards(db)


@router.post(
    "/create",
    response_model=TrainingCardOutORM,
    status_code=status.HTTP_201_CREATED,
)
def create_training_card(
    card_in: TrainingCardCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return tc_service.create_training_card(db, card_in)


@router.put(
    "/{card_id}",
    response_model=TrainingCardOutORM,
)
def update_training_card(
    card_id: int,
    card_in: TrainingCardCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return tc_service.update_training_card(db, card_id, card_in)


@router.delete(
    "/{card_id}",
    response_model=TrainingCardOutORM,
)
def delete_training_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    return tc_service.delete_training_card(db, card_id)


# USER OPERATIONS

@router.get(
    "/list/{user_id}",
    response_model=list[TrainingCardOutORM],
)
def list_training_cards_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return tc_service.list_training_cards_by_user(db, user_id)


@router.get(
    "/{card_id}",
    response_model=TrainingCardOutORM,
)
def get_training_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    card = tc_service.get_training_card(db, card_id)
    # Users can only read their own card; admins can read any
    if current_user.role != UserRole.ADMIN and card.user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return card


# -------------------------------------------------------------------------
# TRAINING CARD EXERCISES
# -------------------------------------------------------------------------

# ADMIN OPERATIONS

@router.post(
    "/{card_id}/exercises",
    response_model=TrainingCardExerciseOutORM,
    status_code=status.HTTP_201_CREATED,
)
def add_exercise_to_card(
    card_id: int,
    card_exercise_in: TrainingCardExerciseCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")

    if card_exercise_in.training_card_id != card_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="card_id in path and training_card_id in body must match.",
        )
    return tc_service.add_exercise_to_card(db, card_exercise_in)


@router.put(
    "/{card_id}/exercises/{card_exercise_id}",
    response_model=TrainingCardExerciseOutORM,
)
def update_card_exercise(
    card_id: int,
    card_exercise_id: int,
    card_exercise_in: TrainingCardExerciseCreateORM,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")
    if card_exercise_in.training_card_id != card_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="card_id in path and training_card_id in body must match.",
        )
    return tc_service.update_card_exercise(db, card_exercise_id, card_exercise_in)


@router.delete(
    "/{card_id}/exercises/{card_exercise_id}",
    response_model=TrainingCardExerciseOutORM,
)
def remove_exercise_from_card(
    card_id: int,
    card_exercise_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Admin privileges required.")

    return tc_service.remove_exercise_from_card(db, card_exercise_id)


# USER OPERATIONS

@router.get(
    "/{card_id}/exercises",
    response_model=list[TrainingCardExerciseOutORM],
)
def list_exercises_by_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    card = tc_service.get_training_card(db, card_id)
    if current_user.role != UserRole.ADMIN and card.user_id != current_user.id:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Not authorized.")
    return tc_service.list_exercises_by_card(db, card_id)