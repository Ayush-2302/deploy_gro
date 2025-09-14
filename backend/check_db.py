from db import engine
from sqlmodel import text

with engine.connect() as conn:
    # Check if patientfilesection3 table exists
    result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='patientfilesection3'"))
    tables = list(result)
    print("Tables:", tables)
    
    if tables:
        # Check data in patientfilesection3
        result = conn.execute(text("SELECT * FROM patientfilesection3"))
        rows = list(result)
        print("Section 3 data:", rows)
    else:
        print("patientfilesection3 table does not exist")
