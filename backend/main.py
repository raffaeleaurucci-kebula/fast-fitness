from fastapi import FastAPI
from database import engine
from database_models import Base
from routers import users

# Create table if doesn't exist
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Fitness App")
app.include_router(users.router)