from enum import Enum

from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List
import datetime
import re


# -------------------------------------------------------------------------
# USER
# -------------------------------------------------------------------------
class UserCreateORM(BaseModel):
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
    email: EmailStr
    password: str  # hashed in backend
    new_password: Optional[str] = None

    model_config = {"from_attributes": True}

    @field_validator("name", "surname")
    @classmethod
    def name_letters_only(cls, v):
        if not v.isalpha():
            raise ValueError("Name and surname must contain only letters.")
        if len(v) < 2:
            raise ValueError("Name and surname must be at least 2 characters.")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def check_birth_date(cls, v):
        if v > datetime.date.today():
            raise ValueError("Date of birth must not be in the future.")
        return v

    @field_validator("username")
    @classmethod
    def username_length(cls, v):
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be between 3 and 50 characters.")
        return v

    @model_validator(mode='before')
    @classmethod
    def password_strength(cls, values):
        password = values.get("password")
        new_password = values.get("new_password")

        def check_password(v):
            if len(v) < 8:
                raise ValueError("Password must be at least 8 characters.")
            if not re.search(r"[A-Z]", v):
                raise ValueError("Password must contain at least one uppercase letter.")
            if not re.search(r"[a-z]", v):
                raise ValueError("Password must contain at least one lowercase letter.")
            if not re.search(r"[0-9]", v):
                raise ValueError("Password must contain at least one number.")
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
                raise ValueError("Password must contain at least one special character.")
            return v

        if password:
            check_password(password)

        if new_password:
            check_password(new_password)

        return values

    @field_validator("location_of_birth", "city")
    @classmethod
    def location_length(cls, v):
        if not v or len(v) < 2:
            raise ValueError("Location and city must be at least 2 characters.")
        return v

    @field_validator("country")
    @classmethod
    def country_length(cls, v):
        if not v or len(v) < 2:
            raise ValueError("Country must be at least 2 characters.")
        return v

    @field_validator("street_address")
    @classmethod
    def street_address_length(cls, v):
        if not v or len(v) < 2:
            raise ValueError("Street address must be at least 2 characters.")
        return v

    @field_validator("street_number")
    @classmethod
    def street_number_positive(cls, v):
        if v <= 0:
            raise ValueError("Street number must be positive.")
        return v

    @field_validator("zip_code")
    @classmethod
    def zip_code_format(cls, v):
        if not v.isdigit() or len(v) < 4 or len(v) > 10:
            raise ValueError("ZIP code must be numeric and between 4 and 10 digits.")
        return v

    @field_validator("phone_number")
    @classmethod
    def phone_number_format(cls, v):
        if not re.fullmatch(r"^\+\d{1,3}\d{6,14}$", v):
            raise ValueError("Phone number must be in international format, e.g., +39 123456789.")
        return v


# No password on response
class UserOutORM(BaseModel):
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
    email: EmailStr

    model_config = {"from_attributes": True}


class UserInORM(BaseModel):
    username: str
    password: str

    model_config = {"from_attributes": True}


# -------------------------------------------------------------------------
# CREDIT CARD
# -------------------------------------------------------------------------
class CreditCardCreateORM(BaseModel):
    user_id: int
    number: str
    expiry_date: str
    brand: str

    model_config = {"from_attributes": True}

    @field_validator("number")
    @classmethod
    def number_length(cls, v):
        if not v or not v.isdigit() or len(v) != 16:
            raise ValueError("Number of credit card not valid.")
        return v

    @field_validator("expiry_date")
    @classmethod
    def check_expire(cls, v):
        expiry_date = str.split(v, "-")

        expiry_month = expiry_date[0]
        expiry_year = expiry_date[1]

        if expiry_month.isdigit() and expiry_year.isdigit():
            expiry_month = int(expiry_month)
            expiry_year = int(expiry_year)
        else:
            raise ValueError("Expiry month and Expiry year must be digits.")

        if expiry_month > 12 or expiry_month < 1:
            raise ValueError("Expiry month must be between 1 and 12.")

        if expiry_year < datetime.datetime.now().year:
            raise ValueError("Expiry year must be greater or equal than current year.")

        import calendar
        last_day = calendar.monthrange(expiry_year, expiry_month)[1]
        expiry_date = datetime.date(expiry_year, expiry_month, last_day)

        if expiry_date < datetime.datetime.now():
            raise ValueError("Credit card is expired.")


    @field_validator("brand")
    @classmethod
    def brand_length(cls, v):
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Brand must be between 3 and 50 characters.")
        return v


# No token on response
class CreditCardOutORM(BaseModel):
    id: int
    user_id: int
    number: str
    expiry_date: str
    brand: str

    model_config = {"from_attributes": True}


# -------------------------------------------------------------------------
# SUBSCRIPTIONS
# -------------------------------------------------------------------------
class SubscriptionCreateORM(BaseModel):
    cost: float
    duration_month: int
    weekly_accesses: int
    description: Optional[str] = None

    model_config = {"from_attributes": True}

    @field_validator("duration_month", "weekly_accesses")
    @classmethod
    def positive_numbers(cls, v):
        if v <= 0:
            raise ValueError("Value must be positive.")
        return v

    @field_validator("cost")
    @classmethod
    def cost_positive(cls, v):
        if v < 0:
            raise ValueError("Cost must be non-negative.")
        return v


