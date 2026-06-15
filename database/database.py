from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine


engine = create_engine(
    "sqlite:///database.db",
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()