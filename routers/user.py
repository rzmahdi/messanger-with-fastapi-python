import os
import uuid
from sqlalchemy.orm import Session
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from database.models import User
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