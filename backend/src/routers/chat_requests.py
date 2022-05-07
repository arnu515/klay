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


@router.patch("/{request_id}/{action}")
def accept_chat_request(request_id: str, action: str, user_aw: Appwrite = Depends(auth()),
                        appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Accept or reject a chat request
    """
    if action not in ["accept", "reject"]:
        raise HTTPException("Invalid action. Action must be one of accept, reject", 400)
    chat_request = appwrite.database.get_document("chat_requests", request_id)
    if chat_request is None:
        raise HTTPException("Chat request not found", 404)
    if chat_request.get("userId2") != user_aw.account.get().get("$id"):
        raise HTTPException("You can't accept or reject a chat request that you didn't receive", 403)
    if action == "accept":
        appwrite.database.create_document("contacts", "unique()", {
            "userId1": chat_request.get("userId1"),
            "userId2": chat_request.get("userId2"),
        }, [f"user:{chat_request.get('userId1')}", f"user:{chat_request.get('userId2')}"])
        appwrite.database.delete_document("chat_requests", request_id)
    elif action == "reject":
        appwrite.database.delete_document("chat_requests", request_id)
    return {"success": True}


@router.delete("/{request_id}")
def delete_chat_request(request_id: str, user_aw: Appwrite = Depends(auth()),
                        appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Delete a chat request
    """
    chat_request = appwrite.database.get_document("chat_requests", request_id)
    if chat_request is None:
        raise HTTPException("Chat request not found", 404)
    if chat_request.get("userId1") != user_aw.account.get().get("$id"):
        raise HTTPException("You can't delete a chat request that you didn't send", 403)
    appwrite.database.delete_document("chat_requests", request_id)
    return {"success": True}
