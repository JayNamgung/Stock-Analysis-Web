import json
import os

def load_api_key(key_name):
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'api_key.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config.get(key_name)

def load_db_config(db_name='postgresql'):
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'database_config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config.get(db_name)