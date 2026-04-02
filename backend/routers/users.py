from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import get_db
from database_models import User
from models import UserCreateORM, UserOutORM

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/", response_model=UserOutORM, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreateORM, db: Session = Depends(get_db)):
    """
    Flow:
      1. FastAPI deserializes the JSON and validates it using UserCreateORM (Pydantic)
      2. Checks that the username and email are unique in the database
      3. Hashes the password
      4. Creates a SQLAlchemy record and saves it
      5. Returns a UserOutORM object (without the password)
    """

    # 2. Check username uniqueness
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    # 2. Check email uniqueness
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    # 3. Hash the password
    hashed_pw = pwd_context.hash(user_in.password)

    # 4. Create ORM object — model_dump() converts the Pydantic model to a dict
    db_user = User(
        **user_in.model_dump(exclude={"password"}),
        password=hashed_pw,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)  # reloads the object with the DB-assigned ID

    # 5. FastAPI serializes the response using UserOutORM
    return db_user

@router.get("/{user_id}", response_model=UserOutORM)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieves a user from the database and returns it validated by UserOutORM.
    Thanks to from_attributes=True in the model_config, Pydantic reads
    attributes directly from the SQLAlchemy object.
    """
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found",
        )
    return db_user

@router.get("/", response_model=list[UserOutORM])
def list_users(limit: int = 20, db: Session = Depends(get_db)):
    return db.query(User).limit(limit).all()