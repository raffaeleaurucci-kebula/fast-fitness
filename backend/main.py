from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import datetime

from database import engine, SessionLocal
from database_models import Base, User, Subscription, UserRole, Course
from routers import (
    users,
    credit_cards,
    auth,
    subscriptions,
    courses,
    reservations,
    training_cards,
)

# IMPORT HASHER PASSWORD
from routers.users import pwd_context


# -------------------------------------------------------------------------
# CREATE/DROP TABLES
# -------------------------------------------------------------------------
# Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fitness App")


# -------------------------------------------------------------------------
# SEED DATABASE
# -------------------------------------------------------------------------
def seed_database():
    db: Session = SessionLocal()

    try:
        # -------------------------------------------------
        # ADMIN
        # -------------------------------------------------
        admin = db.query(User).filter(User.username == "admin").first()

        if not admin:
            admin = User(
                name="Mario",
                surname="Rossi",
                date_of_birth=datetime.date(1990, 1, 1),
                location_of_birth="Genova",
                country="Italia",
                street_address="Via Roma",
                street_number=1,
                city="Genova",
                zip_code="16121",
                phone_number="+391111111111",
                username="admin",
                email="admin@fastfitness.it",

                # PASSWORD HASHATA
                password=pwd_context.hash("Admin123!"),

                role=UserRole.ADMIN,
            )
            db.add(admin)

        # -------------------------------------------------
        # USER STANDARD
        # -------------------------------------------------
        user = db.query(User).filter(User.username == "user").first()

        if not user:
            user = User(
                name="Luca",
                surname="Bianchi",
                date_of_birth=datetime.date(1998, 5, 15),
                location_of_birth="Milano",
                country="Italia",
                street_address="Via Milano",
                street_number=10,
                city="Milano",
                zip_code="20100",
                phone_number="+393333333333",
                username="user",
                email="user@fastfitness.it",

                # PASSWORD HASHATA
                password=pwd_context.hash("User1234!"),

                role=UserRole.USER,
            )
            db.add(user)

        db.commit()

        # -------------------------------------------------
        # SUBSCRIPTIONS
        # -------------------------------------------------
        if db.query(Subscription).count() == 0:
            plans = [
                Subscription(
                    title="Basic",
                    cost=29.99,
                    duration_month=1,
                    weekly_accesses=3,
                    description="Sala Pesi",
                ),
                Subscription(
                    title="Premium",
                    cost=49.99,
                    duration_month=1,
                    weekly_accesses=5,
                    description="Sala Pesi, Armadietto, Docce incluse",
                ),
                Subscription(
                    title="Annual Pro",
                    cost=499.99,
                    duration_month=12,
                    weekly_accesses=5,
                    description="Sala Pesi, Armadietto, Docce incluse",
                ),
            ]

            db.add_all(plans)
            db.commit()

            # -------------------------------------------------
            # COURSES
            # -------------------------------------------------

            if db.query(Course).count() == 0:
                courses = [
                    Course(
                        type="Functional Training",
                        description="Allenamento funzionale per migliorare forza e mobilità",
                        n_accesses=10,
                        cost=59.99,
                        duration_month=1,
                        require_subscription=False,
                    ),
                    Course(
                        type="Hypertrophy Program",
                        description="Programma per aumento massa muscolare",
                        n_accesses=12,
                        cost=79.99,
                        duration_month=2,
                        require_subscription=True,
                    ),
                    Course(
                        type="Cross Training",
                        description="Allenamento ad alta intensità per performance atletiche",
                        n_accesses=8,
                        cost=69.99,
                        duration_month=1,
                        require_subscription=True,
                    ),
                    Course(
                        type="Yoga & Mobility",
                        description="Mobilità articolare e benessere mentale",
                        n_accesses=15,
                        cost=39.99,
                        duration_month=3,
                        require_subscription=False,
                    ),
                    Course(
                        type="Personal Coaching",
                        description="Percorso personalizzato con trainer dedicato",
                        n_accesses=5,
                        cost=149.99,
                        duration_month=1,
                        require_subscription=True,
                    ),
                ]

                db.add_all(courses)
                db.commit()

    finally:
        db.close()


# -------------------------------------------------------------------------
# STARTUP
# -------------------------------------------------------------------------
@app.on_event("startup")
def startup():
    seed_database()


# -------------------------------------------------------------------------
# ROUTERS
# -------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(credit_cards.router)
app.include_router(subscriptions.router)
app.include_router(courses.router)
app.include_router(reservations.router)
app.include_router(training_cards.router)


# -------------------------------------------------------------------------
# CORS
# -------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)