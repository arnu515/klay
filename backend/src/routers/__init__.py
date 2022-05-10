from . import profile
from . import chat_requests
from . import chat_messages

routers = [
    {"path": profile.path, "router": profile.router},
    {"path": chat_requests.path, "router": chat_requests.router},
    {"path": chat_messages.path, "router": chat_messages.router},
]
