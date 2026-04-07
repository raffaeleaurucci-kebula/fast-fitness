from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError, ExpiredSignatureError

from fastapi import Depends, HTTPException, APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from starlette.status import HTTP_401_UNAUTHORIZED

from config import ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from database import get_db
from database_models import User
from models import UserInORM, CurrentUser
from routers.users import pwd_context

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

security = HTTPBearer()


def create_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency that decodes the JWT and returns the current user.
    Used via Depends() in protected endpoints.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return CurrentUser(id=user_id, role=role)
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login")
def login(user_in: UserInORM, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if not db_user or not pwd_context.verify(user_in.password, db_user.password):
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token_data = {"user_id": db_user.id, "role": db_user.role.value}
    access_token = create_access_token(token_data)

    return {"access_token": access_token, "token_type": "bearer"}