import sqlite3
import json
from pathlib import Path
from backend.app.config import settings
from backend.app.db.ifct_data import IFCT_FOOD_RECORDS

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Food compositions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS food_compositions (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        energy_kcal REAL NOT NULL,
        protein_g REAL NOT NULL,
        carbohydrate_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        fiber_g REAL DEFAULT 0.0,
        calcium_mg REAL DEFAULT 0.0,
        iron_mg REAL DEFAULT 0.0,
        source TEXT NOT NULL
    );
    """)
    
    # 2. Meal history table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meal_records (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        total_calories REAL NOT NULL,
        total_protein REAL NOT NULL,
        total_carbs REAL NOT NULL,
        total_fat REAL NOT NULL,
        dishes_json TEXT NOT NULL
    );
    """)
    
    # 3. Hygiene audit logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hygiene_audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        station_id TEXT NOT NULL,
        compliance_score REAL NOT NULL,
        workers_count INTEGER NOT NULL,
        violations_json TEXT NOT NULL
    );
    """)
    
    # Seed food compositions if empty
    cursor.execute("SELECT COUNT(*) FROM food_compositions")
    count = cursor.fetchone()[0]
    
    if count == 0:
        for item in IFCT_FOOD_RECORDS:
            cursor.execute("""
            INSERT OR REPLACE INTO food_compositions 
            (code, name, category, energy_kcal, protein_g, carbohydrate_g, fat_g, fiber_g, calcium_mg, iron_mg, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item["code"], item["name"], item["category"],
                item["energy_kcal"], item["protein_g"], item["carbohydrate_g"],
                item["fat_g"], item.get("fiber_g", 0.0),
                item.get("calcium_mg", 0.0), item.get("iron_mg", 0.0),
                item["source"]
            ))
        conn.commit()
    
    conn.close()

def query_food_by_name(term: str):
    conn = get_connection()
    cursor = conn.cursor()
    search = f"%{term.lower()}%"
    cursor.execute("""
        SELECT * FROM food_compositions 
        WHERE LOWER(name) LIKE ? OR LOWER(category) LIKE ?
        LIMIT 10
    """, (search, search))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_food_count() -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM food_compositions")
    count = cursor.fetchone()[0]
    conn.close()
    return count
