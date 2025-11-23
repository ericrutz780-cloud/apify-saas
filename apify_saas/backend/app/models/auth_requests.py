from pydantic import BaseModel

class UserAuth(BaseModel):
    email: str
    password: str