import os
from PIL import Image

from appwrite.exception import AppwriteException
from fastapi import APIRouter, Depends, Body, UploadFile
from pydantic import BaseModel, Field

from src.exceptions.HTTPException import HTTPException
from src.util.aw import Appwrite, get_admin_appwrite
from src.dependencies.auth import auth

router = APIRouter()
path = "/api/profile"


@router.get("/me")
def get_my_profile(appwrite: Appwrite = Depends(auth())):
    """
    Get current user's profile
    """
    # get profile from collection
    profile = appwrite.database.get_document("profiles", appwrite.account.get().get("$id"))
    return profile


class UpdateProfileBody(BaseModel):
    status: str = Field(..., max_length=512)
    bio: str | None = Field(None, max_length=2048)


@router.put("/me")
def update_my_profile(body: UpdateProfileBody = Body(...), user: Appwrite = Depends(auth()),
                      appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Update current user's profile

    Use /me/avatar for avatars
    """
    # get profile from collection
    profile = user.database.get_document("profiles", user.account.get().get("$id"))
    profile["status"] = body.status.strip()
    profile["bio"] = body.bio.strip() if body.bio else None
    # update profile
    appwrite.database.update_document("profiles", profile.get("$id"), profile)
    return profile


@router.put("/me/avatar")
def change_my_avatar(file: UploadFile, user: Appwrite = Depends(auth()),
                  appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Change current user's avatar
    """
    # check file type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException("Invalid file type. Must be png or jpeg", 422)

    # get profile from collection
    profile = user.database.get_document("profiles", user.account.get().get("$id"))
    with open("avatar.png", "wb") as f:
        f.write(file.file.read())
        print("saved file")
    # resize image to 64x64px
    img = Image.open("avatar.png")
    img.thumbnail((128, 128))
    img.save("avatar.png")
    # upload image to storage
    try:
        appwrite.storage.create_file('avatars', profile.get("$id"), "avatar.png")
        appwrite.storage.update_file('avatars', profile.get("$id"))
    except AppwriteException as e:
        raise HTTPException(e.message, e.code)
    os.remove("avatar.png")
    profile["avatar_url"] = f"{os.getenv('APPWRITE_ENDPOINT')}/v1/storage/buckets/avatars/files/{profile.get('$id')}/view?project={os.getenv('APPWRITE_PROJECT_ID')}"
    # update profile
    appwrite.database.update_document("profiles", profile.get("$id"), profile)
    return profile
