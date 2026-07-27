from fastapi import FastAPI
from database.database import Base, engine
from contextlib import asynccontextmanager
from routers import auth, pages, rooms, messages, websocket, user
from fastapi.staticfiles import StaticFiles

@asynccontextmanager
async def life_span(app: FastAPI):
    print("Application Start!")
    Base.metadata.create_all(engine)
    yield
    print("Application Stop!")

app = FastAPI(lifespan=life_span)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(pages.router)
app.include_router(rooms.router)
app.include_router(messages.router)
app.include_router(websocket.router)
app.include_router(user.router)
