from DB.db import SessionLocal, Base, engine
from sqlalchemy import Column, Integer, String

# Define a model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)



class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer , primary_key= True ,index = True)
    amount = Column(Integer ,index = True)
    description = Column(String)
    date = Column(String)
    category = Column(String)
    print("Expense Model Created")


Base.metadata.create_all(bind=engine)