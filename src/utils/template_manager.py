def get_template(template_type):
    if template_type == 'unified_template':
        return """
        Given the following information:

        1. Route Details:
        {route_details}

        2. Logical Steps:
        {logical_steps}

        3. DB Schema:
        {db_schema}

        4. Available Middleware and Utils:
        {middleware_utils}

        5. Example Route:
        {example_route}

        6. Example Controller:
        {example_controller}

        7. Example Service:
        {example_service}

        Generate the following files that follow the style and structure of the examples, implementing the specified route details and logical steps:
        1. A route file
        2. A controller file
        3. A service file (if necessary)

        Ensure proper error handling, follow RESTful principles, and implement the logical steps across the files as appropriate. Use the provided DB schema for accurate data operations and apply relevant middleware and utility functions where suitable.

        When using middleware or utilities, import them from their specified file paths. For example:
        const authenticateJWT = require('../middleware/auth');

        Separate each file with "--- FILE SEPARATOR ---" and start each file with a comment indicating its type (route, controller, or service).
        """
    elif template_type == 'swagger_template':
        return """
        Given the following route file:
        {route_file}

        And the following example Swagger documentation:
        {example_swagger}

        Generate Swagger documentation that describes the API endpoints defined in the route file, following the style and structure of the example Swagger documentation.

        Generated Swagger Documentation:
        """
    else:
        raise ValueError(f"Unknown template type: {template_type}")
