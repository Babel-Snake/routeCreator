from langchain_core.prompts import ChatPromptTemplate

def get_route_generation_chat_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", """You are an expert API developer. Your task is to generate a route file based on given specifications."""),
        ("human", """Given the following route details:
        {route_details}

        And this example route file:
        {example_route}

        Project information:
        {project_info}

        Project structure:
        {project_structure}

        Generate a route file that follows the style and structure of the example, implementing the specified route details. Ensure proper error handling and follow RESTful principles.

        Generated Route File:"""),
    ])

def get_controller_generation_chat_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", """You are an expert API developer. Your task is to generate a controller file based on a given route file."""),
        ("human", """Given the following route file:
        {route_file}

        And this example controller file:
        {example_controller}

        Project information:
        {project_info}

        Project structure:
        {project_structure}

        Route path:
        {route_path}

        Generate a controller file that follows the style and structure of the example, implementing the necessary methods to handle the routes defined in the route file. Ensure proper error handling and follow best practices for controller design. 

        IMPORTANT: You MUST include the route path '{route_path}' in your comments or method names. For example, create a method named 'handleUserRequest' for a '/users' route.

        Generated Controller File:"""),
    ])


def get_service_generation_chat_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", """You are an expert API developer. Your task is to generate a service file based on given route and controller files."""),
        ("human", """Given the following route file:
        {route_file}

        And the following controller file:
        {controller_file}

        And this example service file:
        {example_service}

        Project information:
        {project_info}

        Database schema:
        {db_schema}

        Project structure:
        {project_structure}

        Generate a service file that follows the style and structure of the example, implementing the necessary methods to handle the business logic required by the controller. Ensure proper error handling, database interactions based on the provided schema, and follow best practices for service layer design.

        Generated Service File:"""),
    ])

def get_swagger_docs_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", """You are an expert API developer. Your task is to generate Swagger documentation based on a given route file."""),
        ("human", """Given the following generated route:
        {generated_route}

        And this example Swagger documentation:
        {example_swagger}

        Generate Swagger documentation that follows the style and structure of the example, implementing the details of the generated route.

        Generated Swagger Documentation:"""),
    ])

def get_test_suite_generation_prompt():
    return ChatPromptTemplate.from_messages([
        ("system", "You are an expert in writing comprehensive Jest test suites for API routes."),
        ("human", """
        Given the following generated files:
        
        Route file:
        {route_file}
        
        Controller file:
        {controller_file}
        
        Service file:
        {service_file}
        
        Example test file:
        {example_test_file}
        
        Project structure:
        {project_structure}
        
        Generate a complete Jest test suite that covers all potential cases for the given route, controller, and service. Include tests for happy paths, error cases, edge cases, and any middleware functionality. Ensure proper mocking of dependencies and external services.
        
        Generated Test Suite:
        """)
    ])