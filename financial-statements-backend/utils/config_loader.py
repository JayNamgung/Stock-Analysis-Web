import json
import os

def load_api_key(key_name):
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'api_key.json')
    with open(config_path, 'r') as f:
        config = json.load(f)
    return config.get(key_name)