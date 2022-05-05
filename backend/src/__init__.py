from fastapi.middleware.cors import CORSMiddleware

from .app import app
from .dependencies.auth import auth
from .exceptions.HTTPException import HTTPException
from .routers import routers

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(HTTPException)
def http_exception_handler(_, exc: HTTPException):
    return exc.response


for router in routers:
    app.include_router(router["router"], prefix=router["path"])
