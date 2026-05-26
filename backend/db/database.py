from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = "postgresql://postgres:aaryan@localhost:5432/confighub"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_connection():
    return engine.connect()

def init_postgresql_db():
    conn = engine.connect()

    # Users Table
    conn.execute(text("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
        avatar TEXT
    )
    """))

    # Configuration Groups Table
    conn.execute(text("""
    CREATE TABLE IF NOT EXISTS configuration_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        description TEXT
    )
    """))

    # Settings Table
    conn.execute(text("""
    CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('boolean', 'select', 'string', 'number')),
        default_value TEXT NOT NULL,
        options TEXT,
        is_system_wide BOOLEAN NOT NULL,
        is_sensitive BOOLEAN NOT NULL,
        FOREIGN KEY (group_id) REFERENCES configuration_groups(id)
    )
    """))

    # Setting Values Table
    conn.execute(text("""
    CREATE TABLE IF NOT EXISTS setting_values (
        setting_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (setting_id, user_id),
        FOREIGN KEY (setting_id) REFERENCES settings(id)
    )
    """))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_postgresql_db()
    print("PostgreSQL Database initialized successfully.")