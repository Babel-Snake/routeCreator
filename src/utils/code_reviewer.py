import ast
import re

def check_naming_conventions(code):
    issues = []
    # Check for camelCase variables and functions
    variable_pattern = re.compile(r'\b[a-z][a-zA-Z0-9]*\b')
    variables = re.findall(r'\b(?:let|const|var)\s+(\w+)', code)
    functions = re.findall(r'\bfunction\s+(\w+)', code)
    
    for var in variables + functions:
        if not variable_pattern.match(var):
            issues.append(f"'{var}' is not in camelCase")
    
    return issues

def check_formatting(code):
    issues = []
    lines = code.split('\n')
    
    # Check indentation
    if any(line.startswith(' ') and not line.startswith('  ') for line in lines):
        issues.append("Indentation should be 2 spaces")
    
    # Check line length
    if any(len(line) > 80 for line in lines):
        issues.append("Some lines are longer than 80 characters")
    
    # Check newline at EOF
    if not code.endswith('\n'):
        issues.append("File should end with a newline")
    
    return issues

def check_documentation(code):
    issues = []
    
    # Check for JSDoc comments
    if not re.search(r'/\*\*[\s\S]*?\*/', code):
        issues.append("Missing JSDoc comments")
    
    return issues

def review_code(code, file_type):
    issues = []
    
    # General checks
    try:
        ast.parse(code)
    except SyntaxError as e:
        issues.append(f"Syntax error: {str(e)}")
    
    if 'TODO' in code:
        issues.append("Code contains TODO comments")
    
    if 'console.log' in code:
        issues.append("Code contains console.log statements")
    
    # File-specific checks
    if file_type == 'route':
        if 'router.' not in code:
            issues.append("Route file doesn't use Express router")
        if 'module.exports' not in code:
            issues.append("Route file doesn't export the router")
    elif file_type == 'controller':
        if 'exports.' not in code and 'module.exports' not in code:
            issues.append("Controller doesn't export any functions")
    elif file_type == 'service':
        if 'class' not in code.lower() and 'function' not in code.lower():
            issues.append("Service file doesn't define any classes or functions")
    
    # Check for common patterns
    if 'async' not in code:
        issues.append("Consider using async/await for asynchronous operations")
    if 'try' not in code:
        issues.append("Consider adding try-catch blocks for error handling")
    
    return issues

def suggest_improvements(code, file_type):
    suggestions = []
    
    if file_type in ['controller', 'service'] and 'await' not in code:
        suggestions.append("Consider using async/await for database operations")
    
    if file_type == 'route' and 'validate' not in code.lower():
        suggestions.append("Consider adding input validation to the route")
    
    if 'transaction' not in code.lower() and file_type in ['controller', 'service']:
        suggestions.append("Consider using database transactions for data integrity")
    
    return suggestions

def check_db_schema_usage(code, db_schema):
    issues = []
    for table, details in db_schema.get('tables', {}).items():
        if table.lower() not in code.lower():
            continue
        for column in details.get('columns', []):
            if column['name'].lower() not in code.lower():
                issues.append(f"The column '{column['name']}' of table '{table}' is defined in the schema but not used in the code")
    return issues

def check_middleware_usage(code, middleware_list):
    used_middleware = []
    for middleware in middleware_list:
        if middleware.lower() in code.lower():
            used_middleware.append(middleware)
    return used_middleware