import os

from pymongo import MongoClient

mongo = MongoClient(os.environ.get("MONGO_URI"))
