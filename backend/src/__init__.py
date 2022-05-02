from fastapi.middleware.cors import CORSMiddleware
from os import getenv

from .app import app

CORSMiddleware(app, allow_credentials=True, allow_origins=[getenv("FRONTEND_URL", "http://localhost:3000")])
