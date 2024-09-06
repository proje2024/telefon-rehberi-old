from sqlalchemy import (Column, Integer, String, Text, ForeignKey, Boolean)
from sqlalchemy.orm import relationship
from sqlalchemy.types import UserDefinedType
from sqlalchemy.ext.hybrid import hybrid_property
from .base import Base
from passlib.context import CryptContext
from sqlalchemy.dialects.postgresql import JSONB

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # SQLAlchemy Model


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    description = Column(Text)

    users = relationship("User", back_populates="role_rel")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    surname = Column(String(50), nullable=False)
    phone_number = Column(String(50))
    username = Column(String(255), unique=True)
    password = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(Integer, ForeignKey("roles.id"), default=2)

    role_rel = relationship("Role", back_populates="users")

class SubscriptionTypes(Base):
    __tablename__ = "subscriptionTypes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    subscription_types =  Column(Text, nullable=False)

class Hierarchy(Base):
    __tablename__ = "hiyerarcy"

    id = Column(Text, primary_key=True)
    adi = Column(Text, nullable=False)
    hiyerAd = Column(Text, nullable=False)
    internal_number = Column(Text, nullable=True)
    ip_number = Column(Text, nullable=True)
    mailbox = Column(Text, nullable=True)
    visibility = Column(Integer, nullable=True, default=1)
    spare_number = Column(Text, nullable=True)
    subscription_id = Column(Integer, ForeignKey("subscriptionTypes.id"), nullable=False, default=1)

    subscriptionTypes = relationship("SubscriptionTypes")

class Directory(Base):
    __tablename__ = "directory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hiyerid = Column(Text, ForeignKey("hiyerarcy.id"), nullable=True)
    ataid = Column(Integer, ForeignKey("directory.id"), nullable=True)

    hierarchy = relationship("Hierarchy")
    parent = relationship("Directory", remote_side=[id])
