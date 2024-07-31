import logging
from ai_agent import AIAgent
from utils.route_parser import parse_and_validate_route_specs
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    agent = AIAgent()
    
    try:
        route_specs = parse_and_validate_route_specs('data/route_specs.yaml')
        logger.info(f"Total route specs: {len(route_specs)}")
    except Exception as e:
        logger.error(f"Error parsing route specs: {str(e)}", exc_info=True)
        return

    for i, spec in enumerate(route_specs, 1):
        logger.info(f"Processing spec {i}: {spec['route_details']['path']}")
        
        try:
            generated_files = agent.generate_files_sequentially(spec)
            if not generated_files:
                logger.error(f"Failed to generate files for spec {i}")
                continue

            logger.info(f"Generated files for {spec['route_details']['path']}:")
            for file_type, file_info in generated_files.items():
                logger.info(f"- {file_type}: {file_info['file_name']}")
            
            # Generate test suite
            test_suite, test_file_name = agent.generate_test_suite(
                generated_files['route']['file_name'],
                generated_files['controller']['file_name'],
                generated_files['service']['file_name']
            )
            
            if test_suite and test_file_name:
                logger.info(f"Generated test suite: {test_file_name}")
                logger.debug(f"Test suite content preview: {test_suite[:500]}...")
            else:
                logger.error(f"Failed to generate test suite for {spec['route_details']['path']}")
            
        except Exception as e:
            logger.error(f"Error processing spec {i}: {str(e)}", exc_info=True)

    logger.info("Processing complete.")

if __name__ == "__main__":
    main()