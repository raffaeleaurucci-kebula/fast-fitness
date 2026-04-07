from fastapi import FastAPI
from database import engine
from database_models import Base
from routers import users, credit_cards, auth, subscriptions

# Drop tables
# Base.metadata.drop_all(bind=engine)

# Create tables if doesn't exist
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Fitness App")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(credit_cards.router)
app.include_router(subscriptions.router)

# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJyb2xlIjoiQURNSU4iLCJleHAiOjE3NzU1ODk3MjZ9.n15zAmmx-Yf-Ua5BUVacNunLG0TVZfA-9uDKEq_bwd8