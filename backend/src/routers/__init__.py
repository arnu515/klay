from . import profile
from . import chat_requests

routers = [
    {"path": profile.path, "router": profile.router},
    {"path": chat_requests.path, "router": chat_requests.router},
]
