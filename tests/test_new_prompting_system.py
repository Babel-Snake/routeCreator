import yaml
from src.ai_agent import AIAgent

def test_new_prompting_system():
    # Load a sample route spec
    try:
        with open('data/route_specs.yaml', 'r') as file:
            route_specs = yaml.safe_load(file)
        assert isinstance(route_specs, list), "The route_specs should be a list"
        sample_spec = route_specs[0]  # Use the first spec for testing

        # Print loaded specs for debugging
        print("Loaded route specs:", route_specs)

        # Initialize AIAgent
        agent = AIAgent()

        # Generate files using the new sequential prompting system
        generated_files = agent.generate_files_sequentially(sample_spec)

        # Assertions to check if the generated files meet expectations
        assert 'route' in generated_files, "Route file was not generated"
        assert 'controller' in generated_files, "Controller file was not generated"
        assert 'service' in generated_files, "Service file was not generated"
        assert 'swagger' in generated_files, "Swagger file was not generated"

        # Check if the generated files contain expected content
        for file_type, file_info in generated_files.items():
            assert file_info['content'], f"{file_type} file content is empty"
            assert file_info['file_name'], f"{file_type} file name is empty"
            
            # More flexible check for key aspects of the content
            if file_type == 'route':
                assert "router." in file_info['content'], "Route file content is missing router definitions"
            elif file_type == 'controller':
                assert "module.exports" in file_info['content'], "Controller file content is missing exports"
            elif file_type == 'service':
                assert "module.exports" in file_info['content'], "Service file content is missing exports"
            elif file_type == 'swagger':
                assert "swagger" in file_info['content'], "Swagger file content is missing swagger definitions"
            
            print(f"\nGenerated {file_type} file content:")
            print(file_info['content'][:500])  # Print the first 500 characters for debugging

        print("All tests passed successfully.")
    
    except yaml.YAMLError as e:
        print(f"Error loading YAML file: {e}")
        assert False, f"YAML loading error: {e}"
    except Exception as e:
        print(f"Unexpected error: {e}")
        assert False, f"Unexpected error: {e}"

# Do not run main() here