class SubscriptionOutORM(BaseModel):
    id: int
    cost: float
    duration_month: int
    weekly_accesses: int
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class SubscriptionUserCardCreateORM(BaseModel):
    user_id: int
    card_id: int
    subscription_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    automatic_renewal: bool = False

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def check_dates(cls, values):
        init = values.get("init_date")
        expiry = values.get("expiry_date")
        if init and expiry and expiry <= init:
            raise ValueError("Expire Date must be after Init Date.")
        return values


class SubscriptionUserCardOutORM(BaseModel):
    id: int
    user_id: int
    card_id: int
    subscription_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    automatic_renewal: bool = False

    model_config = {"from_attributes": True}


# -------------------------------------------------------------------------
# COURSES
# -------------------------------------------------------------------------
class CourseCreateORM(BaseModel):
    type: str
    description: Optional[str] = None
    n_accesses: int
    cost: float
    duration_month: int
    require_subscription: bool = False

    model_config = {"from_attributes": True}

    @field_validator("type")
    @classmethod
    def type_length(cls, v):
        if not v or len(v) < 2:
            raise ValueError("Course type must have at least 2 characters.")
        return v

    @field_validator("n_accesses", "duration_month")
    @classmethod
    def positive_numbers(cls, v):
        if v <= 0:
            raise ValueError("Value must be positive.")
        return v

    @field_validator("cost")
    @classmethod
    def cost_positive(cls, v):
        if v < 0:
            raise ValueError("Cost must be non-negative.")
        return v


class CourseOutORM(BaseModel):
    id: int
    type: str
    description: Optional[str] = None
    n_accesses: int
    cost: float
    duration_month: int
    require_subscription: bool = False

    model_config = {"from_attributes": True}


class CourseUserCardCreateORM(BaseModel):
    user_id: int
    card_id: int
    course_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    automatic_renewal: bool = False

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def check_dates(cls, values):
        init = values.get("init_date")
        expiry = values.get("expiry_date")
        if init and expiry and expiry <= init:
            raise ValueError("Expire Date must be after Init Date.")
        return values


class CourseUserCardOutORM(BaseModel):
    id: int
    card_id: int
    course_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    automatic_renewal: bool = False

    model_config = {"from_attributes": True}


class ReservationCourseCreateORM(BaseModel):
    user_id: int
    course_id: int
    date: datetime.date
    from_hour: datetime.time
    to_hour: datetime.time

    model_config = {"from_attributes": True}

    @field_validator("date")
    @classmethod
    def check_date(cls, v):
        if v < datetime.date.today():
            raise ValueError("Date must not be in the past.")
        return v

    @model_validator(mode="after")
    def check_hours(self):
        now = datetime.datetime.now().time()
        if self.date == datetime.date.today() and self.from_hour < now:
            raise ValueError("From-Hour must be in the future for today's reservations.")
        if self.to_hour <= self.from_hour:
            raise ValueError("To-Hour must be after From Hour.")
        return self


class ReservationCourseOutORM(BaseModel):
    id: int
    user_id: int
    course_id: int
    date: datetime.date
    from_hour: datetime.time
    to_hour: datetime.time

    model_config = {"from_attributes": True}


# -------------------------------------------------------------------------
# EXERCISE & TRAINING CARDS
# -------------------------------------------------------------------------

class WeekDay(str, Enum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"
    Saturday = "Saturday"

class ExerciseCreateORM(BaseModel):
    name: str
    muscle_group: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}

    @field_validator("name")
    @classmethod
    def name_length(cls, v):
        if len(v) < 3 or len(v) > 100:
            raise ValueError("Name must be between 3 and 100 characters.")
        return v

    @field_validator("muscle_group")
    @classmethod
    def muscle_group_length(cls, v):
        if len(v) < 3 or len(v) > 100:
            raise ValueError("Muscle group must be between 3 and 100 characters.")
        return v


class ExerciseOutORM(BaseModel):
    id: int
    muscle_group: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class TrainingCardExerciseCreateORM(BaseModel):
    exercise_id: int
    training_card_id: int
    day_execution: WeekDay
    position: int
    sets: int
    reps: int
    weight: Optional[float] = None

    @field_validator("position")
    @classmethod
    def position_valid(cls, v):
        if not 1 <= v <= 12:
            raise ValueError("Position must be between 1 and 12 characters.")
        return v

    @field_validator("sets")
    @classmethod
    def sets_valid(cls, v):
        if not 1 <= v <= 50:
            raise ValueError("Sets must be between 1 and 50 characters.")
        return v

    @field_validator("reps")
    @classmethod
    def reps_valid(cls, v):
        if not 1 <= v <= 30:
            raise ValueError("Reps must be between 1 and 30 characters.")
        return v

    model_config = {"from_attributes": True}


class TrainingCardExerciseOutORM(BaseModel):
    id: int
    exercise_id: int
    training_card_id: int
    day_execution: WeekDay
    position: int
    sets: int
    reps: int
    weight: Optional[float] = None

    model_config = {"from_attributes": True}


class TrainingCardCreateORM(BaseModel):
    user_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    description: Optional[str] = None
    note: Optional[str] = None
    exercises: List[TrainingCardExerciseOutORM] = []

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def check_dates(cls, values):
        init = values.get("init_date")
        expiry = values.get("expiry_date")
        if init and expiry and expiry <= init:
            raise ValueError("Expire Date must be after Init Date.")
        return values


class TrainingCardOutORM(BaseModel):
    id: int
    user_id: int
    init_date: datetime.date
    expiry_date: datetime.date
    description: Optional[str] = None
    note: Optional[str] = None
    exercises: List[TrainingCardExerciseOutORM] = []

    model_config = {"from_attributes": True}