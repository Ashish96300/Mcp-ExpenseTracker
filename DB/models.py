from DB.db import Base
from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship


class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True)
  name = Column(String, nullable=False)
  email = Column(String, unique=True, index=True, nullable=False)

  expenses = relationship("Expense", back_populates="user")


class Expense(Base):
  __tablename__ = "expenses"

  id = Column(Integer, primary_key=True)
  amount = Column(Numeric(12, 2), nullable=False)
  description = Column(String, nullable=False)
  date = Column(Date, nullable=False)
  category = Column(String, nullable=False)

  user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

  user = relationship("User", back_populates="expenses")
# Base.metadata.create_all(bind=engine)