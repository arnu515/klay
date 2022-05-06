from appwrite.query import Query
from fastapi import APIRouter, Depends

from src.dependencies.auth import auth
from src.exceptions.HTTPException import HTTPException
from src.util.aw import Appwrite, get_admin_appwrite

router = APIRouter()
path = "/api/chat_requests"


@router.post("/{user_id}")
def create_chat_request(user_id: str, user_aw: Appwrite = Depends(auth()),
                        appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Create a chat request from logged-in user to ``user_id``
    """
    user = user_aw.account.get()
    if user_id == user.get("$id"):
        raise HTTPException("You can't send a chat request to yourself", 400)
    # check for existing chat request
    chat_request1 = appwrite.database.list_documents("chat_requests", [
        Query.equal("userId1", user.get("$id")),
        Query.equal("userId2", user_id),
    ])
    if chat_request1["total"] > 0:
        raise HTTPException("You've already sent a chat request to this user", 409)

    chat_request2 = appwrite.database.list_documents("chat_requests", [
        Query.equal("userId1", user_id),
        Query.equal("userId2", user.get("$id")),
    ])
    if chat_request2["total"] > 0:
        raise HTTPException("This user has already sent a chat request to you. You can accept that instead of sending a new one", 409)

    # create chat request
    chat_request = appwrite.database.create_document("chat_requests", "unique()", {
        "userId1": user.get("$id"),
        "userId2": user_id,
    }, [f"user:{user.get('$id')}", f"user:{user_id}"])

    return chat_request
