from fastapi import FastAPI
from database import engine
from database_models import Base
from routers import users, credit_cards, auth, subscriptions, courses, reservations, training_cards

# Drop tables
# Base.metadata.drop_all(bind=engine)

# Create tables if doesn't exist
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Fitness App")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(credit_cards.router)
app.include_router(subscriptions.router)
app.include_router(courses.router)
app.include_router(reservations.router)
app.include_router(training_cards.router)