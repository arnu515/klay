import os

from pymongo import MongoClient

mongo = MongoClient(os.environ.get("MONGODB_URI"))

db = mongo[os.environ.get("MONGODB_DB", "klay")]
