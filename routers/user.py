import os
import uuid
from sqlalchemy.orm import Session
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from database.models import User
from database.schema import UserEditSchema, UserResponseSchema
from services.auth_service import get_db, get_current_user


UPLOAD_DIR = "static/images/profile_pics/"
ALLOWED_EXTENSIONS = {".jpeg", ".jpg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024

router = APIRouter()

@router.post("/me/profile-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, "Invalid file type. Only jpg, png, webp allowed.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large. Max 5MB.")

    if current_user.profile_pic:
        old_path = current_user.profile_pic.lstrip("/")
        if os.path.exists(old_path):
            os.remove(old_path)

    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    current_user.profile_pic = f"{file_path}"
    db.commit()
    db.refresh(current_user)

    return {"profile_pic": current_user.profile_pic}


@router.put("/profile/{username}", response_model=UserResponseSchema)
def edit_user_info(
    request: UserEditSchema,
    username: str,
    current_user: User=Depends(get_current_user),
    db: Session=Depends(get_db)
):
    if username != current_user.username:
        raise HTTPException(403, "You do not have the permission!")

    if not request.username:
        raise HTTPException(400, "this filed can't be empty!")
    if not request.display_name:
        raise HTTPException(400, "this filed can't be empty!")

    existing_user = db.query(User).filter_by(username=request.username).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(409, "username already exists!")

    if len(request.bio) > 70:
        raise HTTPException(400, "bio can't be more than 70 char!")

    if len(request.display_name) > 40:
        raise HTTPException(400, "display name can't be more than 40 char!")

    current_user.username = request.username
    current_user.display_name = request.display_name
    current_user.bio = request.bio

    db.commit()
    db.refresh(current_user)
    return current_user