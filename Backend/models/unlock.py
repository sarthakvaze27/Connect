from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

class UnlockRecord(BaseModel):
    client_id:str
    professional_id:str,
    timestamp:datetime = Field(default_factory=datetime.now)
    tokens_spent:int = 10

    