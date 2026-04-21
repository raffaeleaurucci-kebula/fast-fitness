from sqlalchemy import (
    Column, Integer, String, Float, Numeric, Date,
    ForeignKey, Boolean, Time, UniqueConstraint, Enum
)
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


class Base(DeclarativeBase):
    pass


# -------------------------------------------------------------------------
# USERS & PAYMENT
# -------------------------------------------------------------------------
class UserRole(enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    surname = Column(String(255), nullable=False)
    date_of_birth = Column(Date, nullable=False)
    location_of_birth = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    street_address = Column(String(255), nullable=False)
    street_number = Column(Integer, nullable=False)
    city = Column(String(100), nullable=False)
    zip_code = Column(String(10), nullable=False)
    phone_number = Column(String(20), nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.USER)

    credit_cards = relationship("CreditCard", back_populates="user", cascade="all, delete-orphan")
    training_cards = relationship("TrainingCard", back_populates="user", cascade="all, delete-orphan")


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    number = Column(String(16), nullable=False)
    expiry_date = Column(Date, nullable=False)
    brand = Column(String(50), nullable=False)

    user = relationship("User", back_populates="credit_cards")
    subscriptions = relationship("SubscriptionUserCard", back_populates="card")
    courses = relationship("CourseUserCard", back_populates="card")

    __table_args__ = (
        UniqueConstraint("user_id", "number", name="uq_number_user"),
    )


# -------------------------------------------------------------------------
# SUBSCRIPTIONS
# -------------------------------------------------------------------------
class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    title = Column(String(50), nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    duration_month = Column(Integer, nullable=False)
    weekly_accesses = Column(Integer, nullable=False)
    description = Column(String(255))

    purchases = relationship("SubscriptionUserCard", back_populates="subscription",)


class SubscriptionUserCard(Base):
    __tablename__ = "subscription_user_cards"

    id = Column(Integer, primary_key=True)
    card_id = Column(Integer, ForeignKey("credit_cards.id"), nullable=False)

    # se admin elimina abbonamento => resta storico con NULL
    subscription_id = Column(
        Integer,
        ForeignKey("subscriptions.id", ondelete="SET NULL"),
        nullable=True
    )

    init_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    automatic_renewal = Column(Boolean, default=False)

    # dato storico
    paid_amount = Column(Numeric(10, 2), nullable=False)
    cancelled = Column(Boolean, default=False, nullable=False)

    card = relationship("CreditCard", back_populates="subscriptions")
    subscription = relationship("Subscription", back_populates="purchases")


# -------------------------------------------------------------------------
# COURSES
# -------------------------------------------------------------------------
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    type = Column(String(50), nullable=False)
    description = Column(String(255))
    n_accesses = Column(Integer, nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    duration_month = Column(Integer, nullable=False)
    require_subscription = Column(Boolean, default=False)

    purchases = relationship("CourseUserCard", back_populates="course",)


class CourseUserCard(Base):
    __tablename__ = "course_user_cards"

    id = Column(Integer, primary_key=True)
    card_id = Column(Integer, ForeignKey("credit_cards.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=False)

    init_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    automatic_renewal = Column(Boolean, default=False)

    # dato storico
    paid_amount = Column(Numeric(10, 2), nullable=False)
    cancelled = Column(Boolean, default=False, nullable=False)

    card = relationship("CreditCard", back_populates="courses")
    course = relationship("Course", back_populates="purchases")
    reservations = relationship("ReservationCourse", back_populates="purchase",
                                cascade="all, delete-orphan")


# -------------------------------------------------------------------------
# RESERVATIONS
# -------------------------------------------------------------------------
class ReservationCourse(Base):
    __tablename__ = "reservation_courses"

    id = Column(Integer, primary_key=True)

    course_user_card_id = Column(
        Integer,
        ForeignKey("course_user_cards.id", ondelete="CASCADE"),
        nullable=False
    )

    date = Column(Date, nullable=False)
    from_hour = Column(Time, nullable=False)
    to_hour = Column(Time, nullable=False)

    purchase = relationship("CourseUserCard", back_populates="reservations")


# -------------------------------------------------------------------------
# TRAINING CARDS
# -------------------------------------------------------------------------
class WeekDay(enum.Enum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"
    Saturday = "Saturday"


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    muscle_group = Column(String(100), nullable=False)
    description = Column(String(255))

    usages = relationship("TrainingCardExercise", back_populates="exercise")


class TrainingCard(Base):
    __tablename__ = "training_cards"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    init_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    description = Column(String(255))
    note = Column(String(255))

    user = relationship("User", back_populates="training_cards")
    exercises = relationship("TrainingCardExercise", back_populates="training_card",
                             cascade="all, delete-orphan")


class TrainingCardExercise(Base):
    __tablename__ = "training_card_exercises"

    id = Column(Integer, primary_key=True)
    training_card_id = Column(Integer, ForeignKey("training_cards.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)

    day_execution = Column(Enum(WeekDay), nullable=False)
    position = Column(Integer, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Float)

    training_card = relationship("TrainingCard", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="usages")

    __table_args__ = (
        UniqueConstraint("training_card_id", "day_execution", "position",
                         name="uq_card_day_position"),
    )