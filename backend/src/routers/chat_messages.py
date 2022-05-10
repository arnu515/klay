import math
from time import time
from typing import Literal

from appwrite.query import Query
from bson import ObjectId
from fastapi import APIRouter, Depends
from nanoid import generate as nanoid
from pydantic import BaseModel

from src.dependencies.auth import auth
from src.exceptions.HTTPException import HTTPException
from src.util.aw import Appwrite, get_admin_appwrite
from src.util.mongo import db

router = APIRouter()
path = "/api/chat_messages"


class Attachment(BaseModel):
    type: Literal['image', 'file', 'video', 'audio']
    url: str


@router.get("/message-{message_id}")
def get_chat_message(message_id: str, aw: Appwrite = Depends(auth())):
    """
    Get all chat messages with user_id
    """
    user = aw.account.get()

    col = db[f"chat_{user.get('$id')}"]
    message = col.find_one({"_id": ObjectId(message_id)})
    return {"message": {**message, "_id": str(message.get("_id"))}}


@router.get("/{user_id}")
def get_chat_messages(user_id: str, aw: Appwrite = Depends(auth())):
    """
    Get all chat messages with user_id
    """
    user = aw.account.get()
    if user_id == user.get("$id"):
        raise HTTPException("You can't get messages with yourself", 400)
    # check for existing contact
    contact1 = aw.database.list_documents("contacts", [
        Query.equal("userId1", user.get("$id")),
        Query.equal("userId2", user_id),
    ])
    contact2 = aw.database.list_documents("contacts", [
        Query.equal("userId1", user_id),
        Query.equal("userId2", user.get("$id")),
    ])
    if not contact1.get("total") and not contact2.get("total"):
        raise HTTPException("You can't message this user", 400)

    col = db[f"chat_{user.get('$id')}"]
    messages = []
    for i in col.find({"to": user_id}).sort("createdAt", 1).limit(100):
        messages.append({
            **i,
            "_id": str(i.get("_id")),
        })
    return {"messages": messages}


class CreateChatMessageBody(BaseModel):
    content1: str
    content2: str
    attachments: None | list[Attachment]


@router.post("/{user_id}")
def create_chat_message(user_id: str, body: CreateChatMessageBody, aw: Appwrite = Depends(auth()),
                        appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Create a chat message
    """
    # check that both users have contacts
    user = aw.account.get()
    if user_id == user.get("$id"):
        raise HTTPException("You can't send a chat message to yourself", 400)
    # check for existing contact
    contact1 = appwrite.database.list_documents("contacts", [
        Query.equal("userId1", user.get("$id")),
        Query.equal("userId2", user_id),
    ])
    contact2 = appwrite.database.list_documents("contacts", [
        Query.equal("userId1", user_id),
        Query.equal("userId2", user.get("$id")),
    ])
    if not contact1.get("total") and not contact2.get("total"):
        raise HTTPException("You can't send a chat message to this user", 400)

    message_id = f"{user.get('$id')}-{user_id}-{nanoid(size=16)}"
    col1 = db[f"chat_{user.get('$id')}"]
    col1.insert_one({
        "_id": message_id,
        "content": body.content1,
        "attachments": body.attachments,
        "to": user_id,
        "created_at": str(math.floor(time()))
    })

    col2 = db[f"chat_{user_id}"]
    res = col2.insert_one({
        "_id": message_id,
        "content": body.content2,
        "attachments": body.attachments,
        "to": user.get("$id"),
        "created_at": str(math.floor(time()))
    })

    perms = (f"user:{user.get('$id')}", f"user:{user_id}")
    appwrite.database.create_document("chat_events", "unique()", {
        "userId1": user.get("$id"),
        "userId2": user_id,
        "type": "create",
        "messageId": message_id
    }, perms, perms)

    return {"messageId": res.inserted_id}


class UpdateChatMessageBody(BaseModel):
    message_id: str
    content1: str
    content2: str


@router.put("/{user_id}")
def update_chat_message(user_id: str, body: UpdateChatMessageBody, aw: Appwrite = Depends(auth()),
                        appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Update a chat message
    """
    user = aw.account.get()
    col1 = db[f"chat_{user.get('$id')}"]
    col2 = db[f"chat_{user_id}"]
    # check that both users have contacts
    if user_id == user.get("$id"):
        raise HTTPException("You can't send a chat message to yourself", 400)
    # check for chat message
    message1 = col1.find_one({"to": user_id, "_id": body.message_id})
    message2 = col2.find_one({"to": user.get("$id"), "_id": body.message_id})
    if not message1 or not message2:
        print(message1, message2)
        raise HTTPException("No chat message found", 404)
    # check for existing contact
    contact1 = appwrite.database.list_documents("contacts", [
        Query.equal("userId1", user.get("$id")),
        Query.equal("userId2", user_id),
    ])
    contact2 = appwrite.database.list_documents("contacts", [
        Query.equal("userId1", user_id),
        Query.equal("userId2", user.get("$id")),
    ])
    if not contact1.get("total") and not contact2.get("total"):
        raise HTTPException("You can't send a chat message to this user", 400)

    col1.update_one({"_id": message1.get("_id")}, {"$set": {"content": body.content1}})
    col2.update_one({"_id": message2.get("_id")}, {"$set": {"content": body.content2}})

    appwrite.database.create_document("chat_events", "unique()", {
        "userId1": user.get("$id"),
        "userId2": user_id,
        "type": "update",
        "messageId": message2.get("_id")
    })

    return {"message": "Chat message updated"}


@router.delete("/{user_id}/{message_id}")
def delete_chat_message(user_id: str, message_id: str, aw: Appwrite = Depends(auth()),
                        appwrite: Appwrite = Depends(get_admin_appwrite)):
    """
    Delete a chat message
    """
    user = aw.account.get()
    col1 = db[f"chat_{user.get('$id')}"]
    col2 = db[f"chat_{user_id}"]
    # check that both users have contacts
    if user_id == user.get("$id"):
        raise HTTPException("You can't send a chat message to yourself", 400)
    # check for chat message
    message1 = col1.find_one({"to": user_id, "_id": message_id})
    message2 = col2.find_one({"to": user.get("$id"), "_id": message_id})
    if not message1 or not message2:
        raise HTTPException("No chat message found", 404)
    # check for existing contact
    contact1 = appwrite.database.list_documents("contacts", [
        Query.equal("userId1", user.get("$id")),
        Query.equal("userId2", user_id),
    ])
    contact2 = appwrite.database.list_documents("contacts", [
        Query.equal("userId1", user_id),
        Query.equal("userId2", user.get("$id")),
    ])
    if not contact1.get("total") and not contact2.get("total"):
        raise HTTPException("You can't send a chat message to this user", 400)

    col1.delete_one({"_id": message1.get("_id")})
    col2.delete_one({"_id": message2.get("_id")})

    appwrite.database.create_document("chat_events", "unique()", {
        "userId1": user.get("$id"),
        "userId2": user_id,
        "type": "delete",
        "messageId": message2.get("_id"),
    })

    return {"message": "Chat message deleted"}
