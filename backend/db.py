import os
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "db.sqlite")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Create engine with proper transaction handling
engine = create_engine(
    DATABASE_URL, 
    echo=False,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True
)

def create_db_and_tables():
    """Create database and tables if they don't exist"""
    # Ensure data directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    
    # Create all tables
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session
