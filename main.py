from fastapi import FastAPI, Depends
from database.database import Base, engine, get_db
from contextlib import asynccontextmanager
from routers import auth
from services.auth_service import get_current_user

@asynccontextmanager
async def life_span(app: FastAPI):
    print("Application Start!")
    Base.metadata.create_all(engine)
    yield
    print("Application Stop!")

app = FastAPI(lifespan=life_span)
app.include_router(auth.router)

@app.get("/")
def user(user: dict = Depends(get_current_user), db=Depends(get_db)):
    return {"User": user}