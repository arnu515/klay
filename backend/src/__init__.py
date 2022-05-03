from appwrite.client import Client
from appwrite.services.account import Account
from fastapi import Depends
from fastapi.middleware.cors import CORSMiddleware

from .app import app
from .dependencies.auth import auth
from .exceptions.HTTPException import HTTPException

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(HTTPException)
def http_exception_handler(_, exc: HTTPException):
    return exc.response
