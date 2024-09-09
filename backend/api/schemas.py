from pydantic import BaseModel, EmailStr
from typing import Optional


# # Pydantic Models

class UserCreateV(BaseModel):
    username: Optional[str]
    name: Optional[str]
    surname: Optional[str]
    email: EmailStr
    password: str
    phone_number: Optional[str]

class DirectoryEditV(BaseModel):
    id: Optional[str]
    adi: Optional[str]
    internal_number_area_code: Optional[str]
    internal_number: Optional[str]
    ip_number_area_code: Optional[str]
    ip_number: Optional[str]
    mailbox: Optional[str]
    visibility: Optional[int]
    spare_number: Optional[str]
    subscription_id: Optional[int]

class SubscriptionCreateV(BaseModel):
    subscription_types: Optional[str]

class SubscriptionEditV(BaseModel):
    id: Optional[int]
    subscription_types: Optional[str]