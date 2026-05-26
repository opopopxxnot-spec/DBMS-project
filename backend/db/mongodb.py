import os
import json
import time
import uuid

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
MONGO_DB_PATH = os.path.join(DATA_DIR, "mongo_db.json")

class MockCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name

    def _get_data(self):
        data = self.db._load_db()
        return data.setdefault(self.name, [])

    def _save_data(self, collection_data):
        data = self.db._load_db()
        data[self.name] = collection_data
        self.db._save_db(data)

    def insert_one(self, document):
        doc = dict(document)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        
        collection_data = self._get_data()
        collection_data.append(doc)
        self._save_data(collection_data)
        return doc

    def find(self, filter_dict=None):
        collection_data = self._get_data()
        if not filter_dict:
            return collection_data
        
        results = []
        for doc in collection_data:
            match = True
            for k, v in filter_dict.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                results.append(doc)
        return results

    def find_one(self, filter_dict):
        results = self.find(filter_dict)
        return results[0] if results else None

    def update_one(self, filter_dict, update_dict, upsert=False):
        collection_data = self._get_data()
        updated = False
        
        # Look for target document
        for doc in collection_data:
            match = True
            for k, v in filter_dict.items():
                if doc.get(k) != v:
                    match = False
                    break
            
            if match:
                # Apply update (simulating $set)
                set_fields = update_dict.get("$set", update_dict)
                for uk, uv in set_fields.items():
                    doc[uk] = uv
                updated = True
                break
        
        if not updated and upsert:
            # Create a new document containing filter fields and set fields
            new_doc = {}
            for k, v in filter_dict.items():
                new_doc[k] = v
            set_fields = update_dict.get("$set", update_dict)
            for uk, uv in set_fields.items():
                new_doc[uk] = uv
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            collection_data.append(new_doc)
            self._save_data(collection_data)
            return new_doc
            
        if updated:
            self._save_data(collection_data)
        return updated

    def delete_many(self, filter_dict):
        collection_data = self._get_data()
        initial_len = len(collection_data)
        
        new_data = []
        for doc in collection_data:
            match = True
            for k, v in filter_dict.items():
                if doc.get(k) != v:
                    match = False
                    break
            if not match:
                new_data.append(doc)
                
        self._save_data(new_data)
        return {"deleted_count": initial_len - len(new_data)}


class MockMongoClient:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if not os.path.exists(MONGO_DB_PATH):
            with open(MONGO_DB_PATH, "w") as f:
                json.dump({}, f)

    def _load_db(self):
        try:
            with open(MONGO_DB_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return {}

    def _save_db(self, data):
        with open(MONGO_DB_PATH, "w") as f:
            json.dump(data, f, indent=2)

    def get_database(self, db_name="settings_db"):
        return MockDatabase(self, db_name)


class MockDatabase:
    def __init__(self, client, name):
        self.client = client
        self.name = name

    def _load_db(self):
        return self.client._load_db()

    def _save_db(self, data):
        self.client._save_db(data)

    def get_collection(self, collection_name):
        return MockCollection(self, collection_name)


# Singleton db instance
mongo_client = MockMongoClient()
mongodb = mongo_client.get_database("settings_db")

# Collections
configuration_logs = mongodb.get_collection("configuration_logs")
settings_embeddings = mongodb.get_collection("settings_embeddings")
user_preferences = mongodb.get_collection("user_preferences")
