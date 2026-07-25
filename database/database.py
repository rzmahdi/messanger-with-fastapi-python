from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg2://postgres:Mahdi11228Postgres@localhost:5432/messenger"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()