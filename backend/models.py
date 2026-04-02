import datetime
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    surname: str
    date_of_birth: datetime.date
    location_of_birth: str
    country: str
    street_address: str
    street_number: int
    city: str
    zip_code: str
    phone_number: str
    username: str
    email: str
    password: str

class CreditCard(BaseModel):
    id: int
    user_id: int
    token: str  # generic token by Payment Service Provider
    last_4: str
    brand: str

class Subscription(BaseModel):
    id: int
    cost: float
    duration_month: int
    weekly_accesses: int
    description: str

class SubscriptionUserCard(BaseModel):
    id: int
    user_id: int
    card_id: int
    subscription_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    automatic_renewal: bool

class Course(BaseModel):
    id: int
    type: str
    description: str
    n_accesses: int
    cost: float
    duration_month: int
    require_subscription: bool

class CourseUserCard(BaseModel):
    id: int
    user_id: int
    card_id: int
    course_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    automatic_renewal: bool

class ReservationCourse(BaseModel):
    id: int
    user_id: int
    course_id: int
    date: datetime.date
    from_hour: datetime.time
    to_hour: datetime.time

class Exercise(BaseModel):
    id: int
    name: str
    description: str
    muscle_group: str

class TrainingExercise(BaseModel):
    id: int
    exercise_id: int
    sets: int
    reps: int
    weight: float | None = None
    order: int
    note: str | None = None

class TrainingCard(BaseModel):
    id: int
    user_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    description: str
    note: str | None = None
    exercise_ids: list[int]






