import os

from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.exception import AppwriteException
from fastapi import Header

from src.exceptions.HTTPException import HTTPException


def auth(required=True):
    def handler(authorization: str | None = Header(None)):
        if authorization is None:
            if required:
                raise HTTPException("Authorization header is required", 401)
            return None
        if len(authorization.split(" ")) != 2:
            if required:
                raise HTTPException("Invalid Authorization header. Format: Bearer TOKEN", 401)
            return None
        bearer, token = authorization.split(" ")
        if bearer.lower() != "bearer" or not token:
            if required:
                raise HTTPException("Invalid Authorization header. Format: Bearer TOKEN", 401)
            return None

        # Create appwrite user
        appwrite = Client()
        appwrite.set_endpoint(os.getenv("APPWRITE_ENDPOINT"))\
            .set_project(os.getenv("APPWRITE_PROJECT_ID"))\
            .set_jwt(token)

        try:
            user = Account(appwrite).get()
            print(user)
            return appwrite
        except AppwriteException:
            if required:
                raise HTTPException("Invalid token", 401)
            return None

    return handler
