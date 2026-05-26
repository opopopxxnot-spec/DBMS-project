import os
import json
import sqlite3
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone

from .db.database import get_db_connection, init_sqlite_db
from .db.mongodb import configuration_logs, user_preferences, settings_embeddings
from .db.vector_search import seed_settings_embeddings, search_settings_semantic

app = FastAPI(title="Settings & Configuration Management System")

# Configure CORS for Vite dev server (typically runs on 5173 or other local ports)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SettingUpdate(BaseModel):
    setting_id: str
    user_id: int
    value: str

class PreferenceUpdate(BaseModel):
    user_id: int
    pref_key: str
    pref_value: str

# Database Seeding helper
def seed_databases():
    # 1. Init SQLite schema
    init_sqlite_db()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 2. Check if users are seeded
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        users = [
            (1, "admin", "System Administrator", "admin", "https://api.dicebear.com/7.x/bottts/svg?seed=admin"),
            (2, "dan_developer", "Developer Dan", "user", "https://api.dicebear.com/7.x/bottts/svg?seed=dan"),
            (3, "jane_marketing", "Jane Doe", "user", "https://api.dicebear.com/7.x/bottts/svg?seed=jane")
        ]
        cursor.executemany("INSERT INTO users (id, username, name, role, avatar) VALUES (?, ?, ?, ?, ?)", users)
    
    # 3. Check if groups are seeded
    cursor.execute("SELECT COUNT(*) FROM configuration_groups")
    if cursor.fetchone()[0] == 0:
        groups = [
            ("general", "General Settings", "Settings", "Basic app details, default language, and timezone options."),
            ("security", "Security & Privacy", "Shield", "MFA, session timeout, profile visibility, and data usage sharing."),
            ("notifications", "Notifications", "Bell", "Manage email alerts, push notifications, and marketing preferences."),
            ("appearance", "UI & Appearance", "Palette", "Customize visual experience, themes, and font size choices."),
            ("system", "System & Advanced", "Cpu", "System-wide parameters like rate limiting, upload types, and maintenance mode.")
        ]
        cursor.executemany("INSERT INTO configuration_groups (id, name, icon, description) VALUES (?, ?, ?, ?)", groups)
        
    # 4. Check if settings definitions are seeded
    cursor.execute("SELECT COUNT(*) FROM settings")
    if cursor.fetchone()[0] == 0:
        settings = [
            # General Settings
            ("site_name", "general", "Site Name", "The title of the web portal displayed in browsertabs and headers.", "string", "Settings Hub", None, 1, 0),
            ("site_description", "general", "Site Description", "Meta description of the portal used for SEO and portal metadata.", "string", "Enterprise Configurations Portal", None, 1, 0),
            ("language", "general", "Language Preference", "Your default display language for translation and localization.", "select", "English", json.dumps(["English", "Spanish", "French", "German"]), 0, 0),
            ("timezone", "general", "Timezone", "Standard timezone used to display logs and timelines.", "select", "UTC", json.dumps(["UTC", "EST (GMT-5)", "PST (GMT-8)", "IST (GMT+5:30)", "CET (GMT+1)"]), 0, 0),
            
            # Security Settings
            ("two_factor_auth", "security", "Two-Factor Authentication (2FA)", "Require a security token verification code in addition to user credentials.", "boolean", "false", None, 0, 0),
            ("session_timeout", "security", "Session Idle Timeout", "Automatically log users out after a specific period of inactivity (in minutes).", "number", "30", None, 1, 0),
            ("profile_visibility", "security", "Profile Visibility", "Control who can search and view your user profile details.", "select", "Public", json.dumps(["Public", "Private", "Contacts Only"]), 0, 0),
            ("data_sharing", "security", "Anonymous Analytics Sharing", "Share anonymous usage statistics to help us improve user experience.", "boolean", "true", None, 0, 0),
            
            # Notification Settings
            ("email_notifications", "notifications", "Email Notifications", "Send alerts via email for important system updates and account actions.", "boolean", "true", None, 0, 0),
            ("push_notifications", "notifications", "Push Notifications", "Show desktop alert notifications when the system generates events.", "boolean", "false", None, 0, 0),
            ("marketing_emails", "notifications", "Marketing & Promotional Emails", "Receive newsletters and promotional material from our teams.", "boolean", "false", None, 0, 0),
            ("notification_frequency", "notifications", "Notification Frequency", "Frequency at which notifications digests are sent.", "select", "Daily Digest", json.dumps(["Realtime", "Daily Digest", "Weekly Summary", "Never"]), 0, 0),
            
            # Appearance Settings
            ("theme", "appearance", "App Visual Theme", "Switches the site color scheme between light, dark, or system preferences.", "select", "Dark Mode", json.dumps(["Light Mode", "Dark Mode", "System Default"]), 0, 0),
            ("font_size", "appearance", "Font Sizing", "Adjust the UI scaling font size for accessibility.", "select", "Medium", json.dumps(["Small", "Medium", "Large", "Extra Large"]), 0, 0),
            
            # System Settings
            ("maintenance_mode", "system", "Maintenance Mode", "Locks out non-admin users and shows a maintenance screen.", "boolean", "false", None, 1, 0),
            ("api_rate_limit", "system", "API Rate Limit", "Maximum HTTP requests allowed per client IP per minute.", "number", "1000", None, 1, 0),
            ("allowed_file_types", "system", "Allowed File Attachment Types", "Comma separated file extensions allowed to upload in support tickets.", "string", "jpg,png,pdf,docx", None, 1, 0)
        ]
        cursor.executemany("""
            INSERT INTO settings (id, group_id, name, description, type, default_value, options, is_system_wide, is_sensitive) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, settings)

    conn.commit()
    conn.close()
    
    # 5. Seed Vector Embeddings in Mock MongoDB
    seed_settings_embeddings()

@app.on_event("startup")
def on_startup():
    seed_databases()

# Helper: retrieve setting value resolver
def get_setting_value(cursor, setting_id, user_id, is_system_wide, default_val):
    target_user_id = -1 if is_system_wide else user_id
    cursor.execute("SELECT value FROM setting_values WHERE setting_id = ? AND user_id = ?", (setting_id, target_user_id))
    row = cursor.fetchone()
    return row[0] if row else default_val

# Endpoints
@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    users = [dict(row) for row in conn.execute("SELECT * FROM users").fetchall()]
    conn.close()
    return users

@app.get("/api/groups")
def get_groups():
    conn = get_db_connection()
    groups = [dict(row) for row in conn.execute("SELECT * FROM configuration_groups").fetchall()]
    conn.close()
    return groups

@app.get("/api/settings")
def get_settings(user_id: int = Query(..., description="ID of current active user")):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch all setting definitions
    cursor.execute("SELECT * FROM settings")
    settings_rows = cursor.fetchall()
    
    result = []
    for row in settings_rows:
        setting = dict(row)
        # Parse JSON options if present
        if setting["options"]:
            setting["options"] = json.loads(setting["options"])
        
        # Resolve current value based on user context
        setting["value"] = get_setting_value(
            cursor, 
            setting["id"], 
            user_id, 
            setting["is_system_wide"], 
            setting["default_value"]
        )
        
        result.append(setting)
        
    conn.close()
    return result

@app.post("/api/settings/update")
def update_setting(update: SettingUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verify user exists
    cursor.execute("SELECT name, role FROM users WHERE id = ?", (update.user_id,))
    user_row = cursor.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    
    username = user_row["name"]
    user_role = user_row["role"]
    
    # Verify setting definition
    cursor.execute("SELECT * FROM settings WHERE id = ?", (update.setting_id,))
    setting_row = cursor.fetchone()
    if not setting_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Setting not found")
        
    setting = dict(setting_row)
    
    # Check permissions (only admins can edit system-wide settings)
    if setting["is_system_wide"] and user_role != "admin":
        conn.close()
        raise HTTPException(status_code=403, detail="Unauthorized: Only Administrators can edit system-wide settings")
        
    target_user_id = -1 if setting["is_system_wide"] else update.user_id
    
    # Get old value for audit logging
    old_value = get_setting_value(cursor, setting["id"], update.user_id, setting["is_system_wide"], setting["default_value"])
    
    # Update value in SQLite
    cursor.execute("""
        INSERT INTO setting_values (setting_id, user_id, value)
        VALUES (?, ?, ?)
        ON CONFLICT(setting_id, user_id) DO UPDATE SET value = excluded.value
    """, (setting["id"], target_user_id, update.value))
    
    conn.commit()
    conn.close()
    
    # Log configuration changes to Mock MongoDB
    log_doc = {
        "user_id": update.user_id,
        "username": username,
        "role": user_role,
        "setting_id": setting["id"],
        "setting_name": setting["name"],
        "is_system_wide": bool(setting["is_system_wide"]),
        "action": "UPDATE",
        "old_value": old_value,
        "new_value": update.value,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }
    configuration_logs.insert_one(log_doc)
    
    return {
        "success": True, 
        "setting_id": setting["id"], 
        "value": update.value,
        "is_system_wide": bool(setting["is_system_wide"])
    }

@app.get("/api/settings/search")
def search_settings(q: str = Query(..., description="Query string for semantic search"), user_id: int = Query(..., description="Active user ID")):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Perform semantic search to get matched setting ids and cosine similarity scores
    search_matches = search_settings_semantic(q)
    
    if not search_matches:
        conn.close()
        return []
        
    matched_ids = [m["setting_id"] for m in search_matches]
    score_map = {m["setting_id"]: m["score"] for m in search_matches}
    
    # Fetch settings details from SQLite
    placeholders = ",".join("?" for _ in matched_ids)
    query = f"SELECT * FROM settings WHERE id IN ({placeholders})"
    cursor.execute(query, matched_ids)
    settings_rows = cursor.fetchall()
    
    results = []
    for row in settings_rows:
        setting = dict(row)
        if setting["options"]:
            setting["options"] = json.loads(setting["options"])
            
        setting["value"] = get_setting_value(
            cursor, 
            setting["id"], 
            user_id, 
            setting["is_system_wide"], 
            setting["default_value"]
        )
        # Attach semantic score
        setting["score"] = score_map[setting["id"]]
        results.append(setting)
        
    conn.close()
    
    # Sort results by score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

@app.get("/api/logs")
def get_logs():
    # Fetch logs from Mock MongoDB configuration_logs collection
    logs = configuration_logs.find()
    # Sort logs in memory by timestamp descending
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return logs[:100]  # Limit to 100 recent entries

@app.get("/api/preferences")
def get_user_prefs(user_id: int):
    # Fetch user pref settings from Mock MongoDB user_preferences collection
    prefs = user_preferences.find({"user_id": user_id})
    result = {}
    for p in prefs:
        result[p["pref_key"]] = p["pref_value"]
    return result

@app.post("/api/preferences")
def save_user_pref(pref: PreferenceUpdate):
    # Upsert preference in Mock MongoDB user_preferences
    user_preferences.update_one(
        {"user_id": pref.user_id, "pref_key": pref.pref_key},
        {"$set": {"pref_value": pref.pref_value}},
        upsert=True
    )
    return {"success": True, "pref_key": pref.pref_key, "pref_value": pref.pref_value}
