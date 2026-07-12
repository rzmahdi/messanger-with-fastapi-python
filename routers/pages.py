from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

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
def room_page(room_id: int, request: Request):
    return templates.TemplateResponse(
        name="room.html",
        request=request,
        context={
            "room_id": room_id
        }
    )

@router.get("/404")
def page_404(request: Request):
    return templates.TemplateResponse(
        name="404.html",
        request=request
    )