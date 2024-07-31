import json
import os
import logging
from openai import OpenAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from dotenv import load_dotenv
from src.utils.prompt_utils import (
    get_route_generation_chat_prompt, 
    get_swagger_docs_prompt, 
    get_controller_generation_chat_prompt, 
    get_service_generation_chat_prompt,
    get_test_suite_generation_prompt
)
from src.utils.route_parser import parse_and_validate_route_specs
from src.utils.code_reviewer import review_code, suggest_improvements
from src.utils.template_manager import get_template

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AIAgent:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.llm_generation = ChatOpenAI(
            model="gpt-4o-mini",
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.llm_other_tasks = ChatOpenAI(
            model="gpt-3.5-turbo",
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )

        self.project_info = {}
        self.db_schema = {}
        self.example_files = {}
        self.middleware_utils = {}

        self.load_project_info('data/project_info.json')
        self.load_db_schema('data/db_schema.json')
        self.load_middleware('data/middleware_utils.json')
        self.load_example_files(
            'data/example_files/example_route.js',
            'data/example_files/example_controller.js',
            'data/example_files/example_service.js',
            'data/example_files/example_test.js'
        )
        self.load_example_swagger('data/example_files/example_swagger.js')
        self.load_project_structure('data/project_structure.json')

    def load_project_structure(self, file_path):
        try:
            with open(file_path, 'r') as f:
                self.project_structure = json.load(f)
            logger.debug("Project structure loaded successfully")
        except Exception as e:
            logger.error(f"Error loading project structure: {str(e)}")
            self.project_structure = {}

    def load_project_info(self, file_path):
        try:
            with open(file_path, 'r') as f:
                self.project_info = json.load(f)
            logger.debug("Project info loaded successfully")
        except Exception as e:
            logger.error(f"Error loading project info: {str(e)}")
            self.project_info = {}

    def load_db_schema(self, file_path):
        try:
            with open(file_path, 'r') as f:
                self.db_schema = json.load(f)
            logger.debug("DB schema loaded successfully")
        except Exception as e:
            logger.error(f"Error loading DB schema: {str(e)}")
            self.db_schema = {}

    def load_example_files(self, route_path, controller_path, service_path, test_path):
        try:
            with open(route_path, 'r') as f:
                self.example_files['route'] = f.read()
            with open(controller_path, 'r') as f:
                self.example_files['controller'] = f.read()
            with open(service_path, 'r') as f:
                self.example_files['service'] = f.read()
            with open(test_path, 'r') as f:
                self.example_files['test'] = f.read()
            logger.debug("Example files loaded successfully")
        except Exception as e:
            logger.error(f"Error loading example files: {str(e)}")
            self.example_files = {}

    def load_middleware(self, file_path):
        try:
            with open(file_path, 'r') as f:
                self.middleware_utils = json.load(f)
            logger.debug("Middleware loaded successfully")
        except Exception as e:
            logger.error(f"Error loading middleware: {str(e)}")
            self.middleware_utils = {}

    def load_example_swagger(self, file_path):
        try:
            with open(file_path, 'r') as file:
                self.example_swagger = file.read()
            logger.debug(f"Example Swagger loaded successfully from {file_path}")
        except Exception as e:
            logger.error(f"Error loading example Swagger from {file_path}: {str(e)}")
            self.example_swagger = ""

    def save_generated_file(self, file_path, content):
        try:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            if os.path.exists(file_path):
                logger.warning(f"Warning: File {file_path} already exists. Overwriting.")
            
            with open(file_path, 'w') as f:
                f.write(content)
            
            logger.debug(f"File saved successfully at {file_path}")
        except Exception as e:
            logger.error(f"Error saving file {file_path}: {str(e)}")
            raise
    def generate_route_file(self, route_spec):
        try:
            logger.debug("Entering generate_route_file")
            
            if 'route_details' not in route_spec:
                raise ValueError("Missing 'route_details' in route_spec")

            prompt = get_route_generation_chat_prompt()
            inputs = {
                "route_details": json.dumps(route_spec['route_details'], indent=2),
                "example_route": self.example_files['route'],
                "project_info": json.dumps(self.project_info, indent=2),
                "project_structure": json.dumps(self.project_structure, indent=2)
            }

            logger.debug(f"Route file inputs: {inputs}")
            chain = RunnableSequence(prompt | self.llm_generation)
            result = chain.invoke(inputs)

            logger.debug("Route file generated successfully")
            generated_file = result.content if hasattr(result, 'content') else result
            logger.debug(f"Generated route file content: {generated_file[:500]}...") 
            file_name = route_spec.get('file_names', {}).get('route', 'generatedRoute.js')
            self.save_generated_file(f'generated/{file_name}', generated_file)
            
            return generated_file, file_name
        except Exception as e:
            logger.error(f"Error in generate_route_file: {str(e)}")
            raise

    def generate_controller_file(self, route_file, route_spec):
        try:
            logger.debug("Entering generate_controller_file")
            
            prompt = get_controller_generation_chat_prompt()
            inputs = {
                "route_file": route_file,
                "example_controller": self.example_files['controller'],
                "project_info": json.dumps(self.project_info, indent=2),
                "project_structure": json.dumps(self.project_structure, indent=2),
                "route_path": route_spec['route_details']['path']
            }

            logger.debug(f"Controller file inputs: {inputs}")
            chain = RunnableSequence(prompt | self.llm_generation)
            logger.debug(f"Generating controller for route path: {route_spec['route_details']['path']}")
            result = chain.invoke(inputs)

            logger.debug("Controller file generated successfully")
            generated_file = result.content if hasattr(result, 'content') else result
            logger.debug(f"Generated controller content: {generated_file[:500]}...") 
            file_name = route_spec.get('file_names', {}).get('controller', 'generatedController.js')
            self.save_generated_file(f'generated/{file_name}', generated_file)
            
            return generated_file, file_name
        except Exception as e:
            logger.error(f"Error in generate_controller_file: {str(e)}")
            raise

    def generate_service_file(self, route_file, controller_file, route_spec):
        try:
            logger.debug("Entering generate_service_file")
            
            prompt = get_service_generation_chat_prompt()
            inputs = {
                "route_file": route_file,
                "controller_file": controller_file,
                "example_service": self.example_files['service'],
                "project_info": json.dumps(self.project_info, indent=2),
                "db_schema": json.dumps(self.db_schema, indent=2),
                "project_structure": json.dumps(self.project_structure, indent=2)
            }

            logger.debug(f"Service file inputs: {inputs}")
            chain = RunnableSequence(prompt | self.llm_generation)
            result = chain.invoke(inputs)

            logger.debug("Service file generated successfully")
            generated_file = result.content if hasattr(result, 'content') else result
            logger.debug(f"Generated service content: {generated_file[:500]}...") 
            file_name = route_spec.get('file_names', {}).get('service', 'generatedService.js')
            self.save_generated_file(f'generated/{file_name}', generated_file)
            
            return generated_file, file_name
        except Exception as e:
            logger.error(f"Error in generate_service_file: {str(e)}")
            raise

    def generate_swagger_docs(self, route_file, example_swagger, route_spec):
        try:
            logger.debug("Entering generate_swagger_docs")
            
            template = get_template('swagger_template')
            prompt = ChatPromptTemplate.from_messages([
                ("system", template),
                ("user", "Generate the Swagger documentation based on the route provided.")
            ])
            chain = RunnableSequence(prompt | self.llm_other_tasks)

            inputs = {
                "route_file": route_file,
                "example_swagger": example_swagger
            }
            logger.debug(f"Swagger docs inputs: {inputs}")
            result = chain.invoke(inputs)

            logger.debug("Swagger documentation generated successfully")
            generated_file = result.content if hasattr(result, 'content') else result
            logger.debug(f"Generated swagger content: {generated_file[:500]}...") 
            file_name = route_spec.get('file_names', {}).get('swagger', 'swaggerDocs.json')
            self.save_generated_file(f'generated/{file_name}', generated_file)

            return generated_file, file_name
        except Exception as e:
            logger.error(f"Error in generate_swagger_docs: {str(e)}")
            raise

    def generate_files_sequentially(self, route_spec):
        route_file, route_file_name = self.generate_route_file(route_spec)
        controller_file, controller_file_name = self.generate_controller_file(route_file, route_spec)
        service_file, service_file_name = self.generate_service_file(route_file, controller_file, route_spec)
        swagger_docs, swagger_file_name = self.generate_swagger_docs(route_file, self.example_swagger, route_spec)

        return {
            'route': {'content': route_file, 'file_name': route_file_name},
            'controller': {'content': controller_file, 'file_name': controller_file_name},
            'service': {'content': service_file, 'file_name': service_file_name},
            'swagger': {'content': swagger_docs, 'file_name': swagger_file_name}
        }

    def generate_test_suite(self, route_file_name, controller_file_name, service_file_name):
        logger.info(f"Starting test suite generation for {route_file_name}")
        
        try:
            # Read the newly generated files
            route_file = self.read_file(f'generated/{route_file_name}')
            controller_file = self.read_file(f'generated/{controller_file_name}')
            service_file = self.read_file(f'generated/{service_file_name}')
            example_test_file = self.read_file('data/example_files/example_test.js')
            
            logger.info("Successfully read all required files")

            prompt = get_test_suite_generation_prompt()
            inputs = {
                "route_file": route_file,
                "controller_file": controller_file,
                "service_file": service_file,
                "example_test_file": example_test_file,
                "project_structure": json.dumps(self.project_structure, indent=2)
            }
            
            logger.info("Invoking AI model for test suite generation")
            chain = RunnableSequence(prompt | self.llm_generation)
            result = chain.invoke(inputs)
            
            logger.info("AI model invocation completed")
            
            generated_test_suite = result.content if hasattr(result, 'content') else result
            if not generated_test_suite:
                logger.error("Generated test suite is empty!")
                return None, None
            
            logger.info(f"Test suite generated. Length: {len(generated_test_suite)} characters")
            logger.debug(f"Generated test suite preview: {generated_test_suite[:500]}...")

            test_file_name = f"test_{route_file_name.replace('.js', '.test.js')}"
            full_path = os.path.join('generated', 'tests', test_file_name)
            
            self.save_generated_file(full_path, generated_test_suite)
            logger.info(f"Test suite saved to {full_path}")
            
            return generated_test_suite, test_file_name
        except Exception as e:
            logger.error(f"Error in generate_test_suite: {str(e)}", exc_info=True)
            return None, None

    def read_file(self, file_path):
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            logger.debug(f"Successfully read file: {file_path}")
            return content
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {str(e)}")
            raise