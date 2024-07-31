# src/utils/json_validator.py

import json
import jsonschema
from jsonschema import validate

def load_json_schema(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
        print(f"Content of {file_path}: {content}")  # Debugging statement
        print(f"Length of content: {len(content)}")  # Debugging statement
        schema = json.loads(content)
    return schema

def validate_json(instance, schema):
    try:
        validate(instance=instance, schema=schema)
    except jsonschema.exceptions.ValidationError as err:
        return False, err.message
    except jsonschema.exceptions.SchemaError as err:
        return False, err.message
    return True, None
