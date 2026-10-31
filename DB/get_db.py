from DB.db import SessionLocal

def get_db():
    db = SessionLocal()
    return db
