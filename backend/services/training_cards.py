from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database_models import Exercise, TrainingCard, TrainingCardExercise, User
from models import (
    ExerciseCreateORM,
    TrainingCardCreateORM,
    TrainingCardExerciseCreateORM,
)


# -------------------------------------------------------------------------
# HELPERS
# -------------------------------------------------------------------------

def get_exercise_or_404(db: Session, exercise_id: int) -> Exercise:
    db_exercise = db.get(Exercise, exercise_id)
    if not db_exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found.")
    return db_exercise


def get_training_card_or_404(db: Session, card_id: int) -> TrainingCard:
    db_tc = db.get(TrainingCard, card_id)
    if not db_tc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training card not found.")
    return db_tc


def get_card_exercise_or_404(db: Session, card_exercise_id: int) -> TrainingCardExercise:
    db_tc_ex = db.get(TrainingCardExercise, card_exercise_id)
    if not db_tc_ex:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Training card exercise not found.")
    return db_tc_ex


# -------------------------------------------------------------------------
# EXERCISES
# -------------------------------------------------------------------------

def list_all_exercises(db: Session) -> list[Exercise]:
    return db.query(Exercise).all()


def get_exercise(db: Session, exercise_id: int) -> Exercise:
    return get_exercise_or_404(db, exercise_id)


def create_exercise(db: Session, exercise_in: ExerciseCreateORM) -> Exercise:
    existing = db.query(Exercise).filter(Exercise.name == exercise_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Exercise with name '{exercise_in.name}' already exists.",
        )
    db_exercise = Exercise(**exercise_in.model_dump())
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    return db_exercise


def update_exercise(db: Session, exercise_id: int, exercise_in: ExerciseCreateORM) -> Exercise:
    db_exercise = get_exercise_or_404(db, exercise_id)

    # Check name uniqueness only if name is changing
    if exercise_in.name != db_exercise.name:
        existing = db.query(Exercise).filter(Exercise.name == exercise_in.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Exercise with name '{exercise_in.name}' already exists.",
            )

    for field, value in exercise_in.model_dump().items():
        setattr(db_exercise, field, value)

    db.commit()
    db.refresh(db_exercise)
    return db_exercise


def delete_exercise(db: Session, exercise_id: int) -> Exercise:
    db_exercise = get_exercise_or_404(db, exercise_id)

    # Prevent deletion if exercise is referenced in any training card
    in_use = db.query(TrainingCardExercise).filter(
        TrainingCardExercise.exercise_id == exercise_id
    ).first()
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete exercise: it is currently used in one or more training cards.",
        )

    db.delete(db_exercise)
    db.commit()
    return db_exercise


# -------------------------------------------------------------------------
# TRAINING CARDS
# -------------------------------------------------------------------------

def list_all_training_cards(db: Session) -> list[TrainingCard]:
    return db.query(TrainingCard).all()


def list_training_cards_by_user(db: Session, user_id: int) -> list[TrainingCard]:
    return db.query(TrainingCard).filter(TrainingCard.user_id == user_id).all()


def get_training_card(db: Session, card_id: int) -> TrainingCard:
    return get_training_card_or_404(db, card_id)


def create_training_card(db: Session, card_in: TrainingCardCreateORM) -> TrainingCard:
    # Validate user exists
    if not db.get(User, card_in.user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    card_data = card_in.model_dump(exclude={"exercises"})
    db_card = TrainingCard(**card_data)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


def update_training_card(db: Session, card_id: int, card_in: TrainingCardCreateORM) -> TrainingCard:
    db_card = get_training_card_or_404(db, card_id)

    if not db.get(User, card_in.user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    for field, value in card_in.model_dump(exclude={"exercises"}).items():
        setattr(db_card, field, value)

    db.commit()
    db.refresh(db_card)
    return db_card


def delete_training_card(db: Session, card_id: int) -> TrainingCard:
    db_card = get_training_card_or_404(db, card_id)
    db.delete(db_card)
    db.commit()
    return db_card


# -------------------------------------------------------------------------
# TRAINING CARD EXERCISES
# -------------------------------------------------------------------------

def list_exercises_by_card(db: Session, card_id: int) -> list[TrainingCardExercise]:
    get_training_card_or_404(db, card_id)
    return (
        db.query(TrainingCardExercise)
        .filter(TrainingCardExercise.training_card_id == card_id)
        .order_by(TrainingCardExercise.day_execution, TrainingCardExercise.position)
        .all()
    )


def add_exercise_to_card(
    db: Session, card_exercise_in: TrainingCardExerciseCreateORM
) -> TrainingCardExercise:
    # Validate references
    get_training_card_or_404(db, card_exercise_in.training_card_id)
    get_exercise_or_404(db, card_exercise_in.exercise_id)

    # Check unique constraint (card + day + position)
    conflict = (
        db.query(TrainingCardExercise)
        .filter(
            TrainingCardExercise.training_card_id == card_exercise_in.training_card_id,
            TrainingCardExercise.day_execution == card_exercise_in.day_execution,
            TrainingCardExercise.position == card_exercise_in.position,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Position {card_exercise_in.position} on {card_exercise_in.day_execution} "
                   f"is already occupied in this training card.",
        )

    db_ce = TrainingCardExercise(**card_exercise_in.model_dump())
    db.add(db_ce)
    db.commit()
    db.refresh(db_ce)
    return db_ce


def update_card_exercise(
    db: Session,
    card_exercise_id: int,
    card_exercise_in: TrainingCardExerciseCreateORM,
) -> TrainingCardExercise:
    db_ce = get_card_exercise_or_404(db, card_exercise_id)

    get_exercise_or_404(db, card_exercise_in.exercise_id)

    # Check unique constraint only if day/position changed
    if (
        db_ce.day_execution != card_exercise_in.day_execution
        or db_ce.position != card_exercise_in.position
    ):
        conflict = (
            db.query(TrainingCardExercise)
            .filter(
                TrainingCardExercise.training_card_id == card_exercise_in.training_card_id,
                TrainingCardExercise.day_execution == card_exercise_in.day_execution,
                TrainingCardExercise.position == card_exercise_in.position,
                TrainingCardExercise.id != card_exercise_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Position {card_exercise_in.position} on {card_exercise_in.day_execution} "
                       f"is already occupied in this training card.",
            )

    for field, value in card_exercise_in.model_dump().items():
        setattr(db_ce, field, value)

    db.commit()
    db.refresh(db_ce)
    return db_ce


def remove_exercise_from_card(db: Session, card_exercise_id: int) -> TrainingCardExercise:
    db_ce = get_card_exercise_or_404(db, card_exercise_id)
    db.delete(db_ce)
    db.commit()
    return db_ce