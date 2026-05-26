import numpy as np
import json
from .mongodb import settings_embeddings

# 20-dimensional semantic concept vector space
VOCABULARY = [
    "privacy",      # 0
    "security",     # 1
    "notification", # 2
    "email",        # 3
    "push",         # 4
    "theme",        # 5
    "appearance",   # 6
    "general",      # 7
    "advanced",     # 8
    "api",          # 9
    "system",       # 10
    "timeout",      # 11
    "profile",      # 12
    "data",         # 13
    "marketing",    # 14
    "language",     # 15
    "timezone",     # 16
    "auth",         # 17
    "mfa",          # 18
    "limit"         # 19
]

# Vocabulary map for fast index lookup
VOCAB_MAP = {word: idx for idx, word in enumerate(VOCABULARY)}

# Query synonym mapping to translate natural language words into semantic concepts
SYNONYMS = {
    "options": ["general", "system"],
    "preferences": ["notification", "general", "profile", "theme"],
    "configuration": ["system", "general", "advanced"],
    "config": ["system", "general", "advanced"],
    "password": ["security", "auth"],
    "login": ["security", "auth", "mfa"],
    "credentials": ["security", "auth"],
    "alert": ["notification", "email", "push"],
    "alerts": ["notification", "email", "push"],
    "mail": ["email", "notification"],
    "digest": ["notification", "email"],
    "spam": ["notification", "marketing"],
    "style": ["theme", "appearance"],
    "color": ["theme", "appearance"],
    "font": ["appearance"],
    "size": ["appearance"],
    "mfa": ["security", "auth", "mfa"],
    "2fa": ["security", "auth", "mfa"],
    "sharing": ["privacy", "data"],
    "analytics": ["privacy", "data"],
    "safety": ["security", "privacy"],
    "web": ["general", "system"],
    "rate": ["limit", "api"],
    "session": ["timeout", "security"],
    "avatar": ["profile", "general"],
    "lang": ["language", "general"],
    "zone": ["timezone", "general"],
    "admin": ["advanced", "system"],
    "developer": ["api", "advanced"]
}

# Raw setting vectors - these will be normalized when stored
RAW_SETTING_VECTORS = {
    "site_name": {
        "general": 0.9,
        "system": 0.3
    },
    "site_description": {
        "general": 0.9,
        "system": 0.3
    },
    "language": {
        "general": 0.7,
        "language": 0.9
    },
    "timezone": {
        "general": 0.7,
        "timezone": 0.9
    },
    "two_factor_auth": {
        "security": 0.95,
        "auth": 0.9,
        "mfa": 0.9,
        "privacy": 0.5
    },
    "session_timeout": {
        "security": 0.7,
        "timeout": 0.9,
        "system": 0.5
    },
    "profile_visibility": {
        "privacy": 0.95,
        "profile": 0.9,
        "general": 0.2
    },
    "data_sharing": {
        "privacy": 0.9,
        "data": 0.9,
        "advanced": 0.3
    },
    "email_notifications": {
        "notification": 0.95,
        "email": 0.95
    },
    "push_notifications": {
        "notification": 0.95,
        "push": 0.95
    },
    "marketing_emails": {
        "notification": 0.6,
        "email": 0.7,
        "marketing": 0.95
    },
    "notification_frequency": {
        "notification": 0.95,
        "general": 0.3
    },
    "theme": {
        "theme": 0.95,
        "appearance": 0.95
    },
    "font_size": {
        "appearance": 0.9,
        "theme": 0.3
    },
    "maintenance_mode": {
        "system": 0.95,
        "advanced": 0.8
    },
    "api_rate_limit": {
        "api": 0.95,
        "limit": 0.9,
        "system": 0.5
    },
    "allowed_file_types": {
        "system": 0.8,
        "security": 0.5,
        "advanced": 0.4
    }
}

def get_normalized_vector(concept_dict):
    """Create a 20-d normalized vector from a concept dict."""
    vec = np.zeros(len(VOCABULARY))
    for concept, weight in concept_dict.items():
        if concept in VOCAB_MAP:
            vec[VOCAB_MAP[concept]] = weight
    
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()

def seed_settings_embeddings():
    """Seed the settings_embeddings collection in Mock MongoDB."""
    # First, clear existing embeddings
    settings_embeddings.delete_many({})
    
    for setting_id, concept_dict in RAW_SETTING_VECTORS.items():
        embedding = get_normalized_vector(concept_dict)
        text_to_embed = f"Setting: {setting_id}. Concepts: " + ", ".join([f"{k} ({v})" for k, v in concept_dict.items()])
        settings_embeddings.insert_one({
            "setting_id": setting_id,
            "text_to_embed": text_to_embed,
            "embedding": embedding
        })
    print(f"Seeded {len(RAW_SETTING_VECTORS)} setting embeddings in Mock MongoDB settings_embeddings collection.")

def search_settings_semantic(query_text, threshold=0.15):
    """
    Search settings semantically using Cosine Similarity on query vectors.
    Query is tokenized, expanded with synonyms, vectorized, and compared with settings_embeddings.
    """
    if not query_text or not query_text.strip():
        return []

    # Clean and tokenize query
    words = query_text.lower().replace("-", " ").replace("_", " ").split()
    
    # Build query concept weights
    query_weights = {}
    for word in words:
        # Direct vocabulary match (High weight)
        if word in VOCAB_MAP:
            query_weights[word] = query_weights.get(word, 0.0) + 3.0
        
        # Synonym expansion (Medium weight)
        if word in SYNONYMS:
            for concept in SYNONYMS[word]:
                query_weights[concept] = query_weights.get(concept, 0.0) + 0.4
                
    # If no keywords matched, try partial word matching against vocabulary (Low weight)
    if not query_weights:
        for word in words:
            for vocab_word in VOCABULARY:
                if vocab_word in word or word in vocab_word:
                    query_weights[vocab_word] = query_weights.get(vocab_word, 0.0) + 0.2
                    
    # If still empty, return empty list
    if not query_weights:
        return []

    # Vectorize and normalize query
    query_vector = np.array(get_normalized_vector(query_weights))
    
    # Retrieve all embeddings from MongoDB
    all_embeddings = settings_embeddings.find()
    
    results = []
    for doc in all_embeddings:
        setting_vector = np.array(doc["embedding"])
        
        # Cosine similarity is the dot product of two normalized vectors
        similarity = float(np.dot(query_vector, setting_vector))
        
        if similarity >= threshold:
            results.append({
                "setting_id": doc["setting_id"],
                "score": round(similarity, 4)
            })
            
    # Sort by similarity score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

if __name__ == "__main__":
    # Test queries
    seed_settings_embeddings()
    print("Testing 'Privacy settings options':")
    print(search_settings_semantic("Privacy settings options"))
    print("\nTesting 'Notification preferences configuration':")
    print(search_settings_semantic("Notification preferences configuration"))
