from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.avatars import Avatars
from appwrite.services.database import Database
from appwrite.services.functions import Functions
from appwrite.services.health import Health
from appwrite.services.locale import Locale
from appwrite.services.storage import Storage
from appwrite.services.teams import Teams
from appwrite.services.users import Users


class Appwrite:
    def __init__(self, client: Client):
        self.__client = client

    @property
    def client(self):
        return self.__client

    @property
    def account(self):
        return Account(self.__client)

    @property
    def avatars(self):
        return Avatars(self.__client)

    @property
    def database(self):
        return Database(self.__client)

    @property
    def functions(self):
        return Functions(self.__client)

    @property
    def health(self):
        return Health(self.__client)

    @property
    def locale(self):
        return Locale(self.__client)

    @property
    def storage(self):
        return Storage(self.__client)

    @property
    def teams(self):
        return Teams(self.__client)

    @property
    def users(self):
        return Users(self.__client)


def get_appwrite(client: Client):
    """
    Returns all appwrite services in one object
    """

    return Appwrite(client)
