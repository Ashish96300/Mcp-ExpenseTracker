from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from DB.db import Base, engine


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)

    expenses = relationship("Expense", back_populates="user")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer)
    description = Column(String)
    date = Column(String)
    category = Column(String)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="expenses")


Base.metadata.create_all(bind=engine)