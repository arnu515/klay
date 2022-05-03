from fastapi.responses import JSONResponse


class HTTPException(Exception):
    def __init__(self, message: str, status: int = 400, data: dict | None = None, headers: dict | None = None):
        if data is None:
            data = dict()
        self.message = message
        self.status = status
        self.data = data
        self.headers = headers

    @property
    def response(self):
        return JSONResponse({
            "message": self.message,
            "data": self.data
        }, self.status, self.headers)
