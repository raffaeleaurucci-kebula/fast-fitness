from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import get_db
from database_models import User
from models import UserCreateORM, UserOutORM, UserInORM

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
        **user_in.model_dump(exclude={"password", "new_password"}),
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

@router.post("/login", response_model=UserOutORM)
def login_user(user_in: UserInORM, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.username == user_in.username).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    if not pwd_context.verify(user_in.password, db_user.password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    return db_user

@router.put("/{user_id}", response_model=UserOutORM, status_code=status.HTTP_200_OK)
def update_user(user_id: int, user_in: UserCreateORM, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found.")

    db_user.name = user_in.name
    db_user.surname = user_in.surname
    db_user.date_of_birth = user_in.date_of_birth
    db_user.location_of_birth = user_in.location_of_birth
    db_user.country = user_in.country
    db_user.street_address = user_in.street_address
    db_user.street_number = user_in.street_number
    db_user.city = user_in.city
    db_user.zip_code = user_in.zip_code
    db_user.phone_number = user_in.phone_number

    if user_in.username != db_user.username:
        if db.query(User).filter(User.username == user_in.username).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken.",
            )
    db_user.username = user_in.username

    if user_in.email != db_user.email:
        if db.query(User).filter(User.email == user_in.email).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered.",
            )
    db_user.email = user_in.email

    if not pwd_context.verify(user_in.password, db_user.password):
        raise HTTPException(status_code=400, detail="Incorrect password.")

    if user_in.new_password:
        if pwd_context.verify(user_in.new_password, db_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is identically to previous password.",
            )
        hashed_pw = pwd_context.hash(user_in.new_password)
        db_user.password = hashed_pw

    db.commit()
    db.refresh(db_user)
    return db_user