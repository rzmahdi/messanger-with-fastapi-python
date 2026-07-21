from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from services.room import room_exist
from database.database import get_db
from database.models import Room
from sqlalchemy.orm import Session

router = APIRouter()
templates = Jinja2Templates(directory="templates")
router.mount("/static", StaticFiles(directory="static"), name="static")


@router.get("/register")
def register_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="register.html"
    )

@router.get("/login")
def login_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html"
    )

@router.get("/")
def user(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )

@router.get("/rooms/{room_id}")
def room_page(room_id: int, request: Request, db: Session=Depends(get_db)):
    if not room_exist(room_id, db):
        return page_404(request)
    
    room = db.query(Room).filter_by(id=room_id).first()

    return templates.TemplateResponse(
        name="room.html",
        request=request,
        context={
            "room_id": room_id,
            "room_name": room.name
        }
    )


@router.get("/forgot-password")
def reset_passwordd_page(request: Request, db: Session=Depends(get_db)):
    return templates.TemplateResponse(
        name="reset_password.html",
        request=request
    )


@router.get("/404")
def page_404(request: Request):
    return templates.TemplateResponse(
        name="404.html",
        request=request
    )