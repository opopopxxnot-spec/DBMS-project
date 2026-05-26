import unittest
import os
import json
import sqlite3
from fastapi.testclient import TestClient

# Adjust path and import
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app, seed_databases
from backend.db.database import DB_PATH, get_db_connection
from backend.db.mongodb import MONGO_DB_PATH, configuration_logs

class TestSettingsBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Reset files for clean tests
        if os.path.exists(DB_PATH):
            try:
                os.remove(DB_PATH)
            except Exception:
                pass
        if os.path.exists(MONGO_DB_PATH):
            try:
                os.remove(MONGO_DB_PATH)
            except Exception:
                pass
                
        # Trigger seeding before running tests
        seed_databases()
        cls.client = TestClient(app)

    def test_get_users(self):
        response = self.client.get("/api/users")
        self.assertEqual(response.status_code, 200)
        users = response.json()
        self.assertTrue(len(users) >= 3)
        self.assertEqual(users[0]["username"], "admin")

    def test_get_settings_for_user(self):
        # Get settings for User ID 2 (Dan Developer - non-admin)
        response = self.client.get("/api/settings?user_id=2")
        self.assertEqual(response.status_code, 200)
        settings = response.json()
        
        # Verify language setting defaults to English
        lang_setting = next(s for s in settings if s["id"] == "language")
        self.assertEqual(lang_setting["value"], "English")
        self.assertEqual(lang_setting["is_system_wide"], 0)

    def test_update_user_specific_setting(self):
        # Dan Developer (User ID 2) updates language to Spanish
        response = self.client.post("/api/settings/update", json={
            "setting_id": "language",
            "user_id": 2,
            "value": "Spanish"
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        
        # Verify Jane Doe (User ID 3) still has English
        res_jane = self.client.get("/api/settings?user_id=3")
        lang_jane = next(s for s in res_jane.json() if s["id"] == "language")
        self.assertEqual(lang_jane["value"], "English")
        
        # Verify Dan (User ID 2) now sees Spanish
        res_dan = self.client.get("/api/settings?user_id=2")
        lang_dan = next(s for s in res_dan.json() if s["id"] == "language")
        self.assertEqual(lang_dan["value"], "Spanish")

    def test_system_wide_permissions(self):
        # Non-admin (User ID 2) tries to edit system-wide site_name -> Forbidden
        response = self.client.post("/api/settings/update", json={
            "setting_id": "site_name",
            "user_id": 2,
            "value": "Hacked Portal"
        })
        self.assertEqual(response.status_code, 403)
        
        # Admin (User ID 1) updates site_name -> Success
        response_admin = self.client.post("/api/settings/update", json={
            "setting_id": "site_name",
            "user_id": 1,
            "value": "Admin Settings Center"
        })
        self.assertEqual(response_admin.status_code, 200)
        
        # Verify system-wide setting propagates to Dan Developer (User ID 2)
        res_dan = self.client.get("/api/settings?user_id=2")
        site_name_dan = next(s for s in res_dan.json() if s["id"] == "site_name")
        self.assertEqual(site_name_dan["value"], "Admin Settings Center")

    def test_semantic_search_privacy(self):
        # Query "Privacy settings options"
        response = self.client.get("/api/settings/search?q=Privacy settings options&user_id=2")
        self.assertEqual(response.status_code, 200)
        results = response.json()
        
        # Verify privacy settings are top ranked
        top_keys = [r["id"] for r in results[:2]]
        self.assertIn("profile_visibility", top_keys)
        self.assertIn("data_sharing", top_keys)
        # Should have semantic similarity score
        self.assertTrue("score" in results[0])

    def test_semantic_search_notifications(self):
        # Query "Notification preferences configuration"
        response = self.client.get("/api/settings/search?q=Notification preferences configuration&user_id=2")
        self.assertEqual(response.status_code, 200)
        results = response.json()
        
        # Verify notification settings are top ranked
        top_keys = [r["id"] for r in results[:3]]
        self.assertIn("notification_frequency", top_keys)
        self.assertIn("email_notifications", top_keys)
        self.assertIn("push_notifications", top_keys)

    def test_configuration_logs_and_audit_trail(self):
        # Clear existing logs for predictable test
        configuration_logs.delete_many({})
        
        # Trigger an update
        self.client.post("/api/settings/update", json={
            "setting_id": "two_factor_auth",
            "user_id": 2,
            "value": "true"
        })
        
        # Fetch logs
        response = self.client.get("/api/logs")
        self.assertEqual(response.status_code, 200)
        logs = response.json()
        self.assertTrue(len(logs) > 0)
        self.assertEqual(logs[0]["setting_id"], "two_factor_auth")
        self.assertEqual(logs[0]["username"], "Developer Dan")
        self.assertEqual(logs[0]["new_value"], "true")

if __name__ == "__main__":
    unittest.main()
