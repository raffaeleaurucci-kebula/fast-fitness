from sqlalchemy import (
    Column, Integer, String, Float, Numeric, Date, ForeignKey, Boolean, Time
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy import UniqueConstraint, Enum

Base = declarative_base()


# -------------------------------------------------------------------------
# USERS & PAYMENT
# -------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
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

    # relationship
    credit_cards = relationship("CreditCard", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("SubscriptionUserCard", back_populates="user", cascade="all, delete-orphan")
    courses = relationship("CourseUserCard", back_populates="user", cascade="all, delete-orphan")
    reservations = relationship("ReservationCourse", back_populates="user", cascade="all, delete-orphan")
    training_cards = relationship("TrainingCard", back_populates="user", cascade="all, delete-orphan")


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    number = Column(String(16), nullable=False)
    expiry_date = Column(Date, nullable=False)
    brand = Column(String(50), nullable=False)

    # relationship
    user = relationship("User", back_populates="credit_cards")
    subscriptions = relationship("SubscriptionUserCard", back_populates="card")
    courses = relationship("CourseUserCard", back_populates="card")

    __table_args__ = (UniqueConstraint("user_id", "number", name="uq_number_user_id"),)



# -------------------------------------------------------------------------
# SUBSCRIPTIONS & COURSES
# -------------------------------------------------------------------------
class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    cost = Column(Numeric(10, 2), nullable=False)
    duration_month = Column(Integer, nullable=False)
    weekly_accesses = Column(Integer, nullable=False)
    description = Column(String(255))

    # relationship
    users_cards = relationship("SubscriptionUserCard", back_populates="subscription",
                               cascade="all, delete-orphan")


class SubscriptionUserCard(Base):
    __tablename__ = "subscription_user_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    card_id = Column(Integer, ForeignKey("credit_cards.id"), nullable=False)
    # IF subscription is deleted reimbursement management
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    init_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    automatic_renewal = Column(Boolean, default=False)

    # relationship
    user = relationship("User", back_populates="subscriptions")
    card = relationship("CreditCard", back_populates="subscriptions")
    subscription = relationship("Subscription", back_populates="users_cards")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)
    description = Column(String(255))
    n_accesses = Column(Integer, nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    duration_month = Column(Integer, nullable=False)
    require_subscription = Column(Boolean, default=False)

    # relationship
    users_cards = relationship("CourseUserCard", back_populates="course", cascade="all, delete-orphan")
    reservations = relationship("ReservationCourse", back_populates="course", cascade="all, delete-orphan")


class CourseUserCard(Base):
    __tablename__ = "course_user_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    card_id = Column(Integer, ForeignKey("credit_cards.id"), nullable=False)
    # IF course is deleted reimbursement management
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    init_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    automatic_renewal = Column(Boolean, default=False)

    # relationship
    user = relationship("User", back_populates="courses")
    card = relationship("CreditCard", back_populates="courses")
    course = relationship("Course", back_populates="users_cards")


class ReservationCourse(Base):
    __tablename__ = "reservation_courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    from_hour = Column(Time, nullable=False)
    to_hour = Column(Time, nullable=False)

    # relationship
    user = relationship("User", back_populates="reservations")
    course = relationship("Course", back_populates="reservations")



# -------------------------------------------------------------------------
# TRAINING CARDS
# -------------------------------------------------------------------------
import enum

class WeekDay(enum.Enum):
    Monday = "Monday"
    Tuesday = "Tuesday"
    Wednesday = "Wednesday"
    Thursday = "Thursday"
    Friday = "Friday"
    Saturday = "Saturday"

# TOPOLOGY OF EXERCISES
class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    muscle_group = Column(String(100), nullable=False)
    description = Column(String(255))

    # relationships
    card_exercises = relationship("TrainingCardExercise", back_populates="exercise")


# TRAINING CARD
class TrainingCard(Base):
    __tablename__ = "training_cards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    init_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)

    description = Column(String(255))
    note = Column(String(255))

    # relationships
    exercises = relationship("TrainingCardExercise", back_populates="training_card",
                             cascade="all, delete-orphan")

    user = relationship("User", back_populates="training_cards")


# TRAINING CARD EXERCISE (position + day per user)
class TrainingCardExercise(Base):
    __tablename__ = "training_card_exercises"

    id = Column(Integer, primary_key=True, index=True)

    training_card_id = Column(Integer, ForeignKey("training_cards.id", ondelete="CASCADE"), nullable=False)

    exercise_id = Column(Integer,ForeignKey("exercises.id", ondelete="CASCADE"),nullable=False)

    day_execution = Column(Enum(WeekDay), nullable=False)
    position = Column(Integer, nullable=False)

    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Float)

    # relationships
    training_card = relationship("TrainingCard", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="card_exercises")

    __table_args__ = (UniqueConstraint("training_card_id", "day_execution", "position",
                                       name="uq_card_day_position"),)