# src/utils/route_parser.py

import yaml
from typing import List, Dict, Any

def parse_route_specs(file_path: str) -> List[Dict[str, Any]]:
    with open(file_path, 'r') as file:
        try:
            route_specs = yaml.safe_load(file)
            return route_specs
        except yaml.YAMLError as e:
            print(f"Error parsing YAML file: {e}")
            return None

def validate_route_spec(route_spec: Dict[str, Any]) -> List[str]:
    errors = []
    required_fields = ['route_details', 'logical_steps']
    
    for field in required_fields:
        if field not in route_spec:
            errors.append(f"Missing required field: {field}")
    
    if 'route_details' in route_spec:
        if 'path' not in route_spec['route_details']:
            errors.append("Missing 'path' in route_details")
        elif not route_spec['route_details']['path'].startswith('/'):
            errors.append("Path must start with a '/'")
        
        if 'method' not in route_spec['route_details']:
            errors.append("Missing 'method' in route_details")
        elif route_spec['route_details']['method'] not in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            errors.append("Invalid HTTP method")
    
    if 'logical_steps' in route_spec:
        if not isinstance(route_spec['logical_steps'], list):
            errors.append("logical_steps must be a list")
    
    return errors

def parse_and_validate_route_specs(file_path: str) -> List[Dict[str, Any]]:
    route_specs = parse_route_specs(file_path)
    if route_specs is None:
        return None
    
    valid_specs = []
    for spec in route_specs:
        errors = validate_route_spec(spec)
        if errors:
            print(f"Invalid route specification for path '{spec.get('route_details', {}).get('path', 'unknown')}':")
            for error in errors:
                print(f"- {error}")
        else:
            valid_specs.append(spec)
    
    return valid_specs
