from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel, Field

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
