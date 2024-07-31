# src/utils/schema_validator.py

import yaml
from cerberus import Validator
from utils.json_validator import load_json_schema, validate_json

# Define the schema for route specifications
route_schema = {
    'path': {'type': 'string', 'required': True},
    'method': {'type': 'string', 'required': True, 'allowed': ['GET', 'POST', 'PUT', 'DELETE']},
    'description': {'type': 'string', 'required': True},
    'input': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                'name': {'type': 'string', 'required': True},
                'type': {'type': 'string', 'required': True, 'allowed': ['string', 'number', 'boolean', 'object', 'array']},
                'description': {'type': 'string', 'required': True}
            }
        }
    },
    'logicalSteps': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                'step': {'type': 'string', 'required': True},
                'description': {'type': 'string', 'required': True}
            }
        }
    },
    'middleware': {
        'type': 'list',
        'schema': {'type': 'string'}
    }
}

def validate_yaml(file_path, route_schema, input_schema):
    with open(file_path, 'r') as file:
        data = yaml.safe_load(file)
    
    v = Validator(route_schema)
    for entry in data:
        if not v.validate(entry, route_schema):
            print(f"Validation errors in {entry['path']}: {v.errors}")
            return False
        
        for input_spec in entry.get('input', []):
            valid, message = validate_json(input_spec, input_schema)
            if not valid:
                print(f"Input validation error in {entry['path']}: {message}")
                return False
                
    return True

# Ensure schema is available for import
schema = route_schema

if __name__ == "__main__":
    specs_file_path = 'data/route_specs.yaml'
    input_schema = load_json_schema('src/schemas/input_schema.json')
    if validate_yaml(specs_file_path, route_schema, input_schema):
        print("YAML file is valid")
    else:
        print("YAML file is invalid")
