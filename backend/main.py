import os
import json
import hashlib
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import text

from .db.database import get_db_connection, init_postgresql_db
from .db.mongodb import configuration_logs, user_preferences
from .db.vector_search import seed_settings_embeddings, search_settings_semantic

app = FastAPI(title="Settings & Configuration Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Password Utilities
# =========================

def hash_password(password: str, salt: str = None) -> str:
    if salt is None:
        salt = os.urandom(16).hex()

    hashed = hashlib.sha256(
        (password + salt).encode("utf-8")
    ).hexdigest()

    return f"{salt}:{hashed}"


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or ":" not in stored_hash:
        return False

    salt, hashed = stored_hash.split(":", 1)

    check_hash = hashlib.sha256(
        (password + salt).encode("utf-8")
    ).hexdigest()

    return check_hash == hashed


# =========================
# Models
# =========================

class RegisterRequest(BaseModel):
    username: str
    name: str
    password: str
    role: Optional[str] = "user"
    email: Optional[str] = None


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str


class SettingUpdate(BaseModel):
    setting_id: str
    user_id: int
    value: str


class PreferenceUpdate(BaseModel):
    user_id: int
    pref_key: str
    pref_value: str


# =========================
# Seed Data
# =========================

def seed_databases():
    init_postgresql_db()

    conn = get_db_connection()

    try:
        # USERS
        user_count = conn.execute(
            text("SELECT COUNT(*) FROM users")
        ).scalar()

        if user_count == 0:
            conn.execute(text("""
                INSERT INTO users
                (username, email, password, name, role, avatar)
                VALUES
                (
                    'admin',
                    'admin@gmail.com',
                    :password,
                    'System Administrator',
                    'admin',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=admin'
                )
            """), {"password": hash_password("admin123")})

            conn.execute(text("""
                INSERT INTO users
                (username, email, password, name, role, avatar)
                VALUES
                (
                    'dan_developer',
                    'dan@gmail.com',
                    :password,
                    'Developer Dan',
                    'user',
                    'https://api.dicebear.com/7.x/bottts/svg?seed=dan'
                )
            """), {"password": hash_password("dan123")})

        # GROUPS
        group_count = conn.execute(
            text("SELECT COUNT(*) FROM configuration_groups")
        ).scalar()

        if group_count == 0:
            groups = [
                ("general", "General Settings", "Settings", "Basic app details, default language, and timezone options."),
                ("security", "Security & Privacy", "Shield", "MFA, session timeout, profile visibility, and data usage sharing."),
                ("notifications", "Notifications", "Bell", "Manage email alerts, push notifications, and marketing preferences."),
                ("appearance", "UI & Appearance", "Palette", "Customize visual experience, themes, and font size choices."),
                ("system", "System & Advanced", "Cpu", "System-wide parameters like rate limiting, upload types, and maintenance mode.")
            ]

            for g in groups:
                conn.execute(text("""
                    INSERT INTO configuration_groups
                    (id, name, icon, description)
                    VALUES
                    (:id, :name, :icon, :description)
                """), {
                    "id": g[0],
                    "name": g[1],
                    "icon": g[2],
                    "description": g[3]
                })

        # SETTINGS
        settings_count = conn.execute(
            text("SELECT COUNT(*) FROM settings")
        ).scalar()

        if settings_count == 0:
            settings = [
                ("site_name", "general", "Site Name", "The title of the web portal displayed in browser tabs and headers.", "string", "Settings Hub", None, True, False),
                ("site_description", "general", "Site Description", "Meta description of the portal used for SEO and portal metadata.", "string", "Enterprise Configurations Portal", None, True, False),
                ("language", "general", "Language Preference", "Your default display language for translation and localization.", "select", "English", json.dumps(["English", "Spanish", "French", "German"]), False, False),
                ("timezone", "general", "Timezone", "Standard timezone used to display logs and timelines.", "select", "UTC", json.dumps(["UTC", "EST (GMT-5)", "PST (GMT-8)", "IST (GMT+5:30)", "CET (GMT+1)"]), False, False),

                ("two_factor_auth", "security", "Two-Factor Authentication (2FA)", "Require a security token verification code in addition to user credentials.", "boolean", "false", None, False, False),
                ("session_timeout", "security", "Session Idle Timeout", "Automatically log users out after a specific period of inactivity (in minutes).", "number", "30", None, True, False),
                ("profile_visibility", "security", "Profile Visibility", "Control who can search and view your user profile details.", "select", "Public", json.dumps(["Public", "Private", "Contacts Only"]), False, False),
                ("data_sharing", "security", "Anonymous Analytics Sharing", "Share anonymous usage statistics to help us improve user experience.", "boolean", "true", None, False, False),

                ("email_notifications", "notifications", "Email Notifications", "Send alerts via email for important system updates and account actions.", "boolean", "true", None, False, False),
                ("push_notifications", "notifications", "Push Notifications", "Show desktop alert notifications when the system generates events.", "boolean", "false", None, False, False),
                ("marketing_emails", "notifications", "Marketing & Promotional Emails", "Receive newsletters and promotional material from our teams.", "boolean", "false", None, False, False),
                ("notification_frequency", "notifications", "Notification Frequency", "Frequency at which notification digests are sent.", "select", "Daily Digest", json.dumps(["Realtime", "Daily Digest", "Weekly Summary", "Never"]), False, False),

                ("theme", "appearance", "App Visual Theme", "Switches the site color scheme between light, dark, or system preferences.", "select", "Dark Mode", json.dumps(["Light Mode", "Dark Mode", "System Default"]), False, False),
                ("font_size", "appearance", "Font Sizing", "Adjust the UI scaling font size for accessibility.", "select", "Medium", json.dumps(["Small", "Medium", "Large", "Extra Large"]), False, False),

                ("maintenance_mode", "system", "Maintenance Mode", "Locks out non-admin users and shows a maintenance screen.", "boolean", "false", None, True, False),
                ("api_rate_limit", "system", "API Rate Limit", "Maximum HTTP requests allowed per client IP per minute.", "number", "1000", None, True, False),
                ("allowed_file_types", "system", "Allowed File Attachment Types", "Comma separated file extensions allowed to upload in support tickets.", "string", "jpg,png,pdf,docx", None, True, False)
            ]

            for s in settings:
                conn.execute(text("""
                    INSERT INTO settings
                    (id, group_id, name, description, type, default_value, options, is_system_wide, is_sensitive)
                    VALUES
                    (:id, :group_id, :name, :description, :type, :default_value, :options, :is_system_wide, :is_sensitive)
                """), {
                    "id": s[0],
                    "group_id": s[1],
                    "name": s[2],
                    "description": s[3],
                    "type": s[4],
                    "default_value": s[5],
                    "options": s[6],
                    "is_system_wide": s[7],
                    "is_sensitive": s[8]
                })

        conn.commit()

    finally:
        conn.close()

    try:
        seed_settings_embeddings()
    except Exception as e:
        print(f"Vector seeding skipped: {e}")


@app.on_event("startup")
def startup_event():
    seed_databases()


# =========================
# Helpers
# =========================

def get_setting_value(conn, setting_id, user_id, is_system_wide, default_val):
    target_user_id = -1 if is_system_wide else user_id

    row = conn.execute(text("""
        SELECT value
        FROM setting_values
        WHERE setting_id = :setting_id
        AND user_id = :user_id
    """), {
        "setting_id": setting_id,
        "user_id": target_user_id
    }).fetchone()

    return row[0] if row else default_val


# =========================
# Auth Routes
# =========================

@app.post("/api/auth/register")
def register_user(request: RegisterRequest):
    conn = get_db_connection()

    try:
        existing = conn.execute(text("""
            SELECT id
            FROM users
            WHERE username = :username
        """), {
            "username": request.username.strip()
        }).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Username is already taken")

        email = request.email.strip() if request.email else f"{request.username.strip()}@gmail.com"
        avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={request.username.strip()}"
        hashed_pw = hash_password(request.password)

        conn.execute(text("""
            INSERT INTO users
            (username, email, password, name, role, avatar)
            VALUES
            (:username, :email, :password, :name, :role, :avatar)
        """), {
            "username": request.username.strip(),
            "email": email,
            "password": hashed_pw,
            "name": request.name.strip(),
            "role": request.role or "user",
            "avatar": avatar_url
        })

        conn.commit()

        user = conn.execute(text("""
            SELECT id, username, name, role, avatar
            FROM users
            WHERE username = :username
        """), {
            "username": request.username.strip()
        }).fetchone()

        return dict(user._mapping)

    finally:
        conn.close()


@app.post("/api/auth/login")
def login_user(request: LoginRequest):
    conn = get_db_connection()

    try:
        identifier = (request.username or request.email or "").strip()
        if not identifier:
            raise HTTPException(status_code=400, detail="Username or email is required")

        row = conn.execute(text("""
            SELECT *
            FROM users
            WHERE username = :identifier
               OR email = :identifier
        """), {
            "identifier": identifier
        }).fetchone()

        if not row:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user = dict(row._mapping)

        if not verify_password(request.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        user.pop("password", None)
        return user

    finally:
        conn.close()


# =========================
# Users / Groups / Settings
# =========================

@app.get("/api/users")
def get_users():
    conn = get_db_connection()
    try:
        rows = conn.execute(text("""
            SELECT id, username, name, role, avatar
            FROM users
            ORDER BY id
        """)).fetchall()

        return [dict(r._mapping) for r in rows]
    finally:
        conn.close()


@app.get("/api/groups")
def get_groups():
    conn = get_db_connection()
    try:
        rows = conn.execute(text("""
            SELECT *
            FROM configuration_groups
            ORDER BY id
        """)).fetchall()

        return [dict(r._mapping) for r in rows]
    finally:
        conn.close()


@app.get("/api/settings")
def get_settings(user_id: int = Query(..., description="ID of current active user")):
    conn = get_db_connection()
    try:
        rows = conn.execute(text("""
            SELECT *
            FROM settings
            ORDER BY group_id, id
        """)).fetchall()

        result = []
        for row in rows:
            setting = dict(row._mapping)

            if setting["options"]:
                try:
                    setting["options"] = json.loads(setting["options"])
                except Exception:
                    pass

            setting["value"] = get_setting_value(
                conn,
                setting["id"],
                user_id,
                bool(setting["is_system_wide"]),
                setting["default_value"]
            )

            result.append(setting)

        return result
    finally:
        conn.close()


@app.post("/api/settings/update")
def update_setting(update: SettingUpdate):
    conn = get_db_connection()
    try:
        user_row = conn.execute(text("""
            SELECT name, role
            FROM users
            WHERE id = :id
        """), {
            "id": update.user_id
        }).fetchone()

        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")

        username = user_row[0]
        user_role = user_row[1]

        setting_row = conn.execute(text("""
            SELECT *
            FROM settings
            WHERE id = :id
        """), {
            "id": update.setting_id
        }).fetchone()

        if not setting_row:
            raise HTTPException(status_code=404, detail="Setting not found")

        setting = dict(setting_row._mapping)

        if bool(setting["is_system_wide"]) and user_role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Only Administrators can edit system-wide settings"
            )

        target_user_id = -1 if bool(setting["is_system_wide"]) else update.user_id

        old_value = get_setting_value(
            conn,
            setting["id"],
            update.user_id,
            bool(setting["is_system_wide"]),
            setting["default_value"]
        )

        conn.execute(text("""
            INSERT INTO setting_values (setting_id, user_id, value)
            VALUES (:setting_id, :user_id, :value)
            ON CONFLICT(setting_id, user_id)
            DO UPDATE SET value = excluded.value
        """), {
            "setting_id": setting["id"],
            "user_id": target_user_id,
            "value": update.value
        })

        conn.commit()

        try:
            configuration_logs.insert_one({
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
            })
        except Exception:
            pass

        return {
            "success": True,
            "setting_id": setting["id"],
            "value": update.value,
            "is_system_wide": bool(setting["is_system_wide"])
        }

    finally:
        conn.close()


@app.get("/api/settings/search")
def search_settings(
    q: str = Query(..., description="Query string for semantic search"),
    user_id: int = Query(..., description="Active user ID")
):
    conn = get_db_connection()
    try:
        try:
            search_matches = search_settings_semantic(q) or []
        except Exception:
            search_matches = []

        if search_matches:
            matched_ids = [m["setting_id"] for m in search_matches]
            score_map = {m["setting_id"]: m["score"] for m in search_matches}

            placeholders = ",".join([f":id{i}" for i in range(len(matched_ids))])
            params = {f"id{i}": sid for i, sid in enumerate(matched_ids)}

            rows = conn.execute(
                text(f"SELECT * FROM settings WHERE id IN ({placeholders})"),
                params
            ).fetchall()

            results = []
            for row in rows:
                setting = dict(row._mapping)
                if setting["options"]:
                    try:
                        setting["options"] = json.loads(setting["options"])
                    except Exception:
                        pass

                setting["value"] = get_setting_value(
                    conn,
                    setting["id"],
                    user_id,
                    bool(setting["is_system_wide"]),
                    setting["default_value"]
                )
                setting["score"] = score_map.get(setting["id"], 0)
                results.append(setting)

            results.sort(key=lambda x: x["score"], reverse=True)
            return results

        # Fallback search if semantic search returns nothing
        rows = conn.execute(text("""
            SELECT *
            FROM settings
            WHERE lower(name) LIKE lower(:q)
               OR lower(description) LIKE lower(:q)
            ORDER BY id
        """), {
            "q": f"%{q}%"
        }).fetchall()

        results = []
        for row in rows:
            setting = dict(row._mapping)
            if setting["options"]:
                try:
                    setting["options"] = json.loads(setting["options"])
                except Exception:
                    pass

            setting["value"] = get_setting_value(
                conn,
                setting["id"],
                user_id,
                bool(setting["is_system_wide"]),
                setting["default_value"]
            )
            setting["score"] = 0.5
            results.append(setting)

        return results

    finally:
        conn.close()


# =========================
# Logs / Preferences
# =========================

@app.get("/api/logs")
def get_logs():
    try:
        logs = configuration_logs.find()
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return logs[:100]
    except Exception:
        return []


@app.get("/api/preferences")
def get_preferences(user_id: int):
    try:
        prefs = user_preferences.find({"user_id": user_id})
        result = {}
        for p in prefs:
            result[p["pref_key"]] = p["pref_value"]
        return result
    except Exception:
        return {}


@app.post("/api/preferences")
def save_preferences(pref: PreferenceUpdate):
    try:
        user_preferences.update_one(
            {"user_id": pref.user_id, "pref_key": pref.pref_key},
            {"$set": {"pref_value": pref.pref_value}},
            upsert=True
        )
        return {"success": True}
    except Exception:
        return {"success": False}


# =========================
# Root
# =========================

@app.get("/")
def root():
    return {"message": "Backend Running Successfully"}